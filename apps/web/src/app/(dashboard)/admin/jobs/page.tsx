'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Briefcase, Search, X } from 'lucide-react';
import { useAdminJobs } from '@/hooks/useAdmin';
import { usePublicSettings } from '@/hooks/useSettings';
import { JOB_STATUS_LABELS, JOB_STATUS_STYLES } from '@/lib/constants';
import { formatDate, pluralize } from '@/lib/format';
import type { Job, JobStatus } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CompanyLogo } from '@/components/ui/CompanyLogo';
import { Input, Select } from '@/components/ui/Field';
import { PageHeader } from '@/components/ui/PageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { FeaturedBadge, HiddenBadge } from '@/components/admin/jobs/JobFlagBadges';
import { JobModerationActions } from '@/components/admin/jobs/JobModerationActions';
import { JOB_STATUSES } from '@/components/admin/jobs/useJobModeration';

const PAGE_SIZE = 20;

function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function AdminJobsPage() {
  return (
    <Suspense fallback={<div><PageHeader title="Jobs" description="Review, feature and moderate every job posting." /><Card><ListSkeleton /></Card></div>}>
      <AdminJobsContent />
    </Suspense>
  );
}

function AdminJobsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // URL is the source of truth for filters, so other pages can deep-link (?hidden=true, ?q=Acme, ?recruiterId=…).
  const rawStatus = sp.get('status');
  const status = rawStatus && (JOB_STATUSES as string[]).includes(rawStatus) ? (rawStatus as JobStatus) : undefined;
  const hiddenParam = sp.get('hidden');
  const hidden = hiddenParam === 'true' ? true : hiddenParam === 'false' ? false : undefined;
  const featured = sp.get('featured') === 'true' ? true : undefined;
  const category = sp.get('category') ?? '';
  const recruiterId = sp.get('recruiterId') ?? '';
  const page = Math.max(0, (Number(sp.get('page')) || 1) - 1);
  const urlQ = sp.get('q') ?? '';

  const [q, setQ] = useState(urlQ);
  const debouncedQ = useDebouncedValue(q.trim());

  const updateParams = useCallback(
    (patch: Record<string, string | undefined>, keepPage = false) => {
      const next = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      if (!keepPage) next.delete('page');
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [sp, router, pathname]
  );

  // Push the debounced search into the URL.
  useEffect(() => {
    if (debouncedQ !== urlQ) updateParams({ q: debouncedQ || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  // Follow external navigation (e.g. a "Manage job" link) into the search box.
  useEffect(() => {
    if (urlQ !== debouncedQ) setQ(urlQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQ]);

  const { data: settings } = usePublicSettings();
  const categories = settings?.categories ?? [];
  const categoryOptions = category && !categories.includes(category) ? [category, ...categories] : categories;

  const { data, isLoading, isError, error, refetch, isRefetching, isPlaceholderData } = useAdminJobs({
    q: urlQ || undefined,
    status,
    hidden,
    featured,
    category: category || undefined,
    recruiterId: recruiterId || undefined,
    page,
    size: PAGE_SIZE,
  });

  const jobs = data?.content ?? [];
  const filtering = !!(urlQ || status || hidden !== undefined || featured || category || recruiterId);
  const recruiterName = recruiterId ? jobs.find((j) => j.recruiterId === recruiterId)?.recruiterName : undefined;

  const clearFilters = () => {
    setQ('');
    router.replace(pathname, { scroll: false });
  };

  const goToPage = (p: number) => {
    updateParams({ page: p > 0 ? String(p + 1) : undefined }, true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <PageHeader title="Jobs" description="Review, feature and moderate every job posting, including hidden and closed ones." />

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-line-subtle space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_repeat(4,minmax(0,10rem))]">
            <div className="relative sm:col-span-2 xl:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-subtle pointer-events-none" aria-hidden />
              <Input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by job title or company…"
                aria-label="Search jobs by title or company"
                className="pl-9"
              />
            </div>
            <Select value={status ?? ''} onChange={(e) => updateParams({ status: e.target.value || undefined })} aria-label="Filter by status">
              <option value="">All statuses</option>
              {JOB_STATUSES.map((s) => <option key={s} value={s}>{JOB_STATUS_LABELS[s]}</option>)}
            </Select>
            <Select
              value={hidden === undefined ? '' : String(hidden)}
              onChange={(e) => updateParams({ hidden: e.target.value || undefined })}
              aria-label="Filter by visibility"
            >
              <option value="">All visibility</option>
              <option value="false">Visible</option>
              <option value="true">Hidden</option>
            </Select>
            <Select value={featured ? 'true' : ''} onChange={(e) => updateParams({ featured: e.target.value || undefined })} aria-label="Filter by featured">
              <option value="">Any placement</option>
              <option value="true">Featured only</option>
            </Select>
            <Select value={category} onChange={(e) => updateParams({ category: e.target.value || undefined })} aria-label="Filter by category">
              <option value="">All categories</option>
              {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 min-h-[2rem]">
            <p className="text-sm text-fg-muted" aria-live="polite">
              {data ? (
                <>
                  <span className="font-medium text-fg">{pluralize(data.totalElements, 'job')}</span>
                  {filtering ? ' match your filters' : ' in total'}
                </>
              ) : isLoading ? 'Loading jobs…' : null}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {recruiterId && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 pl-3 pr-1 py-0.5 text-xs font-medium text-primary-700 ring-1 ring-inset ring-primary-600/20">
                  Recruiter: {recruiterName ?? 'selected recruiter'}
                  <button
                    type="button"
                    onClick={() => updateParams({ recruiterId: undefined })}
                    className="p-1 rounded-full hover:bg-primary-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    aria-label="Remove recruiter filter"
                  >
                    <X className="w-3 h-3" aria-hidden />
                  </button>
                </span>
              )}
              {filtering && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-3.5 h-3.5" aria-hidden /> Clear filters
                </Button>
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          <ListSkeleton />
        ) : isError ? (
          <ErrorState title="Couldn't load jobs" error={error} onRetry={() => refetch()} retrying={isRefetching} />
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={filtering ? 'No jobs match these filters' : 'No jobs have been posted yet'}
            description={filtering ? 'Try a different search or clear the filters to see every job.' : 'Jobs appear here as soon as recruiters publish them.'}
            action={filtering ? <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button> : undefined}
          />
        ) : (
          <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : undefined} aria-busy={isPlaceholderData || undefined}>
            {/* Desktop table (contained horizontal scroll if the viewport is tight) */}
            <div className="hidden xl:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted text-left text-xs font-medium text-fg-muted">
                  <tr>
                    <th scope="col" className="px-5 py-3">Job</th>
                    <th scope="col" className="px-4 py-3">Recruiter</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3 text-right">Applicants</th>
                    <th scope="col" className="px-4 py-3">Posted</th>
                    <th scope="col" className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-muted/60 align-top">
                      <td className="px-5 py-3 min-w-[16rem]">
                        <JobIdentity job={job} />
                      </td>
                      <td className="px-4 py-3">
                        <RecruiterLink job={job} active={recruiterId === job.recruiterId} onFilter={() => updateParams({ recruiterId: job.recruiterId })} />
                      </td>
                      <td className="px-4 py-3">
                        <JobBadges job={job} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-fg-secondary">{job.applicationCount ?? 0}</td>
                      <td className="px-4 py-3 text-fg-muted whitespace-nowrap">{formatDate(job.createdAt)}</td>
                      <td className="px-5 py-3">
                        <JobModerationActions job={job} compact withStatus withDelete className="justify-end flex-nowrap" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards below xl */}
            <ul className="xl:hidden divide-y divide-line-subtle">
              {jobs.map((job) => (
                <li key={job.id} className="px-4 py-4 sm:px-5 space-y-3">
                  <JobIdentity job={job} />
                  <JobBadges job={job} />
                  <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-muted">
                    <div className="flex gap-1">
                      <dt>Recruiter:</dt>
                      <dd><RecruiterLink job={job} active={recruiterId === job.recruiterId} onFilter={() => updateParams({ recruiterId: job.recruiterId })} /></dd>
                    </div>
                    <div className="flex gap-1">
                      <dt>Applicants:</dt>
                      <dd className="font-medium text-fg-secondary">{job.applicationCount ?? 0}</dd>
                    </div>
                    <div className="flex gap-1">
                      <dt>Posted:</dt>
                      <dd>{formatDate(job.createdAt)}</dd>
                    </div>
                  </dl>
                  <JobModerationActions job={job} withStatus withDelete />
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {data && <Pagination page={page} totalPages={data.totalPages} onChange={goToPage} />}
    </div>
  );
}

function JobIdentity({ job }: { job: Job }) {
  return (
    <div className="flex items-start gap-3 min-w-0">
      <CompanyLogo name={job.companyName} src={job.companyLogoUrl} size="sm" />
      <div className="min-w-0">
        <Link href={`/jobs/${job.id}`} className="font-medium text-fg hover:text-primary-700 break-words focus:outline-none focus-visible:underline">
          {job.title}
        </Link>
        <p className="text-xs text-fg-muted break-words">
          {job.companyName}
          {job.category && <span> · {job.category}</span>}
        </p>
      </div>
    </div>
  );
}

function JobBadges({ job }: { job: Job }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge tone={JOB_STATUS_STYLES[job.status]}>{JOB_STATUS_LABELS[job.status]}</Badge>
      {job.hidden && <HiddenBadge />}
      {job.featured && <FeaturedBadge />}
    </div>
  );
}

function RecruiterLink({ job, active, onFilter }: { job: Job; active: boolean; onFilter: () => void }) {
  if (active) return <span className="text-fg-secondary">{job.recruiterName}</span>;
  return (
    <button
      type="button"
      onClick={onFilter}
      title={`Show all jobs by ${job.recruiterName}`}
      className="text-left text-fg-secondary hover:text-primary-700 hover:underline focus:outline-none focus-visible:underline"
    >
      {job.recruiterName}
    </button>
  );
}

function ListSkeleton() {
  return (
    <div className="divide-y divide-line-subtle" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-4">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-56 max-w-full" />
            <Skeleton className="h-3 w-40 max-w-full" />
          </div>
          <Skeleton className="hidden sm:block h-8 w-40" />
        </div>
      ))}
    </div>
  );
}
