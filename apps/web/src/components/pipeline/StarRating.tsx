'use client';

import { useEffect, useRef, useState } from 'react';
import { Star } from 'lucide-react';
import { useRateApplication } from '@/hooks/useHiring';
import { getErrorMessage } from '@/lib/format';
import { toast } from '@/store/toastStore';
import { cn } from '@/lib/cn';

/** Small read-only stars. Renders nothing when unrated unless `showEmpty`. */
export function StarDisplay({ rating, showEmpty = false, className }: { rating?: number | null; showEmpty?: boolean; className?: string }) {
  if (!rating && !showEmpty) return null;
  const value = rating ?? 0;
  return (
    <span className={cn('inline-flex items-center gap-px', className)} role="img" aria-label={value ? `Rated ${value} out of 5` : 'Not rated'}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn('w-3 h-3', n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300')}
          aria-hidden
        />
      ))}
    </span>
  );
}

/** 1–5 star rating control (radio group). Clicking the current value clears it. */
export function StarRatingInput({ applicationId, rating, candidateName }: { applicationId: string; rating?: number | null; candidateName: string }) {
  const rate = useRateApplication();
  const [value, setValue] = useState<number | null>(rating ?? null);
  const [hover, setHover] = useState<number | null>(null);
  const groupRef = useRef<HTMLDivElement>(null);

  useEffect(() => setValue(rating ?? null), [rating, applicationId]);

  function commit(next: number | null) {
    const prev = value;
    setValue(next);
    rate.mutate(
      { id: applicationId, rating: next },
      {
        onError: (err) => {
          setValue(prev);
          toast.error('Could not save rating', getErrorMessage(err));
        },
      }
    );
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const current = value ?? 0;
    let next: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = Math.min(5, current + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = Math.max(1, current - 1);
    else if (e.key === 'Home') next = 1;
    else if (e.key === 'End') next = 5;
    else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      if (value !== null) commit(null);
      return;
    }
    if (next === null) return;
    e.preventDefault();
    if (next !== value) commit(next);
    groupRef.current?.querySelector<HTMLButtonElement>(`[data-star="${next}"]`)?.focus();
  }

  const shown = hover ?? value ?? 0;
  const focusTarget = value ?? 1;

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={`Rating for ${candidateName}`}
      className="inline-flex items-center"
      onKeyDown={onKeyDown}
      onMouseLeave={() => setHover(null)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          data-star={n}
          aria-checked={value === n}
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
          title={value === n ? 'Click again to clear' : `${n} star${n === 1 ? '' : 's'}`}
          tabIndex={n === focusTarget ? 0 : -1}
          onMouseEnter={() => setHover(n)}
          onClick={() => commit(value === n ? null : n)}
          className="p-0.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <Star className={cn('w-5 h-5 transition-colors', n <= shown ? 'fill-amber-400 text-amber-400' : 'text-slate-300')} aria-hidden />
        </button>
      ))}
      <span className="ml-2 text-xs text-slate-500 tabular-nums" aria-live="polite">
        {value ? `${value}/5` : 'Not rated'}
      </span>
    </div>
  );
}
