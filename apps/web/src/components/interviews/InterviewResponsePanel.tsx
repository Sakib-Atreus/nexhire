'use client';

import { useId, useMemo, useState } from 'react';
import {
  AlertTriangle, CalendarClock, CheckCircle2, Clock, Plus, RefreshCw, Trash2, XCircle, type LucideIcon,
} from 'lucide-react';
import type { Interview, InterviewResponse } from '@/types';
import { useRespondToInterview, useUpcomingInterviews } from '@/hooks/useHiring';
import { getErrorMessage } from '@/lib/format';
import { toast } from '@/store/toastStore';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import {
  findClashes, formatDuration, formatInterviewWhen, formatSlot, hasStarted, localInputsToIso, toDateInput, toTimeInput,
} from './interviewUtils';

const NOTE_MAX = 1000;
const MAX_SUGGESTIONS = 3;

// ─── Candidate wording ───────────────────────────────────────────────────────

/** Short badge text for the candidate (recruiters use INTERVIEW_RESPONSE_LABELS). */
export const CANDIDATE_RESPONSE_LABELS: Record<InterviewResponse, string> = {
  AWAITING: 'Please respond',
  ACCEPTED: 'Confirmed',
  NEW_TIME_REQUESTED: 'New time requested',
  DECLINED: 'Declined',
};

export const CANDIDATE_RESPONSE_STYLES: Record<InterviewResponse, string> = {
  AWAITING: 'bg-primary-50 text-primary-700 ring-primary-600/20',
  ACCEPTED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  NEW_TIME_REQUESTED: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  DECLINED: 'bg-rose-50 text-rose-700 ring-rose-600/20',
};

const STATE: Record<InterviewResponse, { text: string; icon: LucideIcon; tone: string; box: string }> = {
  AWAITING: { text: 'Please respond', icon: Clock, tone: 'text-primary-700', box: 'bg-primary-50/60 ring-primary-200' },
  ACCEPTED: { text: 'Confirmed', icon: CheckCircle2, tone: 'text-emerald-700', box: 'bg-emerald-50/50 ring-emerald-200' },
  NEW_TIME_REQUESTED: { text: 'You asked for another time', icon: RefreshCw, tone: 'text-amber-800', box: 'bg-amber-50/50 ring-amber-200' },
  DECLINED: { text: 'You declined', icon: XCircle, tone: 'text-rose-700', box: 'bg-rose-50/40 ring-rose-200' },
};

/** Candidate can answer while the interview is scheduled and hasn't started. */
export function canRespond(i: Interview): boolean {
  return i.status === 'SCHEDULED' && !hasStarted(i);
}

// ─── Own-clash warning ───────────────────────────────────────────────────────

function ClashNote({ clashes, compact }: { clashes: Interview[]; compact?: boolean }) {
  if (clashes.length === 0) return null;
  return (
    <div role="status" className={cn('flex gap-2 rounded-lg bg-amber-50 text-amber-900 ring-1 ring-inset ring-amber-200', compact ? 'px-2.5 py-2 text-xs' : 'px-3 py-2.5 text-sm')}>
      <AlertTriangle className={cn('flex-shrink-0 text-amber-600', compact ? 'mt-px w-3.5 h-3.5' : 'mt-0.5 w-4 h-4')} aria-hidden />
      <div className="min-w-0 space-y-1 break-words">
        {clashes.map((c) => (
          <p key={c.id}>
            This overlaps your interview for <span className="font-medium">{c.jobTitle}</span> at {c.companyName} — {formatInterviewWhen(c)}.
            {!compact && ' You can ask for another time.'}
          </p>
        ))}
        {compact && <p>You can ask for another time.</p>}
      </div>
    </div>
  );
}

// ─── Request another time ────────────────────────────────────────────────────

interface SlotRow { key: number; date: string; time: string }

let rowKey = 1;

