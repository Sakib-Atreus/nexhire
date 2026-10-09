'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, BarChart3, Columns3, ExternalLink, Link2, List, Lock, Pencil, Search, SearchX, Users, X,
} from 'lucide-react';
import type { Application, ApplicationStatus } from '@/types';
import { useJob } from '@/hooks/useJobs';
import { useBulkUpdateStatus, useJobApplications } from '@/hooks/useApplications';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import { APPLICATION_STATUS_BAR, JOB_STATUS_LABELS, JOB_STATUS_STYLES } from '@/lib/constants';
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
import { PipelineBoard } from '@/components/pipeline/PipelineBoard';
import { useMoveApplication } from '@/components/pipeline/useMoveApplication';
import { CONFIRM_STATUSES, MOVE_TARGETS, isForbidden, stageLabel } from '@/components/pipeline/stages';
import { ApplicantDrawer } from '@/components/hiring/ApplicantDrawer';

type View = 'board' | 'list';
type RatingFilter = 0 | 3 | 4;
const VIEW_KEY = 'nexhire.pipeline.view';

function readView(): View {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    if (v === 'board' || v === 'list') return v;
  } catch {
    // Storage unavailable (private mode etc.): fall through to the screen-size default.
  }
  return window.matchMedia('(min-width: 768px)').matches ? 'board' : 'list';
}

