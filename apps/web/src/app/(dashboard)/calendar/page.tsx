'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, CalendarCheck2, CalendarClock, CalendarDays, ChevronLeft, ChevronRight, Clock, List, Rows3, Sun, Video,
} from 'lucide-react';
import type { Interview } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useCalendarInterviews, useUpcomingInterviews } from '@/hooks/useHiring';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button, buttonClasses } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { StatCard } from '@/components/dashboard/StatCard';
import { InterviewTypeIcon, TimeZoneNote } from '@/components/interviews/InterviewParts';
import { canRespond } from '@/components/interviews/InterviewResponsePanel';
import { dayHeading, formatTime, localDayKey } from '@/components/interviews/interviewUtils';
import dynamic from 'next/dynamic';
import type { CalendarHandle, CalendarView } from '@/components/calendar/InterviewCalendar';

import { InterviewDetailsModal } from '@/components/calendar/InterviewDetailsModal';
import { CalendarSubscribeCard } from '@/components/calendar/CalendarSubscribeCard';
import { eventTone, legend } from '@/components/calendar/eventTone';

// FullCalendar is the heaviest part of the page: load it after the stats and side panels.
const InterviewCalendar = dynamic(() => import('@/components/calendar/InterviewCalendar'), {
  ssr: false,
  loading: () => <Skeleton className="m-4 h-[560px] rounded-xl" />,
});

const VIEWS: { value: CalendarView; label: string; icon: typeof CalendarDays }[] = [
  { value: 'dayGridMonth', label: 'Month', icon: CalendarDays },
  { value: 'timeGridWeek', label: 'Week', icon: Rows3 },
  { value: 'timeGridDay', label: 'Day', icon: Sun },
  { value: 'listWeek', label: 'Agenda', icon: List },
];

function initialView(): CalendarView {
  return typeof window !== 'undefined' && window.innerWidth < 768 ? 'listWeek' : 'dayGridMonth';
}

