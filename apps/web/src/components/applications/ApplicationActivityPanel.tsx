'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { CalendarClock, History, MessagesSquare, Send } from 'lucide-react';
import type { Application, ApplicationMessage, Interview } from '@/types';
import { useApplicationInterviews, useApplicationMessages, useSendMessage } from '@/hooks/useHiring';
import { INTERVIEW_STATUS_LABELS, INTERVIEW_STATUS_STYLES, INTERVIEW_TYPE_LABELS } from '@/lib/constants';
import { getErrorMessage } from '@/lib/format';
import { toast } from '@/store/toastStore';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import { ErrorState, Skeleton } from '@/components/ui/States';
import {
  AddToCalendarButton, InterviewLocation, InterviewTypeIcon, JoinButton,
} from '@/components/interviews/InterviewParts';
import { InterviewResponsePanel } from '@/components/interviews/InterviewResponsePanel';
import { ApplicationTimeline } from '@/components/timeline/ApplicationTimeline';
import { formatInterviewWhen, isHttpUrl } from '@/components/interviews/interviewUtils';

const MESSAGE_MAX = 5000;

function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ─── Interviews ──────────────────────────────────────────────────────────────

function InterviewItem({ interview: i }: { interview: Interview }) {
  const inactive = i.status !== 'SCHEDULED';
  return (
    <li className={cn('rounded-lg border border-line bg-surface p-3.5', inactive && 'bg-muted/70')}>
      <div className="flex gap-3">
        <InterviewTypeIcon type={i.type} className={inactive ? 'bg-subtle text-fg-subtle' : undefined} />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className={cn('text-sm font-semibold', inactive ? 'text-fg-muted line-through decoration-slate-300' : 'text-fg')}>
              <time dateTime={i.scheduledAt}>{formatInterviewWhen(i)}</time>
            </p>
            <Badge tone={INTERVIEW_STATUS_STYLES[i.status]}>{INTERVIEW_STATUS_LABELS[i.status]}</Badge>
          </div>
          <p className="text-xs text-fg-muted">{INTERVIEW_TYPE_LABELS[i.type]}</p>
          {i.status === 'SCHEDULED' && <InterviewLocation interview={i} />}
          {i.message && (
            <p className="text-sm text-fg-tertiary whitespace-pre-line break-words">{i.message}</p>
          )}
          <InterviewResponsePanel interview={i} className="!mt-2.5" />
          {i.status === 'SCHEDULED' && (i.response === 'ACCEPTED' || (i.type === 'VIDEO' && isHttpUrl(i.location))) && (
            <div className="flex flex-wrap gap-2 pt-1.5">
              <JoinButton interview={i} />
              {i.response === 'ACCEPTED' && <AddToCalendarButton interview={i} />}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function InterviewsSection({ applicationId }: { applicationId: string }) {
  const { data, isLoading, isError, error, refetch, isRefetching } = useApplicationInterviews(applicationId);
  const now = Date.now();
  const list = data ?? [];
  const upcoming = list
    .filter((i) => i.status === 'SCHEDULED' && new Date(i.scheduledAt).getTime() + i.durationMinutes * 60_000 >= now)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const past = list
    .filter((i) => !upcoming.includes(i))
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));

  return (
    <section aria-label="Interviews" className="min-w-0">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-fg">
        <CalendarClock className="w-4 h-4 text-fg-subtle" aria-hidden /> Interviews
      </h3>
      <div className="mt-3">
        {isLoading ? (
          <div className="space-y-2" aria-busy="true" aria-label="Loading interviews">
            <Skeleton className="h-20" />
          </div>
        ) : isError ? (
          <ErrorState className="py-6" title="Couldn't load interviews" error={error} onRetry={() => refetch()} retrying={isRefetching} />
        ) : list.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line px-4 py-5 text-center text-sm text-fg-muted">
            No interviews yet. If the hiring team invites you, the details will appear here.
          </p>
        ) : (
          <div className="space-y-4">
            {upcoming.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">Upcoming</p>
                <ul className="space-y-2">{upcoming.map((i) => <InterviewItem key={i.id} interview={i} />)}</ul>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">Past &amp; cancelled</p>
                <ul className="space-y-2">{past.map((i) => <InterviewItem key={i.id} interview={i} />)}</ul>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Messages ────────────────────────────────────────────────────────────────

function MessageBubble({ message: m }: { message: ApplicationMessage }) {
  const mine = m.fromCandidate;
  return (
    <li className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[85%] sm:max-w-[75%] min-w-0')}>
        <p className={cn('mb-1 text-[11px] text-fg-muted', mine && 'text-right')}>
          <span className="font-medium text-fg-secondary">{mine ? 'You' : m.senderName || 'Hiring team'}</span>
          {' · '}
          <time dateTime={m.createdAt}>{formatMessageTime(m.createdAt)}</time>
        </p>
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line break-words',
            mine ? 'rounded-tr-sm bg-primary-600 text-white' : 'rounded-tl-sm bg-surface text-fg-soft ring-1 ring-inset ring-line'
          )}
        >
          {m.body}
        </div>
      </div>
    </li>
  );
}

function MessagesSection({ application }: { application: Application }) {
  const { data, isLoading, isError, error, refetch, isRefetching } = useApplicationMessages(application.id);
  const send = useSendMessage(application.id);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const hintId = useId();
  const list = data ?? [];

  // Keep the newest message in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [list.length]);

  const submit = () => {
    const body = draft.trim();
    if (!body || send.isPending) return;
    send.mutate(body, {
      onSuccess: () => setDraft(''),
      onError: (err) => toast.error('Message not sent', getErrorMessage(err)),
    });
  };

  return (
    <section aria-label="Messages" className="min-w-0 flex flex-col">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-fg">
        <MessagesSquare className="w-4 h-4 text-fg-subtle" aria-hidden /> Messages with {application.companyName}
      </h3>
      <div className="mt-3 rounded-xl bg-muted ring-1 ring-inset ring-line flex flex-col min-w-0">
        <div ref={scrollRef} className="max-h-96 overflow-y-auto p-3 sm:p-4" aria-live="polite">
          {isLoading ? (
            <div className="space-y-3" aria-busy="true" aria-label="Loading messages">
              <Skeleton className="h-12 w-2/3" />
              <Skeleton className="h-10 w-1/2 ml-auto" />
            </div>
          ) : isError ? (
            <ErrorState className="py-6" title="Couldn't load messages" error={error} onRetry={() => refetch()} retrying={isRefetching} />
          ) : list.length === 0 ? (
            <p className="py-6 text-center text-sm text-fg-muted">
              No messages yet. You can send the hiring team a question about this application.
            </p>
          ) : (
            <ul className="space-y-3">{list.map((m) => <MessageBubble key={m.id} message={m} />)}</ul>
          )}
        </div>
        <form
          className="border-t border-line bg-surface rounded-b-xl p-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label htmlFor={inputId} className="sr-only">Write a message to the hiring team</label>
          <Textarea
            id={inputId}
            rows={2}
            value={draft}
            maxLength={MESSAGE_MAX}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Write a message…"
            aria-describedby={hintId}
            className="resize-y"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p id={hintId} className="text-xs text-fg-muted">
              The hiring team is notified. Press Ctrl/⌘ + Enter to send.
              {draft.length > MESSAGE_MAX - 300 && <span className="ml-1 tabular-nums">{draft.length}/{MESSAGE_MAX}</span>}
            </p>
            <Button type="submit" size="sm" loading={send.isPending} disabled={!draft.trim()}>
              {!send.isPending && <Send className="w-3.5 h-3.5" aria-hidden />} Send
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}

// ─── Timeline ────────────────────────────────────────────────────────────────

function TimelineSection({ application }: { application: Application }) {
  return (
    <section aria-label="Timeline" className="min-w-0">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-fg">
        <History className="w-4 h-4 text-fg-subtle" aria-hidden /> Timeline
      </h3>
      <ApplicationTimeline className="mt-3" applicationId={application.id} audience="candidate" companyName={application.companyName} />
    </section>
  );
}

/** Timeline, interviews and message thread for one application. Mount only when the panel is open (queries run on mount). */
export function ApplicationActivityPanel({ application, id }: { application: Application; id?: string }) {
  return (
    <div id={id} className="mt-3 grid grid-cols-1 gap-6 rounded-xl border border-line bg-surface p-4 sm:p-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="min-w-0 space-y-6">
        <TimelineSection application={application} />
        <InterviewsSection applicationId={application.id} />
      </div>
      <MessagesSection application={application} />
    </div>
  );
}
