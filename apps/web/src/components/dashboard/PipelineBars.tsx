import type { ApplicationStats, ApplicationStatus } from '@/types';
import { APPLICATION_STATUS_BAR, APPLICATION_STATUS_LABELS, APPLICATION_STATUS_ORDER } from '@/lib/constants';

export type StatusCounts = Record<ApplicationStatus, number>;

export function statsToCounts(stats: ApplicationStats): StatusCounts {
  return {
    PENDING: stats.pending,
    REVIEWING: stats.reviewing,
    SHORTLISTED: stats.shortlisted,
    INTERVIEWED: stats.interviewed,
    OFFERED: stats.offered,
    HIRED: stats.hired ?? 0,
    REJECTED: stats.rejected,
    WITHDRAWN: stats.withdrawn,
  };
}

/** Horizontal bars, one per application status, scaled against the total. */
export function PipelineBars({ counts, hideEmpty = false }: { counts: StatusCounts; hideEmpty?: boolean }) {
  const total = APPLICATION_STATUS_ORDER.reduce((s, k) => s + (counts[k] ?? 0), 0);
  const rows = APPLICATION_STATUS_ORDER.filter((s) => !hideEmpty || counts[s] > 0);
  return (
    <ul className="space-y-3.5">
      {rows.map((status) => {
        const value = counts[status] ?? 0;
        const pct = total > 0 ? Math.round((value / total) * 100) : 0;
        return (
          <li key={status}>
            <div className="flex items-center justify-between gap-3 text-sm mb-1.5">
              <span className="text-fg-tertiary truncate">{APPLICATION_STATUS_LABELS[status]}</span>
              <span className="flex-shrink-0 tabular-nums">
                <span className="font-semibold text-fg">{value.toLocaleString('en-US')}</span>
                <span className="text-xs text-fg-subtle ml-1.5">{pct}%</span>
              </span>
            </div>
            <div
              className="h-2 bg-subtle rounded-full overflow-hidden"
              role="img"
              aria-label={`${APPLICATION_STATUS_LABELS[status]}: ${value} (${pct}%)`}
            >
              <div className={`h-full rounded-full ${APPLICATION_STATUS_BAR[status]}`} style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
