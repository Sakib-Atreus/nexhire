'use client';

import { useEffect, useState } from 'react';
import { Bookmark, CheckCircle2, MapPin, Sparkles, Video } from 'lucide-react';
import { cn } from '@/lib/cn';

/*
 * Decorative product preview for the home page hero (desktop only). Three frosted cards in a layered
 * composition: a matched job (score ring fills), a live pipeline (a candidate moves forward every few
 * seconds) and an upcoming video interview (countdown). Colours are fixed (not theme tints) because the
 * hero gradient is dark in both themes. Motion stops for people who prefer reduced motion.
 */

const GLASS =
  'rounded-2xl border border-white/15 bg-white/[0.09] text-white shadow-[0_20px_50px_-20px_rgba(15,10,60,0.6)] backdrop-blur-xl';

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/** Circular match score that fills from 0 once the card has entered. */
function MatchRing({ value }: { value: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setShown(value), 500);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div className="relative h-14 w-14 flex-shrink-0">
      <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
        <circle
          cx="28" cy="28" r={r} fill="none" stroke="#6ee7b7" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - shown / 100)}
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-[13px] font-bold tabular-nums">{shown}%</span>
        <span className="mt-0.5 text-[8px] uppercase tracking-wider text-white/60">match</span>
      </span>
    </div>
  );
}

const STAGES = [
  { label: 'Applied', dot: 'bg-slate-300' },
  { label: 'Review', dot: 'bg-sky-300' },
  { label: 'Interview', dot: 'bg-amber-300' },
] as const;
const PEOPLE = [
  { initials: 'AR', tone: 'bg-indigo-300 text-indigo-950' },
  { initials: 'TH', tone: 'bg-sky-300 text-sky-950' },
  { initials: 'MC', tone: 'bg-fuchsia-300 text-fuchsia-950' },
  { initials: 'DO', tone: 'bg-amber-300 text-amber-950' },
  { initials: 'NI', tone: 'bg-emerald-300 text-emerald-950' },
];

/** Order in which candidates move forward (person index); after the last move the board resets. */
const MOVES = [0, 1, 0, 2, 3, 1, 2];
const START = [0, 0, 0, 1, 2];

/** Mini pipeline: every few seconds the next candidate moves one stage to the right. */
function LivePipeline({ animate }: { animate: boolean }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!animate) return;
    const t = setInterval(() => setStep((k) => (k + 1) % (MOVES.length + 1)), 2600);
    return () => clearInterval(t);
  }, [animate]);
  const stages = [...START];
  for (const who of MOVES.slice(0, step)) stages[who] = Math.min(2, stages[who] + 1);
  const moved = step > 0 ? MOVES[step - 1] : null;

  return (
    <div className="grid grid-cols-3 gap-2">
      {STAGES.map((stage, s) => {
        const here = PEOPLE.map((p, idx) => ({ ...p, idx })).filter((p) => stages[p.idx] === s);
        return (
          <div key={stage.label} className="rounded-xl bg-white/[0.06] p-2">
            <p className="flex items-center gap-1.5 text-[10px] font-medium text-white/70">
              <span className={cn('h-1.5 w-1.5 rounded-full', stage.dot)} /> {stage.label}
              <span className="ml-auto tabular-nums text-white/90">{here.length}</span>
            </p>
            {/* Room for two rows (up to 6 people per stage), so the card height never changes. */}
            <div className="mt-2 flex h-[2.625rem] flex-wrap content-start gap-0.5">
              {here.map((p) => (
                <span
                  key={`${p.initials}-${stages[p.idx]}`}
                  className={cn(
                    'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[8px] font-bold',
                    p.tone,
                    moved === p.idx && 'motion-safe:animate-pop'
                  )}
                >
                  {p.initials}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** "Starts in 4:59" style countdown that loops, so the card always looks live. */
function useCountdown(seconds: number, animate: boolean) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (!animate) return;
    const t = setInterval(() => setLeft((v) => (v <= 0 ? seconds : v - 1)), 1000);
    return () => clearInterval(t);
  }, [seconds, animate]);
  return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
}

export function HeroPreview() {
  const reduced = useReducedMotion();
  const countdown = useCountdown(299, !reduced);

  return (
    <div className="hidden w-[27rem] select-none lg:block" aria-hidden>
      {/* One column with fixed gaps, so cards never touch; the whole stack floats as one. */}
      <div className="flex flex-col gap-5 motion-safe:animate-float">
      {/* 1 · Matched job (front, top-left) */}
      <div className="w-[19.5rem] self-start motion-safe:animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className={cn(GLASS, 'p-4')}>
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-400/20 text-sm font-bold text-emerald-200 ring-1 ring-emerald-300/30">
              AL
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-snug">Senior Backend Engineer</p>
              <p className="mt-0.5 text-[13px] text-white/70">Acme Labs</p>
              <p className="mt-1.5 flex items-center gap-1 text-[11px] text-white/60">
                <MapPin className="h-3 w-3" /> Dhaka · Hybrid
              </p>
            </div>
            <MatchRing value={92} />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {['Java', 'Spring Boot', 'PostgreSQL'].map((t) => (
              <span key={t} className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] text-white/85">{t}</span>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
            <span className="text-sm font-semibold">৳2.4M – ৳3.6M</span>
            <span className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10"><Bookmark className="h-3.5 w-3.5" /></span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#4338ca]">
                <Sparkles className="h-3 w-3" /> Apply
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* 2 · Live pipeline (right, middle) */}
      <div className="w-[18.5rem] self-end motion-safe:animate-fade-up" style={{ animationDelay: '0.3s' }}>
        <div className={cn(GLASS, 'p-4')}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Hiring pipeline</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75 motion-safe:animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
              </span>
              Live
            </span>
          </div>
          <LivePipeline animate={!reduced} />
        </div>
      </div>

      {/* 3 · Upcoming interview (front, bottom-left) */}
      <div className="ml-6 w-[19rem] motion-safe:animate-fade-up" style={{ animationDelay: '0.5s' }}>
        <div className={cn(GLASS, 'p-4')}>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-300 text-[11px] font-bold text-indigo-950 ring-2 ring-[#3b33a8]">AR</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-300 text-[11px] font-bold text-sky-950 ring-2 ring-[#3b33a8]">RM</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">Interview with Ayesha</p>
              <p className="mt-0.5 text-[11px] text-white/65">Starts in <span className="tabular-nums text-white">{countdown}</span> · 45 min</p>
            </div>
            <span className="relative inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-[#4338ca]">
              <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 motion-safe:animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-400" />
              </span>
              <Video className="h-3.5 w-3.5" /> Join
            </span>
          </div>
          <p className="mt-3 flex items-center gap-1.5 border-t border-white/10 pt-3 text-[11px] text-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" /> Confirmed · synced to Google Calendar
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
