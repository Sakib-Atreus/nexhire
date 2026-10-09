import { Briefcase, ExternalLink, GraduationCap, Link2, Mail, MapPin, Phone, FileText } from 'lucide-react';
import type { CandidateProfile, Education, WorkExperience } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { formatMonthYear, parseDate } from '@/lib/format';

/** "Feb 2023 – Present · 2 yrs 8 mos" */
export function experiencePeriod(e: WorkExperience): string {
  const start = parseDate(e.startDate);
  const end = e.endDate ? parseDate(e.endDate) : new Date();
  const months = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() + 1);
  const y = Math.floor(months / 12), m = months % 12;
  const length = [y && `${y} yr${y > 1 ? 's' : ''}`, m && `${m} mo${m > 1 ? 's' : ''}`].filter(Boolean).join(' ');
  return `${formatMonthYear(e.startDate)} – ${e.endDate ? formatMonthYear(e.endDate) : 'Present'} · ${length}`;
}

export function educationPeriod(e: Education): string | null {
  if (!e.startYear && !e.endYear) return null;
  return [e.startYear, e.endYear].filter(Boolean).join(' – ');
}

function safeUrl(url: string): string | null {
  return /^https?:\/\//i.test(url) ? url : null;
}

/**
 * Read-only candidate profile: header, about, skills, experience, education and links.
 * Contact details and resume render only when present (hiring-team view).
 * `compact` tightens spacing for side panels.
 */
export function CandidateProfileView({ profile, compact = false, className }: {
  profile: CandidateProfile;
  compact?: boolean;
  className?: string;
}) {
  const gap = compact ? 'space-y-5' : 'space-y-8';
  const heading = 'text-xs font-semibold uppercase tracking-wide text-fg-muted mb-3';
  const links = profile.portfolioLinks.map(safeUrl).filter((u): u is string => !!u);

  return (
    <div className={cn(gap, className)}>
      <div className="flex items-start gap-4">
        <Avatar name={profile.fullName} src={profile.avatarUrl} size={compact ? 'lg' : 'xl'} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className={cn('font-bold text-fg', compact ? 'text-lg' : 'text-2xl')}>{profile.fullName}</h2>
            {profile.openToWork && <Badge tone="bg-emerald-50 text-emerald-700 ring-emerald-600/20">Open to work</Badge>}
          </div>
          {profile.headline && <p className="mt-0.5 text-fg-secondary">{profile.headline}</p>}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-fg-muted">
            {profile.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" aria-hidden />{profile.location}</span>}
            {profile.email && (
              <a href={`mailto:${profile.email}`} className="inline-flex items-center gap-1.5 hover:text-primary-600">
                <Mail className="h-4 w-4" aria-hidden />{profile.email}
              </a>
            )}
            {profile.phone && <span className="inline-flex items-center gap-1.5"><Phone className="h-4 w-4" aria-hidden />{profile.phone}</span>}
            {profile.resumeUrl && safeUrl(profile.resumeUrl) && (
              <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary-600 hover:underline">
                <FileText className="h-4 w-4" aria-hidden />Resume<ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            )}
          </div>
        </div>
      </div>

      {profile.bio && (
        <section>
          <h3 className={heading}>About</h3>
          <p className="whitespace-pre-line text-sm leading-relaxed text-fg-secondary">{profile.bio}</p>
        </section>
      )}

      {profile.skills.length > 0 && (
        <section>
          <h3 className={heading}>Skills</h3>
          <ul className="flex flex-wrap gap-1.5">
            {profile.skills.map((s) => (
              <li key={s} className="rounded-md bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 ring-1 ring-inset ring-primary-600/20">{s}</li>
            ))}
          </ul>
        </section>
      )}

      {profile.experience.length > 0 && (
        <section>
          <h3 className={heading}>Experience</h3>
          <ol className="space-y-4">
            {profile.experience.map((e, i) => (
              <li key={e.id ?? i} className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-subtle text-fg-muted" aria-hidden>
                  <Briefcase className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-fg">{e.title}</p>
                  <p className="text-sm text-fg-secondary">{e.company}{e.location ? ` · ${e.location}` : ''}</p>
                  <p className="text-xs text-fg-muted mt-0.5">{experiencePeriod(e)}</p>
                  {e.description && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-fg-secondary">{e.description}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {profile.education.length > 0 && (
        <section>
          <h3 className={heading}>Education</h3>
          <ol className="space-y-4">
            {profile.education.map((e, i) => (
              <li key={e.id ?? i} className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-subtle text-fg-muted" aria-hidden>
                  <GraduationCap className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-fg">{e.school}</p>
                  {(e.degree || e.fieldOfStudy) && (
                    <p className="text-sm text-fg-secondary">{[e.degree, e.fieldOfStudy].filter(Boolean).join(', ')}</p>
                  )}
                  {educationPeriod(e) && <p className="text-xs text-fg-muted mt-0.5">{educationPeriod(e)}</p>}
                  {e.description && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-fg-secondary">{e.description}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {links.length > 0 && (
        <section>
          <h3 className={heading}>Links</h3>
          <ul className="space-y-1.5">
            {links.map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:underline break-all">
                  <Link2 className="h-4 w-4 flex-shrink-0" aria-hidden />{url.replace(/^https?:\/\//, '')}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!profile.bio && profile.skills.length === 0 && profile.experience.length === 0 && profile.education.length === 0 && (
        <p className="text-sm text-fg-muted">This candidate hasn&apos;t added profile details yet.</p>
      )}
    </div>
  );
}
