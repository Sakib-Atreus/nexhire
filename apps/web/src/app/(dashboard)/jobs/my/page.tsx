'use client';

import { useState } from 'react';
import { useMyJobs, useDeleteJob } from '@/hooks/useJobs';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import {
  Briefcase, Plus, MapPin, Clock, Users, Eye, Trash2,
  AlertTriangle,
} from 'lucide-react';
import type { Job, JobStatus } from '@/types';

const STATUS_COLORS: Record<JobStatus, string> = {
  OPEN: 'bg-green-50 text-green-700 border-green-200',
  DRAFT: 'bg-slate-50 text-slate-500 border-slate-200',
  CLOSED: 'bg-red-50 text-red-600 border-red-200',
  FILLED: 'bg-purple-50 text-purple-700 border-purple-200',
};

const JOB_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  REMOTE: 'Remote',
};

function DeleteConfirmModal({ job, onClose, onConfirm }: { job: Job; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <h2 className="font-semibold text-slate-900 text-center text-lg mb-2">Delete job post?</h2>
        <p className="text-slate-500 text-sm text-center mb-6">
          <span className="font-medium text-slate-700">&ldquo;{job.title}&rdquo;</span> will be permanently removed and all its applications deleted.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyJobsPage() {
  const { data, isLoading } = useMyJobs();
  const { mutate: deleteJob, isPending: deleting } = useDeleteJob();
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const jobs = data?.content ?? [];
  const filtered = statusFilter ? jobs.filter((j) => j.status === statusFilter) : jobs;

  const stats = {
    total: jobs.length,
    open: jobs.filter((j) => j.status === 'OPEN').length,
    closed: jobs.filter((j) => j.status === 'CLOSED').length,
    filled: jobs.filter((j) => j.status === 'FILLED').length,
  };

  return (
    <div className="pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Job Posts</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your job listings and track applicants.</p>
        </div>
        <Link
          href="/jobs/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors shadow-sm shadow-primary-200 self-start"
        >
          <Plus className="w-4 h-4" /> Post a Job
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', count: stats.total, color: 'text-slate-800' },
          { label: 'Open', count: stats.open, color: 'text-green-600' },
          { label: 'Closed', count: stats.closed, color: 'text-red-600' },
          { label: 'Filled', count: stats.filled, color: 'text-purple-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm text-center">
            <p className={cn('text-2xl font-bold', s.color)}>{s.count}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['', 'OPEN', 'DRAFT', 'CLOSED', 'FILLED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors border',
              statusFilter === s
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            )}
          >
            {s === '' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Job list */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <Briefcase className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 font-medium">No jobs found</p>
          <Link href="/jobs/create" className="mt-3 inline-block text-primary-600 hover:underline text-sm">
            Post your first job →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => (
            <div key={job.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Job meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <Link href={`/jobs/${job.id}`} className="font-semibold text-slate-900 hover:text-primary-600 transition-colors text-base leading-snug">
                        {job.title}
                      </Link>
                      <p className="text-sm text-slate-500 mt-0.5">{job.companyName}</p>
                    </div>
                    <span className={cn('text-xs px-2.5 py-1 rounded-full border font-medium flex-shrink-0', STATUS_COLORS[job.status])}>
                      {job.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-3 text-sm text-slate-500">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {job.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {JOB_TYPE_LABELS[job.jobType]}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400 text-xs">
                      Posted {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0 self-start">
                  <Link
                    href={`/jobs/${job.id}/applicants`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors border border-indigo-100"
                  >
                    <Users className="w-3.5 h-3.5" /> Applicants
                  </Link>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors border border-slate-200"
                    title="View job"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(job)}
                    disabled={deleting}
                    className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors border border-red-100"
                    title="Delete job"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          job={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            deleteJob(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
          }}
        />
      )}
    </div>
  );
}