function PageSkeleton({ view }: { view?: View | null }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading applicants">
      <Card className="p-5 flex gap-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </Card>
      <Skeleton className="h-10 w-full" />
      {view === 'list' ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-1 min-w-[15rem] rounded-xl bg-subtle/70 p-2 space-y-2">
              <Skeleton className="h-5 w-1/2 m-1" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface PendingMove { apps: Application[]; status: ApplicationStatus; bulk: boolean }

export default function ApplicantsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const jobQuery = useJob(id);
  const appsQuery = useJobApplications(id);
  const move = useMoveApplication(id);
  const bulk = useBulkUpdateStatus();

  const [view, setViewState] = useState<View | null>(null);
  const [search, setSearch] = useState('');
  const [minRating, setMinRating] = useState<RatingFilter>(0);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('');
  const [openId, setOpenId] = useState<string | null>(null);
  // Deep link from the calendar / notifications: ?application={id} opens that applicant.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('application');
    if (id) setOpenId(id);
  }, []);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<ApplicationStatus>('REVIEWING');
  const [pending, setPending] = useState<PendingMove | null>(null);

  const canView = user?.role === 'RECRUITER' || user?.role === 'ADMIN';
  useEffect(() => {
    if (user && !canView) router.replace('/dashboard');
  }, [user, canView, router]);

  useEffect(() => setViewState(readView()), []);
  const setView = (v: View) => {
    setViewState(v);
    try { localStorage.setItem(VIEW_KEY, v); } catch { /* ignore */ }
  };

  const apps = useMemo(() => appsQuery.data?.content ?? [], [appsQuery.data]);
  const job = jobQuery.data;
  const openings = Math.max(1, job?.openings ?? 1);
  const hiredCount = apps.filter((a) => a.status === 'HIRED').length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return apps.filter(
      (a) =>
        (!q || a.candidateName.toLowerCase().includes(q) || a.candidateEmail.toLowerCase().includes(q)) &&
        (!minRating || (a.rating ?? 0) >= minRating)
    );
  }, [apps, search, minRating]);
  const hasFilters = !!search.trim() || minRating > 0;

  const boardApps = useMemo(() => filtered.filter((a) => a.status !== 'WITHDRAWN'), [filtered]);
  const withdrawnApps = useMemo(() => filtered.filter((a) => a.status === 'WITHDRAWN'), [filtered]);
  const listApps = useMemo(() => (statusFilter ? filtered.filter((a) => a.status === statusFilter) : filtered), [filtered, statusFilter]);

  const statusCounts = useMemo(() => {
    const c: Partial<Record<ApplicationStatus, number>> = {};
    filtered.forEach((a) => (c[a.status] = (c[a.status] ?? 0) + 1));
    return c;
  }, [filtered]);

  const openApp = apps.find((a) => a.id === openId) ?? null;

  // ─── Moves ────────────────────────────────────────────────────────────────

  const runMove = useCallback((app: Application, status: ApplicationStatus) => move.mutate({ app, status }), [move]);

  const requestMove = useCallback((app: Application, status: ApplicationStatus) => {
    if (app.status === status || app.status === 'WITHDRAWN' || status === 'WITHDRAWN') return;
    if (CONFIRM_STATUSES.includes(status)) setPending({ apps: [app], status, bulk: false });
    else runMove(app, status);
  }, [runMove]);

  // ─── Selection & bulk (list view) ─────────────────────────────────────────

  const selectedApps = useMemo(() => apps.filter((a) => selectedIds.has(a.id) && a.status !== 'WITHDRAWN'), [apps, selectedIds]);
  const selectableVisible = listApps.filter((a) => a.status !== 'WITHDRAWN');
  const allVisibleSelected = selectableVisible.length > 0 && selectableVisible.every((a) => selectedIds.has(a.id));
  const someVisibleSelected = selectableVisible.some((a) => selectedIds.has(a.id));
  const showBulkBar = view === 'list' && selectedApps.length > 0;

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

  function runBulk(targets: Application[], status: ApplicationStatus) {
    const ids = targets.filter((a) => a.status !== status).map((a) => a.id);
    if (ids.length === 0) {
      toast.info(`Everyone selected is already in ${stageLabel(status)}`);
      setPending(null);
      return;
    }
    bulk.mutate(
      { applicationIds: ids, status },
      {
        onSuccess: () => {
          toast.success(`${pluralize(ids.length, 'applicant')} moved to ${stageLabel(status)}`);
          setSelectedIds(new Set());
          setPending(null);
        },
        onError: (err) => {
          toast.error('Could not update applicants', getErrorMessage(err));
          setPending(null);
        },
      }
    );
  }

  function requestBulk() {
    if (selectedApps.length === 0) return;
    if (CONFIRM_STATUSES.includes(bulkStatus)) setPending({ apps: selectedApps, status: bulkStatus, bulk: true });
    else runBulk(selectedApps, bulkStatus);
  }

  function confirmPending() {
    if (!pending) return;
    if (pending.bulk) runBulk(pending.apps, pending.status);
    else {
      runMove(pending.apps[0], pending.status);
      setPending(null);
    }
  }

  const closeConfirm = useCallback(() => setPending(null), []);
  const closeDrawer = useCallback(() => setOpenId(null), []);
  const openDrawer = useCallback((a: Application) => setOpenId(a.id), []);

  async function copyJobLink() {
    const url = `${window.location.origin}/jobs/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Job link copied', url);
    } catch {
      toast.info('Copy this link to share the job', url);
    }
  }

  // ─── Confirm copy ─────────────────────────────────────────────────────────

  const confirmCopy = (() => {
    if (!pending) return null;
    const n = pending.apps.length;
    const who = n === 1 ? pending.apps[0].candidateName : pluralize(n, 'applicant');
    if (pending.status === 'HIRED') {
      return {
        title: `Mark ${who} as hired?`,
        description: `The candidate${n === 1 ? '' : 's'} will be notified. The job closes automatically once all ${openings} opening${openings === 1 ? ' is' : 's are'} filled.`,
        confirmLabel: 'Mark as hired',
        tone: 'primary' as const,
      };
    }
    return {
      title: `Reject ${who}?`,
      description: `${n === 1 ? 'The candidate' : 'Each candidate'} will be notified that they were not selected. You can move ${n === 1 ? 'them' : 'applicants'} back later if needed.`,
      confirmLabel: n === 1 ? 'Reject applicant' : 'Reject applicants',
      tone: 'danger' as const,
    };
  })();

  if (!user || !canView) return <PageSkeleton view={view} />;

  const error = appsQuery.error ?? jobQuery.error;
  const isLoading = jobQuery.isLoading || appsQuery.isLoading || view === null;
  const forbidden = isForbidden(appsQuery.error) || isForbidden(jobQuery.error);

  return (
    <div className={cn('min-w-0', showBulkBar && 'pb-24')}>
      <Link href="/jobs/my" className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-primary-600 mb-4">
        <ArrowLeft className="w-4 h-4" aria-hidden /> My jobs
      </Link>

      {isLoading ? (
        <PageSkeleton view={view} />
      ) : forbidden ? (
        <Card>
          <EmptyState
            icon={Lock}
            title="You don't have access to this job's applicants"
            description="Only the job's recruiter, recruiters from the same company, and admins can manage its applicants."
            action={<Link href="/jobs/my" className={buttonClasses('secondary', 'sm')}>Back to my jobs</Link>}
          />
        </Card>
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
          {/* Header */}
          {job && (
            <Card className="p-4 sm:p-5 mb-4">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <CompanyLogo name={job.companyName} src={job.companyLogoUrl} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-lg sm:text-xl font-bold text-fg break-words">{job.title}</h1>
                      <Badge tone={JOB_STATUS_STYLES[job.status]}>{JOB_STATUS_LABELS[job.status]}</Badge>
                    </div>
                    <p className="text-sm text-fg-muted mt-0.5 break-words">{[job.companyName, job.location].filter(Boolean).join(' · ')}</p>
                    <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <span className="font-semibold text-fg-soft">{pluralize(apps.length, 'applicant')}</span>
                      <span className="inline-flex items-center gap-1.5 text-fg-tertiary">
                        <span className={cn('w-2 h-2 rounded-full', APPLICATION_STATUS_BAR.HIRED)} aria-hidden />
                        {hiredCount} of {pluralize(openings, 'opening')} hired
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 lg:flex-shrink-0">
                  <Link href={`/jobs/${job.id}/analytics`} className={buttonClasses('secondary', 'sm')}>
                    <BarChart3 className="w-3.5 h-3.5" aria-hidden /> Analytics
                  </Link>
                  <Link href={`/jobs/${job.id}/edit`} className={buttonClasses('secondary', 'sm')}>
                    <Pencil className="w-3.5 h-3.5" aria-hidden /> Edit job
                  </Link>
                  <Link href={`/jobs/${job.id}`} className={buttonClasses('secondary', 'sm')}>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden /> View job
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {apps.length === 0 ? (
            <Card>
              <EmptyState
                icon={Users}
                title="No applicants yet"
                description={
                  job?.status === 'OPEN'
                    ? 'Applicants will appear here as candidates apply. Share the job link to reach more people.'
                    : 'This job is not open, so it is not accepting applications.'
                }
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    {job?.status === 'OPEN' && (
                      <Button size="sm" onClick={copyJobLink}>
                        <Link2 className="w-3.5 h-3.5" aria-hidden /> Copy job link
                      </Button>
                    )}
                    <Link href={`/jobs/${id}`} className={buttonClasses('secondary', 'sm')}>View job posting</Link>
                  </div>
                }
              />
            </Card>
          ) : (
            <>
              {/* Toolbar */}
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
                <div role="group" aria-label="View" className="inline-flex self-start rounded-lg border border-line-strong bg-surface p-0.5 shadow-sm">
                  {([['board', 'Board', Columns3], ['list', 'List', List]] as const).map(([v, label, Icon]) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={view === v}
                      onClick={() => setView(v)}
                      className={cn(
                        'inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                        view === v ? 'bg-primary-600 text-white' : 'text-fg-tertiary hover:bg-muted'
                      )}
                    >
                      <Icon className="w-4 h-4" aria-hidden /> {label}
                    </button>
                  ))}
                </div>
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-subtle pointer-events-none" aria-hidden />
                  <Input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or email"
                    aria-label="Search applicants"
                    className="pl-9"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="rating-filter" className="text-sm text-fg-tertiary whitespace-nowrap">Rating</label>
                  <Select
                    id="rating-filter"
                    value={minRating}
                    onChange={(e) => setMinRating(Number(e.target.value) as RatingFilter)}
                    className="w-auto md:w-36"
                  >
                    <option value={0}>Any</option>
                    <option value={3}>3★ and up</option>
                    <option value={4}>4★ and up</option>
                  </Select>
                </div>
              </div>

              {filtered.length === 0 ? (
                <Card>
                  <EmptyState
                    icon={SearchX}
                    title="No applicants match your filters"
                    description="Try a different name, email or rating."
                    action={<Button variant="secondary" size="sm" onClick={() => { setSearch(''); setMinRating(0); }}>Clear filters</Button>}
                  />
                </Card>
              ) : view === 'board' ? (
                <PipelineBoard apps={boardApps} withdrawn={withdrawnApps} onOpen={openDrawer} onMove={requestMove} />
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none px-3 h-9 bg-surface border border-line-strong rounded-lg text-sm text-fg-secondary hover:bg-muted">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        ref={(el) => { if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected; }}
                        onChange={toggleAll}
                        disabled={selectableVisible.length === 0}
                        className="w-4 h-4 rounded border-line-strong text-primary-600 focus:ring-primary-500"
                      />
                      <span className="font-medium">Select all</span>
                    </label>
                    <div role="group" aria-label="Filter by stage" className="flex gap-1.5 overflow-x-auto min-w-0 flex-1 pb-0.5">
                      {(['', ...MOVE_TARGETS.map((t) => t.status), 'WITHDRAWN'] as Array<ApplicationStatus | ''>)
                        .filter((s) => !s || statusCounts[s])
                        .map((s) => {
                          const active = statusFilter === s;
                          return (
                            <button
                              key={s || 'all'}
                              type="button"
                              aria-pressed={active}
                              onClick={() => setStatusFilter(s)}
                              className={cn(
                                'flex-shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium border transition-colors',
                                active ? 'bg-primary-600 text-white border-primary-600' : 'bg-surface text-fg-tertiary border-line hover:bg-muted'
                              )}
                            >
                              {s ? stageLabel(s) : 'All'}
                              <span className={cn('text-xs tabular-nums', active ? 'text-primary-100' : 'text-fg-subtle')}>
                                {s ? statusCounts[s] : filtered.length}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                  {listApps.length === 0 ? (
                    <Card>
                      <EmptyState icon={SearchX} title="No applicants in this stage" action={<Button variant="secondary" size="sm" onClick={() => setStatusFilter('')}>Show all</Button>} />
                    </Card>
                  ) : (
                    <>
                      <div className="hidden md:grid grid-cols-[auto_minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.3fr)_7rem_auto] gap-x-3 px-4 pb-2 text-xs font-medium uppercase tracking-wide text-fg-subtle" aria-hidden>
                        <span className="w-4" />
                        <span>Candidate</span>
                        <span>Stage</span>
                        <span>Rating &amp; activity</span>
                        <span>Applied</span>
                        <span className="w-[4.5rem]" />
                      </div>
                      <ul className="space-y-2">
                        {listApps.map((a) => (
                          <li key={a.id}>
                            <ApplicantCard app={a} selected={selectedIds.has(a.id)} onToggle={toggleOne} onOpen={openDrawer} onMove={requestMove} />
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}

      {showBulkBar && (
        <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 lg:left-64 z-40 flex justify-center pointer-events-none px-4 pb-3 lg:pb-4">
          <div
            role="region"
            aria-label="Bulk actions"
            className="pointer-events-auto w-full max-w-2xl bg-slate-900 text-white rounded-2xl shadow-2xl px-4 py-3 flex flex-wrap items-center gap-3"
          >
            <span className="text-sm font-semibold" aria-live="polite">{selectedApps.length} selected</span>
            <div className="flex-1" />
            <label htmlFor="bulk-status" className="sr-only">Move selected applicants to</label>
            <Select
              id="bulk-status"
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as ApplicationStatus)}
              className="h-9 w-auto min-w-0 flex-1 sm:flex-none bg-slate-800 border-slate-700 text-white"
            >
              {MOVE_TARGETS.map((t) => <option key={t.status} value={t.status}>Move to {t.label}</option>)}
            </Select>
            <Button
              size="sm"
              variant={bulkStatus === 'REJECTED' ? 'danger' : 'primary'}
              className="h-9"
              loading={bulk.isPending && !pending}
              disabled={bulk.isPending}
              onClick={requestBulk}
            >
              Apply
            </Button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              disabled={bulk.isPending}
              aria-label="Clear selection"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
            >
              <X className="w-4 h-4 text-fg-faint" aria-hidden />
            </button>
          </div>
        </div>
      )}

      <ApplicantDrawer app={openApp} onClose={closeDrawer} onMove={requestMove} />

      <ConfirmDialog
        open={!!pending}
        onClose={closeConfirm}
        onConfirm={confirmPending}
        loading={bulk.isPending}
        title={confirmCopy?.title ?? ''}
        description={confirmCopy?.description}
        confirmLabel={confirmCopy?.confirmLabel}
        tone={confirmCopy?.tone}
      />
    </div>
  );
}
