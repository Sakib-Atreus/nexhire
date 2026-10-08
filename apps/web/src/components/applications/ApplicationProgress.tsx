import { Check } from 'lucide-react';
import type { ApplicationStatus } from '@/types';
import { APPLICATION_STATUS_LABELS } from '@/lib/constants';
import { cn } from '@/lib/cn';

/** The forward hiring pipeline. Rejected / withdrawn are terminal states shown separately. */
export const PIPELINE_STAGES: ApplicationStatus[] = ['PENDING', 'REVIEWING', 'SHORTLISTED', 'INTERVIEWED', 'OFFERED'];

const SHORT_LABELS: Partial<Record<ApplicationStatus, string>> = {
  PENDING: 'Applied',
  REVIEWING: 'Review',
  SHORTLISTED: 'Shortlisted',
  INTERVIEWED: 'Interview',
  OFFERED: 'Offer',
};

/** Compact stepper: Applied → Under review → Shortlisted → Interviewed → Offer. */
export function ApplicationProgress({ status, className }: { status: ApplicationStatus; className?: string }) {
  const current = PIPELINE_STAGES.indexOf(status);
  if (current === -1) return null;

  return (
    <div className={className}>
      <p className="sr-only">
        Stage {current + 1} of {PIPELINE_STAGES.length}: {APPLICATION_STATUS_LABELS[status]}
      </p>
      <ol className="grid grid-cols-5 gap-1.5" aria-hidden>
        {PIPELINE_STAGES.map((stage, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={stage} className="min-w-0">
              <div
                className={cn(
                  'h-1.5 rounded-full',
                  done ? 'bg-primary-500' : active ? (stage === 'OFFERED' ? 'bg-emerald-500' : 'bg-primary-500') : 'bg-slate-200'
                )}
              />
              <p
                className={cn(
                  'mt-1.5 hidden sm:flex items-center gap-1 text-[11px] font-medium truncate',
                  active ? 'text-slate-900' : done ? 'text-slate-500' : 'text-slate-400'
                )}
              >
                {done && <Check className="w-3 h-3 flex-shrink-0 text-primary-500" />}
                <span className="truncate">{SHORT_LABELS[stage]}</span>
              </p>
            </li>
          );
        })}
      </ol>
      <p className="mt-1.5 text-xs text-slate-500 sm:hidden">
        Step {current + 1} of {PIPELINE_STAGES.length} · <span className="font-medium text-slate-700">{APPLICATION_STATUS_LABELS[status]}</span>
      </p>
    </div>
  );
}
