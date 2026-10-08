'use client';

import Link from 'next/link';
import { ArrowRight, Clock, MapPin, Star } from 'lucide-react';
import { useJobs } from '@/hooks/useJobs';
import { JOB_TYPE_LABELS } from '@/lib/constants';
import { formatSalary, pluralize, timeAgo } from '@/lib/format';
import type { Job } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CompanyLogo } from '@/components/ui/CompanyLogo';
import { Skeleton } from '@/components/ui/States';
import { buttonClasses } from '@/components/ui/Button';
import { VerifiedIcon } from '@/components/companies/VerifiedBadge';

// `sort` is forwarded to the API as a query param (Spring Pageable) so the newest roles come first.
const LATEST_PARAMS = { size: 6, sort: 'createdAt,desc' };

export function JobCard({ job }: { job: Job }) {
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
  const verifiedEmployer = !!(job.companyVerified || job.recruiterVerified);
  return (
    <Card className="group relative h-full p-5 transition-all hover:border-primary-200 hover:shadow-md focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2">
      <div className="flex items-start gap-3">
        <CompanyLogo name={job.companyName} src={job.companyLogoUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:text-primary-700">
            {/* Overlay link: makes the whole card clickable while the company link stays separate. */}
            <Link
              href={`/jobs/${job.id}`}
              className="focus:outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']"
            >
              {job.title}
            </Link>
          </h3>
          <p className="mt-0.5 flex min-w-0 items-center gap-1 text-sm text-slate-600">
            {job.companySlug ? (
              <Link
                href={`/companies/${job.companySlug}`}
                className="relative z-10 min-w-0 truncate rounded hover:text-primary-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                {job.companyName}
              </Link>
            ) : (
              <span className="min-w-0 truncate">{job.companyName}</span>
            )}
            {verifiedEmployer && <VerifiedIcon />}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
        {job.location && (
          <span className="inline-flex items-center gap-1 min-w-0">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />
            <span className="truncate max-w-[12rem]">{job.location}</span>
          </span>
        )}
        <Badge>{JOB_TYPE_LABELS[job.jobType] ?? job.jobType}</Badge>
        {job.featured && (
          <Badge tone="bg-amber-50 text-amber-700 ring-amber-600/20">
            <Star className="w-3 h-3 fill-amber-400 text-amber-500" aria-hidden />
            Featured
          </Badge>
        )}
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-slate-800 truncate">{salary ?? 'Salary not listed'}</span>
        <span className="inline-flex items-center gap-1 text-slate-400 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5" aria-hidden />
          {timeAgo(job.createdAt)}
        </span>
      </div>
    </Card>
  );
}

export function JobCardSkeleton() {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="mt-5 h-3 w-2/3" />
      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </Card>
  );
}

/** "Latest openings" built from live data. Hides itself if the API is unavailable or empty. */
export function LatestJobs() {
  const { data, isLoading, isError } = useJobs(LATEST_PARAMS);

  if (isError) return null;
  if (!isLoading && (!data || data.content.length === 0)) return null;

  const total = data?.totalElements ?? 0;

  return (
    <section aria-labelledby="latest-heading" className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h2 id="latest-heading" className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Latest openings
            </h2>
            <p className="mt-2 text-slate-500">
              {isLoading ? 'Loading the newest roles…' : 'Recently posted roles from teams hiring on NexHire.'}
            </p>
          </div>
          {!isLoading && (
            <Link href="/jobs" className={buttonClasses('secondary', 'md', 'self-start sm:self-auto')}>
              {total > 0 ? `View all ${pluralize(total, 'role')}` : 'View all roles'}
              <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5" aria-busy={isLoading || undefined}>
          {isLoading
            ? Array.from({ length: 6 }, (_, i) => <JobCardSkeleton key={i} />)
            : data!.content.map((job) => <JobCard key={job.id} job={job} />)}
        </div>
      </div>
    </section>
  );
}

/** Live count of open roles for the hero, e.g. "20 open roles". Renders nothing until known. */
export function OpenRolesCount({ className }: { className?: string }) {
  const { data } = useJobs(LATEST_PARAMS);
  if (!data || data.totalElements === 0) return null;
  return (
    <span className={className}>
      <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden />
      {pluralize(data.totalElements, 'open role')} right now
    </span>
  );
}