export default function CalendarPage() {
  const user = useAuthStore((s) => s.user);
  const recruiter = user?.role === 'RECRUITER';
  const calRef = useRef<CalendarHandle>(null);
  const [view, setView] = useState<CalendarView>(initialView);
  const [range, setRange] = useState<{ start: string; end: string; title: string } | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);
  const [jobFilter, setJobFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const cal = useCalendarInterviews(range?.start ?? '', range?.end ?? '', !!range);
  const upcoming = useUpcomingInterviews();

  const jobs = useMemo(() => {
    const m = new Map<string, string>();
    for (const i of [...(cal.data ?? []), ...(upcoming.data ?? [])]) m.set(i.jobId, i.jobTitle);
    return Array.from(m, ([id, title]) => ({ id, title })).sort((a, b) => a.title.localeCompare(b.title));
  }, [cal.data, upcoming.data]);

  const visible = useMemo(
    () => (cal.data ?? []).filter((i) => (showCancelled || i.status !== 'CANCELLED') && (!jobFilter || i.jobId === jobFilter)),
    [cal.data, showCancelled, jobFilter]
  );

  // Selected interview comes from live data, so it updates after a response or reschedule.
  const selected = selectedId
    ? (cal.data?.find((i) => i.id === selectedId) ?? upcoming.data?.find((i) => i.id === selectedId) ?? null)
    : null;

  const stats = useMemo(() => {
    const list = upcoming.data;
    if (!list) return undefined;
    const now = Date.now();
    const today = localDayKey(new Date().toISOString());
    const weekEnd = now + 7 * 86_400_000;
    return {
      today: list.filter((i) => localDayKey(i.scheduledAt) === today).length,
      week: list.filter((i) => new Date(i.scheduledAt).getTime() < weekEnd).length,
      awaiting: list.filter((i) => i.response === 'AWAITING' && (recruiter || canRespond(i))).length,
      attention: recruiter
        ? list.filter((i) => i.response === 'NEW_TIME_REQUESTED' || i.response === 'DECLINED' || i.needsFollowUp).length
        : list.filter((i) => i.response === 'ACCEPTED').length,
    };
  }, [upcoming.data, recruiter]);

  const nextUp = (upcoming.data ?? []).filter((i) => new Date(i.scheduledAt).getTime() + i.durationMinutes * 60_000 > Date.now()).slice(0, 5);

  function changeView(v: CalendarView) {
    setView(v);
    calRef.current?.changeView(v);
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Calendar"
        description={recruiter
          ? 'Every interview across the jobs you manage, with candidate responses at a glance.'
          : 'Your interviews in one place. Respond to invitations, join calls and sync to your own calendar.'}
        actions={
          <>
            <Link href="/interviews" className={buttonClasses('secondary', 'md')}>
              <CalendarClock className="h-4 w-4" aria-hidden /> Interview list
            </Link>
            {recruiter && (
              <Link href="/jobs/my" className={buttonClasses('primary', 'md')}>
                <CalendarCheck2 className="h-4 w-4" aria-hidden /> Schedule from pipeline
              </Link>
            )}
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Today" value={stats?.today} icon={Sun} tone="bg-sky-50 text-sky-700" hint="Interviews today" />
        <StatCard label="Next 7 days" value={stats?.week} icon={CalendarDays} hint="Scheduled interviews" />
        <StatCard
          label={recruiter ? 'Awaiting candidates' : 'Need your response'}
          value={stats?.awaiting}
          icon={Clock}
          tone="bg-violet-50 text-violet-700"
          hint={recruiter ? 'Invites not answered yet' : 'Accept, decline or suggest a time'}
        />
        {recruiter ? (
          <StatCard label="Need attention" value={stats?.attention} icon={AlertTriangle} tone="bg-amber-50 text-amber-700" hint="New times, declines, follow-ups" />
        ) : (
          <StatCard label="Confirmed" value={stats?.attention} icon={CalendarCheck2} tone="bg-emerald-50 text-emerald-700" hint="Upcoming and confirmed" />
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="min-w-0 overflow-hidden">
          {/* Toolbar */}
          <div className="space-y-3 border-b border-line p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => calRef.current?.today()}>Today</Button>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => calRef.current?.prev()}
                    aria-label="Previous"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-fg-tertiary hover:bg-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => calRef.current?.next()}
                    aria-label="Next"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-fg-tertiary hover:bg-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <h2 className="ml-1 whitespace-nowrap text-lg font-semibold tracking-tight text-fg" aria-live="polite">{range?.title ?? ' '}</h2>
                {cal.isFetching && <span className="h-2 w-2 animate-pulse rounded-full bg-primary-500" aria-label="Loading" />}
              </div>

              <div role="radiogroup" aria-label="Calendar view" className="grid grid-cols-4 gap-0.5 rounded-lg bg-subtle p-0.5">
                {VIEWS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={view === value}
                    onClick={() => changeView(value)}
                    className={cn(
                      'inline-flex h-7 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                      view === value ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'
                    )}
                  >
                    <Icon className="hidden h-3.5 w-3.5 sm:block" aria-hidden />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {recruiter && jobs.length > 1 && (
                <Select value={jobFilter} onChange={(e) => setJobFilter(e.target.value)} aria-label="Filter by job" className="h-8 w-auto max-w-[16rem] py-0 text-xs">
                  <option value="">All jobs</option>
                  {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
                </Select>
              )}
              <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg px-2 text-xs font-medium text-fg-tertiary hover:bg-subtle">
                <input
                  type="checkbox"
                  checked={showCancelled}
                  onChange={(e) => setShowCancelled(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-line-strong text-primary-600 focus:ring-primary-500"
                />
                Show cancelled
              </label>
              <span className="ml-auto text-xs text-fg-muted">
                {visible.length} interview{visible.length === 1 ? '' : 's'} in view
              </span>
            </div>
          </div>

          {cal.isError ? (
            <ErrorState className="py-16" title="Couldn't load your calendar" error={cal.error} onRetry={() => cal.refetch()} retrying={cal.isRefetching} />
          ) : (
            <InterviewCalendar
              ref={calRef}
              interviews={visible}
              recruiter={recruiter}
              initialView={view}
              view={view}
              onRangeChange={(r) => {
                setView(r.view);
                setRange({ start: r.start.toISOString(), end: r.end.toISOString(), title: r.title });
              }}
              onSelect={(i) => setSelectedId(i.id)}
            />
          )}

          <div className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <ul className="flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Legend">
              {legend(recruiter).map(({ tone, label }) => (
                <li key={tone.key} className="inline-flex items-center gap-1.5 text-xs text-fg-muted">
                  <span className={cn('h-2 w-2 rounded-full', tone.accent)} aria-hidden /> {label}
                </li>
              ))}
            </ul>
            <TimeZoneNote />
          </div>
        </Card>

        <aside className="space-y-6">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-line-subtle px-5 py-4">
              <h2 className="text-sm font-semibold text-fg">Up next</h2>
              <Link href="/interviews" className="text-xs font-medium text-primary-600 hover:text-primary-700">View all</Link>
            </div>
            {upcoming.isLoading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : nextUp.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <CalendarDays className="mx-auto h-6 w-6 text-fg-faint" aria-hidden />
                <p className="mt-2 text-sm text-fg-muted">No upcoming interviews.</p>
              </div>
            ) : (
              <ul className="divide-y divide-line-subtle">
                {nextUp.map((i) => <UpNextItem key={i.id} interview={i} recruiter={recruiter} onOpen={() => setSelectedId(i.id)} />)}
              </ul>
            )}
          </Card>
          <CalendarSubscribeCard />
        </aside>
      </div>

      <InterviewDetailsModal interview={selected} recruiter={recruiter} onClose={() => setSelectedId(null)} />
    </div>
  );
}

function UpNextItem({ interview: i, recruiter, onOpen }: { interview: Interview; recruiter: boolean; onOpen(): void }) {
  const tone = eventTone(i);
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-muted focus:outline-none focus-visible:bg-muted"
      >
        <InterviewTypeIcon type={i.type} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-fg">{recruiter ? i.candidateName : i.jobTitle}</span>
          <span className="block truncate text-xs text-fg-muted">{recruiter ? i.jobTitle : i.companyName}</span>
          <span className="mt-1 flex items-center gap-1.5 text-xs font-medium text-fg-secondary">
            <span className={cn('h-1.5 w-1.5 rounded-full', tone.accent)} aria-hidden />
            {dayHeading(i.scheduledAt)} · {formatTime(i.scheduledAt)}
            {i.hasVideoRoom && <Video className="h-3 w-3 text-primary-600" aria-label="NexHire video" />}
          </span>
        </span>
      </button>
    </li>
  );
}
