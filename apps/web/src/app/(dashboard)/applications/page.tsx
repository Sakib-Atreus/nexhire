'use client';

import { Suspense, useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CalendarClock, FileText, ExternalLink, ChevronDown, Info, MessagesSquare, PartyPopper, Send, X } from 'lucide-react';
import type { Application } from '@/types';
import { useMyApplications, useUpdateApplicationStatus } from '@/hooks/useApplications';
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_STYLES } from '@/lib/constants';
import { formatDate, getErrorMessage, pluralize, timeAgo } from '@/lib/format';
import { toast } from '@/store/toastStore';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonClasses } from '@/components/ui/Button';
import { CompanyLogo } from '@/components/ui/CompanyLogo';
import { ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { Pagination } from '@/components/ui/Pagination';
import { ApplicationProgress } from '@/components/applications/ApplicationProgress';
import { ApplicationActivityPanel } from '@/components/applications/ApplicationActivityPanel';
import { TimeZoneNote } from '@/components/interviews/InterviewParts';
import { formatShortDate } from '@/components/interviews/interviewUtils';

const CLOSED_STATUSES = new Set(['REJECTED', 'WITHDRAWN']);

function ApplicationCard({ app, onWithdraw, activityOpen, onToggleActivity, highlighted }: {
  app: Application;
  onWithdraw: (app: Application) => void;
  activityOpen: boolean;
  onToggleActivity: () => void;
  highlighted?: boolean;
}) {
  const [showLetter, setShowLetter] = useState(false);
  const letterId = useId();
  const activityId = useId();
  const messageCount = app.messageCount ?? 0;
  const nextInterview = app.nextInterviewAt && new Date(app.nextInterviewAt).getTime() > Date.now() - 60 * 60_000 ? app.nextInterviewAt : null;
  const closed = CLOSED_STATUSES.has(app.status);
  const updated = app.updatedAt && app.updatedAt !== app.appliedAt;

  return (
    <Card id={`application-${app.id}`} className={cn('p-5 scroll-mt-6 transition-shadow', closed && 'bg-muted/60', highlighted && 'ring-2 ring-primary-500/60')}>
      <div className="flex items-start gap-4">
        <CompanyLogo name={app.companyName} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-base font-semibold leading-snug">
                <Link href={`/jobs/${app.jobId}`} className="text-fg hover:text-primary-700 break-words">
                  {app.jobTitle}
                </Link>
              </h2>
              <p className="text-sm text-fg-tertiary truncate">{app.companyName}</p>
            </div>
            <Badge tone={APPLICATION_STATUS_STYLES[app.status]} className="self-start">
              {APPLICATION_STATUS_LABELS[app.status]}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-fg-muted">
            Applied {formatDate(app.appliedAt)}
            {updated && <> · Updated {timeAgo(app.updatedAt)}</>}
          </p>
          {(nextInterview || messageCount > 0) && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {nextInterview && (
                <Badge tone="bg-indigo-50 text-indigo-700 ring-indigo-600/20">
                  <CalendarClock className="w-3 h-3" aria-hidden />
                  <span suppressHydrationWarning>Interview {formatShortDate(nextInterview)}</span>
                </Badge>
              )}
              {messageCount > 0 && (
                <Badge>
                  <MessagesSquare className="w-3 h-3" aria-hidden />
                  {pluralize(messageCount, 'message')}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 sm:pl-14">
        {app.status === 'OFFERED' && (
          <div className="mb-4 flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <PartyPopper className="w-5 h-5 flex-shrink-0 text-emerald-600" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-emerald-800">You received an offer</p>
              <p className="text-xs text-emerald-700 mt-0.5">Congratulations! Expect the recruiter to reach out with next steps.</p>
            </div>
          </div>
        )}

        {app.status === 'REJECTED' ? (
          <p className="text-sm text-fg-muted">The employer has decided not to move forward with this application.</p>
        ) : app.status === 'WITHDRAWN' ? (
          <p className="text-sm text-fg-muted">You withdrew this application.</p>
        ) : (
          <ApplicationProgress status={app.status} />
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-1 gap-y-2 border-t border-line-subtle pt-3">
          <Button
            variant={activityOpen ? 'secondary' : 'ghost'}
            size="sm"
            onClick={onToggleActivity}
            aria-expanded={activityOpen}
            aria-controls={activityId}
          >
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', activityOpen && 'rotate-180')} aria-hidden />
            Timeline, messages &amp; interviews
          </Button>
          {app.coverLetter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLetter((s) => !s)}
              aria-expanded={showLetter}
              aria-controls={letterId}
            >
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showLetter && 'rotate-180')} aria-hidden />
              {showLetter ? 'Hide cover letter' : 'Cover letter'}
            </Button>
          )}
          {app.resumeUrl && (
            <a
              href={app.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses('ghost', 'sm')}
            >
              <FileText className="w-3.5 h-3.5" aria-hidden /> Resume
              <ExternalLink className="w-3 h-3 opacity-60" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
          <Link href={`/jobs/${app.jobId}`} className={buttonClasses('ghost', 'sm')}>
            View job
          </Link>
          {!closed && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              onClick={() => onWithdraw(app)}
            >
              Withdraw
            </Button>
          )}
        </div>

        {app.coverLetter && showLetter && (
          <div id={letterId} className="mt-2 rounded-lg bg-muted p-4 ring-1 ring-inset ring-line">
            <p className="whitespace-pre-line break-words text-sm leading-relaxed text-fg-secondary">{app.coverLetter}</p>
          </div>
        )}

        {activityOpen && <ApplicationActivityPanel application={app} id={activityId} />}
      </div>
    </Card>
  );
}

function ApplicationSkeleton() {
  return (
    <Card className="p-5" aria-hidden>
      <div className="flex items-start gap-4">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3.5 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <div className="mt-5 sm:pl-14 grid grid-cols-6 gap-1.5">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-1.5 rounded-full" />)}
      </div>
    </Card>
  );
}

function ApplicationsPageContent() {
  const [page, setPage] = useState(0);
  const { data, isLoading, isError, error, refetch, isRefetching } = useMyApplications(page);
  const { mutate: updateStatus, isPending: withdrawing } = useUpdateApplicationStatus();
  const [target, setTarget] = useState<Application | null>(null);
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const searchParams = useSearchParams();
  const deepLinkId = searchParams.get('application');
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [deepLinkMissing, setDeepLinkMissing] = useState(false);
  const handledDeepLink = useRef<string | null>(null);

  const toggle = useCallback((id: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Deep link from notifications: /applications?application=<id> opens and scrolls to that application.
  useEffect(() => {
    if (!deepLinkId || !data || handledDeepLink.current === deepLinkId) return;
    handledDeepLink.current = deepLinkId;
    const found = data.content.some((a) => a.id === deepLinkId);
    if (!found) {
      setDeepLinkMissing(true);
      return;
    }
    setDeepLinkMissing(false);
    setOpen((prev) => new Set(prev).add(deepLinkId));
    setHighlightId(deepLinkId);
    requestAnimationFrame(() => {
      document.getElementById(`application-${deepLinkId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [deepLinkId, data]);

  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => setHighlightId(null), 4000);
    return () => clearTimeout(t);
  }, [highlightId]);

  const apps = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const closeConfirm = useCallback(() => {
    if (!withdrawing) setTarget(null);
  }, [withdrawing]);

  const confirmWithdraw = () => {
    if (!target) return;
    const app = target;
    updateStatus(
      { id: app.id, status: 'WITHDRAWN' },
      {
        onSuccess: () => {
          toast.success('Application withdrawn', `${app.jobTitle} at ${app.companyName}`);
          setTarget(null);
        },
        onError: (err) => toast.error('Could not withdraw application', getErrorMessage(err)),
      }
    );
  };

  const goToPage = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <PageHeader
        title="My applications"
        description={
          total > 0
            ? `${pluralize(total, 'application')} · track where each one stands in the hiring process.`
            : 'Track where each application stands in the hiring process.'
        }
        actions={
          total > 0 ? <Link href="/jobs" className={buttonClasses('secondary')}>Find more jobs</Link> : undefined
        }
      />

      {deepLinkMissing && (
        <div role="status" className="mb-4 flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />
          <p className="flex-1">
            The application from your notification isn&apos;t on this page. It may be on another page of your list, or it may no longer be available.
          </p>
          <button type="button" onClick={() => setDeepLinkMissing(false)} className="-m-1 p-1 rounded text-sky-700 hover:bg-sky-100" aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading applications">
          {Array.from({ length: 4 }).map((_, i) => <ApplicationSkeleton key={i} />)}
        </div>
      ) : isError ? (
        <Card>
          <ErrorState title="We couldn't load your applications" error={error} onRetry={() => refetch()} retrying={isRefetching} />
        </Card>
      ) : apps.length === 0 ? (
        <Card>
          <EmptyState
            icon={Send}
            title="No applications yet"
            description="When you apply for a job, you can follow its progress here, from review to offer."
            action={<Link href="/jobs" className={buttonClasses()}>Browse jobs</Link>}
          />
        </Card>
      ) : (
        <>
          <TimeZoneNote className="mb-3" />
          <div className="space-y-3">
            {apps.map((app) => (
              <ApplicationCard
                key={app.id}
                app={app}
                onWithdraw={setTarget}
                activityOpen={open.has(app.id)}
                onToggleActivity={() => toggle(app.id)}
                highlighted={highlightId === app.id}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={data?.totalPages ?? 0} onChange={goToPage} />
        </>
      )}

      <ConfirmDialog
        open={!!target}
        onClose={closeConfirm}
        onConfirm={confirmWithdraw}
        loading={withdrawing}
        title="Withdraw this application?"
        description={
          target
            ? `Your application for ${target.jobTitle} at ${target.companyName} will be withdrawn. You won't be able to apply to this job again.`
            : undefined
        }
        confirmLabel="Withdraw application"
      />
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense>
      <ApplicationsPageContent />
    </Suspense>
  );
}
