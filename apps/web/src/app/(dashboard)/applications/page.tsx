'use client';

import { useState } from 'react';
import { useMyApplications, useUpdateApplicationStatus } from '@/hooks/useApplications';
import { FileText, ExternalLink, Search, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import type { ApplicationStatus } from '@/types';

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING: 'Pending',
  REVIEWING: 'Under Review',
  SHORTLISTED: 'Shortlisted',
  INTERVIEWED: 'Interviewed',
  OFFERED: 'Offered',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  REVIEWING: 'bg-blue-50 text-blue-700 border-blue-200',
  SHORTLISTED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  INTERVIEWED: 'bg-purple-50 text-purple-700 border-purple-200',
  OFFERED: 'bg-green-50 text-green-700 border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  WITHDRAWN: 'bg-slate-50 text-slate-400 border-slate-200',
};

const STATUS_DOTS: Record<ApplicationStatus, string> = {
  PENDING: 'bg-yellow-400',
  REVIEWING: 'bg-blue-500',
  SHORTLISTED: 'bg-indigo-500',
  INTERVIEWED: 'bg-purple-500',
  OFFERED: 'bg-green-500',
  REJECTED: 'bg-red-500',
  WITHDRAWN: 'bg-slate-300',
};

const ALL_STATUSES = Object.keys(STATUS_LABELS) as ApplicationStatus[];

export default function ApplicationsPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useMyApplications(page);
  const { mutate: updateStatus, isPending } = useUpdateApplicationStatus();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const apps = data?.content ?? [];
  const filtered = apps.filter((a) => {
    const matchSearch = !search || a.jobTitle.toLowerCase().includes(search.toLowerCase()) || a.companyName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const countByStatus = (s: string) => apps.filter((a) => a.status === s).length;
  const activeCount = apps.filter((a) => !['REJECTED', 'WITHDRAWN'].includes(a.status)).length;
  const offeredCount = apps.filter((a) => a.status === 'OFFERED').length;

  return (
    <div className="pb-20 lg:pb-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">My Applications</h1>
        <p className="text-slate-500 text-sm mt-1">
          {apps.length > 0
            ? `${apps.length} total · ${activeCount} active · ${offeredCount} offers`
            : 'Track all your job applications here.'}
        </p>
      </div>

      {/* Pipeline summary */}
      {apps.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-6">
          {ALL_STATUSES.map((s) => {
            const count = countByStatus(s);
            if (!count) return null;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
                className={cn(
                  'bg-white rounded-xl border p-3 text-center transition-all hover:shadow-sm',
                  statusFilter === s ? 'border-primary-300 ring-1 ring-primary-200' : 'border-slate-100'
                )}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className={cn('w-2 h-2 rounded-full flex-shrink-0', STATUS_DOTS[s])} />
                  <span className="text-base font-bold text-slate-900">{count}</span>
                </div>
                <p className="text-xs text-slate-500 leading-tight truncate">{STATUS_LABELS[s]}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Search + filter */}
      {apps.length > 0 && (
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by job title or company..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
          {statusFilter && (
            <button
              onClick={() => setStatusFilter('')}
              className="px-3.5 py-2.5 bg-primary-50 text-primary-700 rounded-xl text-sm font-medium hover:bg-primary-100 transition-colors border border-primary-200"
            >
              Clear filter
            </button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}
        </div>
      ) : apps.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <FileText className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 font-medium text-lg">No applications yet</p>
          <p className="text-slate-400 text-sm mt-1 mb-5">Start applying to jobs to track your progress here.</p>
          <Link href="/jobs" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors">
            Browse Jobs
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-slate-500 text-sm">No applications match your filter.</p>
          <button onClick={() => { setSearch(''); setStatusFilter(''); }} className="mt-2 text-primary-600 text-sm hover:underline">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <div key={app.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Job info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={cn('w-2 h-2 rounded-full mt-2 flex-shrink-0', STATUS_DOTS[app.status])} />
                  <div className="min-w-0">
                    <Link
                      href={`/jobs/${app.jobId}`}
                      className="font-semibold text-slate-900 hover:text-primary-600 transition-colors flex items-center gap-1.5 group"
                    >
                      {app.jobTitle}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </Link>
                    <p className="text-sm text-slate-500 mt-0.5">{app.companyName}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Applied {new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {app.updatedAt !== app.appliedAt && ` · Updated ${new Date(app.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                    </p>
                  </div>
                </div>

                {/* Status + actions */}
                <div className="flex items-center gap-2 flex-shrink-0 self-start">
                  <span className={cn('text-xs px-3 py-1.5 rounded-full border font-semibold', STATUS_COLORS[app.status])}>
                    {STATUS_LABELS[app.status]}
                  </span>
                  {app.status !== 'WITHDRAWN' && app.status !== 'REJECTED' && (
                    <button
                      onClick={() => updateStatus({ id: app.id, status: 'WITHDRAWN' })}
                      disabled={isPending}
                      className="text-xs text-slate-400 hover:text-red-500 font-medium transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              </div>

              {/* Cover letter preview */}
              {app.coverLetter && (
                <div className="mt-3 pl-5 border-l-2 border-slate-100">
                  <p className="text-xs text-slate-400 mb-1 font-medium">Your note</p>
                  <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{app.coverLetter}</p>
                </div>
              )}

              {/* Offer highlight */}
              {app.status === 'OFFERED' && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 animate-pulse" />
                  <p className="text-sm font-semibold text-green-700">You received an offer for this position!</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Page {data.number + 1} of {data.totalPages} · {data.totalElements} applications
          </p>
          <div className="flex gap-2">
            <button
              disabled={data.first}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={data.last}
              onClick={() => setPage((p) => p + 1)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
