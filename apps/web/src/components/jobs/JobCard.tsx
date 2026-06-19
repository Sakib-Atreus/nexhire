import Link from 'next/link';
import { MapPin, Clock, DollarSign, Bookmark, BookmarkCheck } from 'lucide-react';
import type { Job } from '@/types';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/store/authStore';
import { useSaveJob, useUnsaveJob } from '@/hooks/useJobs';

interface JobCardProps {
  job: Job;
}

const JOB_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  REMOTE: 'Remote',
};

const LEVEL_COLORS: Record<string, string> = {
  ENTRY: 'bg-green-50 text-green-700',
  MID: 'bg-blue-50 text-blue-700',
  SENIOR: 'bg-purple-50 text-purple-700',
  LEAD: 'bg-orange-50 text-orange-700',
  EXECUTIVE: 'bg-red-50 text-red-700',
};

export function JobCard({ job }: JobCardProps) {
  const { user } = useAuthStore();
  const { mutate: saveJob, isPending: isSaving } = useSaveJob();
  const { mutate: unsaveJob, isPending: isUnsaving } = useUnsaveJob();

  const isCandidate = user?.role === 'CANDIDATE';
  const isPending = isSaving || isUnsaving;

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPending) return;
    if (job.isSaved) {
      unsaveJob(job.id);
    } else {
      saveJob(job.id);
    }
  };

  const salary =
    job.salaryMin && job.salaryMax
      ? `$${(job.salaryMin / 1000).toFixed(0)}k–$${(job.salaryMax / 1000).toFixed(0)}k`
      : job.salaryMin
      ? `$${(job.salaryMin / 1000).toFixed(0)}k+`
      : null;

  return (
    <Link href={`/jobs/${job.id}`}>
      <div className="relative bg-white rounded-xl border border-slate-200 p-6 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer">
        {isCandidate && (
          <button
            onClick={handleBookmark}
            disabled={isPending}
            aria-label={job.isSaved ? 'Unsave job' : 'Save job'}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50"
          >
            {job.isSaved
              ? <BookmarkCheck className="w-5 h-5 text-primary-600" />
              : <Bookmark className="w-5 h-5" />
            }
          </button>
        )}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-slate-900 text-lg">{job.title}</h3>
            <p className="text-slate-500 text-sm mt-0.5">{job.companyName}</p>
          </div>
          <span className={cn('text-xs px-2 py-1 rounded-full font-medium', isCandidate ? 'mr-8' : '', LEVEL_COLORS[job.experienceLevel])}>
            {job.experienceLevel}
          </span>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-slate-500 mt-3">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {job.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {JOB_TYPE_LABELS[job.jobType]}
          </span>
          {salary && (
            <span className="flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" /> {salary}
            </span>
          )}
        </div>

        {job.tags && (
          <div className="flex flex-wrap gap-2 mt-3">
            {job.tags.split(',').slice(0, 4).map((tag) => (
              <span key={tag.trim()} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                {tag.trim()}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
