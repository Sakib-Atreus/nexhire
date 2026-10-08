import { Check } from 'lucide-react';
import type { ApplicationStatus } from '@/types';
import { APPLICATION_STATUS_LABELS, PIPELINE_STAGES } from '@/lib/constants';
import { cn } from '@/lib/cn';

/** The forward hiring pipeline, Applied → Hired. Rejected / withdrawn are terminal states shown separately. */
const STAGES: ApplicationStatus[] = PIPELINE_STAGES.map((s) => s.status);
const SHORT_LABELS = Object.fromEntries(PIPELINE_STAGES.map((s) => [s.status, s.label])) as Partial<Record<ApplicationStatus, string>>;

/** Compact stepper: Applied → Review → Shortlist → Interview → Offer → Hired. */
export function ApplicationProgress({ status, className }: { status: ApplicationStatus; className?: string }) {
  const current = STAGES.indexOf(status);
  if (current === -1) return null;
  const hired = status === 'HIRED';

  return (
    <div className={className}>
      <p className="sr-only">
        Stage {current + 1} of {STAGES.length}: {APPLICATION_STATUS_LABELS[status]}
      </p>
      <ol className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${STAGES.length}, minmax(0, 1fr))` }} aria-hidden>
        {STAGES.map((stage, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={stage} className="min-w-0">
              <div
                className={cn(
                  'h-1.5 rounded-full',
                  hired && (done || active)
                    ? 'bg-emerald-500'
                    : done
                      ? 'bg-primary-500'
                      : active
                        ? stage === 'OFFERED' ? 'bg-teal-500' : 'bg-primary-500'
                        : 'bg-emphasis'
                )}
              />
              <p
                className={cn(
                  'mt-1.5 hidden sm:flex items-center gap-1 text-[11px] font-medium truncate',
                  active ? 'text-fg' : done ? 'text-fg-muted' : 'text-fg-subtle'
                )}
              >
                {(done || (active && hired)) && (
                  <Check className={cn('w-3 h-3 flex-shrink-0', hired ? 'text-emerald-600' : 'text-primary-500')} />
                )}
                <span className="truncate">{SHORT_LABELS[stage]}</span>
              </p>
            </li>
          );
        })}
      </ol>
      <p className="mt-1.5 text-xs text-fg-muted sm:hidden">
        Step {current + 1} of {STAGES.length} · <span className="font-medium text-fg-secondary">{APPLICATION_STATUS_LABELS[status]}</span>
      </p>
    </div>
  );
}
