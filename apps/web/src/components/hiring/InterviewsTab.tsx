'use client';

import { useState } from 'react';
import {
  AlarmClock, CalendarCheck, CalendarPlus, CalendarX2, CheckCircle2, Clock, MapPin, Phone, RefreshCw, Send, Video, XCircle, type LucideIcon,
} from 'lucide-react';
import type { Interview, InterviewConflict, InterviewType } from '@/types';
import { getInterviewConflicts, useApplicationInterviews, useUpdateInterview } from '@/hooks/useHiring';
import {
  INTERVIEW_RESPONSE_LABELS, INTERVIEW_RESPONSE_STYLES, INTERVIEW_STATUS_LABELS, INTERVIEW_STATUS_STYLES, INTERVIEW_TYPE_LABELS,
} from '@/lib/constants';
import { formatDate, getErrorMessage, timeAgo } from '@/lib/format';
import { toast } from '@/store/toastStore';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { formatLongDateTime } from '@/components/pipeline/stages';
import { ConflictWarning, ScheduleInterviewModal, firstNameOf, slotLabel } from './ScheduleInterviewModal';
import { JoinButton } from '@/components/interviews/InterviewParts';

const TYPE_ICONS: Record<InterviewType, LucideIcon> = { VIDEO: Video, PHONE: Phone, ONSITE: MapPin };
const URL_RE = /(https?:\/\/[^\s]+)/;
const HAS_URL = /https?:\/\//;

/** Renders http(s) URLs in plain text as links. */
export function Linkify({ text }: { text: string }) {
  const parts = text.split(URL_RE);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline break-all">
            {p}
          </a>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

function Location({ interview }: { interview: Interview }) {
  const loc = interview.location?.trim();
  if (!loc) return null;
  if (interview.type === 'PHONE' && !HAS_URL.test(loc)) {
    return <a href={`tel:${loc.replace(/[^\d+]/g, '')}`} className="text-primary-600 hover:underline">{loc}</a>;
  }
  return <Linkify text={loc} />;
}


/** Recruiter's local date/time with zone, for messages the candidate reads ("Sat, Oct 10, 3:00 PM GMT+6"). */
function reminderDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  });
}

/** Polite follow-up for an unanswered invitation ({{firstName}} is filled in server-side). */
export function reminderMessage(iv: Interview) {
  return `Hi {{firstName}}, just checking whether the interview on ${reminderDateTime(iv.scheduledAt)} works for you. `
    + 'Please confirm or suggest another time in NexHire.';
}

/**
 * The candidate asked for another time: their note plus one-click buttons for each suggested slot.
 * Moving to a suggestion is auto-confirmed by the server; a clash with your own calendar shows inline with "Use anyway".
 */
function SuggestedTimes({ iv, firstName, readOnly, onPropose }: {
  iv: Interview;
  firstName: string;
  readOnly?: boolean;
  onPropose: () => void;
}) {
  const update = useUpdateInterview();
  const [choosing, setChoosing] = useState<string | null>(null);
  const [clash, setClash] = useState<{ time: string; conflicts: InterviewConflict[] } | null>(null);
  const upcoming = iv.proposedTimes.filter((t) => new Date(t).getTime() > Date.now());

  function use(time: string, allowConflicts?: boolean) {
    setChoosing(time);
    update.mutate(
      { id: iv.id, scheduledAt: time, allowConflicts },
      {
        onSuccess: () => {
          setClash(null);
          toast.success(`Interview moved to ${slotLabel(time, iv.durationMinutes)}`, `Confirmed — it was ${firstName}'s suggestion.`);
        },
        onError: (err) => {
          const conflicts = getInterviewConflicts(err);
          if (conflicts) setClash({ time, conflicts });
          else toast.error('Could not move interview', getErrorMessage(err));
        },
        onSettled: () => setChoosing(null),
      }
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-900">
        <RefreshCw className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
        {firstName} asked for another time
      </p>
      {iv.responseNote?.trim() && (
        <p className="mt-1.5 text-sm text-amber-900 whitespace-pre-line break-words">&ldquo;{iv.responseNote.trim()}&rdquo;</p>
      )}
      {upcoming.length === 0 ? (
        <p className="mt-2 text-xs text-amber-800">
          {iv.proposedTimes.length ? 'The suggested times have already passed.' : 'No specific times were suggested.'}
        </p>
      ) : !readOnly ? (
        <div className="mt-2.5 flex flex-col items-stretch gap-2 sm:items-start">
          {upcoming.map((t) => (
            <Button
              key={t}
              size="sm"
              variant="secondary"
              onClick={() => use(t)}
              loading={update.isPending && choosing === t}
              disabled={update.isPending}
              className="justify-start"
            >
              <CalendarCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
              Use <time dateTime={t}>{slotLabel(t, iv.durationMinutes)}</time>
            </Button>
          ))}
        </div>
      ) : (
        <ul className="mt-2 space-y-1 text-sm text-amber-900">
          {upcoming.map((t) => <li key={t}><time dateTime={t}>{slotLabel(t, iv.durationMinutes)}</time></li>)}
        </ul>
      )}
      {clash && (
        <div className="mt-3">
          <ConflictWarning
            conflicts={clash.conflicts}
            footer={
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={() => use(clash.time, true)} loading={update.isPending} disabled={update.isPending}>
                  Use anyway
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setClash(null)} disabled={update.isPending}>Dismiss</Button>
              </div>
            }
          />
        </div>
      )}
      {!readOnly && (
        <div className="mt-3 pt-2.5 border-t border-amber-200/70">
          <Button size="sm" variant="ghost" onClick={onPropose}>
            <CalendarPlus className="h-3.5 w-3.5" aria-hidden /> Propose a different time
          </Button>
        </div>
      )}
    </div>
  );
}

