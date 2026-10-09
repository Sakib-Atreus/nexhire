import type { User } from '@/types';

export interface CompletenessItem {
  key: 'avatar' | 'headline' | 'location' | 'bio' | 'skills' | 'phone' | 'resume' | 'experience' | 'education' | 'portfolio';
  label: string;
  done: boolean;
}

type CompletenessInput = Pick<User, 'avatarUrl' | 'headline' | 'bio' | 'skills' | 'phone' | 'portfolioLinks' | 'location' | 'resumeUrl'> & {
  /** Number of saved roles. Omit when unknown and the item is left out of the checklist. */
  experienceCount?: number;
  /** Number of saved education entries. Omit when unknown and the item is left out of the checklist. */
  educationCount?: number;
};

/** Candidate profile checklist used by the profile page and the dashboard. */
export function getProfileCompleteness(user: CompletenessInput) {
  const items: CompletenessItem[] = [
    { key: 'avatar', label: 'Profile photo', done: !!user.avatarUrl },
    { key: 'headline', label: 'Headline', done: !!user.headline?.trim() },
    { key: 'location', label: 'Location', done: !!user.location?.trim() },
    { key: 'bio', label: 'About you', done: !!user.bio?.trim() },
    { key: 'skills', label: 'Skills', done: (user.skills?.length ?? 0) > 0 },
    { key: 'phone', label: 'Phone number', done: !!user.phone?.trim() },
    { key: 'resume', label: 'Resume', done: !!user.resumeUrl },
  ];
  if (user.experienceCount !== undefined) {
    items.push({ key: 'experience', label: 'Work experience', done: user.experienceCount > 0 });
  }
  if (user.educationCount !== undefined) {
    items.push({ key: 'education', label: 'Education', done: user.educationCount > 0 });
  }
  items.push({ key: 'portfolio', label: 'Portfolio link', done: (user.portfolioLinks?.filter(Boolean).length ?? 0) > 0 });

  const done = items.filter((i) => i.done).length;
  return { items, done, total: items.length, percent: Math.round((done / items.length) * 100) };
}
