'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useJob } from '@/hooks/useJobs';
import { useApply, useCheckApplied } from '@/hooks/useApplications';
import { useAuthStore } from '@/store/authStore';
import {
  MapPin, Clock, DollarSign, Calendar, Building2, ArrowLeft,
  Users, CheckCircle2, X, Briefcase, TrendingUp, Pencil,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import type { Job } from '@/types';
import { FileUpload } from '@/components/ui/FileUpload';

const LEVEL_COLORS: Record<string, string> = {
  ENTRY: 'bg-green-50 text-green-700 border-green-200',
  MID: 'bg-blue-50 text-blue-700 border-blue-200',
  SENIOR: 'bg-purple-50 text-purple-700 border-purple-200',
  LEAD: 'bg-orange-50 text-orange-700 border-orange-200',
  EXECUTIVE: 'bg-red-50 text-red-700 border-red-200',
};

const JOB_STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-green-50 text-green-700',
  DRAFT: 'bg-slate-50 text-slate-500',
  CLOSED: 'bg-red-50 text-red-600',
  FILLED: 'bg-purple-50 text-purple-700',
};

// ---------- Apply modal ----------
function ApplyModal({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeTab, setResumeTab] = useState<'upload' | 'url'>('upload');
  const [errors, setErrors] = useState<{ coverLetter?: string; resume?: string }>({});
  const { mutate: apply, isPending, isSuccess, error } = useApply();

  const handleApply = () => {
    const newErrors: { coverLetter?: string; resume?: string } = {};
    if (!coverLetter.trim()) newErrors.coverLetter = 'Cover letter is required';
    if (!resumeUrl.trim()) newErrors.resume = 'Resume is required';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    apply(
      { jobId, coverLetter, resumeUrl },
      { onSuccess: () => setTimeout(onClose, 1500) }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Apply for this position</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-12 text-center">
            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-green-500" />
            </div>
            <h3 className="font-semibold text-slate-900 text-lg mb-1">Application Submitted!</h3>
            <p className="text-slate-500 text-sm">The recruiter will review your application soon.</p>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Cover Letter <span className="text-red-500">*</span>
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => { setCoverLetter(e.target.value); setErrors(p => ({ ...p, coverLetter: undefined })); }}
                rows={5}
                placeholder="Introduce yourself and explain why you're a great fit for this role..."
                className={cn(
                  'w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm text-slate-700 placeholder-slate-400',
                  errors.coverLetter ? 'border-red-400' : 'border-slate-300'
                )}
              />
              {errors.coverLetter && <p className="mt-1 text-xs text-red-500">{errors.coverLetter}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Resume <span className="text-red-500">*</span>
              </label>
              <div className="flex border border-slate-200 rounded-lg overflow-hidden mb-3">
                <button
                  type="button"
                  onClick={() => setResumeTab('upload')}
                  className={cn(
                    'flex-1 px-4 py-2 text-sm font-medium transition-colors',
                    resumeTab === 'upload'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  )}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setResumeTab('url')}
                  className={cn(
                    'flex-1 px-4 py-2 text-sm font-medium transition-colors',
                    resumeTab === 'url'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  )}
                >
                  Paste URL
                </button>
              </div>

              {resumeTab === 'upload' ? (
                <FileUpload
                  onUpload={(url) => { setResumeUrl(url); setErrors(p => ({ ...p, resume: undefined })); }}
                  accept=".pdf,.doc,.docx"
                  label="Upload your resume"
                  hint="PDF, DOC or DOCX"
                  currentUrl={resumeUrl}
                />
              ) : (
                <input
                  type="url"
                  value={resumeUrl}
                  onChange={(e) => { setResumeUrl(e.target.value); setErrors(p => ({ ...p, resume: undefined })); }}
                  placeholder="https://yourresume.com/resume.pdf"
                  className={cn(
                    'w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm',
                    errors.resume ? 'border-red-400' : 'border-slate-300'
                  )}
                />
              )}
              {errors.resume && <p className="mt-1 text-xs text-red-500">{errors.resume}</p>}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                Failed to apply. You may have already applied to this job.
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Candidate-only action buttons ----------
// Isolated into its own component so useCheckApplied (which fetches /applications/my)
// is only called when the user is actually a CANDIDATE.
function CandidateActions({ job }: { job: Job }) {
  const { applied, application } = useCheckApplied(job.id);
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {applied ? (
        <div className="flex items-center gap-2 px-5 py-2.5 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          Applied · {application?.status}
        </div>
      ) : job.status !== 'OPEN' ? (
        <div className="px-5 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-sm font-medium">
          Not accepting applications
        </div>
      ) : (
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-2.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors shadow-sm shadow-primary-200"
        >
          Apply Now
        </button>
      )}
      {showModal && <ApplyModal jobId={job.id} onClose={() => setShowModal(false)} />}
    </>
  );
}

// ---------- Main page ----------
export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading } = useJob(id);
  const { user } = useAuthStore();

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-4 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-32" />
        <div className="h-48 bg-slate-200 rounded-2xl" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }
  if (!job) return <div className="text-center py-16 text-slate-500">Job not found</div>;

  const salary =
    job.salaryMin && job.salaryMax
      ? `$${(job.salaryMin / 1000).toFixed(0)}k – $${(job.salaryMax / 1000).toFixed(0)}k / yr`
      : job.salaryMin
      ? `From $${(job.salaryMin / 1000).toFixed(0)}k / yr`
      : null;

  const isOwner = user?.role === 'RECRUITER' && job.recruiterId === user.id;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="max-w-4xl pb-20 lg:pb-0">
      <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to jobs
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
            {/* Job info */}
            <div className="flex gap-4 flex-1 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-7 h-7 text-primary-600" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-slate-900 leading-tight">{job.title}</h1>
                <p className="text-slate-500 mt-0.5 font-medium">{job.companyName}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={cn('text-xs px-2.5 py-1 rounded-full border font-medium', LEVEL_COLORS[job.experienceLevel])}>
                    {job.experienceLevel}
                  </span>
                  <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', JOB_STATUS_COLORS[job.status])}>
                    {job.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              {user?.role === 'CANDIDATE' && <CandidateActions job={job} />}

              {isOwner && (
                <Link
                  href={`/jobs/${job.id}/edit`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  <Pencil className="w-4 h-4" /> Edit Job
                </Link>
              )}

              {(isOwner || isAdmin) && (
                <Link
                  href={`/jobs/${job.id}/applicants`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition-colors"
                >
                  <Users className="w-4 h-4" /> View Applicants
                </Link>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-4 mt-5 text-sm text-slate-600 border-t border-slate-50 pt-5">
            {job.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" /> {job.location}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" /> {job.jobType.replace('_', ' ')}
            </span>
            {salary && (
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-slate-400" /> {salary}
              </span>
            )}
            {job.deadline && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" /> Deadline: {new Date(job.deadline).toLocaleDateString()}
              </span>
            )}
          </div>

          {job.tags && (
            <div className="flex flex-wrap gap-2 mt-4">
              {job.tags.split(',').map((tag) => (
                <span key={tag.trim()} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-7">
        <section>
          <h2 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary-500" /> About the Role
          </h2>
          <p className="text-slate-600 whitespace-pre-wrap leading-relaxed text-sm">{job.description}</p>
        </section>

        {job.responsibilities && (
          <section className="border-t border-slate-50 pt-7">
            <h2 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary-500" /> Responsibilities
            </h2>
            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed text-sm">{job.responsibilities}</p>
          </section>
        )}

        {job.requirements && (
          <section className="border-t border-slate-50 pt-7">
            <h2 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary-500" /> Requirements
            </h2>
            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed text-sm">{job.requirements}</p>
          </section>
        )}
      </div>
    </div>
  );
}
