'use client';

import { useId } from 'react';
import Link from 'next/link';
import { Check, Target } from 'lucide-react';
import { useMe } from '@/hooks/useProfile';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/States';
import { cn } from '@/lib/cn';
import { compareSkills } from './match';

/** Candidate-only: how the profile's skills line up with the job's tags. Renders nothing when the job has no tags. */
export function SkillMatchCard({ tags, className }: { tags: string[]; className?: string }) {
  const me = useMe();
  const titleId = useId();
  if (tags.length === 0) return null;

  if (me.isLoading) {
    return (
      <Card className={cn('p-5 space-y-3', className)} aria-hidden>
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-2 w-full" />
        <div className="flex gap-1.5"><Skeleton className="h-6 w-16" /><Skeleton className="h-6 w-20" /></div>
      </Card>
    );
  }
  if (me.isError || !me.data) return null;

  const skills = me.data.skills ?? [];
  const { matched, missing } = compareSkills(skills, tags);
  const percent = Math.round((matched.length / tags.length) * 100);

  return (
    <Card className={cn('p-5', className)}>
      <section aria-labelledby={titleId}>
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary-600" aria-hidden />
          <h2 id={titleId} className="text-sm font-semibold text-fg">Your skill match</h2>
        </div>
        <p className="mt-2 text-sm text-fg-secondary">
          {skills.length === 0 ? (
            'Add skills to your profile to see how you match.'
          ) : (
            <>You have <span className="font-semibold text-fg">{matched.length} of {tags.length}</span> skills</>
          )}
        </p>
        {skills.length > 0 && (
          <div
            className="mt-2 h-1.5 rounded-full bg-subtle overflow-hidden"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Skills matched"
          >
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
          </div>
        )}

        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Job skills">
          {matched.map((tag) => (
            <li key={tag} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              <Check className="w-3 h-3" aria-hidden />
              {tag}
              <span className="sr-only">(you have this)</span>
            </li>
          ))}
          {missing.map((tag) => (
            <li key={tag} className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-fg-muted ring-1 ring-inset ring-line">
              {tag}
              <span className="sr-only">(missing)</span>
            </li>
          ))}
        </ul>

        <Link href="/profile" className="mt-4 inline-block text-sm font-medium text-primary-600 hover:text-primary-700">
          Update your skills
        </Link>
      </section>
    </Card>
  );
}
