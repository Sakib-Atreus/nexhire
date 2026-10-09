'use client';

import { useId, useMemo, useState, type KeyboardEvent } from 'react';
import type { DailyCount } from '@/types';
import { cn } from '@/lib/cn';

const fmt = (n: number) => n.toLocaleString('en-US');

/** Dates arrive as YYYY-MM-DD in UTC; format them in UTC so the label never shifts a day. */
function dayLabel(date: string, withWeekday = false): string {
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', timeZone: 'UTC', ...(withWeekday ? { weekday: 'short' } : {}),
  });
}

/** Rounds the axis max up to 1, 2 or 5 × 10^n so the top gridline reads cleanly. */
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((m) => m * pow >= value) ?? 10;
  return step * pow;
}

/**
 * Single-series daily column chart (HTML/CSS, no chart library).
 * Hover or focus + arrow keys reveal a per-day tooltip; a visually hidden table carries the data for screen readers.
 */
export function DailyColumnChart({ data, unit, emptyMessage }: {
  data: DailyCount[];
  /** Singular/plural noun for tooltips and the hidden table, e.g. ['sign-up', 'sign-ups']. */
  unit: [string, string];
  emptyMessage: string;
}) {
  const id = useId();
  const [active, setActive] = useState<number | null>(null);
  const max = useMemo(() => Math.max(0, ...data.map((d) => d.count)), [data]);
  const yMax = niceMax(max);
  const total = data.reduce((s, d) => s + d.count, 0);
  const n = data.length;

  if (n === 0) return <p className="text-sm text-fg-muted">No data for this period.</p>;

  const ticks = Array.from(new Set([0, Math.round((n - 1) / 3), Math.round((2 * (n - 1)) / 3), n - 1]));
  const noun = (c: number) => (c === 1 ? unit[0] : unit[1]);
  const peak = data.reduce((best, d) => (d.count > best.count ? d : best), data[0]);
  const summary = total === 0
    ? `${emptyMessage} (${dayLabel(data[0].date)} to ${dayLabel(data[n - 1].date)}).`
    : `${fmt(total)} ${noun(total)} from ${dayLabel(data[0].date)} to ${dayLabel(data[n - 1].date)}. Busiest day: ${dayLabel(peak.date)} with ${fmt(peak.count)}.`;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const cur = active ?? n - 1;
    let next: number | null = null;
    if (e.key === 'ArrowLeft') next = Math.max(0, cur - 1);
    else if (e.key === 'ArrowRight') next = Math.min(n - 1, cur + 1);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    else if (e.key === 'Escape') { setActive(null); return; }
    if (next !== null) { e.preventDefault(); setActive(next); }
  };

  const point = active !== null ? data[active] : null;
  // Keep the tooltip inside the plot near the edges.
  const tipAlign = active === null ? '' : active < 4 ? 'translate-x-0' : active > n - 5 ? '-translate-x-full' : '-translate-x-1/2';
  const tipLeft = active === null ? 0 : active < 4 ? (active / n) * 100 : active > n - 5 ? ((active + 1) / n) * 100 : ((active + 0.5) / n) * 100;

  return (
    <figure className="m-0">
      <div className="flex gap-2">
        {/* Y axis labels */}
        <div className="flex flex-col justify-between h-40 text-[11px] leading-none text-fg-subtle tabular-nums text-right w-7 flex-shrink-0" aria-hidden>
          <span>{fmt(yMax)}</span>
          <span>0</span>
        </div>

        <div className="min-w-0 flex-1">
          <div
            role="group"
            tabIndex={0}
            aria-label={`${summary} Use the left and right arrow keys to read individual days.`}
            onKeyDown={onKeyDown}
            onFocus={() => setActive((a) => a ?? n - 1)}
            onBlur={() => setActive(null)}
            onMouseLeave={() => setActive(null)}
            className="relative h-40 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            {/* Recessive gridlines: top (y max) and baseline */}
            <div className="absolute inset-x-0 top-0 border-t border-dashed border-line" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 border-t border-line-strong" aria-hidden />

            <div className="absolute inset-0 flex items-end gap-[2px]" aria-hidden>
              {data.map((d, i) => {
                const pct = (d.count / yMax) * 100;
                return (
                  <div
                    key={d.date}
                    className="relative flex-1 h-full flex items-end"
                    onMouseEnter={() => setActive(i)}
                    title={`${dayLabel(d.date)}: ${fmt(d.count)} ${noun(d.count)}`}
                  >
                    {active === i && <div className="absolute inset-0 bg-subtle/80 rounded-t" />}
                    <div
                      className={cn(
                        'relative w-full rounded-t transition-colors',
                        d.count > 0 ? (active === i ? 'bg-primary-700' : 'bg-primary-500') : '',
                      )}
                      style={{ height: d.count > 0 ? `max(${pct}%, 3px)` : 0 }}
                    />
                  </div>
                );
              })}
            </div>

            {total === 0 && (
              <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
                <p className="text-sm text-fg-muted bg-surface/90 px-3 py-1 rounded-md">{emptyMessage}</p>
              </div>
            )}

            {point && (
              <div
                className={cn('pointer-events-none absolute -top-2 z-10 -translate-y-full', tipAlign)}
                style={{ left: `${tipLeft}%` }}
                aria-hidden
              >
                <div className="whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg">
                  <span className="block text-slate-300">{dayLabel(point.date, true)}</span>
                  <span className="font-semibold tabular-nums">{fmt(point.count)}</span> {noun(point.count)}
                </div>
              </div>
            )}
          </div>

          {/* X axis ticks */}
          <div className="relative h-5 mt-1.5 text-[11px] text-fg-subtle" aria-hidden>
            {ticks.map((i) => (
              <span
                key={i}
                className={cn(
                  'absolute top-0 whitespace-nowrap',
                  i === 0 ? 'left-0' : i === n - 1 ? 'right-0' : '-translate-x-1/2',
                )}
                style={i === 0 || i === n - 1 ? undefined : { left: `${((i + 0.5) / n) * 100}%` }}
              >
                {dayLabel(data[i].date)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Announce the focused day to screen readers */}
      <p className="sr-only" aria-live="polite">
        {point ? `${dayLabel(point.date, true)}: ${fmt(point.count)} ${noun(point.count)}` : ''}
      </p>

      {/* sr-only on a wrapper: browsers ignore the 1px width on <table> itself, which caused horizontal overflow. */}
      <div className="sr-only">
      <table aria-labelledby={`${id}-caption`}>
        <caption id={`${id}-caption`}>{summary}</caption>
        <thead>
          <tr><th scope="col">Date</th><th scope="col">{unit[1]}</th></tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}><th scope="row">{dayLabel(d.date)}</th><td>{fmt(d.count)}</td></tr>
          ))}
        </tbody>
      </table>
      </div>
    </figure>
  );
}
