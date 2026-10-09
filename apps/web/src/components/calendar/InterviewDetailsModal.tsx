'use client';

import Link from 'next/link';
import { CalendarClock, FileText, KanbanSquare, MessageSquareQuote } from 'lucide-react';
import type { Interview } from '@/types';
import { INTERVIEW_STATUS_LABELS, INTERVIEW_TYPE_LABELS, INTERVIEW_RESPONSE_LABELS } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { Modal } from '@/components/ui/Modal';
import { buttonClasses } from '@/components/ui/Button';
import { AddToCalendarButton, InterviewLocation, InterviewTypeIcon, JoinButton, useTimeZoneAbbr } from '@/components/interviews/InterviewParts';
import { CANDIDATE_RESPONSE_LABELS, InterviewResponsePanel } from '@/components/interviews/InterviewResponsePanel';
import { formatDuration, formatSlot, formatTime, formatWeekdayDate, interviewEnd } from '@/components/interviews/interviewUtils';
import { eventTone } from './eventTone';

/** Opened from a calendar event: when, where, status, and the actions that matter for this viewer. */
export function InterviewDetailsModal({ interview: i, recruiter, onClose }: {
  interview: Interview | null;
  recruiter: boolean;
  onClose(): void;
}) {
  const tz = useTimeZoneAbbr();
  if (!i) return null;
  const tone = eventTone(i);
  const statusLabel = i.status !== 'SCHEDULED'
    ? INTERVIEW_STATUS_LABELS[i.status]
    : recruiter ? INTERVIEW_RESPONSE_LABELS[i.response] : CANDIDATE_RESPONSE_LABELS[i.response];
  const appHref = recruiter ? `/jobs/${i.jobId}/applicants?application=${i.applicationId}` : `/applications?application=${i.applicationId}`;

  return (
    <Modal
      open
      onClose={onClose}
      title={recruiter ? i.candidateName : i.jobTitle}
      description={recruiter ? `${i.jobTitle} · ${i.companyName}` : i.companyName}
      footer={
        <div className="flex w-full flex-wrap items-center gap-2 sm:justify-end">
          <Link href={appHref} className={buttonClasses('ghost', 'sm', 'sm:mr-auto')}>
            {recruiter ? <KanbanSquare className="h-3.5 w-3.5" aria-hidden /> : <FileText className="h-3.5 w-3.5" aria-hidden />}
            {recruiter ? 'Open in pipeline' : 'View application'}
          </Link>
          <AddToCalendarButton interview={i} />
          <JoinButton interview={i} />
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', tone.chip)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', tone.accent)} aria-hidden />
            {statusLabel}
          </span>
          {i.hasVideoRoom && (
            <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">NexHire video</span>
          )}
        </div>

        <dl className="grid gap-3 rounded-xl bg-muted p-4 ring-1 ring-inset ring-line sm:grid-cols-2">
          <div className="flex gap-3">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-surface text-fg-tertiary ring-1 ring-line">
              <CalendarClock className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <dt className="text-xs font-medium text-fg-muted">When</dt>
              <dd className="text-sm font-semibold text-fg">{formatWeekdayDate(i.scheduledAt)}</dd>
              <dd className="text-sm text-fg-tertiary">
                {formatTime(i.scheduledAt)} – {formatTime(interviewEnd(i).toISOString())}{tz && <span className="text-fg-subtle"> {tz}</span>}
              </dd>
              <dd className="text-xs text-fg-muted">{formatDuration(i.durationMinutes)}</dd>
            </div>
          </div>
          <div className="flex gap-3">
            <InterviewTypeIcon type={i.type} className="bg-surface ring-1 ring-line" />
            <div className="min-w-0">
              <dt className="text-xs font-medium text-fg-muted">{INTERVIEW_TYPE_LABELS[i.type]}</dt>
              <dd><InterviewLocation interview={i} className="mt-0.5" /></dd>
            </div>
          </div>
        </dl>

        {i.message && (
          <div>
            <p className="mb-1 text-xs font-medium text-fg-muted">{recruiter ? 'Your note to the candidate' : `Note from ${i.companyName}`}</p>
            <p className="whitespace-pre-line break-words rounded-lg bg-surface px-3 py-2 text-sm text-fg-tertiary ring-1 ring-line">{i.message}</p>
          </div>
        )}

        {recruiter && i.status === 'SCHEDULED' && i.response !== 'AWAITING' && (
          <div className="rounded-lg px-3 py-2.5 text-sm ring-1 ring-inset ring-line">
            <p className="flex items-center gap-1.5 font-medium text-fg-secondary">
              <MessageSquareQuote className="h-4 w-4 text-fg-subtle" aria-hidden /> Candidate {INTERVIEW_RESPONSE_LABELS[i.response].toLowerCase()}
            </p>
            {i.responseNote && <p className="mt-1 whitespace-pre-line text-fg-tertiary">{i.responseNote}</p>}
            {i.response === 'NEW_TIME_REQUESTED' && i.proposedTimes.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {i.proposedTimes.map((t) => (
                  <li key={t} className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">{formatSlot(t)}</li>
                ))}
              </ul>
            )}
            {i.response === 'NEW_TIME_REQUESTED' && (
              <p className="mt-2 text-xs text-fg-muted">Pick one of these times from the applicant’s Interviews tab in the pipeline.</p>
            )}
          </div>
        )}

        {!recruiter && i.status === 'SCHEDULED' && <InterviewResponsePanel interview={i} compact />}
      </div>
    </Modal>
  );
}
