'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowRight, BadgeCheck, Briefcase, CalendarCheck2, Check, ChevronLeft, ChevronRight, MapPin, Mic, PartyPopper,
  Plus, Search, Send, Sparkles, Star, Video,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { buttonClasses } from '@/components/ui/Button';

/*
 * Interactive "How it works": two audiences, three steps each. Each step's preview is a small working
 * scene the visitor can click (Apply, Accept, move a candidate…). The tour starts when the section
 * scrolls into view and loops (1 → 2 → 3 → 1). When the visitor clicks something it pauses for a moment,
 * then carries on by itself. Reduced motion: no
 * auto-play; scenes are simply clickable.
 */

type Audience = 'seeker' | 'employer';
const STEP_MS = 7000;
/** After the visitor clicks something, wait this long before the tour carries on by itself. */
const HOLD_MS = 12000;
const AUDIENCE_KEY = 'nexhire.home.audience';

interface SceneProps {
  /** True while the tour is auto-playing: the scene performs its own action after a short delay. */
  auto: boolean;
  /** The visitor clicked something inside the scene: hand control to them. */
  onInteract: () => void;
}

// ─── Shared bits ──────────────────────────────────────────────────────────────

function useLater(active: boolean, delays: number[], run: (index: number) => void) {
  const runRef = useRef(run);
  runRef.current = run;
  useEffect(() => {
    if (!active) return;
    const timers = delays.map((d, i) => setTimeout(() => runRef.current(i), d));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}

function Hint({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-fg-muted">
      <Sparkles className="h-3.5 w-3.5 text-primary-600" aria-hidden /> {children}
    </p>
  );
}

function Avatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <span className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700', className)}>
      {initials}
    </span>
  );
}

// ─── Job seeker scenes ───────────────────────────────────────────────────────

const SKILLS = ['Java', 'Spring Boot', 'SQL', 'Docker'];

function ProfileScene({ auto, onInteract }: SceneProps) {
  const [skills, setSkills] = useState<string[]>([]);
  const add = (s: string) => setSkills((cur) => (cur.includes(s) ? cur : [...cur, s]));
  useLater(auto, [900, 1600, 2300, 3000], (i) => add(SKILLS[i]));
  const strength = 40 + skills.length * 15;

  return (
    <div>
      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="flex items-center gap-3">
          <Avatar initials="AR" className="h-12 w-12 text-sm" />
          <div className="min-w-0">
            <p className="font-semibold text-fg">Ayesha Rahman</p>
            <p className="text-sm text-fg-muted">Backend Engineer · Dhaka</p>
          </div>
          <span className="ml-auto whitespace-nowrap rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">Open to work</span>
        </div>
        <p className="mt-4 text-xs font-medium uppercase tracking-wider text-fg-subtle">Skills</p>
        <div className="mt-2 flex min-h-[2rem] flex-wrap gap-1.5">
          {skills.length === 0 && <span className="text-sm text-fg-subtle">No skills yet</span>}
          {skills.map((s) => (
            <span key={s} className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 motion-safe:animate-pop">{s}</span>
          ))}
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs">
            <span className="font-medium text-fg-secondary">Profile strength</span>
            <span className="tabular-nums font-semibold text-primary-700">{strength}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-subtle">
            <div className="h-full rounded-full bg-primary-600 transition-[width] duration-700" style={{ width: `${strength}%` }} />
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {SKILLS.filter((s) => !skills.includes(s)).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => { onInteract(); add(s); }}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-line-strong px-2.5 py-1 text-xs font-medium text-fg-tertiary transition-colors hover:border-primary-400 hover:text-primary-700"
          >
            <Plus className="h-3 w-3" aria-hidden /> {s}
          </button>
        ))}
      </div>
      <Hint>{skills.length < SKILLS.length ? 'Tap a skill to add it' : 'Profile complete. Recruiters can find you now'}</Hint>
    </div>
  );
}

const JOBS = [
  { title: 'Senior Backend Engineer', company: 'Acme Labs', initials: 'AL', match: 'Strong match', tone: 'bg-emerald-50 text-emerald-700' },
  { title: 'Java Developer', company: 'Corvana Fintech', initials: 'CF', match: 'Good match', tone: 'bg-sky-50 text-sky-700' },
  { title: 'Platform Engineer', company: 'Lumora Commerce', initials: 'LC', match: 'Good match', tone: 'bg-sky-50 text-sky-700' },
];

