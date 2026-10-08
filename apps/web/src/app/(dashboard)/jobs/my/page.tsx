'use client';

import { Suspense, useCallback, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Briefcase, CalendarClock, Eye, MapPin, Plus, SearchX, UserRound } from 'lucide-react';
import type { Job, JobStatus } from '@/types';
import { useDeleteJob, useMyJobs } from '@/hooks/useJobs';
import { JOB_STATUS_LABELS, JOB_STATUS_STYLES, JOB_TYPE_LABELS } from '@/lib/constants';
import { daysUntil, formatDate, getErrorMessage, pluralize, timeAgo } from '@/lib/format';
import { toast } from '@/store/toastStore';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { buttonClasses } from '@/components/ui/Button';
import { CompanyLogo } from '@/components/ui/CompanyLogo';
import { ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { JobRowActions } from '@/components/recruiter/JobRowActions';

const FILTERS: Array<JobStatus | ''> = ['', 'OPEN', 'DRAFT', 'CLOSED', 'FILLED'];
const FILTER_LABELS: Record<JobStatus, string> = { OPEN: 'Open', DRAFT: 'Drafts', CLOSED: 'Closed', FILLED: 'Filled' };

function parseStatus(value: string | null): JobStatus | '' {
  const v = value?.toUpperCase();
  return v === 'OPEN' || v === 'DRAFT' || v === 'CLOSED' || v === 'FILLED' ? v : '';
}

function Deadline({ value }: { value?: string }) {
  const days = daysUntil(value);
  if (days === null || !value) return null;
  const label =
    days < 0 ? `Deadline passed ${formatDate(value)}` : days === 0 ? 'Closes today' : days <= 7 ? `Closes in ${pluralize(days, 'day')}` : `Closes ${formatDate(value)}`;
  return (
    <span className={cn('inline-flex items-center gap-1', days < 0 ? 'text-rose-600' : days <= 7 ? 'text-amber-600' : '')}>
      <CalendarClock className="w-3.5 h-3.5" aria-hidden /> {label}
    </span>
  );
}

function JobRow({ job, currentUserId, onDelete }: { job: Job; currentUserId?: string; onDelete: (job: Job) => void }) {
  const isDraft = job.status === 'DRAFT';
  const byTeammate = !!currentUserId && job.recruiterId !== currentUserId;
  const openings = job.openings ?? 1;
  return (
    <Card className={cn('p-4 sm:p-5 hover:shadow-md transition-shadow', isDraft && 'border-dashed')}>
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
          <CompanyLogo name={job.companyName} src={job.companyLogoUrl} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Link
                href={isDraft ? `/jobs/${job.id}/edit` : `/jobs/${job.id}`}
                className="font-semibold text-slate-900 hover:text-primary-600 break-words min-w-0"
              >
                {job.title}
              </Link>
              <Badge tone={JOB_STATUS_STYLES[job.status]}>{JOB_STATUS_LABELS[job.status]}</Badge>
            </div>
            <p className="text-sm text-slate-500 mt-0.5 truncate">
              {[job.companyName, JOB_TYPE_LABELS[job.jobType], openings > 1 ? `${openings} openings` : null].filter(Boolean).join(' · ')}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
              {byTeammate && (
                <span className="inline-flex items-center gap-1 min-w-0">
                  <UserRound className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />
                  <span className="truncate">Posted by {job.recruiterName}</span>
                </span>
              )}
              {job.location && (
                <span className="inline-flex items-center gap-1 min-w-0">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" aria-hidden /> <span className="truncate">{job.location}</span>
                </span>
              )}
              {isDraft ? (
                <span title={formatDate(job.updatedAt)}>Last edited {timeAgo(job.updatedAt)} · Only your hiring team can see it</span>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" aria-hidden /> {pluralize(job.viewCount ?? 0, 'view')}
                  </span>
                  <span title={formatDate(job.createdAt)}>Posted {timeAgo(job.createdAt)}</span>
                  {job.status === 'OPEN' && <Deadline value={job.deadline} />}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex lg:justify-end lg:flex-shrink-0">
          <JobRowActions job={job} onDelete={onDelete} />
        </div>
      </div>
    </Card>
  );
}

export default function MyJobsPage() {
  // useSearchParams needs a Suspense boundary in the App Router.
  return (
    <Suspense fallback={null}>
      <MyJobs />
    </Suspense>
  );
}

function MyJobs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, error, refetch, isRefetching } = useMyJobs();
  const deleteJob = useDeleteJob();
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);
  const statusFilter = parseStatus(searchParams.get('status'));

  function setStatusFilter(next: JobStatus | '') {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set('status', next);
    else params.delete('status');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const jobs = data?.content ?? [];
  const filtered = statusFilter ? jobs.filter((j) => j.status === statusFilter) : jobs;
  const countFor = (s: JobStatus | '') => (s ? jobs.filter((j) => j.status === s).length : jobs.length);

  const stats = [
    { label: 'Total jobs', value: data?.totalElements ?? jobs.length },
    { label: 'Open', value: countFor('OPEN') },
    { label: 'Drafts', value: countFor('DRAFT') },
    { label: 'Total applicants', value: jobs.reduce((sum, j) => sum + (j.applicationCount ?? 0), 0) },
  ];

  // Stable reference so the dialog doesn't re-run its focus effect on every render.
  const closeDelete = useCallback(() => setDeleteTarget(null), []);

  function confirmDelete() {
    if (!deleteTarget) return;
    const title = deleteTarget.title;
    deleteJob.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Job deleted', `“${title}” has been removed.`);
        setDeleteTarget(null);
      },
      onError: (err) => toast.error('Could not delete job', getErrorMessage(err)),
    });
  }

  return (
    <div>
      <PageHeader
        title="My jobs"
        description="Manage your team's postings, drafts and applicants."
        actions={
          <Link href="/jobs/create" className={buttonClasses('primary')}>
            <Plus className="w-4 h-4" aria-hidden /> Post a job
          </Link>
        }
      />

      {!error && (
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {stats.map((s) => (
            <Card key={s.label} className="px-3 py-3 sm:px-5 sm:py-4">
              <dt className="text-xs font-medium text-slate-500">{s.label}</dt>
              <dd className="mt-1 text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
                {isLoading ? <Skeleton className="h-7 w-10" /> : s.value.toLocaleString('en-US')}
              </dd>
            </Card>
          ))}
        </dl>
      )}

      <div role="group" aria-label="Filter by status" className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map((s) => {
          const active = statusFilter === s;
          return (
            <button
              key={s || 'all'}
              type="button"
              onClick={() => setStatusFilter(s)}
              aria-pressed={active}
              className={cn(
                'flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                active ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              )}
            >
              {s ? FILTER_LABELS[s] : 'All'}
              <span className={cn('text-xs tabular-nums', active ? 'text-primary-100' : 'text-slate-400')}>{countFor(s)}</span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading jobs">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5 flex gap-4">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <ErrorState title="We couldn't load your jobs" error={error} onRetry={() => refetch()} retrying={isRefetching} />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          {statusFilter && jobs.length > 0 ? (
            <EmptyState
              icon={SearchX}
              title="No jobs match this filter"
              description={
                statusFilter === 'DRAFT'
                  ? 'You have no drafts. Use “Save as draft” when posting a job to finish it later.'
                  : `You have no ${JOB_STATUS_LABELS[statusFilter].toLowerCase()} jobs right now.`
              }
              action={
                <button type="button" onClick={() => setStatusFilter('')} className={buttonClasses('secondary', 'sm')}>
                  Show all jobs
                </button>
              }
            />
          ) : (
            <EmptyState
              icon={Briefcase}
              title="Post your first job"
              description="Create a job posting to start receiving applications from candidates."
              action={
                <Link href="/jobs/create" className={buttonClasses('primary')}>
                  <Plus className="w-4 h-4" aria-hidden /> Post a job
                </Link>
              }
            />
          )}
        </Card>
      ) : (
        <ul className="space-y-3">
          {filtered.map((job) => (
            <li key={job.id}>
              <JobRow job={job} currentUserId={user?.id} onDelete={setDeleteTarget} />
            </li>
          ))}
        </ul>
      )}

      {data && data.totalElements > jobs.length && (
        <p className="mt-4 text-xs text-slate-500 text-center">
          Showing your {jobs.length} most recent jobs of {data.totalElements.toLocaleString('en-US')}.
        </p>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={closeDelete}
        onConfirm={confirmDelete}
        loading={deleteJob.isPending}
        title="Delete this job?"
        description={
          deleteTarget
            ? `“${deleteTarget.title}” and all of its applications will be permanently deleted. This can't be undone.`
            : undefined
        }
        confirmLabel="Delete job"
      />
    </div>
  );
}
