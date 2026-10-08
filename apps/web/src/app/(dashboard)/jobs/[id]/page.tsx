'use client';

import { useCallback, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import {
  ArrowLeft, MapPin, Briefcase, Banknote, CalendarClock, Clock, Eye, UserRound, Pencil, Users, Share2, Check, Bookmark, BookmarkCheck, CheckCircle2, FileSearch, Lock, BadgeCheck, EyeOff, Flag, Tag, BarChart3,
} from 'lucide-react';
import type { Application, Job } from '@/types';
import { useJob, useSaveJob, useUnsaveJob } from '@/hooks/useJobs';
import { useCheckApplied } from '@/hooks/useApplications';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import { cn } from '@/lib/cn';
import {
  APPLICATION_STATUS_LABELS, APPLICATION_STATUS_STYLES, EXPERIENCE_LABELS, EXPERIENCE_STYLES,
  JOB_STATUS_LABELS, JOB_STATUS_STYLES, JOB_TYPE_LABELS,
} from '@/lib/constants';
import { daysUntil, formatDate, formatSalary, getErrorMessage, parseTags, pluralize, timeAgo, toListItems } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonClasses } from '@/components/ui/Button';
import { CompanyLogo } from '@/components/ui/CompanyLogo';
import { EmptyState, ErrorState, Skeleton, Spinner } from '@/components/ui/States';
import { ApplyModal } from '@/components/jobs/ApplyModal';
import { ReportJobModal } from '@/components/jobs/ReportJobModal';
import { FeaturedBadge } from '@/components/admin/jobs/JobFlagBadges';
import { JobModerationCard } from '@/components/admin/jobs/JobModerationCard';
import { AboutCompanyCard } from '@/components/companies/AboutCompanyCard';

// ---------- Helpers ----------

interface Deadline {
  closed: boolean;
  label: string | null;
  urgent: boolean;
}

function getDeadline(job: Job): Deadline {
  const days = daysUntil(job.deadline);
  if (job.status !== 'OPEN' || (days !== null && days < 0)) {
    return { closed: true, label: 'Applications closed', urgent: false };
  }
  if (days === null) return { closed: false, label: null, urgent: false };
  const label = days === 0 ? 'Closes today' : days === 1 ? 'Closes tomorrow' : `Closes in ${days} days`;
  return { closed: false, label, urgent: days <= 7 };
}

function paragraphs(text?: string | null): string[] {
  if (!text) return [];
  return text.split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean);
}

// ---------- Small pieces ----------

function ShareButton({ job, className }: { job: Job; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = { title: job.title, text: `${job.title} at ${job.companyName}`, url };
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied', 'Share it with anyone who might be a good fit.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link', 'Copy the address from your browser instead.');
    }
  };

  return (
    <Button variant="secondary" onClick={handleShare} className={className}>
      {copied ? <Check className="w-4 h-4 text-emerald-600" aria-hidden /> : <Share2 className="w-4 h-4" aria-hidden />}
      {copied ? 'Link copied' : 'Share'}
    </Button>
  );
}

function SaveButton({ job, compact }: { job: Job; compact?: boolean }) {
  const { mutate: save, isPending: saving } = useSaveJob();
  const { mutate: unsave, isPending: unsaving } = useUnsaveJob();
  const pending = saving || unsaving;
  const saved = !!job.isSaved;

  const toggle = () => {
    if (saved) {
      unsave(job.id, {
        onSuccess: () => toast.info('Removed from saved jobs'),
        onError: (err) => toast.error('Could not remove saved job', getErrorMessage(err)),
      });
    } else {
      save(job.id, {
        onSuccess: () => toast.success('Job saved', 'Find it any time under Saved jobs.'),
        onError: (err) => toast.error('Could not save job', getErrorMessage(err)),
      });
    }
  };

  const Icon = saved ? BookmarkCheck : Bookmark;
  return (
    <Button
      variant="secondary"
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
      aria-label={compact ? (saved ? 'Remove from saved jobs' : 'Save job') : undefined}
      className={compact ? 'px-3' : undefined}
    >
      <Icon className={cn('w-4 h-4', saved && 'text-primary-600')} aria-hidden />
      {!compact && (saved ? 'Saved' : 'Save')}
    </Button>
  );
}

