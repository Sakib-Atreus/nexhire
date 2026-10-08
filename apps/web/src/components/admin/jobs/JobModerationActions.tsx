'use client';

import { useCallback, useId, useState } from 'react';
import { Eye, EyeOff, Star, Trash2 } from 'lucide-react';
import { useAdminDeleteJob } from '@/hooks/useAdmin';
import { cn } from '@/lib/cn';
import { JOB_STATUS_LABELS } from '@/lib/constants';
import { getErrorMessage, pluralize } from '@/lib/format';
import { toast } from '@/store/toastStore';
import type { Job, JobStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { ConfirmDialog } from '@/components/ui/Modal';
import { HideJobDialog } from './HideJobDialog';
import { JOB_STATUSES, featureBlockedReason, useJobModeration } from './useJobModeration';

/**
 * Admin moderation controls for one job.
 * - `compact`: icon buttons for dense table rows (labels via aria-label + tooltip).
 * - `withStatus` / `withDelete`: include the status select and delete action (admin jobs table only).
 */
export function JobModerationActions({ job, compact, withStatus, withDelete, className, onDeleted }: {
  job: Job;
  compact?: boolean;
  withStatus?: boolean;
  withDelete?: boolean;
  className?: string;
  onDeleted?: () => void;
}) {
  const reasonId = useId();
  const { setFeatured, setHidden, setStatus, pendingId } = useJobModeration();
  const deleteJob = useAdminDeleteJob();
  const [hideOpen, setHideOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const busy = pendingId === job.id || (deleteJob.isPending && deleteJob.variables === job.id);
  const blocked = featureBlockedReason(job);
  const closeHide = useCallback(() => setHideOpen(false), []);
  const closeDelete = useCallback(() => { if (!deleteJob.isPending) setDeleteOpen(false); }, [deleteJob.isPending]);

  const featureLabel = job.featured ? 'Unfeature' : 'Feature';
  const hideLabel = job.hidden ? 'Unhide' : 'Hide';

  function confirmDelete() {
    deleteJob.mutate(job.id, {
      onSuccess: () => {
        toast.success('Job deleted', `“${job.title}” was permanently removed.`);
        setDeleteOpen(false);
        onDeleted?.();
      },
      onError: (err) => toast.error("Couldn't delete job", getErrorMessage(err)),
    });
  }

  const featureButton = (
    <Button
      variant="secondary"
      size="sm"
      disabled={busy || !!blocked}
      onClick={() => setFeatured(job, !job.featured)}
      aria-pressed={!!job.featured}
      aria-label={compact ? `${featureLabel} ${job.title}` : undefined}
      aria-describedby={blocked ? reasonId : undefined}
      title={compact && !blocked ? featureLabel : undefined}
      className={cn(compact && 'w-8 px-0')}
    >
      <Star className={cn('w-3.5 h-3.5', job.featured && 'fill-amber-400 text-amber-500')} aria-hidden />
      {!compact && featureLabel}
    </Button>
  );

  return (
    <>
      <div className={cn('flex flex-wrap items-center gap-2', className)}>
        {withStatus && (
          <Select
            value={job.status}
            disabled={busy}
            onChange={(e) => setStatus(job, e.target.value as JobStatus)}
            aria-label={`Status for ${job.title}`}
            className="h-8 w-auto min-w-[6.5rem] text-xs"
          >
            {JOB_STATUSES.map((s) => <option key={s} value={s}>{JOB_STATUS_LABELS[s]}</option>)}
          </Select>
        )}

        {/* Disabled buttons don't reliably show tooltips, so the reason sits on a wrapper too. */}
        {blocked ? <span title={blocked} className="inline-flex">{featureButton}</span> : featureButton}
        {blocked && <span id={reasonId} className="sr-only">{blocked}</span>}

        <Button
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() => (job.hidden ? setHidden(job, false) : setHideOpen(true))}
          aria-pressed={!!job.hidden}
          aria-label={compact ? `${hideLabel} ${job.title}` : undefined}
          title={compact ? hideLabel : undefined}
          className={cn(compact && 'w-8 px-0')}
        >
          {job.hidden ? <Eye className="w-3.5 h-3.5" aria-hidden /> : <EyeOff className="w-3.5 h-3.5" aria-hidden />}
          {!compact && hideLabel}
        </Button>

        {withDelete && (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => setDeleteOpen(true)}
            aria-label={compact ? `Delete ${job.title}` : undefined}
            title={compact ? 'Delete' : undefined}
            className={cn('text-rose-600 hover:bg-rose-50 hover:text-rose-700', compact && 'w-8 px-0')}
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden />
            {!compact && 'Delete'}
          </Button>
        )}
      </div>

      {!compact && blocked && <p className="mt-1.5 text-xs text-slate-500" aria-hidden>{blocked}</p>}

      <HideJobDialog
        open={hideOpen}
        jobTitle={job.title}
        featured={job.featured}
        loading={pendingId === job.id}
        onClose={closeHide}
        onConfirm={(reason) => setHidden(job, true, reason, closeHide)}
      />

      {withDelete && (
        <ConfirmDialog
          open={deleteOpen}
          onClose={closeDelete}
          onConfirm={confirmDelete}
          title="Delete this job permanently?"
          description={`“${job.title}” at ${job.companyName} will be deleted${
            job.applicationCount ? ` along with ${pluralize(job.applicationCount, 'application')}` : ''
          }. This can't be undone. To take it down temporarily, hide it instead.`}
          confirmLabel="Delete job"
          loading={deleteJob.isPending}
        />
      )}
    </>
  );
}
