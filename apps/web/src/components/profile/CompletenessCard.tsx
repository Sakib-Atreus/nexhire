'use client';

import { CheckCircle2, Circle } from 'lucide-react';
import { useMyEducation, useMyExperience } from '@/hooks/useCandidate';
import { Card } from '@/components/ui/Card';
import { getProfileCompleteness } from './completeness';
import type { User } from '@/types';

type Fields = Pick<User, 'avatarUrl' | 'headline' | 'bio' | 'skills' | 'phone' | 'portfolioLinks' | 'location' | 'resumeUrl'>;

/** Candidate profile strength meter. Pass live form values so it reacts to unsaved edits. */
export function CompletenessCard({ fields }: { fields: Fields }) {
  const experience = useMyExperience();
  const education = useMyEducation();
  const completeness = getProfileCompleteness({
    ...fields,
    experienceCount: experience.data?.length ?? 0,
    educationCount: education.data?.length ?? 0,
  });

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-fg">Profile strength</h2>
        <span className="text-sm font-semibold text-primary-700 tabular-nums">{completeness.percent}%</span>
      </div>
      <div
        className="mt-3 h-2 rounded-full bg-subtle overflow-hidden"
        role="progressbar"
        aria-label="Profile completeness"
        aria-valuenow={completeness.percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-primary-600 transition-all" style={{ width: `${completeness.percent}%` }} />
      </div>
      <ul className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 lg:grid-cols-1">
        {completeness.items.map((item) => (
          <li key={item.key} className={item.done ? 'flex items-center gap-2 text-fg-muted' : 'flex items-center gap-2 text-fg-secondary'}>
            {item.done
              ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" aria-hidden />
              : <Circle className="w-4 h-4 text-fg-faint flex-shrink-0" aria-hidden />}
            {item.label}
            <span className="sr-only">{item.done ? '— complete' : '— missing'}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
