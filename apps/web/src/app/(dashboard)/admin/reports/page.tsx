'use client';

import { Suspense, useCallback, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Flag, ShieldCheck } from 'lucide-react';
import { useAdminReports, useResolveReport } from '@/hooks/useAdmin';
import { cn } from '@/lib/cn';
import { getErrorMessage, pluralize } from '@/lib/format';
import { toast } from '@/store/toastStore';
import type { JobReport, ReportStatus } from '@/types';
import { buttonClasses } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { ReportCard, ReportCardSkeleton } from '@/components/admin/reports/ReportCard';
import { ReviewReportDialog, type ReviewMode } from '@/components/admin/reports/ReviewReportDialog';

const PAGE_SIZE = 10;

type Tab = 'open' | 'resolved' | 'dismissed' | 'all';
const TABS: { id: Tab; label: string; status: ReportStatus | undefined }[] = [
  { id: 'open', label: 'Open', status: 'OPEN' },
  { id: 'resolved', label: 'Resolved', status: 'RESOLVED' },
  { id: 'dismissed', label: 'Dismissed', status: 'DISMISSED' },
  { id: 'all', label: 'All', status: undefined },
];

const EMPTY: Record<Tab, { title: string; description: string }> = {
  open: { title: 'No reports to review', description: 'You’re all caught up. New reports from users will appear here.' },
  resolved: { title: 'No resolved reports yet', description: 'Reports you resolve will be kept here for reference.' },
  dismissed: { title: 'No dismissed reports', description: 'Reports you dismiss as unfounded will be kept here.' },
  all: { title: 'No reports yet', description: 'When users flag a job posting, the report shows up here.' },
};

export default function AdminReportsPage() {
  return (
    <Suspense fallback={<div className="space-y-4"><ReportCardSkeleton /><ReportCardSkeleton /></div>}>
      <AdminReportsContent />
    </Suspense>
  );
}

function AdminReportsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const tabParam = sp.get('status') as Tab | null;
  const tab: Tab = TABS.some((t) => t.id === tabParam) ? (tabParam as Tab) : 'open';
  const current = TABS.find((t) => t.id === tab)!;
  const page = Math.max(0, (Number(sp.get('page')) || 1) - 1);

  const { data, isLoading, isError, error, refetch, isRefetching, isPlaceholderData } = useAdminReports(current.status, page, PAGE_SIZE);
  // Lightweight query just for the Open tab's count badge.
  const { data: openCount } = useAdminReports('OPEN', 0, 1);
  const resolve = useResolveReport();

  const [review, setReview] = useState<{ report: JobReport; mode: ReviewMode } | null>(null);
  const closeReview = useCallback(() => { if (!resolve.isPending) setReview(null); }, [resolve.isPending]);

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const navigate = (nextTab: Tab, nextPage = 0) => {
    const params = new URLSearchParams();
    if (nextTab !== 'open') params.set('status', nextTab);
    if (nextPage > 0) params.set('page', String(nextPage + 1));
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const onTabKey = (e: KeyboardEvent, index: number) => {
    let next = -1;
    if (e.key === 'ArrowRight') next = (index + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    tabRefs.current[next]?.focus();
    navigate(TABS[next].id);
  };

  function confirmReview(note: string) {
    if (!review) return;
    const { report, mode } = review;
    resolve.mutate(
      { id: report.id, status: mode === 'dismiss' ? 'DISMISSED' : 'RESOLVED', note: note || undefined, hideJob: mode === 'hide' },
      {
        onSuccess: () => {
          if (mode === 'hide') toast.success('Job hidden and report resolved', `“${report.jobTitle}” is no longer visible to candidates.`);
          else if (mode === 'resolve') toast.success('Report resolved', report.jobTitle);
          else toast.success('Report dismissed', report.jobTitle);
          setReview(null);
        },
        onError: (err) => {
          toast.error("Couldn't update report", getErrorMessage(err));
          // e.g. another admin reviewed it first: refresh so the card shows the current state.
          refetch();
        },
      }
    );
  }

  const reports = data?.content ?? [];
  const busyId = resolve.isPending ? resolve.variables?.id : undefined;

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Review job postings flagged by users. Hide jobs that break the rules, or dismiss unfounded reports."
        actions={<Link href="/admin/jobs?hidden=true" className={buttonClasses('secondary', 'sm')}>View hidden jobs</Link>}
      />

      <div className="mb-4 -mx-4 px-4 overflow-x-auto sm:mx-0 sm:px-0">
        <div role="tablist" aria-label="Report status" className="inline-flex gap-1 rounded-lg bg-slate-100 p-1">
          {TABS.map((t, i) => {
            const selected = t.id === tab;
            const count = t.id === 'open' ? openCount?.totalElements : undefined;
            return (
              <button
                key={t.id}
                ref={(el) => { tabRefs.current[i] = el; }}
                type="button"
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={selected}
                aria-controls="reports-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => navigate(t.id)}
                onKeyDown={(e) => onTabKey(e, i)}
                className={cn(
                  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                  selected ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {t.label}
                {typeof count === 'number' && count > 0 && (
                  <span className="rounded-full bg-amber-100 px-1.5 text-xs font-semibold text-amber-800 tabular-nums">
                    {count}
                    <span className="sr-only"> open</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div id="reports-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <ReportCardSkeleton key={i} />)}
          </div>
        ) : isError ? (
          <Card>
            <ErrorState title="Couldn't load reports" error={error} onRetry={() => refetch()} retrying={isRefetching} />
          </Card>
        ) : reports.length === 0 ? (
          <Card>
            <EmptyState icon={tab === 'open' ? ShieldCheck : Flag} title={EMPTY[tab].title} description={EMPTY[tab].description} />
          </Card>
        ) : (
          <>
            <p className="mb-3 text-sm text-slate-500" aria-live="polite">
              {pluralize(data!.totalElements, tab === 'all' ? 'report' : `${current.label.toLowerCase()} report`)}
            </p>
            <ul className={cn('space-y-4', isPlaceholderData && 'opacity-60 transition-opacity')}>
              {reports.map((r) => (
                <li key={r.id}>
                  <ReportCard report={r} busy={busyId === r.id} onReview={(report, mode) => setReview({ report, mode })} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {data && (
        <Pagination
          page={page}
          totalPages={data.totalPages}
          onChange={(p) => { navigate(tab, p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        />
      )}

      <ReviewReportDialog
        report={review?.report ?? null}
        mode={review?.mode ?? 'resolve'}
        loading={resolve.isPending}
        onClose={closeReview}
        onConfirm={confirmReview}
      />
    </div>
  );
}
