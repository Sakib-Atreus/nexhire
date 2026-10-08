'use client';

import { useId, useState } from 'react';
import { cn } from '@/lib/cn';
import { formatPercent } from './format';

export interface FunnelStage {
  label: string;
  count: number;
}

const fmt = (n: number) => n.toLocaleString('en-US');

/** Share of the previous stage, or null when the previous stage is 0. */
function stepRate(stages: FunnelStage[], i: number): number | null {
  if (i === 0) return null;
  const prev = stages[i - 1].count;
  return prev > 0 ? (stages[i].count / prev) * 100 : null;
}

/**
 * Hiring funnel as horizontal bars (one hue: every stage is the same series).
 * Each bar is direct-labelled with its count; the step conversion sits under the stage name.
 * Bars are scaled to the largest stage so a big view count doesn't hide later stages entirely
 * (non-zero stages always get a visible sliver). A visually hidden table carries the data.
 */
export function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const id = useId();
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...stages.map((s) => s.count));
  const first = stages[0];
  const last = stages[stages.length - 1];
  const overall = first && first.count > 0 ? (last.count / first.count) * 100 : null;
  const summary = `Hiring funnel: ${stages.map((s) => `${s.label} ${fmt(s.count)}`).join(', ')}.`;

  return (
    <figure className="m-0">
      <ol className="space-y-3" aria-hidden onMouseLeave={() => setActive(null)}>
        {stages.map((s, i) => {
          const pct = (s.count / max) * 100;
          const rate = stepRate(stages, i);
          return (
            <li
              key={s.label}
              className={cn(
                'grid grid-cols-[6.5rem_minmax(0,1fr)] sm:grid-cols-[9rem_minmax(0,1fr)] items-center gap-3 rounded-lg px-2 py-1.5 -mx-2 transition-colors',
                active === i && 'bg-slate-50',
              )}
              onMouseEnter={() => setActive(i)}
              title={
                i === 0
                  ? `${s.label}: ${fmt(s.count)}`
                  : `${s.label}: ${fmt(s.count)} (${rate === null ? 'no previous-stage data' : `${formatPercent(rate)} of ${stages[i - 1].label.toLowerCase()}`})`
              }
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{s.label}</p>
                <p className="text-xs text-slate-500 tabular-nums">
                  {i === 0 ? 'Starting point' : rate === null ? '—' : `${formatPercent(rate)} of previous`}
                </p>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative h-6 flex-1 min-w-0">
                  {/* Baseline on the left; bars grow right with a rounded data-end. */}
                  <div className="absolute inset-y-0 left-0 border-l border-slate-300" />
                  <div
                    className={cn('absolute inset-y-0 left-0 rounded-r transition-colors', active === i ? 'bg-primary-700' : 'bg-primary-500')}
                    style={{ width: s.count > 0 ? `max(${pct}%, 3px)` : 0 }}
                  />
                </div>
                <span className="w-12 flex-shrink-0 text-right text-sm font-semibold text-slate-900 tabular-nums">{fmt(s.count)}</span>
              </div>
            </li>
          );
        })}
      </ol>

      {overall !== null && first && last && (
        <figcaption className="mt-4 text-xs text-slate-500">
          {formatPercent(overall)} of {first.label.toLowerCase()} reached {last.label.toLowerCase()}.
        </figcaption>
      )}

      <div className="sr-only">
        <table aria-labelledby={`${id}-caption`}>
          <caption id={`${id}-caption`}>{summary}</caption>
          <thead>
            <tr><th scope="col">Stage</th><th scope="col">Count</th><th scope="col">Conversion from previous stage</th></tr>
          </thead>
          <tbody>
            {stages.map((s, i) => {
              const rate = stepRate(stages, i);
              return (
                <tr key={s.label}>
                  <th scope="row">{s.label}</th>
                  <td>{fmt(s.count)}</td>
                  <td>{i === 0 ? 'Not applicable' : rate === null ? 'Not available' : formatPercent(rate)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