function ApplicationStatusNote({ application }: { application: Application }) {
  const withdrawn = application.status === 'WITHDRAWN';
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <CheckCircle2 className={cn('w-4 h-4', withdrawn ? 'text-slate-400' : 'text-emerald-600')} aria-hidden />
        {withdrawn ? 'Application withdrawn' : 'Applied'}
        {!withdrawn && (
          <Badge tone={APPLICATION_STATUS_STYLES[application.status]} className="ml-auto">
            {APPLICATION_STATUS_LABELS[application.status]}
          </Badge>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-500">
        {withdrawn ? 'You withdrew this application' : 'Submitted'} · {formatDate(application.appliedAt)}
      </p>
      <Link href="/applications" className="mt-2 inline-block text-xs font-medium text-primary-600 hover:text-primary-700">
        View my applications
      </Link>
    </div>
  );
}

function ReportJobControl({ job, signedIn }: { job: Job; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-2 text-xs text-slate-500 sm:justify-start">
      <span>Something wrong with this posting?</span>
      {signedIn ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 rounded font-medium text-slate-600 hover:text-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <Flag className="w-3.5 h-3.5" aria-hidden /> Report this job
        </button>
      ) : (
        <Link href="/login" className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-primary-700">
          <Flag className="w-3.5 h-3.5" aria-hidden /> Sign in to report
        </Link>
      )}
      {signedIn && <ReportJobModal jobId={job.id} jobTitle={job.title} open={open} onClose={close} />}
    </div>
  );
}

// ---------- Apply / actions panel ----------

interface PanelProps {
  job: Job;
  role?: string;
  isOwner: boolean;
  canManage: boolean;
  application?: Application;
  applicationLoading: boolean;
  onApply: () => void;
}

