'use client';

import { MessageSquare, StickyNote } from 'lucide-react';
import type { Application, ApplicationStatus } from '@/types';
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_STYLES } from '@/lib/constants';
import { formatDate, timeAgo } from '@/lib/format';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { StarDisplay } from '@/components/pipeline/StarRating';
import { InterviewChip } from '@/components/pipeline/InterviewChip';
import { cn } from '@/lib/cn';
import { ApplicantStatusMenu } from './ApplicantStatusMenu';

/** Note/message counters shown on cards and rows. */
export function ActivityCounts({ app, className }: { app: Application; className?: string }) {
  const notes = app.noteCount ?? 0;
  const messages = app.messageCount ?? 0;
  if (!notes && !messages) return null;
  return (
    <span className={cn('inline-flex items-center gap-2.5 text-xs text-fg-muted', className)}>
      {notes > 0 && (
        <span className="inline-flex items-center gap-1" title={`${notes} private note${notes === 1 ? '' : 's'}`}>
          <StickyNote className="w-3.5 h-3.5" aria-hidden />
          <span className="tabular-nums">{notes}</span>
          <span className="sr-only">note{notes === 1 ? '' : 's'}</span>
        </span>
      )}
      {messages > 0 && (
        <span className="inline-flex items-center gap-1" title={`${messages} message${messages === 1 ? '' : 's'}`}>
          <MessageSquare className="w-3.5 h-3.5" aria-hidden />
          <span className="tabular-nums">{messages}</span>
          <span className="sr-only">message{messages === 1 ? '' : 's'}</span>
        </span>
      )}
    </span>
  );
}

/** Compact applicant row for the list view. Clicking the row opens the applicant drawer. */
export function ApplicantCard({ app, selected, onToggle, onOpen, onMove }: {
  app: Application;
  selected: boolean;
  onToggle: (id: string) => void;
  onOpen: (app: Application) => void;
  onMove: (app: Application, status: ApplicationStatus) => void;
}) {
  const selectable = app.status !== 'WITHDRAWN';
  return (
    <div
      onClick={() => onOpen(app)}
      className={cn(
        'group relative bg-surface rounded-xl border border-line px-3 py-3 sm:px-4 cursor-pointer transition-colors hover:border-primary-300',
        'grid grid-cols-[auto_minmax(0,1fr)_auto] items-start md:items-center gap-x-3 gap-y-2',
        'md:grid-cols-[auto_minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.3fr)_7rem_auto]',
        selected && 'border-primary-400 ring-2 ring-primary-100',
        app.status === 'WITHDRAWN' && 'bg-muted'
      )}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggle(app.id)}
        onClick={(e) => e.stopPropagation()}
        disabled={!selectable}
        aria-label={`Select ${app.candidateName}`}
        title={selectable ? undefined : 'Withdrawn applications are read-only'}
        className="mt-2.5 md:mt-0 w-4 h-4 rounded border-line-strong text-primary-600 focus:ring-primary-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
      />

      <div className="flex items-start md:items-center gap-3 min-w-0">
        <Avatar name={app.candidateName} src={app.candidateAvatarUrl} size="sm" />
        <div className="min-w-0">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onOpen(app); }}
            className="font-semibold text-sm text-fg hover:text-primary-600 text-left break-words focus:outline-none focus-visible:underline"
          >
            {app.candidateName}
          </button>
          <p className="text-xs text-fg-muted truncate">{app.candidateHeadline || app.candidateEmail}</p>
          {/* Mobile-only meta */}
          <div className="md:hidden mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <Badge tone={APPLICATION_STATUS_STYLES[app.status]}>{APPLICATION_STATUS_LABELS[app.status]}</Badge>
            <StarDisplay rating={app.rating} />
            <ActivityCounts app={app} />
            <InterviewChip at={app.nextInterviewAt} response={app.nextInterviewResponse} />
            <span className="text-xs text-fg-subtle">
              <time dateTime={app.appliedAt} title={formatDate(app.appliedAt)}>{timeAgo(app.appliedAt)}</time>
            </span>
          </div>
        </div>
      </div>

      <div className="hidden md:block min-w-0">
        <Badge tone={APPLICATION_STATUS_STYLES[app.status]}>{APPLICATION_STATUS_LABELS[app.status]}</Badge>
      </div>

      <div className="hidden md:flex flex-col items-start gap-1 min-w-0">
        <div className="flex items-center gap-2.5">
          <StarDisplay rating={app.rating} showEmpty />
          <ActivityCounts app={app} />
        </div>
        <InterviewChip at={app.nextInterviewAt} response={app.nextInterviewResponse} />
      </div>

      <span className="hidden md:block text-xs text-fg-muted">
        <time dateTime={app.appliedAt} title={formatDate(app.appliedAt)}>{timeAgo(app.appliedAt)}</time>
      </span>

      <div className="justify-self-end">
        <ApplicantStatusMenu app={app} onMove={onMove} size="xs" />
      </div>
    </div>
  );
}
