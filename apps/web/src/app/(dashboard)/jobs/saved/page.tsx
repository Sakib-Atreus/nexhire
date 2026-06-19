'use client';

import { Bookmark } from 'lucide-react';
import Link from 'next/link';
import { useSavedJobs } from '@/hooks/useJobs';
import { JobCard } from '@/components/jobs/JobCard';

export default function SavedJobsPage() {
  const { data, isLoading, isError } = useSavedJobs();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Bookmark className="w-6 h-6 text-primary-600" />
        Saved Jobs
      </h1>

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse h-32" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg font-medium text-red-500">Failed to load saved jobs</p>
          <p className="text-sm mt-1">Make sure the API server is running and try refreshing</p>
        </div>
      ) : !data || data.content.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <Bookmark className="w-14 h-14 mb-4 opacity-20" />
          <p className="text-lg font-semibold text-slate-700">No saved jobs yet</p>
          <p className="text-sm mt-1 mb-6">Jobs you bookmark will appear here for easy access.</p>
          <Link
            href="/jobs"
            className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            Browse Jobs
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-4">{data.totalElements} saved job{data.totalElements !== 1 ? 's' : ''}</p>
          <div className="grid gap-4">
            {data.content.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