/** The candidate's response to a SCHEDULED interview, with the follow-up actions it calls for. */
function ResponseDetails({ iv, firstName, readOnly, onPropose, onCancel, onRemind }: {
  iv: Interview;
  firstName: string;
  readOnly?: boolean;
  onPropose: () => void;
  onCancel: () => void;
  onRemind?: () => void;
}) {
  switch (iv.response) {
    case 'NEW_TIME_REQUESTED':
      return <SuggestedTimes iv={iv} firstName={firstName} readOnly={readOnly} onPropose={onPropose} />;
    case 'DECLINED':
      return (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-rose-800">
            <CalendarX2 className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
            {firstName} declined this interview
            {iv.respondedAt && (
              <span className="font-normal text-rose-700">
                · <time dateTime={iv.respondedAt} title={formatDate(iv.respondedAt)}>{timeAgo(iv.respondedAt)}</time>
              </span>
            )}
          </p>
          {iv.responseNote?.trim() ? (
            <p className="mt-1.5 text-sm text-rose-900 whitespace-pre-line break-words">&ldquo;{iv.responseNote.trim()}&rdquo;</p>
          ) : (
            <p className="mt-1 text-xs text-rose-700">No reason given.</p>
          )}
          {!readOnly && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={onPropose}>
                <CalendarPlus className="h-3.5 w-3.5" aria-hidden /> Propose a new time
              </Button>
              <Button size="sm" variant="ghost" className="text-rose-700 hover:text-rose-800 hover:bg-rose-100" onClick={onCancel}>
                <XCircle className="h-3.5 w-3.5" aria-hidden /> Cancel interview
              </Button>
            </div>
          )}
        </div>
      );
    case 'ACCEPTED':
      return (
        <p className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          Confirmed
          {iv.respondedAt && <> <time dateTime={iv.respondedAt} title={formatDate(iv.respondedAt)}>{timeAgo(iv.respondedAt)}</time></>}
        </p>
      );
    default:
      if (!iv.needsFollowUp) return null;
      return (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
            <AlarmClock className="h-3 w-3" aria-hidden /> No response for 2+ days
          </span>
          {!readOnly && onRemind && (
            <Button size="sm" variant="ghost" onClick={onRemind}>
              <Send className="h-3.5 w-3.5" aria-hidden /> Send a reminder
            </Button>
          )}
        </div>
      );
  }
}

