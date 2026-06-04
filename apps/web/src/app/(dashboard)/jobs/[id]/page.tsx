'use client';

import { useParams } from 'next/navigation';
import { useJob } from '@/hooks/useJobs';
import { useApply } from '@/hooks/useApplications';
import { useAuthStore } from '@/store/authStore';
import { MapPin, Clock, DollarSign, Calendar, Building2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading } = useJob(id);
  const { user } = useAuthStore();
  const { mutate: apply, isPending, isSuccess } = useApply();

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-slate-200 rounded w-1/2" /><div className="h-64 bg-slate-200 rounded" /></div>;
  if (!job) return <div className="text-center py-16 text-slate-500">Job not found</div>;

  const salary =
    job.salaryMin && job.salaryMax
      ? `$${(job.salaryMin / 1000).toFixed(0)}k–$${(job.salaryMax / 1000).toFixed(0)}k`
      : null;

  return (
    <div className="max-w-4xl">
      <Link href="/jobs" className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to jobs
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{job.title}</h1>
              <div className="flex items-center gap-2 mt-2 text-slate-500">
                <Building2 className="w-4 h-4" />
                <span className="font-medium">{job.companyName}</span>
              </div>
            </div>
            {user?.role === 'CANDIDATE' && (
              <button
                onClick={() => apply({ jobId: job.id })}
                disabled={isPending || isSuccess}
                className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {isSuccess ? 'Applied!' : isPending ? 'Applying...' : 'Apply Now'}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-4 mt-5 text-sm text-slate-600">
            {job.location && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{job.location}</span>}
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{job.jobType.replace('_', ' ')}</span>
            {salary && <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4" />{salary}</span>}
            {job.deadline && <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />Deadline: {new Date(job.deadline).toLocaleDateString()}</span>}
          </div>

          {job.tags && (
            <div className="flex flex-wrap gap-2 mt-4">
              {job.tags.split(',').map((tag) => (
                <span key={tag.trim()} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="p-8 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">About the Role</h2>
            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{job.description}</p>
          </section>

          {job.responsibilities && (
            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-3">Responsibilities</h2>
              <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{job.responsibilities}</p>
            </section>
          )}

          {job.requirements && (
            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-3">Requirements</h2>
              <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{job.requirements}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
