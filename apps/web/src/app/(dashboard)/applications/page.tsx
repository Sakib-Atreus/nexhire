'use client';

import { useCallback, useId, useState } from 'react';
import Link from 'next/link';
import { FileText, ExternalLink, ChevronDown, PartyPopper, Send } from 'lucide-react';
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

const CLOSED_STATUSES = new Set(['REJECTED', 'WITHDRAWN']);

function ApplicationCard({ app, onWithdraw }: { app: Application; onWithdraw: (app: Application) => void }) {
  const [showLetter, setShowLetter] = useState(false);
  const letterId = useId();
  const closed = CLOSED_STATUSES.has(app.status);
  const updated = app.updatedAt && app.updatedAt !== app.appliedAt;

  return (
    <Card className={cn('p-5', closed && 'bg-slate-50/60')}>
      <div className="flex items-start gap-4">
        <CompanyLogo name={app.companyName} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-base font-semibold leading-snug">
                <Link href={`/jobs/${app.jobId}`} className="text-slate-900 hover:text-primary-700 break-words">
                  {app.jobTitle}
                </Link>
              </h2>
              <p className="text-sm text-slate-600 truncate">{app.companyName}</p>
            </div>
            <Badge tone={APPLICATION_STATUS_STYLES[app.status]} className="self-start">
              {APPLICATION_STATUS_LABELS[app.status]}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Applied {formatDate(app.appliedAt)}
            {updated && <> · Updated {timeAgo(app.updatedAt)}</>}
          </p>
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
          <p className="text-sm text-slate-500">The employer has decided not to move forward with this application.</p>
        ) : app.status === 'WITHDRAWN' ? (
          <p className="text-sm text-slate-500">You withdrew this application.</p>
        ) : (
          <ApplicationProgress status={app.status} />
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-1 gap-y-2 border-t border-slate-100 pt-3">
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
          <div id={letterId} className="mt-2 rounded-lg bg-slate-50 p-4 ring-1 ring-inset ring-slate-200">
            <p className="whitespace-pre-line break-words text-sm leading-relaxed text-slate-700">{app.coverLetter}</p>
          </div>
        )}
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
      <div className="mt-5 sm:pl-14 grid grid-cols-5 gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-1.5 rounded-full" />)}
      </div>
    </Card>
  );
}

export default function ApplicationsPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading, isError, error, refetch, isRefetching } = useMyApplications(page);
  const { mutate: updateStatus, isPending: withdrawing } = useUpdateApplicationStatus();
  const [target, setTarget] = useState<Application | null>(null);

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
    <div className="max-w-4xl">
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
          <div className="space-y-3">
            {apps.map((app) => <ApplicationCard key={app.id} app={app} onWithdraw={setTarget} />)}
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
