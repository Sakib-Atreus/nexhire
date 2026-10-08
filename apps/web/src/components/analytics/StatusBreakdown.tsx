'use client';

import { useId } from 'react';
import type { ApplicationStatus } from '@/types';
import { APPLICATION_STATUS_BAR, APPLICATION_STATUS_LABELS, APPLICATION_STATUS_ORDER } from '@/lib/constants';
import { formatPercent } from './format';

const fmt = (n: number) => n.toLocaleString('en-US');

/**
 * Where every application currently sits, one labelled row per status (including Not selected
 * and Withdrawn). Bars show the share of all applications; the label, count and percentage are
 * always visible text, so the status color is never the only cue.
 */
export function StatusBreakdown({ byStatus }: { byStatus: Partial<Record<ApplicationStatus, number>> }) {
  const id = useId();
  const rows = APPLICATION_STATUS_ORDER.map((status) => ({ status, count: byStatus[status] ?? 0 }));
  const total = rows.reduce((s, r) => s + r.count, 0);

  return (
    <figure className="m-0">
      {total === 0 && <p className="mb-3 text-sm text-fg-muted">No applications yet. Statuses will appear here as candidates apply.</p>}
      <ul className="space-y-3" aria-hidden>
        {rows.map(({ status, count }) => {
          const share = total > 0 ? (count / total) * 100 : 0;
          return (
            <li key={status} title={`${APPLICATION_STATUS_LABELS[status]}: ${fmt(count)} (${formatPercent(share)})`}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 min-w-0">
                  <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-sm ${APPLICATION_STATUS_BAR[status]}`} />
                  <span className="truncate text-fg-secondary">{APPLICATION_STATUS_LABELS[status]}</span>
                </span>
                <span className="flex-shrink-0 tabular-nums">
                  <span className="font-semibold text-fg">{fmt(count)}</span>
                  <span className="ml-1.5 text-xs text-fg-muted">{total > 0 ? formatPercent(share) : '—'}</span>
                </span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-subtle">
                <div
                  className={`h-full rounded-full ${APPLICATION_STATUS_BAR[status]}`}
                  style={{ width: count > 0 ? `max(${share}%, 4px)` : 0 }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <div className="sr-only">
        <table aria-labelledby={`${id}-caption`}>
          <caption id={`${id}-caption`}>Applications by current status, {fmt(total)} in total.</caption>
          <thead>
            <tr><th scope="col">Status</th><th scope="col">Applications</th><th scope="col">Share</th></tr>
          </thead>
          <tbody>
            {rows.map(({ status, count }) => (
              <tr key={status}>
                <th scope="row">{APPLICATION_STATUS_LABELS[status]}</th>
                <td>{fmt(count)}</td>
                <td>{total > 0 ? formatPercent((count / total) * 100) : 'Not available'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
