'use client';

import Link from 'next/link';
import { MapPin, Briefcase, Banknote, Clock, Bookmark, BookmarkCheck } from 'lucide-react';
import type { Job } from '@/types';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/store/authStore';
import { useSaveJob, useUnsaveJob } from '@/hooks/useJobs';
import { EXPERIENCE_LABELS, EXPERIENCE_STYLES, JOB_TYPE_LABELS } from '@/lib/constants';
import { formatSalary, getErrorMessage, parseTags, timeAgo } from '@/lib/format';
import { toast } from '@/store/toastStore';
import { Badge } from '@/components/ui/Badge';
import { CompanyLogo } from '@/components/ui/CompanyLogo';
import { Skeleton } from '@/components/ui/States';
import { VerifiedIcon } from '@/components/companies/VerifiedBadge';
import { FeaturedBadge } from '@/components/admin/jobs/JobFlagBadges';

const MAX_TAGS = 3;

export function JobCard({ job }: { job: Job }) {
  const { user } = useAuthStore();
  const { mutate: saveJob, isPending: isSaving } = useSaveJob();
  const { mutate: unsaveJob, isPending: isUnsaving } = useUnsaveJob();

  const isCandidate = user?.role === 'CANDIDATE';
  const isPending = isSaving || isUnsaving;
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
  const tags = parseTags(job.tags);
  const extraTags = tags.length - MAX_TAGS;
  const verifiedEmployer = !!(job.companyVerified || job.recruiterVerified);

  const toggleSave = () => {
    if (isPending) return;
    if (job.isSaved) {
      unsaveJob(job.id, {
        onError: (err) => toast.error('Could not remove saved job', getErrorMessage(err)),
      });
    } else {
      saveJob(job.id, {
        onError: (err) => toast.error('Could not save job', getErrorMessage(err)),
      });
    }
  };

  return (
    <article className="group relative bg-white rounded-xl border border-slate-200 shadow-card p-5 transition hover:border-primary-300 hover:shadow-md focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-500/20">
      <div className="flex items-start gap-4">
        <CompanyLogo name={job.companyName} src={job.companyLogoUrl} size="md" />

        <div className="min-w-0 flex-1">
          <div className={cn('flex flex-wrap items-start gap-x-3 gap-y-1', isCandidate && 'pr-10')}>
            <h3 className="min-w-0 text-base font-semibold text-slate-900 leading-snug break-words">
              <Link
                href={`/jobs/${job.id}`}
                className="focus:outline-none group-hover:text-primary-700 after:absolute after:inset-0 after:rounded-xl after:content-['']"
              >
                {job.title}
              </Link>
            </h3>
            <Badge tone={EXPERIENCE_STYLES[job.experienceLevel]}>{EXPERIENCE_LABELS[job.experienceLevel]}</Badge>
            {job.featured && <FeaturedBadge />}
          </div>
          <p className="mt-0.5 flex min-w-0 items-center gap-1 text-sm text-slate-600">
            {job.companySlug ? (
              // Sits above the card's overlay link (like the bookmark button) so it stays clickable.
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
            {job.category && (
              <span className="hidden sm:inline min-w-0 truncate text-slate-400">
                <span aria-hidden>· </span>{job.category}
              </span>
            )}
          </p>

          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-500">
            {job.location && (
              <li className="flex items-center gap-1.5 min-w-0">
                <MapPin className="w-4 h-4 flex-shrink-0 text-slate-400" aria-hidden />
                <span className="truncate">{job.location}</span>
              </li>
            )}
            <li className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 flex-shrink-0 text-slate-400" aria-hidden />
              {JOB_TYPE_LABELS[job.jobType]}
            </li>
            {salary && (
              <li className="flex items-center gap-1.5">
                <Banknote className="w-4 h-4 flex-shrink-0 text-slate-400" aria-hidden />
                <span className="font-medium text-slate-700">{salary}</span>
              </li>
            )}
          </ul>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            {tags.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5" aria-label="Skills">
                {tags.slice(0, MAX_TAGS).map((tag) => (
                  <li key={tag} className="px-2 py-0.5 rounded-md bg-slate-100 text-xs font-medium text-slate-600">
                    {tag}
                  </li>
                ))}
                {extraTags > 0 && (
                  <li className="px-2 py-0.5 rounded-md text-xs font-medium text-slate-500">+{extraTags} more</li>
                )}
              </ul>
            ) : (
              <span />
            )}
            {job.createdAt && (
              <p className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5" aria-hidden />
                Posted {timeAgo(job.createdAt)}
              </p>
            )}
          </div>
        </div>
      </div>

      {isCandidate && (
        <button
          type="button"
          onClick={toggleSave}
          disabled={isPending}
          aria-pressed={!!job.isSaved}
          aria-label={job.isSaved ? `Remove ${job.title} from saved jobs` : `Save ${job.title}`}
          title={job.isSaved ? 'Saved' : 'Save job'}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50"
        >
          {job.isSaved ? (
            <BookmarkCheck className="w-5 h-5 text-primary-600" aria-hidden />
          ) : (
            <Bookmark className="w-5 h-5" aria-hidden />
          )}
        </button>
      )}
    </article>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5" aria-hidden>
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3.5 w-1/3" />
          <div className="flex gap-3 pt-1">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-28" />
          </div>
          <div className="flex gap-1.5 pt-1">
            <Skeleton className="h-5 w-14" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-12" />
          </div>
        </div>
      </div>
    </div>
  );
}