function ApplyScene({ auto, onInteract }: SceneProps) {
  const [applied, setApplied] = useState<number[]>([]);
  useLater(auto, [2600], () => setApplied((a) => (a.includes(0) ? a : [...a, 0])));
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg-muted">
        <Search className="h-4 w-4" aria-hidden /> Java · Dhaka
        <span className="ml-auto text-xs text-fg-subtle">Recommended for you</span>
      </div>
      <ul className="space-y-2">
        {JOBS.map((j, i) => {
          const done = applied.includes(i);
          return (
            <li key={j.title} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 motion-safe:animate-fade-up" style={{ animationDelay: `${i * 0.12}s` }}>
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-subtle text-xs font-bold text-fg-secondary">{j.initials}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-fg">{j.title}</p>
                <p className="flex items-center gap-1.5 text-xs text-fg-muted">
                  {j.company} <span aria-hidden>·</span> <MapPin className="h-3 w-3" aria-hidden /> Dhaka
                </p>
              </div>
              <span className={cn('hidden rounded-full px-2 py-0.5 text-[11px] font-medium sm:inline', j.tone)}>{j.match}</span>
              <button
                type="button"
                onClick={() => { onInteract(); setApplied((a) => (a.includes(i) ? a : [...a, i])); }}
                disabled={done}
                className={cn(buttonClasses(done ? 'secondary' : 'primary', 'sm'), 'w-[5.5rem] justify-center', done && 'text-emerald-700 disabled:opacity-100')}
              >
                {done ? <><Check className="h-3.5 w-3.5" aria-hidden /> Applied</> : 'Apply'}
              </button>
            </li>
          );
        })}
      </ul>
      <Hint>{applied.length ? 'Applied in one click with your saved resume' : 'Tap Apply on a job'}</Hint>
    </div>
  );
}

const TRACK = ['Applied', 'Review', 'Interview', 'Offer'];

