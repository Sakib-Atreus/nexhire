'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CalendarClock, CalendarDays, CheckCircle2, Clock, Lock } from 'lucide-react';
import type { Interview } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useUpcomingInterviews, useUpdateInterview } from '@/hooks/useHiring';
import { INTERVIEW_TYPE_LABELS } from '@/lib/constants';
import { getErrorMessage, pluralize } from '@/lib/format';
import { toast } from '@/store/toastStore';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { buttonClasses } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { InterviewRow, needsRecruiterAction, type InterviewAction } from '@/components/interviews/InterviewRow';
import { canRespond } from '@/components/interviews/InterviewResponsePanel';
import { cn } from '@/lib/cn';
import { TimeZoneNote } from '@/components/interviews/InterviewParts';
import { formatInterviewWhen, groupByDay, localDayKey } from '@/components/interviews/interviewUtils';

function ListSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading interviews">
      {Array.from({ length: 2 }).map((_, g) => (
        <Card key={g} className="overflow-hidden" aria-hidden>
          <div className="px-5 py-3 border-b border-line-subtle"><Skeleton className="h-4 w-32" /></div>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-5 py-4">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3.5 w-1/3" />
              </div>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}

type Filter = 'ALL' | 'ACTION';

/** Recruiter: response counts and the All / Needs action filter. */
function RecruiterResponseBar({ interviews, filter, onFilter }: {
  interviews: Interview[];
  filter: Filter;
  onFilter: (f: Filter) => void;
}) {
  const scheduled = interviews.filter((i) => i.status === 'SCHEDULED');
  const awaiting = scheduled.filter((i) => i.response === 'AWAITING').length;
  const newTimes = scheduled.filter((i) => i.response === 'NEW_TIME_REQUESTED').length;
  const followUp = scheduled.filter((i) => i.needsFollowUp).length;
  const action = scheduled.filter(needsRecruiterAction).length;
  const parts = [
    { n: awaiting, label: 'awaiting response', tone: 'text-fg' },
    { n: newTimes, label: newTimes === 1 ? 'new time request' : 'new time requests', tone: newTimes ? 'text-amber-700' : 'text-fg' },
    { n: followUp, label: 'need follow-up', tone: followUp ? 'text-amber-700' : 'text-fg' },
  ];
  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: 'ALL', label: 'All', count: interviews.length },
    { key: 'ACTION', label: 'Needs action', count: action },
  ];

  return (
    <Card className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-fg-tertiary">
        {parts.map((p, idx) => (
          <span key={p.label} className="whitespace-nowrap">
            {idx > 0 && <span className="mr-2 text-fg-faint" aria-hidden>·</span>}
            <span className={cn('font-semibold tabular-nums', p.tone)}>{p.n}</span> {p.label}
          </span>
        ))}
      </p>
      <div role="group" aria-label="Filter interviews" className="inline-flex self-start rounded-lg bg-subtle p-0.5 sm:self-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            aria-pressed={filter === t.key}
            onClick={() => onFilter(t.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
              filter === t.key ? 'bg-surface text-fg shadow-sm' : 'text-fg-tertiary hover:text-fg'
            )}
          >
            {t.label}
            <span className={cn(
              'rounded-full px-1.5 tabular-nums',
              t.key === 'ACTION' && t.count > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emphasis/70 text-fg-tertiary'
            )}>
              {t.count}
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}

/** Candidate: "N invitations need your response". */
function CandidateResponseBanner({ count }: { count: number }) {
  if (count === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-fg-tertiary">
        <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden /> You’ve answered every invitation.
      </p>
    );
  }
  return (
    <div role="status" className="flex items-center gap-2.5 rounded-xl bg-primary-50 px-4 py-3 text-sm text-primary-900 ring-1 ring-inset ring-primary-200">
      <AlertTriangle className="w-4 h-4 flex-shrink-0 text-primary-600" aria-hidden />
      <p>
        <span className="font-semibold">{pluralize(count, 'invitation')} {count === 1 ? 'needs' : 'need'} your response.</span>{' '}
        <span className="text-primary-800/80">They’re highlighted below.</span>
      </p>
    </div>
  );
}