function ActionPanel({ job, role, isOwner, canManage, application, applicationLoading, onApply }: PanelProps) {
  const deadline = getDeadline(job);
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
  const isCandidate = role === 'CANDIDATE';

  return (
    <Card className="p-5 space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Salary</p>
        <p className={cn('mt-1 font-semibold', salary ? 'text-lg text-slate-900' : 'text-sm text-slate-500')}>
          {salary ?? 'Not disclosed'}
        </p>
      </div>

      {(job.deadline || deadline.closed) && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Application deadline</p>
          {job.deadline && <p className="mt-1 text-sm font-medium text-slate-900">{formatDate(job.deadline)}</p>}
          {deadline.label && (
            <p
              className={cn(
                'mt-1 inline-flex items-center gap-1.5 text-xs font-medium',
                deadline.closed ? 'text-slate-500' : deadline.urgent ? 'text-amber-700' : 'text-emerald-700'
              )}
            >
              <CalendarClock className="w-3.5 h-3.5" aria-hidden />
              {deadline.label}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2 border-t border-slate-100 pt-5">
        {isCandidate && (
          applicationLoading ? (
            <div className="flex items-center justify-center h-10"><Spinner /></div>
          ) : application ? (
            <ApplicationStatusNote application={application} />
          ) : deadline.closed ? (
            <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2.5 text-sm font-medium text-slate-600">
              <Lock className="w-4 h-4" aria-hidden /> This job is no longer accepting applications
            </div>
          ) : (
            <Button size="lg" className="w-full" onClick={onApply}>Apply now</Button>
          )
        )}

        {isOwner && (
          <Link href={`/jobs/${job.id}/edit`} className={buttonClasses('primary', 'md', 'w-full')}>
            <Pencil className="w-4 h-4" aria-hidden /> Edit job
          </Link>
        )}
        {canManage && (
          <Link href={`/jobs/${job.id}/applicants`} className={buttonClasses(isOwner ? 'secondary' : 'primary', 'md', 'w-full')}>
            <Users className="w-4 h-4" aria-hidden /> View applicants
            {typeof job.applicationCount === 'number' && (
              <span className="ml-0.5 text-xs font-medium opacity-80">({job.applicationCount})</span>
            )}
          </Link>
        )}
        {canManage && (
          <Link href={`/jobs/${job.id}/analytics`} className={buttonClasses('secondary', 'md', 'w-full')}>
            <BarChart3 className="w-4 h-4" aria-hidden /> Analytics
          </Link>
        )}

        <div className="flex gap-2">
          {isCandidate && <SaveButton job={job} />}
          <ShareButton job={job} className="flex-1" />
        </div>
      </div>
    </Card>
  );
}

function MobileApplyBar({ job, application, applicationLoading, onApply }: {
  job: Job;
  application?: Application;
  applicationLoading: boolean;
  onApply: () => void;
}) {
  const deadline = getDeadline(job);
  return (
    <div className="lg:hidden fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-20 border-t border-slate-200 bg-white/95 backdrop-blur px-4 py-3">
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <div className="min-w-0 flex-1">
          {application ? (
            <>
              <p className="text-sm font-semibold text-slate-900">
                {application.status === 'WITHDRAWN' ? 'Application withdrawn' : 'Applied'}
              </p>
              {application.status !== 'WITHDRAWN' && (
                <p className="text-xs text-slate-500 truncate">{APPLICATION_STATUS_LABELS[application.status]}</p>
              )}
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-900 truncate">{job.title}</p>
              {deadline.label && (
                <p className={cn('text-xs truncate', deadline.urgent ? 'text-amber-700' : 'text-slate-500')}>{deadline.label}</p>
              )}
            </>
          )}
        </div>
        <SaveButton job={job} compact />
        {application ? (
          <Link href="/applications" className={buttonClasses('secondary')}>Track</Link>
        ) : (
          <Button onClick={onApply} disabled={deadline.closed || applicationLoading}>
            {deadline.closed ? 'Closed' : 'Apply now'}
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------- Loading ----------

function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading job">
      <Skeleton className="h-4 w-28 mb-6" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="space-y-6">
          <Card className="p-6 sm:p-8">
            <div className="flex gap-4">
              <Skeleton className="w-16 h-16 rounded-xl" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </Card>
          <Card className="p-6 sm:p-8 space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </Card>
        </div>
        <Card className="hidden lg:block p-5 space-y-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-11 w-full" />
        </Card>
      </div>
    </div>
  );
}

// ---------- Page ----------

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const isCandidate = user?.role === 'CANDIDATE';
  const { data: job, isLoading, isError, error, refetch, isRefetching } = useJob(id);
  const { application, isLoading: applicationLoading } = useCheckApplied(id, isCandidate);
  const [applyOpen, setApplyOpen] = useState(false);
  const openApply = useCallback(() => setApplyOpen(true), []);
  const closeApply = useCallback(() => setApplyOpen(false), []);

  // "Owner" = on the hiring team: the poster or a recruiter at the same company (server-computed canManage).
  const isOwner = !!user && !!job && (user.id === job.recruiterId || (user.role === 'RECRUITER' && !!job.canManage));
  const isAdmin = user?.role === 'ADMIN';
  const canManage = isOwner || isAdmin;
  const backHref = canManage ? '/jobs/my' : '/jobs';
  const backLabel = canManage ? 'Back to my jobs' : 'Back to jobs';

  const backLink = (
    <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary-600 mb-6 transition-colors">
      <ArrowLeft className="w-4 h-4" aria-hidden /> {backLabel}
    </Link>
  );

  if (isLoading) return <DetailSkeleton />;

  if (isError || !job) {
    const notFound = axios.isAxiosError(error) && error.response?.status === 404;
    return (
      <div className="max-w-3xl">
        {backLink}
        <Card>
          {notFound ? (
            <EmptyState
              icon={FileSearch}
              title="This job is no longer available"
              description="It may have been filled or removed by the employer. There are plenty of other open roles to explore."
              action={<Link href="/jobs" className={buttonClasses()}>Browse open jobs</Link>}
            />
          ) : (
            <ErrorState title="We couldn't load this job" error={error} onRetry={() => refetch()} retrying={isRefetching} />
          )}
        </Card>
      </div>
    );
  }

  const deadline = getDeadline(job);
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
  const tags = parseTags(job.tags);
  const descParagraphs = paragraphs(job.description);
  const responsibilities = toListItems(job.responsibilities);
  const requirements = toListItems(job.requirements);
  const showMobileBar = isCandidate;
  // Signed-out visitors get a sign-in link; owners and admins can't report.
  const canReport = !isOwner && !isAdmin;

  return (
    <div>
      {backLink}

      {job.hidden && (
        <div role="status" className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <EyeOff className="mt-0.5 w-4 h-4 flex-shrink-0 text-amber-600" aria-hidden />
          <p className="font-medium">This job is hidden by a moderator and isn&apos;t visible to candidates.</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="space-y-6 min-w-0">
          {/* Header */}
          <Card className="p-5 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
              <CompanyLogo name={job.companyName} src={job.companyLogoUrl} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <Badge tone={EXPERIENCE_STYLES[job.experienceLevel]}>{EXPERIENCE_LABELS[job.experienceLevel]}</Badge>
                  {job.status !== 'OPEN' && (
                    <Badge tone={JOB_STATUS_STYLES[job.status]}>{JOB_STATUS_LABELS[job.status]}</Badge>
                  )}
                  {job.featured && <FeaturedBadge />}
                  {job.category && (
                    <Badge>
                      <Tag className="w-3 h-3" aria-hidden /> {job.category}
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 break-words">{job.title}</h1>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-base font-medium text-slate-600">
                  {job.companySlug ? (
                    <Link href={`/companies/${job.companySlug}`} className="break-words hover:text-primary-700 hover:underline">
                      {job.companyName}
                    </Link>
                  ) : (
                    <span className="break-words">{job.companyName}</span>
                  )}
                  {(job.companyVerified || job.recruiterVerified) && (
                    <span title="Verified employer" className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                      <BadgeCheck className="w-3.5 h-3.5" aria-hidden /> Verified employer
                    </span>
                  )}
                </p>

                <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                  {job.location && (
                    <li className="flex items-center gap-1.5 min-w-0">
                      <MapPin className="w-4 h-4 flex-shrink-0 text-slate-400" aria-hidden />
                      <span className="break-words">{job.location}</span>
                    </li>
                  )}
                  <li className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-slate-400" aria-hidden /> {JOB_TYPE_LABELS[job.jobType]}
                  </li>
                  {salary && (
                    <li className="flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-slate-400" aria-hidden />
                      <span className="font-medium text-slate-900">{salary}</span>
                    </li>
                  )}
                  {job.deadline && (
                    <li className="flex items-center gap-1.5">
                      <CalendarClock className="w-4 h-4 text-slate-400" aria-hidden />
                      <span>
                        Apply by {formatDate(job.deadline)}
                        {deadline.label && (
                          <span
                            className={cn(
                              'ml-1.5 font-medium',
                              deadline.closed ? 'text-slate-500' : deadline.urgent ? 'text-amber-700' : 'text-emerald-700'
                            )}
                          >
                            · {deadline.label}
                          </span>
                        )}
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-slate-100 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" aria-hidden /> Posted {timeAgo(job.createdAt)}
              </span>
              {job.recruiterName && (
                <span className="flex items-center gap-1.5">
                  <UserRound className="w-3.5 h-3.5" aria-hidden /> Posted by {job.recruiterName}
                </span>
              )}
              {typeof job.viewCount === 'number' && job.viewCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" aria-hidden /> {pluralize(job.viewCount, 'view')}
                </span>
              )}
            </div>

            {/* Mobile-only actions for owners/admins and non-candidates */}
            {!isCandidate && (
              <div className="mt-5 flex flex-wrap gap-2 lg:hidden">
                {isOwner && (
                  <Link href={`/jobs/${job.id}/edit`} className={buttonClasses('primary')}>
                    <Pencil className="w-4 h-4" aria-hidden /> Edit job
                  </Link>
                )}
                {canManage && (
                  <Link href={`/jobs/${job.id}/applicants`} className={buttonClasses('secondary')}>
                    <Users className="w-4 h-4" aria-hidden /> View applicants
                  </Link>
                )}
                <ShareButton job={job} />
              </div>
            )}
          </Card>

          {isAdmin && <JobModerationCard job={job} className="lg:hidden" />}

          {/* Body */}
          <Card className="p-5 sm:p-8 space-y-8">
            <section aria-labelledby="about-role">
              <h2 id="about-role" className="text-lg font-semibold text-slate-900 mb-3">About the role</h2>
              <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
                {descParagraphs.map((p, i) => (
                  <p key={i} className="whitespace-pre-line break-words">{p}</p>
                ))}
              </div>
            </section>

            {responsibilities.length > 0 && (
              <section aria-labelledby="responsibilities" className="border-t border-slate-100 pt-8">
                <h2 id="responsibilities" className="text-lg font-semibold text-slate-900 mb-3">Responsibilities</h2>
                <ul className="space-y-2.5">
                  {responsibilities.map((item, i) => (
                    <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-slate-700">
                      <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" aria-hidden />
                      <span className="break-words min-w-0">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {requirements.length > 0 && (
              <section aria-labelledby="requirements" className="border-t border-slate-100 pt-8">
                <h2 id="requirements" className="text-lg font-semibold text-slate-900 mb-3">Requirements</h2>
                <ul className="space-y-2.5">
                  {requirements.map((item, i) => (
                    <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-slate-700">
                      <CheckCircle2 className="mt-1 w-4 h-4 flex-shrink-0 text-primary-500" aria-hidden />
                      <span className="break-words min-w-0">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {tags.length > 0 && (
              <section aria-labelledby="skills" className="border-t border-slate-100 pt-8">
                <h2 id="skills" className="text-lg font-semibold text-slate-900 mb-3">Skills</h2>
                <ul className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <li key={tag} className="rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700 ring-1 ring-inset ring-primary-600/10">
                      {tag}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </Card>

          <AboutCompanyCard job={job} className="lg:hidden" />

          {canReport && <ReportJobControl job={job} signedIn={!!user} />}
        </div>

        {/* Desktop sidebar */}
        <aside className="hidden lg:block lg:sticky lg:top-24 space-y-4" aria-label="Job actions">
          <ActionPanel
            job={job}
            role={user?.role}
            isOwner={isOwner}
            canManage={canManage}
            application={application}
            applicationLoading={isCandidate && applicationLoading}
            onApply={openApply}
          />
          <AboutCompanyCard job={job} />
          {isAdmin && <JobModerationCard job={job} />}
        </aside>
      </div>

      {showMobileBar && (
        <>
          <div className="h-20 lg:hidden" aria-hidden />
          <MobileApplyBar job={job} application={application} applicationLoading={applicationLoading} onApply={openApply} />
        </>
      )}

      {/* Stays mounted after submit so the success callback (toast + close) still runs. */}
      {isCandidate && <ApplyModal job={job} open={applyOpen} onClose={closeApply} />}
    </div>
  );
}
