'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, MapPin, Building2, SlidersHorizontal, X, SearchX } from 'lucide-react';
import { useJobs } from '@/hooks/useJobs';
import { JobCard, JobCardSkeleton } from '@/components/jobs/JobCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States';
import { Pagination } from '@/components/ui/Pagination';
import { EXPERIENCE_LABELS, EXPERIENCE_OPTIONS, JOB_TYPE_LABELS, JOB_TYPE_OPTIONS } from '@/lib/constants';
import { pluralize } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { ExperienceLevel, JobType } from '@/types';

const DEBOUNCE_MS = 350;

function useDebouncedValue<T>(value: T, delay = DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function isJobType(v: string | null): v is JobType {
  return !!v && v in JOB_TYPE_LABELS;
}
function isLevel(v: string | null): v is ExperienceLevel {
  return !!v && v in EXPERIENCE_LABELS;
}

export default function JobsPage() {
  return (
    <Suspense fallback={<JobsPageFallback />}>
      <JobsBrowser />
    </Suspense>
  );
}

function JobsPageFallback() {
  return (
    <div>
      <PageHeader title="Find jobs" description="Search open roles and filter by location, job type and experience level." />
      <div className="grid gap-3">
        {Array.from({ length: 4 }).map((_, i) => <JobCardSkeleton key={i} />)}
      </div>
    </div>
  );
}

function JobsBrowser() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initial state comes from the URL so links like /jobs?keyword=react work and are shareable.
  const [keyword, setKeyword] = useState(() => searchParams.get('keyword') ?? '');
  const [location, setLocation] = useState(() => searchParams.get('location') ?? '');
  const [company, setCompany] = useState(() => searchParams.get('company') ?? '');
  const [jobType, setJobType] = useState<JobType | ''>(() => {
    const v = searchParams.get('type');
    return isJobType(v) ? v : '';
  });
  const [level, setLevel] = useState<ExperienceLevel | ''>(() => {
    const v = searchParams.get('level');
    return isLevel(v) ? v : '';
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const debouncedKeyword = useDebouncedValue(keyword.trim());
  const debouncedLocation = useDebouncedValue(location.trim());
  const debouncedCompany = useDebouncedValue(company.trim());

  const filterKey = [debouncedKeyword, debouncedLocation, debouncedCompany, jobType, level].join('|');

  // The page belongs to a specific filter combination; changing any filter returns to page 1.
  const [pageState, setPageState] = useState(() => ({
    key: filterKey,
    page: Math.max(0, (Number(searchParams.get('page')) || 1) - 1),
  }));
  const page = pageState.key === filterKey ? pageState.page : 0;

  // Keep the URL in sync (replace, so typing doesn't flood browser history).
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedKeyword) params.set('keyword', debouncedKeyword);
    if (debouncedLocation) params.set('location', debouncedLocation);
    if (debouncedCompany) params.set('company', debouncedCompany);
    if (jobType) params.set('type', jobType);
    if (level) params.set('level', level);
    if (page > 0) params.set('page', String(page + 1));
    const qs = params.toString();
    const next = qs ? `${pathname}?${qs}` : pathname;
    if (next !== `${pathname}${window.location.search}`) {
      router.replace(next, { scroll: false });
    }
  }, [debouncedKeyword, debouncedLocation, debouncedCompany, jobType, level, page, pathname, router]);

  const query = useMemo(
    () => ({
      keyword: debouncedKeyword || undefined,
      location: debouncedLocation || undefined,
      companyName: debouncedCompany || undefined,
      jobType: jobType || undefined,
      experienceLevel: level || undefined,
      page,
    }),
    [debouncedKeyword, debouncedLocation, debouncedCompany, jobType, level, page]
  );
  const { data, isLoading, isError, error, refetch, isPlaceholderData, isRefetching } = useJobs(query);

  const secondaryFilterCount = [company.trim(), jobType, level].filter(Boolean).length;
  const hasFilters = !!(keyword.trim() || location.trim() || secondaryFilterCount);

  const clearFilters = () => {
    setKeyword('');
    setLocation('');
    setCompany('');
    setJobType('');
    setLevel('');
  };

  const goToPage = (p: number) => {
    setPageState({ key: filterKey, page: p });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const jobs = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  return (
    <div>
      <PageHeader title="Find jobs" description="Search open roles and filter by location, job type and experience level." />

      {/* Filter bar */}
      <div className="lg:sticky lg:top-16 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 pb-4 lg:pt-3 bg-slate-50/95 backdrop-blur supports-[backdrop-filter]:bg-slate-50/80">
        <Card className="p-3">
          <form role="search" onSubmit={(e) => e.preventDefault()} className="space-y-3">
            <div className="flex gap-2 sm:gap-3">
              <div className="relative flex-1 min-w-0">
                <label htmlFor="job-keyword" className="sr-only">Keyword</label>
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden />
                <Input
                  id="job-keyword"
                  type="search"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Job title, skill or keyword"
                  className="pl-9"
                  autoComplete="off"
                />
              </div>
              <div className="relative hidden sm:block sm:w-56">
                <label htmlFor="job-location" className="sr-only">Location</label>
                <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden />
                <Input
                  id="job-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, country or remote"
                  className="pl-9"
                />
              </div>
              <Button
                variant="secondary"
                className="sm:hidden px-3"
                onClick={() => setFiltersOpen((o) => !o)}
                aria-expanded={filtersOpen}
                aria-controls="job-filters"
              >
                <SlidersHorizontal className="w-4 h-4" aria-hidden />
                <span className="sr-only">Filters</span>
                {(secondaryFilterCount + (location.trim() ? 1 : 0)) > 0 && (
                  <span className="min-w-5 h-5 px-1 rounded-full bg-primary-600 text-[11px] font-semibold text-white flex items-center justify-center">
                    {secondaryFilterCount + (location.trim() ? 1 : 0)}
                  </span>
                )}
              </Button>
            </div>

            <div
              id="job-filters"
              className={cn('grid-cols-1 gap-3 sm:grid sm:grid-cols-3', filtersOpen ? 'grid' : 'hidden')}
            >
              <div className="relative sm:hidden">
                <label htmlFor="job-location-mobile" className="sr-only">Location</label>
                <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden />
                <Input
                  id="job-location-mobile"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, country or remote"
                  className="pl-9"
                />
              </div>
              <div className="relative">
                <label htmlFor="job-company" className="sr-only">Company</label>
                <Building2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden />
                <Input
                  id="job-company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company"
                  className="pl-9"
                />
              </div>
              <div>
                <label htmlFor="job-type" className="sr-only">Job type</label>
                <Select id="job-type" value={jobType} onChange={(e) => setJobType(e.target.value as JobType | '')}>
                  <option value="">All job types</option>
                  {JOB_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
              </div>
              <div>
                <label htmlFor="job-level" className="sr-only">Experience level</label>
                <Select id="job-level" value={level} onChange={(e) => setLevel(e.target.value as ExperienceLevel | '')}>
                  <option value="">All experience levels</option>
                  {EXPERIENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
              </div>
            </div>
          </form>
        </Card>
      </div>

      {/* Results summary */}
      {!isLoading && !isError && (
        <div className="flex items-center justify-between gap-3 mb-3 min-h-8">
          <p className="text-sm text-slate-600" aria-live="polite">
            <span className="font-semibold text-slate-900">{pluralize(total, 'job')}</span>
            {hasFilters ? ' match your search' : ' open now'}
          </p>
          <div className="flex items-center gap-2">
            {isPlaceholderData && <Spinner className="w-4 h-4" />}
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-3.5 h-3.5" aria-hidden /> Clear filters
              </Button>
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-3" aria-busy="true" aria-label="Loading jobs">
          {Array.from({ length: 5 }).map((_, i) => <JobCardSkeleton key={i} />)}
        </div>
      ) : isError ? (
        <Card>
          <ErrorState title="We couldn't load jobs" error={error} onRetry={() => refetch()} retrying={isRefetching} />
        </Card>
      ) : jobs.length === 0 ? (
        <Card>
          <EmptyState
            icon={SearchX}
            title={hasFilters ? 'No jobs match your search' : 'No open jobs right now'}
            description={
              hasFilters
                ? 'Try a different keyword, widen the location, or remove a filter.'
                : 'New roles are posted regularly. Check back soon.'
            }
            action={hasFilters ? <Button variant="secondary" onClick={clearFilters}>Clear filters</Button> : undefined}
          />
        </Card>
      ) : (
        <>
          <div className={cn('grid gap-3 transition-opacity', isPlaceholderData && 'opacity-60')} aria-busy={isPlaceholderData}>
            {jobs.map((job) => <JobCard key={job.id} job={job} />)}
          </div>
          <Pagination page={page} totalPages={data?.totalPages ?? 0} onChange={goToPage} />
        </>
      )}
    </div>
  );
}