function SummaryCard({ interviews, recruiter }: { interviews: Interview[]; recruiter: boolean }) {
  const now = new Date();
  const todayKey = localDayKey(now.toISOString());
  const weekEnd = now.getTime() + 7 * 86_400_000;
  const today = interviews.filter((i) => localDayKey(i.scheduledAt) === todayKey).length;
  const week = interviews.filter((i) => new Date(i.scheduledAt).getTime() <= weekEnd).length;
  const next = [...interviews]
    .filter((i) => new Date(i.scheduledAt).getTime() > now.getTime())
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0];

  const stats = [
    { label: 'Today', value: today },
    { label: 'Next 7 days', value: week },
    { label: 'All upcoming', value: interviews.length },
  ];

  return (
    <Card>
      <CardHeader title="At a glance" />
      <dl className="grid grid-cols-3 divide-x divide-line-subtle border-b border-line-subtle">
        {stats.map((s) => (
          <div key={s.label} className="px-3 py-4 text-center">
            <dt className="text-xs text-fg-muted">{s.label}</dt>
            <dd className="mt-1 text-xl font-semibold text-fg tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>
      <div className="p-5 space-y-3">
        {next ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Next up</p>
            <p className="mt-1 text-sm font-medium text-fg break-words">
              {recruiter ? `${next.candidateName} · ${next.jobTitle}` : `${next.jobTitle} at ${next.companyName}`}
            </p>
            <p className="text-sm text-fg-tertiary">{formatInterviewWhen(next)}</p>
            <p className="text-xs text-fg-muted">{INTERVIEW_TYPE_LABELS[next.type]}</p>
          </div>
        ) : null}
        <p className="text-xs text-fg-muted">
          {recruiter
            ? 'Shows scheduled interviews for every job you manage, including jobs posted by your company team. Rescheduling resets the candidate’s answer so they confirm the new time — unless you pick one of their suggested times.'
            : 'Accept, decline or suggest another time for each invitation — you can change your answer until the interview starts. You’ll be notified if the time changes; please confirm the new time when it does.'}
        </p>
      </div>
    </Card>
  );
}

export default function InterviewsPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const allowed = role === 'CANDIDATE' || role === 'RECRUITER';
  const recruiter = role === 'RECRUITER';

  const { data, isLoading, isError, error, refetch, isRefetching } = useUpcomingInterviews(allowed);
  const update = useUpdateInterview();
  const [pending, setPending] = useState<{ interview: Interview; action: InterviewAction } | null>(null);
  const [filter, setFilter] = useState<Filter>('ALL');

  const interviews = useMemo(() => data ?? [], [data]);
  const visible = useMemo(
    () => (recruiter && filter === 'ACTION' ? interviews.filter(needsRecruiterAction) : interviews),
    [interviews, recruiter, filter]
  );
  const groups = useMemo(() => groupByDay(visible), [visible]);
  const awaitingCount = useMemo(
    () => (recruiter ? 0 : interviews.filter((i) => canRespond(i) && i.response === 'AWAITING').length),
    [interviews, recruiter]
  );

  if (!user) return null;

  if (!allowed) {
    return (
      <div>
        <PageHeader title="Interviews" />
        <Card>
          <EmptyState icon={Lock} title="Interviews are for candidates and recruiters" description="Admin accounts don't take part in interviews." />
        </Card>
      </div>
    );
  }

  const confirm = () => {
    if (!pending) return;
    const { interview, action } = pending;
    update.mutate(
      { id: interview.id, status: action },
      {
        onSuccess: () => {
          toast.success(
            action === 'COMPLETED' ? 'Interview marked completed' : 'Interview cancelled',
            action === 'CANCELLED' ? `${interview.candidateName} has been notified.` : `${interview.candidateName} · ${interview.jobTitle}`
          );
          setPending(null);
        },
        onError: (err) => toast.error(action === 'COMPLETED' ? 'Could not update the interview' : 'Could not cancel the interview', getErrorMessage(err)),
      }
    );
  };

  return (
    <div>
      <PageHeader
        title="Interviews"
        description={
          recruiter
            ? 'Upcoming interviews across the jobs you manage.'
            : 'Your upcoming interviews. Add them to your calendar so you don’t miss one.'
        }
        actions={
          recruiter ? (
            <Link href="/jobs/my" className={buttonClasses('secondary')}>My jobs</Link>
          ) : (
            <Link href="/applications" className={buttonClasses('secondary')}>My applications</Link>
          )
        }
      />

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <Card>
          <ErrorState title="We couldn't load your interviews" error={error} onRetry={() => refetch()} retrying={isRefetching} />
        </Card>
      ) : interviews.length === 0 ? (
        <Card>
          {recruiter ? (
            <EmptyState
              icon={CalendarClock}
              title="No interviews scheduled"
              description="Schedule interviews from a job's applicant pipeline. They'll show up here, grouped by day."
              action={<Link href="/jobs/my" className={buttonClasses('primary', 'sm')}>Go to my jobs</Link>}
            />
          ) : (
            <EmptyState
              icon={CalendarClock}
              title="No upcoming interviews"
              description="When a hiring team invites you to interview, the details will appear here and you'll get a notification."
              action={<Link href="/applications" className={buttonClasses('primary', 'sm')}>View my applications</Link>}
            />
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-6 min-w-0">
            {recruiter ? (
              <RecruiterResponseBar interviews={interviews} filter={filter} onFilter={setFilter} />
            ) : (
              <CandidateResponseBanner count={awaitingCount} />
            )}
            <TimeZoneNote />
            {groups.length === 0 && (
              <Card>
                <EmptyState
                  icon={CheckCircle2}
                  title="Nothing needs your attention"
                  description="No new time requests, declines or overdue invitations right now."
                  action={<button type="button" onClick={() => setFilter('ALL')} className={buttonClasses('secondary', 'sm')}>Show all interviews</button>}
                />
              </Card>
            )}
            {groups.map((g) => (
              <section key={g.key} aria-labelledby={`day-${g.key}`}>
                <Card className="overflow-hidden">
                  <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-line-subtle bg-muted/60">
                    <h2 id={`day-${g.key}`} className="flex items-center gap-2 text-sm font-semibold text-fg">
                      <CalendarDays className="w-4 h-4 text-fg-subtle" aria-hidden />
                      {g.heading}
                    </h2>
                    <span className={cn('text-xs', !recruiter && g.items.some((i) => canRespond(i) && i.response === 'AWAITING') ? 'font-medium text-primary-700' : 'text-fg-muted')}>
                      {!recruiter && g.items.some((i) => canRespond(i) && i.response === 'AWAITING')
                        ? `${g.items.filter((i) => canRespond(i) && i.response === 'AWAITING').length} to answer · ${pluralize(g.items.length, 'interview')}`
                        : pluralize(g.items.length, 'interview')}
                    </span>
                  </div>
                  <ul className="divide-y divide-line-subtle">
                    {g.items.map((i) => (
                      <InterviewRow
                        key={i.id}
                        interview={i}
                        viewer={recruiter ? 'RECRUITER' : 'CANDIDATE'}
                        onAction={recruiter ? (interview, action) => setPending({ interview, action }) : undefined}
                      />
                    ))}
                  </ul>
                </Card>
              </section>
            ))}
          </div>
          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <SummaryCard interviews={interviews} recruiter={recruiter} />
            {!recruiter && (
              <Card className="p-5">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-fg">
                  <Clock className="w-4 h-4 text-primary-600" aria-hidden /> Preparing
                </h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-fg-tertiary">
                  <li>Re-read the job description and your application.</li>
                  <li>For video calls, test your camera and link a few minutes early.</li>
                  <li>Have a couple of questions ready for the team.</li>
                </ul>
              </Card>
            )}
          </aside>
        </div>
      )}

      <ConfirmDialog
        open={!!pending}
        onClose={() => !update.isPending && setPending(null)}
        onConfirm={confirm}
        loading={update.isPending}
        tone={pending?.action === 'CANCELLED' ? 'danger' : 'primary'}
        title={pending?.action === 'CANCELLED' ? 'Cancel this interview?' : 'Mark interview as completed?'}
        description={
          pending
            ? pending.action === 'CANCELLED'
              ? `The interview with ${pending.interview.candidateName} on ${formatInterviewWhen(pending.interview)} will be cancelled and they'll be notified.`
              : `The interview with ${pending.interview.candidateName} on ${formatInterviewWhen(pending.interview)} will be marked as completed and removed from this list.`
            : undefined
        }
        confirmLabel={pending?.action === 'CANCELLED' ? 'Cancel interview' : 'Mark completed'}
      />
    </div>
  );
}