export function InterviewsTab({ applicationId, candidateName, readOnly, onSendReminder }: {
  applicationId: string;
  candidateName: string;
  readOnly?: boolean;
  /** Switch to Messages with this text in the composer. */
  onSendReminder?: (text: string) => void;
}) {
  const firstName = firstNameOf(candidateName);
  const interviews = useApplicationInterviews(applicationId);
  const update = useUpdateInterview();
  const [scheduling, setScheduling] = useState(false);
  const [editing, setEditing] = useState<Interview | undefined>();
  const [cancelling, setCancelling] = useState<Interview | null>(null);

  const list = [...(interviews.data ?? [])].sort((a, b) => {
    // Upcoming scheduled first (soonest first), then the rest newest first.
    const aUp = a.status === 'SCHEDULED' ? 0 : 1;
    const bUp = b.status === 'SCHEDULED' ? 0 : 1;
    if (aUp !== bUp) return aUp - bUp;
    const diff = new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    return aUp === 0 ? diff : -diff;
  });

  function setStatus(iv: Interview, status: 'COMPLETED' | 'CANCELLED') {
    update.mutate(
      { id: iv.id, status },
      {
        onSuccess: () => {
          toast.success(status === 'COMPLETED' ? 'Interview marked as completed' : 'Interview cancelled');
          setCancelling(null);
        },
        onError: (err) => {
          toast.error('Could not update interview', getErrorMessage(err));
          setCancelling(null);
        },
      }
    );
  }

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { setEditing(undefined); setScheduling(true); }}>
            <CalendarPlus className="w-3.5 h-3.5" aria-hidden /> Schedule interview
          </Button>
        </div>
      )}

      {interviews.isLoading ? (
        <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : interviews.error ? (
        <ErrorState title="Couldn't load interviews" error={interviews.error} onRetry={() => interviews.refetch()} retrying={interviews.isRefetching} className="py-8" />
      ) : list.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No interviews yet"
          description={readOnly ? undefined : `Schedule an interview and ${candidateName} will get an invitation.`}
          className="py-8"
        />
      ) : (
        <ul className="space-y-3">
          {list.map((iv) => {
            const Icon = TYPE_ICONS[iv.type];
            const past = new Date(iv.scheduledAt).getTime() < Date.now();
            const scheduled = iv.status === 'SCHEDULED';
            return (
              <li key={iv.id} className="rounded-xl border border-line p-4">
                <div className="flex flex-wrap items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-fg">
                      <time dateTime={iv.scheduledAt}>{formatLongDateTime(iv.scheduledAt)}</time>
                    </p>
                    <p className="mt-0.5 text-xs text-fg-muted flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" aria-hidden /> {iv.durationMinutes} min</span>
                      <span className="inline-flex items-center gap-1"><Icon className="w-3.5 h-3.5" aria-hidden /> {INTERVIEW_TYPE_LABELS[iv.type]}</span>
                      {iv.status === 'SCHEDULED' && past && <span className="text-amber-700">Time has passed</span>}
                    </p>
                  </div>
                  {scheduled ? (
                    <Badge tone={INTERVIEW_RESPONSE_STYLES[iv.response]}>{INTERVIEW_RESPONSE_LABELS[iv.response]}</Badge>
                  ) : (
                    <Badge tone={INTERVIEW_STATUS_STYLES[iv.status]}>{INTERVIEW_STATUS_LABELS[iv.status]}</Badge>
                  )}
                </div>
                {scheduled && (
                  <ResponseDetails
                    iv={iv}
                    firstName={firstName}
                    readOnly={readOnly}
                    onPropose={() => { setEditing(iv); setScheduling(true); }}
                    onCancel={() => setCancelling(iv)}
                    onRemind={onSendReminder ? () => onSendReminder(reminderMessage(iv)) : undefined}
                  />
                )}
                {iv.hasVideoRoom && iv.status === 'SCHEDULED' && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-sm text-fg-secondary">
                      <Video className="w-3.5 h-3.5 text-primary-600" aria-hidden /> NexHire video room
                    </span>
                    <JoinButton interview={iv} />
                  </div>
                )}
                {iv.location?.trim() && !iv.hasVideoRoom && (
                  <p className="mt-2 text-sm text-fg-secondary break-words">
                    <span className="text-fg-muted">{iv.type === 'VIDEO' ? 'Link: ' : iv.type === 'PHONE' ? 'Phone: ' : 'Address: '}</span>
                    <Location interview={iv} />
                  </p>
                )}
                {iv.message?.trim() && (
                  <p className="mt-2 text-sm text-fg-tertiary whitespace-pre-line break-words bg-muted rounded-lg px-3 py-2">{iv.message}</p>
                )}
                {!readOnly && iv.status === 'SCHEDULED' && (
                  <div className="mt-3 pt-3 border-t border-line-subtle flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => { setEditing(iv); setScheduling(true); }}>Reschedule</Button>
                    <Button size="sm" variant="secondary" onClick={() => setStatus(iv, 'COMPLETED')} disabled={update.isPending}>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden /> Mark completed
                    </Button>
                    <Button size="sm" variant="ghost" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => setCancelling(iv)}>
                      <XCircle className="w-3.5 h-3.5" aria-hidden /> Cancel
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ScheduleInterviewModal
        open={scheduling}
        onClose={() => setScheduling(false)}
        applicationId={applicationId}
        candidateName={candidateName}
        interview={editing}
      />
      <ConfirmDialog
        open={!!cancelling}
        onClose={() => setCancelling(null)}
        onConfirm={() => cancelling && setStatus(cancelling, 'CANCELLED')}
        loading={update.isPending}
        title="Cancel this interview?"
        description={`${candidateName} will be notified that the interview is cancelled.`}
        confirmLabel="Cancel interview"
      />
    </div>
  );
}
