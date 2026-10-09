'use client';

import { useEffect, useRef } from 'react';

/**
 * Dark-mode-only decoration for the home page hero: slowly drifting colour glows and a soft spotlight
 * that follows the pointer. Light mode is unchanged (everything here is `hidden dark:block`).
 * Motion is skipped for people who prefer reduced motion.
 */
export function HeroGlow() {
  const spotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const spot = spotRef.current;
    const hero = spot?.parentElement;
    if (!spot || !hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = hero.getBoundingClientRect();
        spot.style.setProperty('--x', `${e.clientX - r.left}px`);
        spot.style.setProperty('--y', `${e.clientY - r.top}px`);
        spot.style.opacity = '1';
      });
    };
    const onLeave = () => {
      spot.style.opacity = '0';
    };
    hero.addEventListener('pointermove', onMove);
    hero.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      hero.removeEventListener('pointermove', onMove);
      hero.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <>
      <div className="pointer-events-none absolute inset-0 hidden dark:block" aria-hidden>
        <div className="absolute -right-24 -top-40 h-[34rem] w-[34rem] rounded-full bg-violet-500/30 blur-3xl motion-safe:animate-drift" />
        <div className="absolute -bottom-48 left-[-8rem] h-[30rem] w-[30rem] rounded-full bg-sky-500/20 blur-3xl motion-safe:animate-drift-slow" />
        <div className="absolute right-[22%] top-1/2 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl motion-safe:animate-drift-slow" />
        {/* Glowing bottom edge, so the hero doesn't melt into the dark page below. */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#818cf8]/70 to-transparent" />
      </div>
      <div
        ref={spotRef}
        className="pointer-events-none absolute inset-0 hidden opacity-0 transition-opacity duration-500 dark:block"
        style={{ background: 'radial-gradient(520px circle at var(--x, 50%) var(--y, 50%), rgba(129, 140, 248, 0.16), transparent 65%)' }}
        aria-hidden
      />
    </>
  );
}
