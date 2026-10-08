'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight, Bookmark, Briefcase, CheckCircle2, Circle, Clock, FileText, Inbox, Plus, Search,
  Send, Trophy, Users,
} from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { useRecruiterStats } from '@/hooks/useApplications';
import { useJobs, useMyJobs, useSavedJobs } from '@/hooks/useJobs';
import { useMe } from '@/hooks/useProfile';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { buttonClasses } from '@/components/ui/Button';
import { EmptyState, ErrorState, Skeleton, Spinner } from '@/components/ui/States';
import { StatCard } from '@/components/dashboard/StatCard';
import { UpcomingInterviewsCard } from '@/components/interviews/UpcomingInterviewsCard';
import { PipelineBars, statsToCounts, type StatusCounts } from '@/components/dashboard/PipelineBars';
import { getProfileCompleteness } from '@/components/profile/completeness';
import {
  APPLICATION_STATUS_LABELS, APPLICATION_STATUS_ORDER, APPLICATION_STATUS_STYLES, JOB_STATUS_LABELS, JOB_STATUS_STYLES,
} from '@/lib/constants';
import { pluralize, timeAgo } from '@/lib/format';
import type { Application, Page } from '@/types';

const RECENT_WINDOW = 50;

/** Most recent applications first (the list hooks don't request a sort order). */
function useRecentApplications(scope: 'my' | 'recruiter', size: number) {
  return useQuery({
    queryKey: ['applications', scope, 'recent', size],
    queryFn: () =>
      api
        .get<Page<Application>>(`/applications/${scope}`, { params: { page: 0, size, sort: 'appliedAt,desc' } })
        .then((r) => r.data),
  });
}

function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="p-5 space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function ViewAll({ href, label = 'View all' }: { href: string; label?: string }) {
  return (
    <Link href={href} className="text-sm font-medium text-primary-600 hover:text-primary-700 whitespace-nowrap">
      {label}
    </Link>
  );
}

function NextStep({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="p-5 border-primary-100 bg-gradient-to-br from-primary-50/80 to-white">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Next step</p>
      <h2 className="mt-1 text-base font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
      <div className="mt-4 flex flex-wrap gap-2">{children}</div>
    </Card>
  );
}

