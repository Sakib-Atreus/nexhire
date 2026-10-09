'use client';

import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight, CalendarCheck, CalendarClock, CalendarPlus, CalendarX, CheckCircle2, Gift, History,
  PartyPopper, Quote, Send, Undo2, XCircle,
} from 'lucide-react';
import type { ApplicationEvent } from '@/types';
import { useApplicationTimeline } from '@/hooks/useCandidate';
import { APPLICATION_EVENT_LABELS, APPLICATION_STATUS_LABELS } from '@/lib/constants';
import { formatLongDateTime } from '@/components/pipeline/stages';
import { timeAgo } from '@/lib/format';
import { cn } from '@/lib/cn';
import { ErrorState, Skeleton } from '@/components/ui/States';

export type TimelineAudience = 'candidate' | 'team';

interface Visual {
  icon: LucideIcon;
  tone: string;
}

const NEUTRAL = 'bg-subtle text-fg-tertiary ring-line';
const PRIMARY = 'bg-primary-50 text-primary-600 ring-primary-600/20';
const GOOD = 'bg-emerald-50 text-emerald-600 ring-emerald-600/20';
const BAD = 'bg-rose-50 text-rose-600 ring-rose-600/20';
const WARN = 'bg-amber-50 text-amber-600 ring-amber-600/20';
const INTERVIEW = 'bg-sky-50 text-sky-600 ring-sky-600/20';

function visualFor(e: ApplicationEvent): Visual {
  switch (e.type) {
    case 'APPLIED':
      return { icon: Send, tone: PRIMARY };
    case 'WITHDRAWN':
      return { icon: Undo2, tone: NEUTRAL };
    case 'STATUS_CHANGED':
      if (e.toStatus === 'HIRED') return { icon: PartyPopper, tone: GOOD };
      if (e.toStatus === 'OFFERED') return { icon: Gift, tone: GOOD };
      if (e.toStatus === 'REJECTED') return { icon: XCircle, tone: BAD };
      return { icon: ArrowRight, tone: PRIMARY };
    case 'INTERVIEW_SCHEDULED':
      return { icon: CalendarPlus, tone: INTERVIEW };
    case 'INTERVIEW_RESCHEDULED':
    case 'INTERVIEW_NEW_TIME_REQUESTED':
      return { icon: CalendarClock, tone: WARN };
    case 'INTERVIEW_CANCELLED':
    case 'INTERVIEW_DECLINED':
      return { icon: CalendarX, tone: BAD };
    case 'INTERVIEW_ACCEPTED':
      return { icon: CalendarCheck, tone: GOOD };
    case 'INTERVIEW_COMPLETED':
      return { icon: CheckCircle2, tone: GOOD };
    default:
      return { icon: History, tone: NEUTRAL };
  }
}

function eventTitle(e: ApplicationEvent, audience: TimelineAudience): string {
  if (e.type === 'STATUS_CHANGED' && e.toStatus) {
    const label = APPLICATION_STATUS_LABELS[e.toStatus];
    return audience === 'candidate' ? `Your application moved to ${label}` : `Moved to ${label}`;
  }
  return APPLICATION_EVENT_LABELS[e.type] ?? 'Update';
}

function TimelineItem({ event: e, audience, companyName, last }: {
  event: ApplicationEvent;
  audience: TimelineAudience;
  companyName?: string;
  last: boolean;
}) {
  const { icon: Icon, tone } = visualFor(e);
  const isMessage = e.type === 'STATUS_CHANGED';
  const note = e.note?.trim();
  const messageFrom = audience === 'candidate'
    ? `Message from ${companyName || e.actorName || 'the hiring team'}`
    : `Message to candidate${e.actorName ? ` · sent by ${e.actorName}` : ''}`;

  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!last && <span className="absolute left-4 top-9 bottom-0 w-px bg-line" aria-hidden />}
      <span className={cn('relative z-[1] flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ring-1 ring-inset', tone)}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <p className="text-sm font-medium text-fg break-words">{eventTitle(e, audience)}</p>
          <time dateTime={e.createdAt} title={formatLongDateTime(e.createdAt)} className="text-xs text-fg-muted whitespace-nowrap">
            {timeAgo(e.createdAt)}
          </time>
        </div>
        {audience === 'team' && e.actorName && (
          <p className="mt-0.5 text-xs text-fg-muted">by {e.actorName}</p>
        )}
        {note && (isMessage ? (
          <figure className="mt-2 rounded-xl rounded-tl-sm bg-muted px-3.5 py-2.5 ring-1 ring-inset ring-line">
            <figcaption className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-fg-muted">
              <Quote className="h-3 w-3" aria-hidden /> {messageFrom}
            </figcaption>
            <blockquote className="text-sm leading-relaxed text-fg-secondary whitespace-pre-line break-words">{note}</blockquote>
          </figure>
        ) : (
          <p className="mt-0.5 text-xs text-fg-tertiary whitespace-pre-line break-words">{note}</p>
        ))}
      </div>
    </li>
  );
}

/**
 * Vertical history of an application (oldest first): submission, stage changes (with the team's
 * message to the candidate), interviews and withdrawals. Works for the candidate and the hiring team.
 */
export function ApplicationTimeline({ applicationId, audience, companyName, className }: {
  applicationId: string;
  audience: TimelineAudience;
  /** Used for "Message from {company}" in the candidate view. */
  companyName?: string;
  className?: string;
}) {
  const { data, isLoading, isError, error, refetch, isRefetching } = useApplicationTimeline(applicationId);
  const events = data ?? [];

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)} aria-busy="true" aria-label="Loading timeline">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1.5 pt-1">
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState className={cn('py-6', className)} title="Couldn't load the timeline" error={error} onRetry={() => refetch()} retrying={isRefetching} />
    );
  }

  if (events.length === 0) {
    return (
      <p className={cn('rounded-lg border border-dashed border-line px-4 py-5 text-center text-sm text-fg-muted', className)}>
        No activity yet.{audience === 'candidate' ? ' Updates from the hiring team will appear here.' : ''}
      </p>
    );
  }

  return (
    <ol className={cn('relative', className)} aria-label="Application timeline">
      {events.map((e, i) => (
        <TimelineItem key={e.id} event={e} audience={audience} companyName={companyName} last={i === events.length - 1} />
      ))}
    </ol>
  );
}
