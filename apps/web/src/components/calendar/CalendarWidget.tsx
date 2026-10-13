'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Interview } from '@/types';
import { useCalendarInterviews, useUpcomingInterviews } from '@/hooks/useHiring';
import { INTERVIEW_RESPONSE_LABELS } from '@/lib/constants';
import { buttonClasses } from '@/components/ui/Button';
import { CANDIDATE_RESPONSE_LABELS, canRespond } from '@/components/interviews/InterviewResponsePanel';
import { cn } from '@/lib/cn';
import { Card } from '@/components/ui/Card';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { InterviewTypeIcon, JoinButton } from '@/components/interviews/InterviewParts';
import { dayHeading, formatDuration, formatTime, formatWeekdayDate, interviewEnd, localDayKey } from '@/components/interviews/interviewUtils';
import { eventTone } from './eventTone';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** 6×7 grid of local days covering the month (weeks start on Sunday). */
function monthGrid(month: Date): Date[] {
  const first = startOfMonth(month);
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

const dayKey = (d: Date) => localDayKey(d.toISOString());

/** Dashboard card: month at a glance with interview dots, and the selected day's agenda. */
export function CalendarWidget({ recruiter, className }: { recruiter: boolean; className?: string }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => dayKey(new Date()));
  const grid = useMemo(() => monthGrid(month), [month]);
  const from = grid[0].toISOString();
  const to = new Date(grid[41].getFullYear(), grid[41].getMonth(), grid[41].getDate() + 1).toISOString();
  const { data, isLoading, isError, error, refetch, isRefetching } = useCalendarInterviews(from, to);

  const byDay = useMemo(() => {
    const m = new Map<string, Interview[]>();
    for (const i of data ?? []) {
      if (i.status === 'CANCELLED') continue;
      const k = localDayKey(i.scheduledAt);
      m.set(k, [...(m.get(k) ?? []), i]);
    }
    return m;
  }, [data]);

  const today = dayKey(new Date());
  const upcoming = useUpcomingInterviews();
  const comingUp = (upcoming.data ?? []).filter((i) => i.status === 'SCHEDULED' && interviewEnd(i).getTime() > Date.now()).slice(0, 3);
  const dayItems = byDay.get(selected) ?? [];
  const selectedDate = grid.find((d) => dayKey(d) === selected);
  const monthLabel = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="flex items-center justify-between border-b border-line-subtle px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <CalendarDays className="h-4 w-4" aria-hidden />
          </span>
          <h2 className="text-base font-semibold text-fg">Calendar</h2>
        </div>
        <Link href="/calendar" className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
          Open calendar <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <div className="grid md:grid-cols-[17rem_minmax(0,1fr)]">
        {/* Month */}
        <div className="border-b border-line-subtle p-4 md:border-b-0 md:border-r">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-fg" aria-live="polite">{monthLabel}</p>
            <div className="flex">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-fg-muted hover:bg-subtle hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-fg-muted hover:bg-subtle hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 text-center" role="grid" aria-label={monthLabel}>
            {WEEKDAYS.map((d, i) => (
              <span key={i} className="pb-1 text-[11px] font-semibold text-fg-subtle" aria-hidden>{d}</span>
            ))}
            {grid.map((d) => {
              const k = dayKey(d);
              const items = byDay.get(k) ?? [];
              const inMonth = d.getMonth() === month.getMonth();
              const isSel = k === selected;
              const isToday = k === today;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSelected(k)}
                  aria-pressed={isSel}
                  aria-label={`${d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}${items.length ? `, ${items.length} interview${items.length > 1 ? 's' : ''}` : ''}`}
                  className={cn(
                    'relative mx-auto flex h-9 w-9 flex-col items-center justify-center rounded-lg text-xs tabular-nums transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                    isSel ? 'bg-primary-600 font-semibold text-white' : isToday ? 'bg-primary-50 font-semibold text-primary-700' : 'hover:bg-subtle',
                    !isSel && !isToday && (inMonth ? 'text-fg-secondary' : 'text-fg-subtle')
                  )}
                >
                  {d.getDate()}
                  {items.length > 0 && (
                    <span className="absolute bottom-1 flex gap-0.5" aria-hidden>
                      {items.slice(0, 3).map((i) => (
                        <span key={i.id} className={cn('h-1 w-1 rounded-full', isSel ? 'bg-white' : eventTone(i).accent)} />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day agenda (first on phones, where the month grid matters less) */}
        <div className="order-first min-w-0 p-4 md:order-none">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-subtle">
            {selectedDate ? dayHeading(selectedDate.toISOString()) : ''}
            {dayItems.length > 0 && <span className="ml-1.5 font-medium normal-case tracking-normal text-fg-muted">· {dayItems.length} interview{dayItems.length > 1 ? 's' : ''}</span>}
          </p>
          {isError ? (
            <ErrorState className="py-6" title="Couldn't load your calendar" error={error} onRetry={() => refetch()} retrying={isRefetching} />
          ) : isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : dayItems.length > 0 ? (
            <ul className="space-y-2">
              {dayItems.map((i) => <AgendaRow key={i.id} interview={i} recruiter={recruiter} />)}
            </ul>
          ) : (
            <>
              <p className="flex items-center gap-2 text-sm text-fg-muted">
                <CalendarDays className="h-4 w-4 text-fg-subtle" aria-hidden /> No interviews on this day.
              </p>
              {/* Instead of an empty box, show what's next. */}
              <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-fg-subtle">Coming up</p>
              {comingUp.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-sm text-fg-muted">
                  {recruiter
                    ? 'No interviews scheduled. Schedule them from a job’s applicant pipeline.'
                    : 'No interviews scheduled yet. Invitations will show up here.'}
                </p>
              ) : (
                <ul className="space-y-2">
                  {comingUp.map((i) => <AgendaRow key={i.id} interview={i} recruiter={recruiter} showDay />)}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

/** "Today", "Tomorrow" or "Thu, Oct 15": short enough for the agenda's time column. */
function shortDay(iso: string): string {
  const heading = dayHeading(iso);
  return heading === 'Today' || heading === 'Tomorrow' ? heading : formatWeekdayDate(iso);
}

/** One interview in the agenda. Actions sit on the right on wide screens and wrap below on narrow ones. */
function AgendaRow({ interview: i, recruiter, showDay = false }: { interview: Interview; recruiter: boolean; showDay?: boolean }) {
  const tone = eventTone(i);
  const href = recruiter ? `/jobs/${i.jobId}/applicants?application=${i.applicationId}` : `/applications?application=${i.applicationId}`;
  const askRespond = !recruiter && i.status === 'SCHEDULED' && i.response === 'AWAITING' && canRespond(i);
  const statusLabel = i.status !== 'SCHEDULED' ? null : recruiter ? INTERVIEW_RESPONSE_LABELS[i.response] : CANDIDATE_RESPONSE_LABELS[i.response];
  return (
    <li className="relative flex flex-wrap items-center gap-x-3 gap-y-2 overflow-hidden rounded-xl bg-muted py-2.5 pl-4 pr-3 ring-1 ring-inset ring-line">
      <span className={cn('absolute inset-y-0 left-0 w-1', tone.accent)} aria-hidden />
      <div className={cn('flex-shrink-0', showDay ? 'w-24' : 'w-16')}>
        {showDay && <p className="whitespace-nowrap text-[11px] font-medium text-fg-muted">{shortDay(i.scheduledAt)}</p>}
        <p className="text-sm font-semibold tabular-nums text-fg">{formatTime(i.scheduledAt)}</p>
        {!showDay && <p className="text-[11px] text-fg-muted">{formatDuration(i.durationMinutes)}</p>}
      </div>
      <InterviewTypeIcon type={i.type} className="hidden h-8 w-8 sm:inline-flex" />
      <Link href={href} className="min-w-[10rem] flex-1 focus:outline-none focus-visible:underline">
        <span className={cn('block truncate text-sm font-medium text-fg', i.status !== 'SCHEDULED' && 'text-fg-muted')}>
          {recruiter ? i.candidateName : i.jobTitle}
        </span>
        <span className="block truncate text-xs text-fg-muted">
          {recruiter ? i.jobTitle : i.companyName} · {formatDuration(i.durationMinutes)}
        </span>
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        {statusLabel && (
          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium', tone.chip)}>{statusLabel}</span>
        )}
        {askRespond ? (
          <Link href={href} className={buttonClasses('primary', 'sm')}>Respond</Link>
        ) : (
          <JoinButton interview={i} />
        )}
      </div>
    </li>
  );
}
