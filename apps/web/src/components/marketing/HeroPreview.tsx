import { CalendarCheck2, CheckCircle2, MapPin, Sparkles, Video } from 'lucide-react';

/**
 * Decorative product preview for the home page hero (desktop only): a matched job, a hiring pipeline
 * and a confirmed video interview, drawn as frosted cards on the hero gradient.
 */
export function HeroPreview() {
  const glass = 'rounded-2xl bg-white/10 p-4 text-white ring-1 ring-white/15 backdrop-blur-md shadow-2xl shadow-black/20';
  return (
    <div className="relative hidden select-none lg:block" aria-hidden>
      {/* Matched job */}
      <div className={`${glass} w-[22rem]`}>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-400/20 text-sm font-bold text-emerald-200">AL</span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Senior Backend Engineer</p>
            <p className="text-sm text-white/70">Acme Labs</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-100">
            <Sparkles className="h-3 w-3" /> 92% match
          </span>
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs text-white/70">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Dhaka · Hybrid</span>
          <span>৳2.4M – ৳3.6M</span>
        </div>
        <div className="mt-3 flex gap-1.5">
          {['Java', 'Spring Boot', 'PostgreSQL'].map((t) => (
            <span key={t} className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] text-white/80">{t}</span>
          ))}
        </div>
      </div>

      {/* Pipeline */}
      <div className={`${glass} ml-16 mt-4 w-[22rem]`}>
        <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Hiring pipeline</p>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          {[
            ['Applied', 24, 'bg-slate-300'],
            ['Review', 9, 'bg-sky-300'],
            ['Interview', 4, 'bg-amber-300'],
            ['Offer', 1, 'bg-fuchsia-300'],
          ].map(([label, n, dot]) => (
            <div key={label as string} className="rounded-lg bg-white/5 px-1 py-2">
              <p className="text-lg font-bold tabular-nums">{n}</p>
              <p className="flex items-center justify-center gap-1 text-[10px] text-white/70">
                <span className={`h-1.5 w-1.5 rounded-full ${dot}`} /> {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Interview */}
      <div className={`${glass} mt-4 w-[22rem]`}>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-400/25 text-indigo-100">
            <CalendarCheck2 className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Interview with Ayesha</p>
            <p className="text-xs text-white/70">Tomorrow · 11:00 AM · 45 min</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-[#4338ca]">
            <Video className="h-3.5 w-3.5" /> Join call
          </span>
        </div>
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-200">
          <CheckCircle2 className="h-3.5 w-3.5" /> Candidate confirmed · synced to Google Calendar
        </p>
      </div>
    </div>
  );
}