function initialRows(i: Interview): SlotRow[] {
  const now = Date.now();
  const existing = i.response === 'NEW_TIME_REQUESTED'
    ? i.proposedTimes.filter((t) => new Date(t).getTime() > now).slice(0, MAX_SUGGESTIONS)
    : [];
  if (existing.length) {
    return existing.map((t) => ({ key: rowKey++, date: toDateInput(new Date(t)), time: toTimeInput(new Date(t)) }));
  }
  // Default: the same time of day, the day after the current slot (or tomorrow if that's sooner).
  const base = new Date(Math.max(new Date(i.scheduledAt).getTime(), now));
  const next = new Date(base);
  next.setDate(next.getDate() + 1);
  const at = new Date(i.scheduledAt);
  next.setHours(at.getHours(), at.getMinutes(), 0, 0);
  return [{ key: rowKey++, date: toDateInput(next), time: toTimeInput(next) }];
}

function RequestTimeModal({ open, onClose, interview: i, others }: {
  open: boolean;
  onClose: () => void;
  interview: Interview;
  others: Interview[] | undefined;
}) {
  const respond = useRespondToInterview();
  const [rows, setRows] = useState<SlotRow[]>(() => initialRows(i));
  const [note, setNote] = useState(() => (i.response === 'NEW_TIME_REQUESTED' ? i.responseNote ?? '' : ''));
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const noteId = useId();
  const today = toDateInput(new Date());

  const parsed = rows.map((r) => {
    const iso = localInputsToIso(r.date, r.time);
    return { row: r, iso };
  });
  const errors = parsed.map(({ iso }, idx) => {
    if (!iso) return submitted ? 'Pick a date and time.' : null;
    if (new Date(iso).getTime() <= Date.now()) return 'Pick a time in the future.';
    if (iso === new Date(i.scheduledAt).toISOString()) return 'That’s the current interview time.';
    if (parsed.slice(0, idx).some((p) => p.iso === iso)) return 'You already suggested this time.';
    return null;
  });
  const valid = parsed.every((p) => !!p.iso) && errors.every((e) => !e);

  const update = (key: number, patch: Partial<SlotRow>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const addRow = () => setRows((rs) => {
    const last = rs[rs.length - 1];
    const from = last ? localInputsToIso(last.date, last.time) : null;
    const d = from ? new Date(from) : new Date();
    d.setDate(d.getDate() + 1);
    return [...rs, { key: rowKey++, date: toDateInput(d), time: last?.time || toTimeInput(d) }];
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError(null);
    if (!valid || respond.isPending) return;
    respond.mutate(
      {
        id: i.id,
        response: 'NEW_TIME_REQUESTED',
        proposedTimes: parsed.map((p) => p.iso!),
        note: note.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success(`Sent — ${i.companyName} will confirm a time.`);
          onClose();
        },
        onError: (err) => {
          const msg = getErrorMessage(err);
          setServerError(msg);
          toast.error('Could not send your suggested times', msg);
        },
      }
    );
  };

  return (
    <Modal
      open={open}
      onClose={() => !respond.isPending && onClose()}
      title="Request another time"
      description={`${i.jobTitle} at ${i.companyName} · currently ${formatInterviewWhen(i)}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={respond.isPending}>Cancel</Button>
          <Button type="submit" form={`request-time-${i.id}`} loading={respond.isPending}>Send suggestions</Button>
        </>
      }
    >
      <form id={`request-time-${i.id}`} onSubmit={submit} className="space-y-5" noValidate>
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-slate-700">
            Suggest {rows.length === 1 ? 'a time' : 'times'} that work for you
          </legend>
          <p className="-mt-1 text-xs text-slate-500">
            Same length: {formatDuration(i.durationMinutes)}. Your time zone. Up to {MAX_SUGGESTIONS} options.
          </p>
          <ol className="space-y-3">
            {parsed.map(({ row, iso }, idx) => {
              const clashes = iso && !errors[idx] ? findClashes(iso, i.durationMinutes, others, i.id) : [];
              return (
                <li key={row.key} className="space-y-2">
                  <div className="flex items-end gap-2">
                    <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 min-[400px]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                      <label className="min-w-0">
                        <span className="mb-1 block text-xs text-slate-500">Option {idx + 1} · date</span>
                        <Input
                          type="date"
                          value={row.date}
                          min={today}
                          onChange={(e) => update(row.key, { date: e.target.value })}
                          invalid={!!errors[idx]}
                          required
                        />
                      </label>
                      <label className="min-w-0">
                        <span className="mb-1 block text-xs text-slate-500">Time</span>
                        <Input
                          type="time"
                          value={row.time}
                          step={300}
                          onChange={(e) => update(row.key, { time: e.target.value })}
                          invalid={!!errors[idx]}
                          required
                        />
                      </label>
                    </div>
                    {rows.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 px-2.5 text-slate-500 hover:text-rose-600"
                        onClick={() => setRows((rs) => rs.filter((r) => r.key !== row.key))}
                        aria-label={`Remove option ${idx + 1}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden />
                      </Button>
                    )}
                  </div>
                  {errors[idx] ? (
                    <p className="text-xs text-rose-600" role="alert">{errors[idx]}</p>
                  ) : iso ? (
                    <p className="text-xs text-slate-500">{formatInterviewWhen({ scheduledAt: iso, durationMinutes: i.durationMinutes })}</p>
                  ) : null}
                  <ClashNote clashes={clashes} compact />
                </li>
              );
            })}
          </ol>
          {rows.length < MAX_SUGGESTIONS && (
            <Button variant="ghost" size="sm" onClick={addRow} className="text-primary-700 hover:text-primary-800">
              <Plus className="w-3.5 h-3.5" aria-hidden /> Add another option
            </Button>
          )}
        </fieldset>

        <div className="space-y-1.5">
          <label htmlFor={noteId} className="block text-sm font-medium text-slate-700">
            Note <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <Textarea
            id={noteId}
            rows={3}
            value={note}
            maxLength={NOTE_MAX}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. I have a class on Tuesday mornings — afternoons work best."
          />
          <p className="text-xs text-slate-500">
            {i.companyName} will see your note.
            {note.length > NOTE_MAX - 200 && <span className="ml-1 tabular-nums">{note.length}/{NOTE_MAX}</span>}
          </p>
        </div>

        {serverError && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-200" role="alert">{serverError}</p>
        )}
      </form>
    </Modal>
  );
}

