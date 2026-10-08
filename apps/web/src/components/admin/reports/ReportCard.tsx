'use client';

import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Clock, EyeOff, Settings2, XCircle } from 'lucide-react';
import { REPORT_REASON_LABELS, REPORT_STATUS_LABELS, REPORT_STATUS_STYLES } from '@/lib/constants';
import { formatDate, timeAgo } from '@/lib/format';
import type { JobReport } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonClasses } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/States';
import { HiddenBadge } from '@/components/admin/jobs/JobFlagBadges';
import type { ReviewMode } from './ReviewReportDialog';

export function ReportCard({ report, busy, onReview }: {
  report: JobReport;
  busy?: boolean;
  onReview: (report: JobReport, mode: ReviewMode) => void;
}) {
  const isOpen = report.status === 'OPEN';

  return (
    <Card className="p-4 sm:p-5">
      <article aria-labelledby={`report-${report.id}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 id={`report-${report.id}`} className="text-base font-semibold text-slate-900 break-words">
              <Link href={`/jobs/${report.jobId}`} className="hover:text-primary-700 focus:outline-none focus-visible:underline">
                {report.jobTitle}
              </Link>
            </h2>
            <p className="text-sm text-slate-500 break-words">{report.companyName}</p>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:justify-end">
            {!isOpen && <Badge tone={REPORT_STATUS_STYLES[report.status]}>{REPORT_STATUS_LABELS[report.status]}</Badge>}
            {report.jobHidden && <HiddenBadge />}
            <Badge tone="bg-rose-50 text-rose-700 ring-rose-600/20">{REPORT_REASON_LABELS[report.reason]}</Badge>
          </div>
        </div>

        {isOpen && report.openReportsForJob > 1 && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
            <AlertTriangle className="w-3.5 h-3.5" aria-hidden />
            {report.openReportsForJob} open reports for this job
          </p>
        )}

        {report.details ? (
          <blockquote className="mt-3 rounded-lg border-l-2 border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 whitespace-pre-line break-words">
            {report.details}
          </blockquote>
        ) : (
          <p className="mt-3 text-sm italic text-slate-400">No details provided.</p>
        )}

        <p className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-500">
          <span>
            Reported by <span className="font-medium text-slate-700">{report.reporterName}</span>
          </span>
          <a href={`mailto:${report.reporterEmail}`} className="break-all hover:text-primary-700 hover:underline">
            ({report.reporterEmail})
          </a>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" aria-hidden />
            <time dateTime={report.createdAt} title={formatDate(report.createdAt)}>{timeAgo(report.createdAt)}</time>
          </span>
        </p>

        {!isOpen && (
          <div className="mt-3 rounded-lg border border-slate-200 px-3 py-2.5 text-sm">
            <p className="flex flex-wrap items-center gap-1.5 text-slate-700">
              {report.status === 'RESOLVED'
                ? <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden />
                : <XCircle className="w-4 h-4 text-slate-400" aria-hidden />}
              <span>
                {REPORT_STATUS_LABELS[report.status]}
                {report.resolvedByName && <> by <span className="font-medium">{report.resolvedByName}</span></>}
                {report.resolvedAt && <> on {formatDate(report.resolvedAt)}</>}
              </span>
            </p>
            {report.resolutionNote && (
              <p className="mt-1.5 text-slate-600 whitespace-pre-line break-words">{report.resolutionNote}</p>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={`/admin/jobs?q=${encodeURIComponent(report.jobTitle)}`}
            className={buttonClasses('ghost', 'sm', 'self-start sm:self-auto')}
          >
            <Settings2 className="w-3.5 h-3.5" aria-hidden /> Manage job
          </Link>
          {isOpen && (
            <div className="flex flex-wrap gap-2">
              {!report.jobHidden && (
                <Button variant="danger" size="sm" disabled={busy} onClick={() => onReview(report, 'hide')}>
                  <EyeOff className="w-3.5 h-3.5" aria-hidden /> Hide job & resolve
                </Button>
              )}
              <Button variant="secondary" size="sm" disabled={busy} onClick={() => onReview(report, 'resolve')}>
                Resolve
              </Button>
              <Button variant="ghost" size="sm" disabled={busy} onClick={() => onReview(report, 'dismiss')}>
                Dismiss
              </Button>
            </div>
          )}
        </div>
      </article>
    </Card>
  );
}

export function ReportCardSkeleton() {
  return (
    <Card className="p-5 space-y-3" aria-hidden>
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-3 w-1/2" />
    </Card>
  );
}
