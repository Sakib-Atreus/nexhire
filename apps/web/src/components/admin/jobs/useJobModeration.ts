'use client';

import { useModerateJob } from '@/hooks/useAdmin';
import { JOB_STATUS_LABELS } from '@/lib/constants';
import { getErrorMessage } from '@/lib/format';
import { toast } from '@/store/toastStore';
import type { Job, JobStatus } from '@/types';

export const JOB_STATUSES: JobStatus[] = ['OPEN', 'CLOSED', 'FILLED', 'DRAFT'];

/** Why a job can't be featured right now (mirrors the backend rule), or null when it can. */
export function featureBlockedReason(job: Pick<Job, 'hidden' | 'status' | 'featured'>): string | null {
  if (job.featured) return null; // Unfeaturing is always allowed.
  if (job.hidden) return "Hidden jobs can't be featured. Unhide it first.";
  if (job.status !== 'OPEN') return 'Only open jobs can be featured.';
  return null;
}

/**
 * Feature / hide / status actions with consistent toasts. `onDone` runs after a successful change
 * (use it to close a dialog). The toast text is based on the job the server returns.
 */
export function useJobModeration() {
  const moderate = useModerateJob();
  const pendingId = moderate.isPending ? moderate.variables?.id ?? null : null;

  function setFeatured(job: Job, featured: boolean, onDone?: () => void) {
    moderate.mutate(
      { id: job.id, featured },
      {
        onSuccess: (updated) => {
          if (updated.featured) toast.success('Job featured', `“${job.title}” now appears first in search results.`);
          else toast.success('Removed from featured', `“${job.title}” is listed normally again.`);
          onDone?.();
        },
        onError: (err) => toast.error(featured ? "Couldn't feature job" : "Couldn't unfeature job", getErrorMessage(err)),
      }
    );
  }

  function setHidden(job: Job, hidden: boolean, reason?: string, onDone?: () => void) {
    moderate.mutate(
      { id: job.id, hidden, reason: reason?.trim() || undefined },
      {
        onSuccess: (updated) => {
          if (updated.hidden) {
            const unfeatured = job.featured && !updated.featured ? ' It was also removed from featured.' : '';
            toast.success('Job hidden', `“${job.title}” is no longer visible to candidates.${unfeatured}`);
          } else {
            toast.success('Job visible again', `“${job.title}” can be found by candidates again.`);
          }
          onDone?.();
        },
        onError: (err) => toast.error(hidden ? "Couldn't hide job" : "Couldn't unhide job", getErrorMessage(err)),
      }
    );
  }

  function setStatus(job: Job, status: JobStatus, onDone?: () => void) {
    if (status === job.status) return;
    moderate.mutate(
      { id: job.id, status },
      {
        onSuccess: (updated) => {
          const unfeatured = job.featured && !updated.featured ? ' It was removed from featured.' : '';
          toast.success('Status updated', `“${job.title}” is now ${JOB_STATUS_LABELS[updated.status].toLowerCase()}.${unfeatured}`);
          onDone?.();
        },
        onError: (err) => toast.error("Couldn't change status", getErrorMessage(err)),
      }
    );
  }

  return { setFeatured, setHidden, setStatus, pendingId, isPending: moderate.isPending };
}
