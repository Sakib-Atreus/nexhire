'use client';

import Link from 'next/link';
import { Eye, Lock, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import type { Job } from '@/types';
import { useUpdateJob } from '@/hooks/useJobs';
import { getErrorMessage } from '@/lib/format';
import { toast } from '@/store/toastStore';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/States';
import { cn } from '@/lib/cn';

const iconBtn =
  'inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors ' +
  'hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50';

/** Per-row actions for a recruiter's job (useUpdateJob is bound to a single job id). */
export function JobRowActions({ job, onDelete }: { job: Job; onDelete: (job: Job) => void }) {
  const update = useUpdateJob(job.id);

  const canClose = job.status === 'OPEN';
  const canReopen = job.status === 'CLOSED' || job.status === 'DRAFT';

  function setStatus(status: 'OPEN' | 'CLOSED') {
    update.mutate(
      { status },
      {
        onSuccess: () =>
          toast.success(status === 'OPEN' ? 'Job reopened' : 'Job closed', status === 'OPEN'
            ? `“${job.title}” is accepting applications again.`
            : `“${job.title}” no longer accepts applications.`),
        onError: (err) => toast.error('Could not update job status', getErrorMessage(err)),
      }
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {(canClose || canReopen) && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setStatus(canClose ? 'CLOSED' : 'OPEN')}
          disabled={update.isPending}
          aria-label={canClose ? `Close ${job.title}` : `${job.status === 'DRAFT' ? 'Publish' : 'Reopen'} ${job.title}`}
        >
          {update.isPending ? (
            <Spinner className="w-3.5 h-3.5 text-slate-500" />
          ) : canClose ? (
            <Lock className="w-3.5 h-3.5" aria-hidden />
          ) : (
            <RotateCcw className="w-3.5 h-3.5" aria-hidden />
          )}
          <span className="hidden sm:inline">{canClose ? 'Close' : job.status === 'DRAFT' ? 'Publish' : 'Reopen'}</span>
        </Button>
      )}
      <Link href={`/jobs/${job.id}`} className={iconBtn} aria-label={`View ${job.title}`} title="View job">
        <Eye className="w-4 h-4" aria-hidden />
      </Link>
      <Link href={`/jobs/${job.id}/edit`} className={iconBtn} aria-label={`Edit ${job.title}`} title="Edit job">
        <Pencil className="w-4 h-4" aria-hidden />
      </Link>
      <button
        type="button"
        onClick={() => onDelete(job)}
        className={cn(iconBtn, 'hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200')}
        aria-label={`Delete ${job.title}`}
        title="Delete job"
      >
        <Trash2 className="w-4 h-4" aria-hidden />
      </button>
    </div>
  );
}
