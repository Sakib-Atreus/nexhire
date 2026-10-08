'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Search, SearchX, Users, X } from 'lucide-react';
import type { Application, ApplicationStatus } from '@/types';
import { useJob } from '@/hooks/useJobs';
import { useBulkUpdateStatus, useJobApplications } from '@/hooks/useApplications';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import {
  ALLOWED_TRANSITIONS,
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_ORDER,
  JOB_STATUS_LABELS,
  JOB_STATUS_STYLES,
} from '@/lib/constants';
import { getErrorMessage, pluralize } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonClasses } from '@/components/ui/Button';
import { CompanyLogo } from '@/components/ui/CompanyLogo';
import { Input, Select } from '@/components/ui/Field';
import { ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { ApplicantCard } from '@/components/recruiter/ApplicantCard';

const isSelectable = (a: Application) => ALLOWED_TRANSITIONS[a.status].length > 0;

/** Statuses every selected application can move to. */
function commonTransitions(apps: Application[]): ApplicationStatus[] {
  if (apps.length === 0) return [];
  return apps
    .map((a) => ALLOWED_TRANSITIONS[a.status])
    .reduce((acc, next) => acc.filter((s) => next.includes(s)));
}

function PageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading applicants">
      <Card className="p-5 flex gap-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </Card>
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="p-5 flex gap-3">
          <Skeleton className="w-11 h-11 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-16 w-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function ApplicantsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const jobQuery = useJob(id);
  const appsQuery = useJobApplications(id);
  const bulk = useBulkUpdateStatus();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<ApplicationStatus | ''>('');
  const [confirmReject, setConfirmReject] = useState(false);

  const canView = user?.role === 'RECRUITER' || user?.role === 'ADMIN';
  useEffect(() => {
    if (user && !canView) router.replace('/dashboard');
  }, [user, canView, router]);

  const apps = useMemo(() => appsQuery.data?.content ?? [], [appsQuery.data]);
  const job = jobQuery.data;

  const counts = useMemo(() => {
    const c = {} as Record<ApplicationStatus, number>;
    APPLICATION_STATUS_ORDER.forEach((s) => (c[s] = 0));
    apps.forEach((a) => (c[a.status] += 1));
    return c;
  }, [apps]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return apps.filter(
      (a) =>
        (!statusFilter || a.status === statusFilter) &&
        (!q || a.candidateName.toLowerCase().includes(q) || a.candidateEmail.toLowerCase().includes(q))
    );
  }, [apps, search, statusFilter]);

  // Only count selections that still exist and can still change status (data refetches after updates).
  const selectedApps = useMemo(() => apps.filter((a) => selectedIds.has(a.id) && isSelectable(a)), [apps, selectedIds]);
  const bulkOptions = useMemo(() => commonTransitions(selectedApps), [selectedApps]);
  const effectiveBulkStatus = bulkStatus && bulkOptions.includes(bulkStatus) ? bulkStatus : bulkOptions[0] ?? '';

  const selectableVisible = filtered.filter(isSelectable);
  const allVisibleSelected = selectableVisible.length > 0 && selectableVisible.every((a) => selectedIds.has(a.id));
  const someVisibleSelected = selectableVisible.some((a) => selectedIds.has(a.id));

  const toggleOne = useCallback((appId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(appId)) next.delete(appId);
      else next.add(appId);
      return next;
    });
  }, []);

  function toggleAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      selectableVisible.forEach((a) => (allVisibleSelected ? next.delete(a.id) : next.add(a.id)));
      return next;
    });
  }

  function runBulk() {
    if (!effectiveBulkStatus || selectedApps.length === 0) return;
    const status = effectiveBulkStatus;
    const n = selectedApps.length;
    bulk.mutate(
      { applicationIds: selectedApps.map((a) => a.id), status },
      {
        onSuccess: () => {
          toast.success(`${pluralize(n, 'applicant')} moved to ${APPLICATION_STATUS_LABELS[status]}`);
          setSelectedIds(new Set());
          setConfirmReject(false);
        },
        onError: (err) => {
          toast.error('Could not update applicants', getErrorMessage(err));
          setConfirmReject(false);
        },
      }
    );
  }

  // Stable reference so the dialog doesn't re-run its focus effect on every render.
  const closeConfirm = useCallback(() => setConfirmReject(false), []);

  if (!user || !canView) return <PageSkeleton />;

  const error = jobQuery.error ?? appsQuery.error;
  const isLoading = jobQuery.isLoading || appsQuery.isLoading;

  return (
    <div className={cn(selectedApps.length > 0 && 'pb-24')}>
      <Link href="/jobs/my" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 mb-4">
        <ArrowLeft className="w-4 h-4" aria-hidden /> My jobs
      </Link>

      {isLoading ? (
        <PageSkeleton />
      ) : error ? (
        <Card>
          <ErrorState
            title="We couldn't load the applicants"
            error={error}
            onRetry={() => { jobQuery.refetch(); appsQuery.refetch(); }}
            retrying={jobQuery.isRefetching || appsQuery.isRefetching}
          />
        </Card>
      ) : (
        <>
          {job && (
            <Card className="p-4 sm:p-5 mb-6">
              <div className="flex items-start gap-4">
                <CompanyLogo name={job.companyName} src={job.companyLogoUrl} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-lg sm:text-xl font-bold text-slate-900 break-words">
                      <Link href={`/jobs/${job.id}`} className="hover:text-primary-600">{job.title}</Link>
                    </h1>
                    <Badge tone={JOB_STATUS_STYLES[job.status]}>{JOB_STATUS_LABELS[job.status]}</Badge>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5 break-words">
                    {[job.companyName, job.location].filter(Boolean).join(' · ')}
                  </p>
                  <p className="text-sm text-slate-700 mt-2 font-medium">
                    {pluralize(apps.length, 'applicant')}
                  </p>
                </div>
                {(user.role === 'ADMIN' || user.id === job.recruiterId) && (
                  <Link href={`/jobs/${job.id}/edit`} className={buttonClasses('secondary', 'sm', 'flex-shrink-0')} aria-label="Edit job">
                    <Pencil className="w-3.5 h-3.5" aria-hidden />
                    <span className="hidden sm:inline">Edit job</span>
                  </Link>
                )}
              </div>
            </Card>
          )}

          {apps.length > 0 && (
            <>
              <div role="group" aria-label="Filter by status" className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
                {(['', ...APPLICATION_STATUS_ORDER.filter((s) => counts[s] > 0)] as Array<ApplicationStatus | ''>).map((s) => {
                  const active = statusFilter === s;
                  return (
                    <button
                      key={s || 'all'}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setStatusFilter(s)}
                      className={cn(
                        'flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                        active ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      )}
                    >
                      {s ? APPLICATION_STATUS_LABELS[s] : 'All'}
                      <span className={cn('text-xs tabular-nums', active ? 'text-primary-100' : 'text-slate-400')}>
                        {s ? counts[s] : apps.length}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden />
                  <Input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or email"
                    aria-label="Search applicants"
                    className="pl-9"
                  />
                </div>
                {selectableVisible.length > 0 && (
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none px-3 h-10 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 self-start sm:self-auto">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      ref={(el) => { if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected; }}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="font-medium">Select all</span>
                  </label>
                )}
              </div>
            </>
          )}

          {filtered.length === 0 ? (
            <Card>
              {apps.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No applications yet"
                  description={
                    job?.status === 'OPEN'
                      ? 'Applications will appear here as candidates apply. Share the job link to reach more people.'
                      : 'This job is not open, so it is not accepting applications.'
                  }
                  action={job && <Link href={`/jobs/${job.id}`} className={buttonClasses('secondary', 'sm')}>View job posting</Link>}
                />
              ) : (
                <EmptyState
                  icon={SearchX}
                  title="No applicants match your filters"
                  description="Try a different name or status."
                  action={
                    <Button variant="secondary" size="sm" onClick={() => { setSearch(''); setStatusFilter(''); }}>
                      Clear filters
                    </Button>
                  }
                />
              )}
            </Card>
          ) : (
            <ul className="space-y-4">
              {filtered.map((app) => (
                <li key={app.id}>
                  <ApplicantCard app={app} selected={selectedIds.has(app.id)} onToggle={toggleOne} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {selectedApps.length > 0 && (
        <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 lg:left-64 z-40 flex justify-center pointer-events-none px-4 pb-3 lg:pb-4">
          <div
            role="region"
            aria-label="Bulk actions"
            className="pointer-events-auto w-full max-w-2xl bg-slate-900 text-white rounded-2xl shadow-2xl px-4 py-3 flex flex-wrap items-center gap-3"
          >
            <span className="text-sm font-semibold" aria-live="polite">{selectedApps.length} selected</span>
            <div className="flex-1" />
            {bulkOptions.length > 0 ? (
              <>
                <label htmlFor="bulk-status" className="sr-only">Move selected applicants to</label>
                <Select
                  id="bulk-status"
                  value={effectiveBulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value as ApplicationStatus)}
                  className="h-9 w-auto min-w-0 flex-1 sm:flex-none bg-slate-800 border-slate-700 text-white"
                >
                  {bulkOptions.map((s) => (
                    <option key={s} value={s}>Move to {APPLICATION_STATUS_LABELS[s]}</option>
                  ))}
                </Select>
                <Button
                  size="sm"
                  variant={effectiveBulkStatus === 'REJECTED' ? 'danger' : 'primary'}
                  className="h-9"
                  loading={bulk.isPending && !confirmReject}
                  disabled={bulk.isPending}
                  onClick={() => (effectiveBulkStatus === 'REJECTED' ? setConfirmReject(true) : runBulk())}
                >
                  Apply
                </Button>
              </>
            ) : (
              <span className="text-xs text-slate-300">No status change applies to all selected applicants.</span>
            )}
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              disabled={bulk.isPending}
              aria-label="Clear selection"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
            >
              <X className="w-4 h-4 text-slate-300" aria-hidden />
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmReject}
        onClose={closeConfirm}
        onConfirm={runBulk}
        loading={bulk.isPending}
        title={`Mark ${pluralize(selectedApps.length, 'applicant')} as not selected?`}
        description="Their applications will be marked as not selected. Rejected applications can't be moved to another status."
        confirmLabel="Reject applicants"
      />
    </div>
  );
}
