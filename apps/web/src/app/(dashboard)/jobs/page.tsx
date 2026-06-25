'use client';

import { useState } from 'react';
import { useJobs } from '@/hooks/useJobs';
import { JobCard } from '@/components/jobs/JobCard';
import { Search, Building2 } from 'lucide-react';

export default function JobsPage() {
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [company, setCompany] = useState('');
  const [jobType, setJobType] = useState('');
  const [salaryMin, setSalaryMin] = useState<number | undefined>(undefined);
  const [salaryMax, setSalaryMax] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(0);

  const { data, isLoading, isError } = useJobs({
    keyword: keyword || undefined,
    location: location || undefined,
    companyName: company || undefined,
    jobType: jobType || undefined,
    salaryMin,
    salaryMax,
    page,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Browse Jobs</h1>

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
              placeholder="Job title, keywords..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="relative sm:w-48">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={company}
              onChange={(e) => { setCompany(e.target.value); setPage(0); }}
              placeholder="Company name"
              className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <input
            value={location}
            onChange={(e) => { setLocation(e.target.value); setPage(0); }}
            placeholder="Location"
            className="sm:w-40 px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <select
            value={jobType}
            onChange={(e) => { setJobType(e.target.value); setPage(0); }}
            className="sm:w-44 px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="">All Types</option>
            <option value="FULL_TIME">Full-time</option>
            <option value="PART_TIME">Part-time</option>
            <option value="CONTRACT">Contract</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="REMOTE">Remote</option>
          </select>
        </div>
        <div className="flex gap-3 mt-3">
          <input
            type="number"
            min={0}
            value={salaryMin ?? ''}
            onChange={(e) => { setSalaryMin(e.target.value ? Number(e.target.value) : undefined); setPage(0); }}
            placeholder="Min salary ($)"
            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <input
            type="number"
            min={0}
            value={salaryMax ?? ''}
            onChange={(e) => { setSalaryMax(e.target.value ? Number(e.target.value) : undefined); setPage(0); }}
            placeholder="Max salary ($)"
            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse h-32" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg font-medium text-red-500">Failed to load jobs</p>
          <p className="text-sm mt-1">Make sure the API server is running and try refreshing</p>
        </div>
      ) : !data || data.content.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No jobs found</p>
          <p className="text-sm mt-1">Try adjusting your search filters</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-4">{data.totalElements} jobs found</p>
          <div className="grid gap-4">
            {data.content.map((job) => <JobCard key={job.id} job={job} />)}
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-slate-600">
                Page {page + 1} of {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={data.last}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
