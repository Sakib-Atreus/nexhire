import type { User } from '@/types';

export interface CompletenessItem {
  key: 'avatar' | 'headline' | 'bio' | 'skills' | 'phone' | 'portfolio';
  label: string;
  done: boolean;
}

/** Candidate profile checklist used by the profile page and the dashboard. */
export function getProfileCompleteness(user: Pick<User, 'avatarUrl' | 'headline' | 'bio' | 'skills' | 'phone' | 'portfolioLinks'>) {
  const items: CompletenessItem[] = [
    { key: 'avatar', label: 'Profile photo', done: !!user.avatarUrl },
    { key: 'headline', label: 'Headline', done: !!user.headline?.trim() },
    { key: 'bio', label: 'About you', done: !!user.bio?.trim() },
    { key: 'skills', label: 'Skills', done: (user.skills?.length ?? 0) > 0 },
    { key: 'phone', label: 'Phone number', done: !!user.phone?.trim() },
    { key: 'portfolio', label: 'Portfolio link', done: (user.portfolioLinks?.filter(Boolean).length ?? 0) > 0 },
  ];
  const done = items.filter((i) => i.done).length;
  return { items, done, total: items.length, percent: Math.round((done / items.length) * 100) };
}