function InterviewScene({ auto, onInteract }: SceneProps) {
  const [accepted, setAccepted] = useState(false);
  const [stage, setStage] = useState(2);
  useLater(auto, [2400], () => setAccepted(true));
  useEffect(() => {
    if (!accepted) return;
    const t = setTimeout(() => setStage(3), 1300);
    return () => clearTimeout(t);
  }, [accepted]);
  const offer = stage === 3;

  return (
    <div>
      <div className={cn('rounded-xl border bg-surface p-4 transition-colors', accepted ? 'border-emerald-300' : 'border-line')}>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <Video className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-fg">Interview invitation</p>
            <p className="text-sm text-fg-muted">Acme Labs · Senior Backend Engineer</p>
            <p className="mt-1 text-sm font-medium text-fg-secondary">Tomorrow · 11:00 AM · 45 min · Video call</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {accepted ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 motion-safe:animate-pop">
              <CalendarCheck2 className="h-4 w-4" aria-hidden /> Confirmed · added to your calendar
            </span>
          ) : (
            <>
              <button type="button" onClick={() => { onInteract(); setAccepted(true); }} className={buttonClasses('primary', 'sm')}>
                <Check className="h-3.5 w-3.5" aria-hidden /> Accept
              </button>
              <button type="button" onClick={onInteract} className={buttonClasses('secondary', 'sm')}>Suggest a time</button>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-line bg-surface p-4">
        <ol className="grid grid-cols-4 gap-1.5">
          {TRACK.map((t, i) => (
            <li key={t}>
              <div className={cn('h-1.5 rounded-full transition-colors duration-500', i <= stage ? 'bg-primary-600' : 'bg-subtle')} />
              <p className={cn('mt-1.5 text-[11px] font-medium', i === stage ? 'text-primary-700' : 'text-fg-muted')}>{t}</p>
            </li>
          ))}
        </ol>
        {offer && (
          <p className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 motion-safe:animate-pop">
            <PartyPopper className="h-4 w-4" aria-hidden /> Offer received from Acme Labs
          </p>
        )}
      </div>
      <Hint>{offer ? 'From invitation to offer, all in one place' : 'Accept the invitation'}</Hint>
    </div>
  );
}

// ─── Employer scenes ─────────────────────────────────────────────────────────

const POST_TITLE = 'Senior Backend Engineer';

function PostScene({ auto, onInteract }: SceneProps) {
  const [typed, setTyped] = useState(0);
  const [published, setPublished] = useState(false);
  useEffect(() => {
    if (!auto || typed >= POST_TITLE.length) return;
    const t = setTimeout(() => setTyped((n) => n + 1), 55);
    return () => clearTimeout(t);
  }, [auto, typed]);
  useLater(auto, [3400], () => setPublished(true));
  const title = POST_TITLE.slice(0, typed);
  const filled = typed >= POST_TITLE.length;

  return (
    <div>
      <div className="rounded-xl border border-line bg-surface p-4">
        <p className="text-xs font-medium text-fg-muted">Job title</p>
        <p className="mt-1 flex h-9 items-center rounded-lg border border-line-strong px-3 text-sm text-fg">
          {title}
          {!filled && <span className="ml-px inline-block h-4 w-px bg-primary-600 motion-safe:animate-pulse" aria-hidden />}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-medium text-fg-muted">Salary (BDT / year)</p>
            <p className={cn('mt-1 flex h-9 items-center rounded-lg border border-line-strong px-3 text-sm transition-colors', filled ? 'text-fg' : 'text-fg-subtle')}>
              {filled ? '৳2.4M – ৳3.6M' : 'e.g. 1,200,000'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-fg-muted">Location</p>
            <p className={cn('mt-1 flex h-9 items-center rounded-lg border border-line-strong px-3 text-sm', filled ? 'text-fg' : 'text-fg-subtle')}>
              {filled ? 'Dhaka · Hybrid' : 'City or Remote'}
            </p>
          </div>
        </div>
        <div className="mt-3 flex min-h-[1.75rem] flex-wrap gap-1.5">
          {filled && ['Java', 'Spring Boot', 'PostgreSQL'].map((s, i) => (
            <span key={s} className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 motion-safe:animate-pop" style={{ animationDelay: `${i * 0.12}s` }}>{s}</span>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-line-subtle pt-3">
          {published ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 motion-safe:animate-pop">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Live on the job board
            </span>
          ) : (
            <span className="text-xs text-fg-muted">Draft</span>
          )}
          <button
            type="button"
            disabled={published}
            onClick={() => { onInteract(); setTyped(POST_TITLE.length); setPublished(true); }}
            className={cn(buttonClasses(published ? 'secondary' : 'primary', 'sm'), published && 'disabled:opacity-100')}
          >
            {published ? <><Check className="h-3.5 w-3.5" aria-hidden /> Published</> : <><Send className="h-3.5 w-3.5" aria-hidden /> Publish job</>}
          </button>
        </div>
      </div>
      <Hint>{published ? 'Matching job seekers get an alert right away' : 'Tap Publish job'}</Hint>
    </div>
  );
}

const COLUMNS = ['Applied', 'Review', 'Shortlist'] as const;
const CANDIDATES = [
  { initials: 'AR', name: 'Ayesha Rahman', role: 'Backend Engineer' },
  { initials: 'TH', name: 'Tanvir Hasan', role: 'Full-stack Developer' },
  { initials: 'NI', name: 'Nadia Islam', role: 'Software Engineer' },
];

function PipelineScene({ auto, onInteract }: SceneProps) {
  const [col, setCol] = useState([0, 0, 0]);
  const advance = (i: number) => setCol((c) => c.map((v, k) => (k === i ? Math.min(2, v + 1) : v)));
  useLater(auto, [1500, 3000, 4300], (step) => advance(step === 2 ? 1 : 0));

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {COLUMNS.map((name, c) => (
          <div key={name} className="min-h-[13rem] rounded-xl bg-subtle/70 p-2">
            <p className="mb-2 flex items-center justify-between px-1 text-xs font-semibold text-fg-soft">
              {name}
              <span className="rounded-full bg-surface px-1.5 text-[11px] tabular-nums text-fg-muted ring-1 ring-line">{col.filter((v) => v === c).length}</span>
            </p>
            <div className="space-y-2">
              {CANDIDATES.map((p, i) =>
                col[i] === c ? (
                  <button
                    key={`${p.initials}-${c}`}
                    type="button"
                    onClick={() => { onInteract(); advance(i); }}
                    disabled={c === 2}
                    className="w-full rounded-lg border border-line bg-surface p-2 text-left shadow-card transition hover:border-primary-300 disabled:cursor-default motion-safe:animate-pop"
                    aria-label={c < 2 ? `Move ${p.name} to ${COLUMNS[c + 1]}` : `${p.name}, shortlisted`}
                  >
                    <span className="flex items-center gap-2">
                      <Avatar initials={p.initials} className="h-7 w-7 text-[10px]" />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-fg">{p.name.split(' ')[0]}</span>
                        <span className="block truncate text-[10px] text-fg-muted">{p.role}</span>
                      </span>
                    </span>
                    {c === 2 && (
                      <span className="mt-1.5 flex gap-0.5 text-amber-400" aria-hidden>
                        {Array.from({ length: 5 }).map((_, k) => <Star key={k} className={cn('h-3 w-3', k < 4 && 'fill-current')} />)}
                      </span>
                    )}
                  </button>
                ) : null
              )}
            </div>
          </div>
        ))}
      </div>
      <Hint>Tap a candidate to move them forward</Hint>
    </div>
  );
}

const SLOTS = ['Mon 10:00', 'Tue 11:30', 'Wed 15:00'];

function HireScene({ auto, onInteract }: SceneProps) {
  const [slot, setSlot] = useState<number | null>(null);
  const [hired, setHired] = useState(false);
  useLater(auto, [1300, 3600], (i) => (i === 0 ? setSlot(1) : setHired(true)));

  return (
    <div>
      <div className="rounded-xl border border-line bg-surface p-4">
        <p className="text-sm font-semibold text-fg">Schedule an interview with Ayesha</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {SLOTS.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => { onInteract(); setSlot(i); }}
              className={cn(
                'rounded-lg border px-2 py-2 text-xs font-medium transition-colors',
                slot === i ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-line-strong text-fg-tertiary hover:bg-muted'
              )}
            >
              {s}
            </button>
          ))}
        </div>
        {slot !== null && (
          <div className="mt-3 flex items-center gap-3 rounded-lg bg-slate-900 p-3 text-white motion-safe:animate-fade-up">
            <div className="flex -space-x-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-300 text-[10px] font-bold text-indigo-950 ring-2 ring-slate-900">AR</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-300 text-[10px] font-bold text-sky-950 ring-2 ring-slate-900">RM</span>
            </div>
            <div className="min-w-0 flex-1 text-xs">
              <p className="font-semibold">Video interview · {SLOTS[slot]}</p>
              <p className="text-slate-400">Private NexHire room</p>
            </div>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10"><Mic className="h-3.5 w-3.5" aria-hidden /></span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10"><Video className="h-3.5 w-3.5" aria-hidden /></span>
          </div>
        )}
        <div className="mt-4 flex items-center justify-between border-t border-line-subtle pt-3">
          <span className="text-xs text-fg-muted">
            Openings filled: <span className="font-semibold tabular-nums text-fg">{hired ? 1 : 0} of 2</span>
          </span>
          {hired ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 motion-safe:animate-pop">
              <BadgeCheck className="h-4 w-4" aria-hidden /> Hired
            </span>
          ) : (
            <button
              type="button"
              disabled={slot === null}
              onClick={() => { onInteract(); setHired(true); }}
              className={buttonClasses('success', 'sm')}
            >
              Mark as hired
            </button>
          )}
        </div>
      </div>
      <Hint>{hired ? 'Ayesha is notified, and the job closes when every opening is filled' : slot === null ? 'Pick an interview time' : 'Tap Mark as hired'}</Hint>
    </div>
  );
}

