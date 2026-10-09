'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Ban, CalendarClock, CheckCircle2, KanbanSquare, FileText, MessageSquareText, Send } from 'lucide-react';
import type { Interview, InterviewConflict } from '@/types';
import { getInterviewConflicts, useUpdateInterview } from '@/hooks/useHiring';
import {
  INTERVIEW_RESPONSE_LABELS, INTERVIEW_RESPONSE_STYLES, INTERVIEW_STATUS_LABELS, INTERVIEW_STATUS_STYLES, INTERVIEW_TYPE_LABELS,
} from '@/lib/constants';
import { getErrorMessage } from '@/lib/format';
import { toast } from '@/store/toastStore';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonClasses } from '@/components/ui/Button';
import { AddToCalendarButton, InterviewLocation, InterviewTypeIcon, JoinButton } from './InterviewParts';
import { InterviewResponsePanel } from './InterviewResponsePanel';
import { formatDuration, formatInterviewWhen, formatShortDate, formatSlot, formatTime, formatWeekdayDate } from './interviewUtils';

export type InterviewAction = 'COMPLETED' | 'CANCELLED';

/** Recruiter attention: the candidate asked for another time, declined, or hasn't answered in 48h. */
export function needsRecruiterAction(i: Interview): boolean {
  return i.status === 'SCHEDULED' && (i.response === 'NEW_TIME_REQUESTED' || i.response === 'DECLINED' || i.needsFollowUp);
}

export const FOLLOW_UP_CHIP = 'bg-amber-50 text-amber-800 ring-amber-600/20';

/** Recruiter view of the candidate's answer: suggested times (one click to use), decline reason, follow-up nudge. */
function CandidateResponse({ interview: i }: { interview: Interview }) {
  const update = useUpdateInterview();
  const [target, setTarget] = useState<string | null>(null);
  const [clash, setClash] = useState<{ iso: string; conflicts: InterviewConflict[] } | null>(null);
  const now = Date.now();

  const move = (iso: string, allowConflicts = false) => {
    setTarget(iso);
    update.mutate(
      { id: i.id, scheduledAt: iso, ...(allowConflicts ? { allowConflicts: true } : {}) },
      {
        onSuccess: () => {
          setClash(null);
          toast.success(`Interview moved — ${i.candidateName} has been notified`, formatInterviewWhen({ scheduledAt: iso, durationMinutes: i.durationMinutes }));
        },
        onError: (err) => {
          const conflicts = getInterviewConflicts(err);
          if (conflicts) setClash({ iso, conflicts });
          else toast.error('Could not move the interview', getErrorMessage(err));
        },
        onSettled: () => setTarget(null),
      }
    );
  };

  if (i.response === 'NEW_TIME_REQUESTED') {
    return (
      <div className="mt-2 rounded-lg bg-amber-50/60 px-3 py-2.5 ring-1 ring-inset ring-amber-200 space-y-2">
        <p className="flex items-center gap-1.5 text-sm font-medium text-amber-900">
          <CalendarClock className="w-4 h-4 flex-shrink-0 text-amber-600" aria-hidden />
          {i.candidateName} asked for another time
        </p>
        {i.responseNote && (
          <p className="text-sm text-fg-secondary whitespace-pre-line break-words">
            <MessageSquareText className="mr-1 inline w-3.5 h-3.5 align-[-2px] text-fg-subtle" aria-hidden />
            {i.responseNote}
          </p>
        )}
        {i.proposedTimes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {i.proposedTimes.map((t) => {
              const past = new Date(t).getTime() <= now;
              return (
                <Button
                  key={t}
                  variant="secondary"
                  size="sm"
                  disabled={past || update.isPending}
                  loading={update.isPending && target === t}
                  onClick={() => move(t)}
                  title={past ? 'This time has passed' : `Reschedule to this time (${formatDuration(i.durationMinutes)}) — confirms it automatically`}
                >
                  Use {formatSlot(t)}{past && ' (passed)'}
                </Button>
              );
            })}
          </div>
        )}
        {clash && (
          <div role="status" className="rounded-lg border border-amber-300 bg-surface px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-800">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden />
              {clash.conflicts.length === 1 ? 'You already have an interview then' : `You already have ${clash.conflicts.length} interviews then`}
            </p>
            <ul className="mt-1.5 space-y-1 text-sm text-amber-900">
              {clash.conflicts.map((c, idx) => (
                <li key={c.interviewId ?? idx} className="break-words">
                  {c.label} — {formatInterviewWhen(c)}
                </li>
              ))}
            </ul>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => move(clash.iso, true)} loading={update.isPending && target === clash.iso}>
                Use anyway
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setClash(null)} disabled={update.isPending}>
                Dismiss
              </Button>
            </div>
          </div>
        )}
        <p className="text-xs text-fg-muted">Picking one of their times confirms it — no need for them to reply again.</p>
      </div>
    );
  }

  if (i.response === 'DECLINED') {
    return (
      <p className="mt-2 rounded-lg bg-rose-50/60 px-3 py-2 text-sm text-rose-900 ring-1 ring-inset ring-rose-200 whitespace-pre-line break-words">
        <span className="font-medium">{i.candidateName} declined{i.respondedAt ? ` on ${formatShortDate(i.respondedAt)}` : ''}.</span>{' '}
        {i.responseNote ? <>Reason: {i.responseNote}</> : <span className="text-rose-700/80">No reason given.</span>}
      </p>
    );
  }

  return null;
}

