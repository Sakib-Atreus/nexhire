'use client';

import { useMyApplications, useUpdateApplicationStatus } from '@/hooks/useApplications';
import { FileText, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import type { ApplicationStatus } from '@/types';

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  REVIEWING: 'bg-blue-50 text-blue-700 border-blue-200',
  SHORTLISTED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  INTERVIEWED: 'bg-purple-50 text-purple-700 border-purple-200',
  OFFERED: 'bg-green-50 text-green-700 border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  WITHDRAWN: 'bg-slate-50 text-slate-500 border-slate-200',
};

export default function ApplicationsPage() {
  const { data, isLoading } = useMyApplications();
  const { mutate: updateStatus } = useUpdateApplicationStatus();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Applications</h1>

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded-xl animate-pulse" />)}</div>
      ) : data?.content.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No applications yet</p>
          <Link href="/jobs" className="mt-3 inline-block text-primary-600 hover:underline text-sm">Browse jobs</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.content.map((app) => (
            <div key={app.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <Link href={`/jobs/${app.jobId}`} className="font-semibold text-slate-900 hover:text-primary-600 flex items-center gap-1">
                    {app.jobTitle} <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <p className="text-slate-500 text-sm mt-0.5">{app.companyName}</p>
                  <p className="text-slate-400 text-xs mt-1">Applied {new Date(app.appliedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={cn('text-xs px-2.5 py-1 rounded-full border font-medium', STATUS_STYLES[app.status])}>
                    {app.status}
                  </span>
                  {app.status !== 'WITHDRAWN' && (
                    <button
                      onClick={() => updateStatus({ id: app.id, status: 'WITHDRAWN' })}
                      className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
