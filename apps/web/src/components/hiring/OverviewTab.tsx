'use client';

import { CalendarClock, CalendarDays, FileText, Mail } from 'lucide-react';
import type { Application } from '@/types';
import { formatDate, timeAgo } from '@/lib/format';
import { formatLongDateTime } from '@/components/pipeline/stages';

/** Splits the cover letter the apply flow composes ("…\n\n---\n\nScreening questions:\nQ: …\nA: …"). */
export function parseCoverLetter(text?: string | null): { letter: string; qa: { q: string; a: string }[] } {
  const raw = (text ?? '').trim();
  const marker = 'Screening questions:\n';
  const idx = raw.indexOf(marker);
  if (idx < 0) return { letter: raw, qa: [] };
  const letter = raw.slice(0, idx).replace(/\n*-{3,}\s*$/, '').trim();
  const qa = raw
    .slice(idx + marker.length)
    .split(/\n\n(?=Q: )/)
    .map((block) => {
      const m = /^Q: ([\s\S]*?)\nA: ?([\s\S]*)$/.exec(block.trim());
      return m ? { q: m[1].trim(), a: m[2].trim() } : null;
    })
    .filter((x): x is { q: string; a: string } => !!x);
  // Unparseable tail: show it as-is rather than dropping it.
  if (qa.length === 0) return { letter: raw, qa: [] };
  return { letter, qa };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-muted mb-2">{title}</h3>
      {children}
    </section>
  );
}

export function OverviewTab({ app }: { app: Application }) {
  const { letter, qa } = parseCoverLetter(app.coverLetter);
  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg bg-muted p-3">
          <dt className="text-xs text-fg-muted flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" aria-hidden /> Applied</dt>
          <dd className="text-sm font-medium text-fg mt-0.5">
            {formatDate(app.appliedAt)} <span className="text-fg-subtle font-normal">· {timeAgo(app.appliedAt)}</span>
          </dd>
        </div>
        <div className="rounded-lg bg-muted p-3">
          <dt className="text-xs text-fg-muted flex items-center gap-1.5"><CalendarClock className="w-3.5 h-3.5" aria-hidden /> Next interview</dt>
          <dd className="text-sm font-medium text-fg mt-0.5">
            {app.nextInterviewAt ? formatLongDateTime(app.nextInterviewAt) : <span className="text-fg-subtle font-normal">None scheduled</span>}
          </dd>
        </div>
        <div className="rounded-lg bg-muted p-3 sm:col-span-2 min-w-0">
          <dt className="text-xs text-fg-muted flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" aria-hidden /> Email</dt>
          <dd className="text-sm font-medium mt-0.5 truncate">
            <a href={`mailto:${app.candidateEmail}`} className="text-primary-600 hover:underline">{app.candidateEmail}</a>
          </dd>
        </div>
      </dl>

      <Section title="Cover letter">
        {letter ? (
          <p className="text-sm text-fg-secondary leading-relaxed whitespace-pre-line break-words">{letter}</p>
        ) : (
          <p className="text-sm text-fg-subtle flex items-center gap-1.5"><FileText className="w-4 h-4" aria-hidden /> No cover letter provided.</p>
        )}
      </Section>

      {qa.length > 0 && (
        <Section title="Screening questions">
          <ol className="space-y-3">
            {qa.map((item, i) => (
              <li key={i} className="rounded-lg border border-line p-3">
                <p className="text-sm font-medium text-fg break-words">{item.q}</p>
                <p className="mt-1 text-sm text-fg-tertiary whitespace-pre-line break-words">
                  {item.a || <span className="text-fg-subtle italic">No answer</span>}
                </p>
              </li>
            ))}
          </ol>
        </Section>
      )}
    </div>
  );
}