// ─── Candidate ────────────────────────────────────────────────────
function CandidateDashboard() {
  const apps = useRecentApplications('my', RECENT_WINDOW);
  const saved = useSavedJobs(0);
  const me = useMe();

  const list = apps.data?.content ?? [];
  const total = apps.data?.totalElements;
  const partial = (total ?? 0) > list.length;
  const counts = APPLICATION_STATUS_ORDER.reduce(
    (acc, s) => ({ ...acc, [s]: list.filter((a) => a.status === s).length }),
    {} as StatusCounts
  );
  const inProgress = counts.PENDING + counts.REVIEWING + counts.SHORTLISTED + counts.INTERVIEWED;
  const completeness = me.data ? getProfileCompleteness(me.data) : null;
  const scopeHint = partial ? `In your ${RECENT_WINDOW} latest` : undefined;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Applications" value={apps.isError ? null : total} icon={Send} href="/applications" hint="All time" />
        <StatCard label="In progress" value={apps.isError ? null : apps.data ? inProgress : undefined} icon={Clock} tone="bg-sky-50 text-sky-600" hint={scopeHint ?? 'Awaiting a decision'} />
        <StatCard label="Offers & hires" value={apps.isError ? null : apps.data ? counts.OFFERED + counts.HIRED : undefined} icon={Trophy} tone="bg-emerald-50 text-emerald-600" hint={scopeHint} />
        <StatCard label="Saved jobs" value={saved.isError ? null : saved.data?.totalElements} icon={Bookmark} tone="bg-amber-50 text-amber-600" href="/jobs/saved" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader title="Recent applications" description="Your latest submissions and where they stand" action={list.length > 0 ? <ViewAll href="/applications" /> : undefined} />
          {apps.isLoading ? (
            <ListSkeleton />
          ) : apps.isError ? (
            <ErrorState title="Couldn't load your applications" error={apps.error} onRetry={() => apps.refetch()} retrying={apps.isRefetching} />
          ) : list.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No applications yet"
              description="When you apply for a job, you can follow its progress here."
              action={<Link href="/jobs" className={buttonClasses('primary', 'sm')}>Browse jobs</Link>}
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {list.slice(0, 5).map((app) => (
                <li key={app.id} className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70">
                  <div className="min-w-0">
                    <Link href={`/jobs/${app.jobId}`} className="block text-sm font-medium text-slate-900 hover:text-primary-600 truncate">
                      {app.jobTitle}
                    </Link>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {app.companyName} · Applied {timeAgo(app.appliedAt)}
                    </p>
                  </div>
                  <Badge tone={APPLICATION_STATUS_STYLES[app.status]} className="flex-shrink-0">
                    {APPLICATION_STATUS_LABELS[app.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <UpcomingInterviewsCard viewer="CANDIDATE" />
          {completeness && completeness.percent < 100 ? (
            <NextStep
              title="Complete your profile"
              description={`Recruiters see your profile when you apply. ${completeness.done} of ${completeness.total} sections are filled in.`}
            >
              <div className="w-full">
                <div className="h-2 rounded-full bg-primary-100 overflow-hidden" role="progressbar" aria-valuenow={completeness.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completeness">
                  <div className="h-full bg-primary-600 rounded-full" style={{ width: `${completeness.percent}%` }} />
                </div>
                <ul className="mt-3 grid grid-cols-2 gap-1.5 text-xs">
                  {completeness.items.map((item) => (
                    <li key={item.key} className={item.done ? 'flex items-center gap-1.5 text-slate-500' : 'flex items-center gap-1.5 text-slate-700'}>
                      {item.done ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" aria-hidden /> : <Circle className="w-3.5 h-3.5 text-slate-300" aria-hidden />}
                      {item.label}
                      <span className="sr-only">{item.done ? '(done)' : '(missing)'}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link href="/profile" className={buttonClasses('primary', 'sm')}>Complete profile</Link>
            </NextStep>
          ) : (
            <NextStep
              title={total ? 'Keep your search going' : 'Find your first role'}
              description="Search open positions by title, company, location or salary."
            >
              <Link href="/jobs" className={buttonClasses('primary', 'sm')}>
                <Search className="w-4 h-4" aria-hidden /> Browse jobs
              </Link>
              {!!saved.data?.totalElements && (
                <Link href="/jobs/saved" className={buttonClasses('secondary', 'sm')}>Saved jobs</Link>
              )}
            </NextStep>
          )}

          {list.length > 0 && (
            <Card>
              <CardHeader
                title="Application status"
                description={partial ? `Your ${list.length} most recent applications` : 'All your applications'}
              />
              <div className="p-5">
                <PipelineBars counts={counts} hideEmpty />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Recruiter ────────────────────────────────────────────────────
function RecruiterDashboard() {
  const stats = useRecruiterStats();
  const jobs = useMyJobs(0, 5);
  const recent = useRecentApplications('recruiter', 6);

  const jobList = jobs.data?.content ?? [];
  const recentList = recent.data?.content ?? [];
  const noJobs = jobs.data?.totalElements === 0;
  const pending = stats.data?.pending ?? 0;
  const firstPending = recentList.find((a) => a.status === 'PENDING');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Job posts" value={jobs.isError ? null : jobs.data?.totalElements} icon={Briefcase} href="/jobs/my" hint="All statuses" />
        <StatCard label="Applicants" value={stats.isError ? null : stats.data?.total} icon={Users} tone="bg-sky-50 text-sky-600" hint="Across all your jobs" />
        <StatCard label="Awaiting review" value={stats.isError ? null : stats.data?.pending} icon={Inbox} tone="bg-amber-50 text-amber-600" hint="New, not yet reviewed" />
        <StatCard label="Hired" value={stats.isError ? null : stats.data ? (stats.data.hired ?? 0) : undefined} icon={Trophy} tone="bg-emerald-50 text-emerald-600" hint={stats.data ? `${pluralize(stats.data.offered, 'offer')} pending` : undefined} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader title="Recent applicants" description="Latest candidates across your job posts" />
          {recent.isLoading ? (
            <ListSkeleton />
          ) : recent.isError ? (
            <ErrorState title="Couldn't load applicants" error={recent.error} onRetry={() => recent.refetch()} retrying={recent.isRefetching} />
          ) : recentList.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No applicants yet"
              description={noJobs ? 'Post a job to start receiving applications.' : 'New applications to your open jobs will appear here.'}
              action={noJobs ? <Link href="/jobs/create" className={buttonClasses('primary', 'sm')}>Post a job</Link> : undefined}
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentList.map((app) => (
                <li key={app.id}>
                  <Link
                    href={`/jobs/${app.jobId}/applicants`}
                    className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 focus:outline-none focus-visible:bg-slate-50"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-slate-900 truncate">{app.candidateName}</span>
                      <span className="block text-xs text-slate-500 mt-0.5 truncate">
                        {app.jobTitle} · {timeAgo(app.appliedAt)}
                      </span>
                    </span>
                    <Badge tone={APPLICATION_STATUS_STYLES[app.status]} className="flex-shrink-0">
                      {APPLICATION_STATUS_LABELS[app.status]}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <UpcomingInterviewsCard viewer="RECRUITER" />
          {noJobs ? (
            <NextStep title="Post your first job" description="Describe the role and start receiving applications from candidates.">
              <Link href="/jobs/create" className={buttonClasses('primary', 'sm')}><Plus className="w-4 h-4" aria-hidden /> Post a job</Link>
            </NextStep>
          ) : pending > 0 ? (
            <NextStep
              title={`Review ${pluralize(pending, 'new applicant')}`}
              description="Move candidates forward or let them know where they stand."
            >
              <Link href={firstPending ? `/jobs/${firstPending.jobId}/applicants` : '/jobs/my'} className={buttonClasses('primary', 'sm')}>
                Review applicants <ArrowRight className="w-4 h-4" aria-hidden />
              </Link>
              <Link href="/jobs/create" className={buttonClasses('secondary', 'sm')}>Post a job</Link>
            </NextStep>
          ) : (
            <NextStep title="You're all caught up" description="Every application has been reviewed. Open a new role to keep your pipeline full.">
              <Link href="/jobs/create" className={buttonClasses('primary', 'sm')}><Plus className="w-4 h-4" aria-hidden /> Post a job</Link>
            </NextStep>
          )}

          <Card className="overflow-hidden">
            <CardHeader title="Your latest jobs" action={jobList.length > 0 ? <ViewAll href="/jobs/my" /> : undefined} />
            {jobs.isLoading ? (
              <ListSkeleton rows={3} />
            ) : jobs.isError ? (
              <ErrorState title="Couldn't load your jobs" error={jobs.error} onRetry={() => jobs.refetch()} retrying={jobs.isRefetching} />
            ) : jobList.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-500 text-center">You haven&apos;t posted any jobs yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {jobList.map((job) => (
                  <li key={job.id}>
                    <Link href={`/jobs/${job.id}/applicants`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50/70 focus:outline-none focus-visible:bg-slate-50">
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-slate-900 truncate">{job.title}</span>
                        <span className="block text-xs text-slate-500 mt-0.5">
                          {pluralize(job.applicationCount ?? 0, 'applicant')}
                        </span>
                      </span>
                      <Badge tone={JOB_STATUS_STYLES[job.status]} className="flex-shrink-0">{JOB_STATUS_LABELS[job.status]}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader title="Hiring pipeline" description="Applications by stage across all your job posts" />
        <div className="p-5">
          {stats.isLoading ? (
            <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6" />)}</div>
          ) : stats.isError ? (
            <ErrorState title="Couldn't load pipeline" error={stats.error} onRetry={() => stats.refetch()} retrying={stats.isRefetching} />
          ) : !stats.data || stats.data.total === 0 ? (
            <p className="text-sm text-slate-500">No applications yet. Stages will fill in as candidates apply.</p>
          ) : (
            <PipelineBars counts={statsToCounts(stats.data)} />
          )}
        </div>
      </Card>
    </div>
  );
}

// ─── Admin ────────────────────────────────────────────────────────
/** Admins have their own Overview at /admin; send them there instead of a duplicate dashboard. */
function AdminRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin');
  }, [router]);
  return (
    <div className="flex justify-center py-16" role="status">
      <Spinner className="w-6 h-6 text-primary-600" />
      <span className="sr-only">Opening the admin overview…</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────
const SUBTITLES = {
  CANDIDATE: 'Track your applications and find your next role.',
  RECRUITER: 'Review new applicants and manage your job posts.',
} as const;

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;
  if (user.role === 'ADMIN') return <AdminRedirect />;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {greeting}, {user.firstName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{SUBTITLES[user.role]}</p>
        </div>
        {user.role === 'RECRUITER' && (
          <Link href="/jobs/create" className={buttonClasses('primary', 'md', 'self-start sm:self-auto')}>
            <Plus className="w-4 h-4" aria-hidden /> Post a job
          </Link>
        )}
        {user.role === 'CANDIDATE' && (
          <Link href="/jobs" className={buttonClasses('primary', 'md', 'self-start sm:self-auto')}>
            <Search className="w-4 h-4" aria-hidden /> Browse jobs
          </Link>
        )}
      </div>

      {user.role === 'CANDIDATE' && <CandidateDashboard />}
      {user.role === 'RECRUITER' && <RecruiterDashboard />}
    </div>
  );
}