// ─── Content ─────────────────────────────────────────────────────────────────

const CONTENT: Record<Audience, {
  tab: string;
  steps: { title: string; text: string; Scene: (p: SceneProps) => ReactNode }[];
  cta: { href: string; label: string };
  secondary: { href: string; label: string };
}> = {
  seeker: {
    tab: 'I’m looking for a job',
    steps: [
      { title: 'Create your profile', text: 'Add your skills, experience and resume once. Recruiters see it when you apply.', Scene: ProfileScene },
      { title: 'Find and apply', text: 'Get jobs matched to your skills and apply in one click with your saved resume.', Scene: ApplyScene },
      { title: 'Interview and get hired', text: 'Accept invitations, join the video call from your browser and follow every update.', Scene: InterviewScene },
    ],
    cta: { href: '/register?role=CANDIDATE', label: 'Create a free account' },
    secondary: { href: '/jobs', label: 'Browse jobs' },
  },
  employer: {
    tab: 'I’m hiring',
    steps: [
      { title: 'Post a job', text: 'Describe the role, salary and skills. Publish in minutes, or save it as a draft.', Scene: PostScene },
      { title: 'Review applicants', text: 'Everyone who applies lands in one pipeline. Rate, take notes and move them forward.', Scene: PipelineScene },
      { title: 'Interview and hire', text: 'Schedule interviews, meet on video and mark your hire. Candidates are kept informed.', Scene: HireScene },
    ],
    cta: { href: '/register?role=RECRUITER', label: 'Post your first job' },
    secondary: { href: '/companies', label: 'See companies hiring' },
  },
};