// ─── Decline ─────────────────────────────────────────────────────────────────

function DeclineModal({ open, onClose, interview: i }: { open: boolean; onClose: () => void; interview: Interview }) {
  const respond = useRespondToInterview();
  const [reason, setReason] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const reasonId = useId();

  const confirm = () => {
    setServerError(null);
    respond.mutate(
      { id: i.id, response: 'DECLINED', note: reason.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('Interview declined', `${i.companyName} has been notified.`);
          onClose();
        },
        onError: (err) => {
          const msg = getErrorMessage(err);
          setServerError(msg);
          toast.error('Could not decline the interview', msg);
        },
      }
    );
  };

  return (
    <Modal
      open={open}
      onClose={() => !respond.isPending && onClose()}
      title="Decline this interview?"
      description={`${i.jobTitle} at ${i.companyName} · ${formatInterviewWhen(i)}. You can change your answer until the interview starts.`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={respond.isPending}>Cancel</Button>
          <Button variant="danger" onClick={confirm} loading={respond.isPending}>Decline interview</Button>
        </>
      }
    >
      <div className="space-y-1.5">
        <label htmlFor={reasonId} className="block text-sm font-medium text-slate-700">
          Reason <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <Textarea
          id={reasonId}
          rows={3}
          value={reason}
          maxLength={NOTE_MAX}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Let the hiring team know why, if you like."
        />
        {reason.length > NOTE_MAX - 200 && <p className="text-xs text-slate-500 tabular-nums">{reason.length}/{NOTE_MAX}</p>}
        {serverError && <p className="text-sm text-rose-600" role="alert">{serverError}</p>}
      </div>
    </Modal>
  );
}

// ─── Panel ───────────────────────────────────────────────────────────────────

/**
 * The candidate's answer to an interview invitation: state line, own-clash warning, and
 * Accept / Request another time / Decline. Renders nothing once the interview has started or isn't scheduled.
 */
