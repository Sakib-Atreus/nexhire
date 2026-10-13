'use client';

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Fades and slides its content up the first time it scrolls into view.
 *
 * Content is visible by default (server render, no JS, search engines). Only blocks that start below the
 * fold are hidden on mount and revealed when reached, so nothing already on screen flashes. People who
 * prefer reduced motion get no animation at all.
 */
export function Reveal({ children, className, delay = 0, as: Tag = 'div' }: {
  children: ReactNode;
  className?: string;
  /** Milliseconds to wait before animating (use for staggering items in a grid). */
  delay?: number;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<'static' | 'hidden' | 'shown'>('static');

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Already on screen when the page loads: leave it alone.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    setState('hidden');
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState('shown');
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={cn(
        state !== 'static' && 'transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]',
        state === 'hidden' && 'translate-y-6 opacity-0',
        state === 'shown' && 'translate-y-0 opacity-100',
        className
      )}
      style={state === 'shown' && delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}

/** Stagger delay for the i-th item in a grid: quick, and capped so long grids don't drag. */
export const stagger = (i: number, step = 70, max = 420) => Math.min(i * step, max);