// ─── Section ─────────────────────────────────────────────────────────────────

export function HowItWorks() {
  const [audience, setAudience] = useState<Audience>('seeker');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false); // tour running (starts when the section is first seen)
  const [hold, setHold] = useState(false); // visitor is trying a step: pause, then resume on its own
  const [run, setRun] = useState(0); // bumps to restart scenes and progress bars
  const [reduced, setReduced] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const started = useRef(false);
  const remaining = useRef(STEP_MS);
  const stepStart = useRef(0);
  const touchX = useRef<number | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (holdTimer.current) clearTimeout(holdTimer.current); }, []);

  const content = CONTENT[audience];
  const { Scene } = content.steps[step];

  // Remember the visitor's choice; respect reduced motion.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUDIENCE_KEY);
      if (saved === 'seeker' || saved === 'employer') setAudience(saved);
    } catch { /* storage unavailable */ }
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // Start the tour the first time the section is visible.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || reduced) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        setPlaying(true);
      }
    }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  // Reset the step timer whenever the step or tour restarts.
  useEffect(() => {
    remaining.current = STEP_MS;
  }, [step, run, audience]);

  // Loop through the steps (1 → 2 → 3 → 1 …) while playing, unless the visitor is trying a step.
  useEffect(() => {
    if (!playing || hold) return;
    stepStart.current = Date.now();
    const t = setTimeout(() => setStep((s) => (s + 1) % content.steps.length), remaining.current);
    return () => {
      clearTimeout(t);
      remaining.current = Math.max(0, remaining.current - (Date.now() - stepStart.current));
    };
  }, [playing, hold, step, run, audience, content.steps.length]);

  /** The visitor clicked something: pause the tour for a while, then let it continue by itself. */
  const takeOver = useCallback(() => {
    setHold(true);
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => setHold(false), HOLD_MS);
  }, []);

  function chooseAudience(a: Audience) {
    if (a === audience) return;
    setAudience(a);
    setStep(0);
    setRun((r) => r + 1);
    setHold(false);
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setPlaying(!reduced);
    try { localStorage.setItem(AUDIENCE_KEY, a); } catch { /* ignore */ }
  }

  function goTo(i: number) {
    setStep(i);
    setRun((r) => r + 1);
    takeOver();
  }

  const last = content.steps.length - 1;

  return (
    <section
      ref={sectionRef}
      aria-labelledby="how-heading"
      className="py-16 sm:py-24 bg-surface"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-primary-600">How it works</p>
          <h2 id="how-heading" className="mt-2 text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            From first click to first day
          </h2>
          <p className="mt-3 text-base text-fg-muted sm:text-lg">Three steps, whichever side of hiring you’re on. Try them below.</p>
        </div>

        {/* Audience tabs */}
        <div className="mt-8 flex justify-center">
          <div role="tablist" aria-label="Who are you?" className="inline-flex rounded-xl bg-subtle p-1">
            {(['seeker', 'employer'] as const).map((a) => (
              <button
                key={a}
                type="button"
                role="tab"
                aria-selected={audience === a}
                onClick={() => chooseAudience(a)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors sm:px-5',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                  audience === a ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'
                )}
              >
                {a === 'seeker' ? <Search className="h-4 w-4" aria-hidden /> : <Briefcase className="h-4 w-4" aria-hidden />}
                {CONTENT[a].tab}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-12">
          {/* Steps (desktop: vertical timeline) */}
          <div className="hidden lg:block">
          <ol className="relative">
            {content.steps.map((s, i) => {
              const active = i === step;
              const done = i < step;
              return (
                <li key={`${audience}-${s.title}`} className="relative">
                  {/* Connector to the next step's number; green once this step is done. */}
                  {i < last && (
                    <span
                      className={cn('absolute -bottom-3 left-[1.8rem] top-12 w-0.5 rounded-full transition-colors', done ? 'bg-emerald-400' : 'bg-line')}
                      aria-hidden
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    aria-current={active ? 'step' : undefined}
                    className={cn(
                      'group relative flex w-full gap-4 rounded-xl p-3 text-left transition-colors',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                      active ? 'bg-primary-50' : 'hover:bg-muted'
                    )}
                  >
                    <span
                      className={cn(
                        'relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ring-4 ring-surface transition-colors',
                        active ? 'bg-primary-600 text-white' : done ? 'bg-emerald-500 text-white' : 'bg-subtle text-fg-muted'
                      )}
                    >
                      {done && !active ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn('block font-semibold', active ? 'text-primary-700' : 'text-fg')}>{s.title}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-fg-muted">{s.text}</span>
                      {active && playing && (
                        <span className="mt-3 block h-1 overflow-hidden rounded-full bg-primary-100">
                          <span
                            key={`${run}-${step}`}
                            className="block h-full rounded-full bg-primary-600 motion-safe:animate-fill"
                            style={{ animationDuration: `${STEP_MS}ms`, animationPlayState: hold ? 'paused' : 'running' }}
                          />
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="mt-6 flex flex-wrap items-center gap-3 pl-3">
            <Link href={content.cta.href} className={buttonClasses('primary', 'md')}>
              {content.cta.label} <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href={content.secondary.href} className="text-sm font-medium text-primary-600 hover:text-primary-700">{content.secondary.label}</Link>
          </div>
          </div>

          {/* Preview: an app window with the step's working scene */}
          <div className="min-w-0">
            <div
              className="rounded-2xl border border-line bg-canvas shadow-[0_24px_60px_-30px_rgba(30,27,75,0.45)]"
              onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
              onTouchEnd={(e) => {
                if (touchX.current === null) return;
                const dx = e.changedTouches[0].clientX - touchX.current;
                touchX.current = null;
                if (Math.abs(dx) < 50) return;
                if (dx < 0 && step < last) goTo(step + 1);
                if (dx > 0 && step > 0) goTo(step - 1);
              }}
            >
              <div className="flex items-center gap-2 border-b border-line px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" aria-hidden />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" aria-hidden />
                <span className="ml-3 truncate rounded-md bg-surface px-3 py-1 text-xs text-fg-muted ring-1 ring-line">
                  nexhire · {content.steps[step].title}
                </span>
              </div>
              <div className="flex min-h-[22rem] items-center p-4 sm:p-6" aria-live="polite">
                <div key={`${audience}-${step}-${run}`} className="mx-auto w-full max-w-xl motion-safe:animate-fade-up">
                  <Scene auto={playing && !hold} onInteract={takeOver} />
                </div>
              </div>
            </div>

            {/* Steps (phone/tablet): dots, the current step's text, prev/next */}
            <div className="mt-5 lg:hidden">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => goTo(Math.max(0, step - 1))}
                  disabled={step === 0}
                  aria-label="Previous step"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-fg-tertiary disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                </button>
                <div className="flex gap-2">
                  {content.steps.map((s, i) => (
                    <button
                      key={s.title}
                      type="button"
                      onClick={() => goTo(i)}
                      aria-label={`Step ${i + 1}: ${s.title}`}
                      aria-current={i === step ? 'step' : undefined}
                      className={cn('h-2.5 rounded-full transition-all', i === step ? 'w-7 bg-primary-600' : 'w-2.5 bg-line-strong')}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => goTo(Math.min(last, step + 1))}
                  disabled={step === last}
                  aria-label="Next step"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-fg-tertiary disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <div className="mt-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">Step {step + 1} of {content.steps.length}</p>
                <p className="mt-1 text-lg font-semibold text-fg">{content.steps[step].title}</p>
                <p className="mx-auto mt-1 max-w-md text-sm text-fg-muted">{content.steps[step].text}</p>
              </div>
              <div className="mt-5 flex flex-col items-center gap-3">
                <Link href={content.cta.href} className={buttonClasses('primary', 'md', 'w-full max-w-xs justify-center')}>
                  {content.cta.label} <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link href={content.secondary.href} className="text-sm font-medium text-primary-600">{content.secondary.label}</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