export function InterviewResponsePanel({ interview: i, compact, className }: {
  interview: Interview;
  compact?: boolean;
  className?: string;
}) {
  const { data: upcoming } = useUpcomingInterviews(true);
  const respond = useRespondToInterview();
  const [changing, setChanging] = useState(false);
  const [modal, setModal] = useState<'time' | 'decline' | null>(null);

  const clashes = useMemo(
    () => (i.response === 'DECLINED' ? [] : findClashes(i.scheduledAt, i.durationMinutes, upcoming, i.id)),
    [i.response, i.scheduledAt, i.durationMinutes, i.id, upcoming]
  );

  if (!canRespond(i)) return null;

  const state = STATE[i.response];
  const StateIcon = state.icon;
  const answered = i.response !== 'AWAITING';
  const showActions = !answered || changing;

  const accept = () => {
    respond.mutate(
      { id: i.id, response: 'ACCEPTED' },
      {
        onSuccess: () => {
          toast.success('Interview confirmed', `${i.jobTitle} at ${i.companyName} · ${formatInterviewWhen(i)}`);
          setChanging(false);
        },
        onError: (err) => toast.error('Could not accept the interview', getErrorMessage(err)),
      }
    );
  };

  const openModal = (m: 'time' | 'decline') => {
    setModal(m);
  };
  const closeModal = () => {
    setModal(null);
    setChanging(false);
  };

  return (
    <div
      className={cn('rounded-lg ring-1 ring-inset', state.box, compact ? 'px-3 py-2.5 space-y-2' : 'p-3 space-y-2.5', className)}
      aria-label="Your response"
      role="group"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <p className={cn('flex items-center gap-1.5 text-sm font-semibold', state.tone)}>
          <StateIcon className="w-4 h-4 flex-shrink-0" aria-hidden />
          {state.text}
          {answered && i.respondedAt && (
            <span className="font-normal text-xs text-slate-500">
              · <time dateTime={i.respondedAt}>{new Date(i.respondedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</time>
            </span>
          )}
        </p>
        {answered && !changing && (
          <Button variant="ghost" size="sm" onClick={() => setChanging(true)} className="-my-1">
            Change response
          </Button>
        )}
      </div>

      {i.response === 'NEW_TIME_REQUESTED' && i.proposedTimes.length > 0 && (
        <div className="text-xs text-slate-600">
          <p>Your suggestions — {i.companyName} will confirm one:</p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {i.proposedTimes.map((t) => (
              <li key={t} className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 font-medium text-slate-700 ring-1 ring-inset ring-amber-200">
                <CalendarClock className="w-3 h-3 text-amber-600" aria-hidden />
                <time dateTime={t}>{formatSlot(t)}</time>
              </li>
            ))}
          </ul>
        </div>
      )}
      {answered && i.responseNote && (i.response === 'NEW_TIME_REQUESTED' || i.response === 'DECLINED') && (
        <p className="text-xs text-slate-600 whitespace-pre-line break-words">
          <span className="font-medium text-slate-700">Your note:</span> {i.responseNote}
        </p>
      )}
      {i.response === 'AWAITING' && !compact && (
        <p className="text-xs text-slate-600">Let {i.companyName} know whether this time works for you.</p>
      )}

      <ClashNote clashes={clashes} compact={compact} />

      {showActions && (
        <div className="flex flex-wrap items-center gap-2">
          {i.response !== 'ACCEPTED' && (
            <Button size="sm" onClick={accept} loading={respond.isPending}>
              {!respond.isPending && <CheckCircle2 className="w-3.5 h-3.5" aria-hidden />}
              {i.response === 'AWAITING' ? 'Accept' : 'Accept this time'}
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => openModal('time')} disabled={respond.isPending}>
            <RefreshCw className="w-3.5 h-3.5" aria-hidden />
            {i.response === 'NEW_TIME_REQUESTED' ? 'Edit suggested times' : 'Request another time'}
          </Button>
          {i.response !== 'DECLINED' && (
            <Button
              variant="ghost"
              size="sm"
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              onClick={() => openModal('decline')}
              disabled={respond.isPending}
            >
              <XCircle className="w-3.5 h-3.5" aria-hidden /> Decline
            </Button>
          )}
          {changing && (
            <Button variant="ghost" size="sm" onClick={() => setChanging(false)} disabled={respond.isPending}>
              Keep my answer
            </Button>
          )}
        </div>
      )}

      {/* Mounted only while open so each opening starts from fresh state. */}
      {modal === 'time' && <RequestTimeModal open onClose={closeModal} interview={i} others={upcoming} />}
      {modal === 'decline' && <DeclineModal open onClose={closeModal} interview={i} />}
    </div>
  );
}