/** One interview on the /interviews page. Recruiters get pipeline/complete/cancel; candidates get their response panel. */
export function InterviewRow({ interview: i, viewer, onAction }: {
  interview: Interview;
  viewer: 'CANDIDATE' | 'RECRUITER';
  onAction?: (interview: Interview, action: InterviewAction) => void;
}) {
  const recruiter = viewer === 'RECRUITER';
  const started = new Date(i.scheduledAt).getTime() <= Date.now();
  const scheduled = i.status === 'SCHEDULED';
  const highlight = scheduled && !started && (recruiter ? needsRecruiterAction(i) : i.response === 'AWAITING');

  return (
    <li
      className={cn(
        'px-4 py-4 sm:px-5 border-l-[3px]',
        highlight ? (recruiter ? 'border-l-amber-400 bg-amber-50/20' : 'border-l-primary-500 bg-primary-50/30') : 'border-l-transparent'
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        {/* Time */}
        <div className="flex items-baseline gap-2 md:block md:w-28 md:flex-shrink-0">
          <p className="text-base font-semibold text-fg tabular-nums">
            <time dateTime={i.scheduledAt}>{formatTime(i.scheduledAt)}</time>
          </p>
          <p className="text-xs text-fg-muted">
            {formatDuration(i.durationMinutes)}
            <span className="sr-only">, {formatWeekdayDate(i.scheduledAt)}</span>
          </p>
        </div>

        {/* Details */}
        <div className="flex min-w-0 flex-1 gap-3">
          <InterviewTypeIcon type={i.type} />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-sm font-semibold text-fg break-words">
                {recruiter ? i.candidateName : i.jobTitle}
              </h3>
              {scheduled && recruiter ? (
                <Badge tone={INTERVIEW_RESPONSE_STYLES[i.response]}>{INTERVIEW_RESPONSE_LABELS[i.response]}</Badge>
              ) : !scheduled ? (
                <Badge tone={INTERVIEW_STATUS_STYLES[i.status]}>{INTERVIEW_STATUS_LABELS[i.status]}</Badge>
              ) : null}
              {recruiter && scheduled && i.needsFollowUp && (
                <Badge tone={FOLLOW_UP_CHIP}>
                  <AlertTriangle className="w-3 h-3" aria-hidden /> No response for 2+ days
                </Badge>
              )}
              {started && scheduled && (
                <Badge tone="bg-amber-50 text-amber-700 ring-amber-600/20">Started</Badge>
              )}
            </div>
            <p className="text-sm text-fg-tertiary break-words">
              {recruiter ? <>{i.jobTitle} · {i.companyName}</> : i.companyName}
              <span className="text-fg-subtle"> · </span>
              {INTERVIEW_TYPE_LABELS[i.type]}
            </p>
            <InterviewLocation interview={i} />
            {i.message && (
              <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-sm text-fg-tertiary whitespace-pre-line break-words ring-1 ring-inset ring-line">
                {i.message}
              </p>
            )}
            {recruiter
              ? scheduled && <CandidateResponse interview={i} />
              : <InterviewResponsePanel interview={i} compact className="!mt-2.5" />}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 md:max-w-[17rem] md:flex-shrink-0 md:justify-end">
          <JoinButton interview={i} />
          {recruiter ? (
            <>
              {i.needsFollowUp && scheduled && (
                <Link href={`/jobs/${i.jobId}/applicants`} className={buttonClasses('secondary', 'sm', 'border-amber-300 text-amber-800 hover:bg-amber-50')}>
                  <Send className="w-3.5 h-3.5" aria-hidden /> Follow up
                  <span className="sr-only"> with {i.candidateName}</span>
                </Link>
              )}
              {scheduled && <AddToCalendarButton interview={i} />}
              <Link href={`/jobs/${i.jobId}/applicants`} className={buttonClasses('secondary', 'sm')}>
                <KanbanSquare className="w-3.5 h-3.5" aria-hidden /> Open in pipeline
              </Link>
              {scheduled && onAction && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => onAction(i, 'COMPLETED')} aria-label={`Mark interview with ${i.candidateName} completed`}>
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden /> Mark completed
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    onClick={() => onAction(i, 'CANCELLED')}
                    aria-label={`Cancel interview with ${i.candidateName}`}
                  >
                    <Ban className="w-3.5 h-3.5" aria-hidden /> Cancel
                  </Button>
                </>
              )}
            </>
          ) : (
            <>
              {i.response === 'ACCEPTED' && <AddToCalendarButton interview={i} />}
              <Link href={`/applications?application=${i.applicationId}`} className={buttonClasses('ghost', 'sm')}>
                <FileText className="w-3.5 h-3.5" aria-hidden /> View application
              </Link>
            </>
          )}
        </div>
      </div>
    </li>
  );
}
