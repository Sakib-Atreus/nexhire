import type { Interview } from '@/types';

export type EventToneKey = 'confirmed' | 'awaiting' | 'newTime' | 'declined' | 'completed' | 'cancelled';

export interface EventTone {
  key: EventToneKey;
  /** Chip / block fill + text. Tints flip automatically in dark mode. */
  chip: string;
  /** Solid accent (left bar, dot). */
  accent: string;
}

const TONES: Record<EventToneKey, EventTone> = {
  confirmed: { key: 'confirmed', chip: 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100', accent: 'bg-emerald-500' },
  awaiting: { key: 'awaiting', chip: 'bg-primary-50 text-primary-800 hover:bg-primary-100', accent: 'bg-primary-500' },
  newTime: { key: 'newTime', chip: 'bg-amber-50 text-amber-900 hover:bg-amber-100', accent: 'bg-amber-500' },
  declined: { key: 'declined', chip: 'bg-rose-50 text-rose-800 hover:bg-rose-100', accent: 'bg-rose-500' },
  completed: { key: 'completed', chip: 'bg-subtle text-fg-secondary hover:bg-emphasis', accent: 'bg-slate-400' },
  cancelled: { key: 'cancelled', chip: 'bg-muted text-fg-muted line-through hover:bg-subtle', accent: 'bg-slate-300' },
};

export function eventTone(i: Interview): EventTone {
  if (i.status === 'CANCELLED') return TONES.cancelled;
  if (i.status === 'COMPLETED') return TONES.completed;
  switch (i.response) {
    case 'ACCEPTED': return TONES.confirmed;
    case 'NEW_TIME_REQUESTED': return TONES.newTime;
    case 'DECLINED': return TONES.declined;
    default: return TONES.awaiting;
  }
}

/** Legend entries, worded for the viewer. */
export function legend(recruiter: boolean): { tone: EventTone; label: string }[] {
  return [
    { tone: TONES.confirmed, label: 'Confirmed' },
    { tone: TONES.awaiting, label: recruiter ? 'Awaiting candidate' : 'Needs your response' },
    { tone: TONES.newTime, label: 'New time requested' },
    { tone: TONES.declined, label: 'Declined' },
    { tone: TONES.completed, label: 'Completed' },
    { tone: TONES.cancelled, label: 'Cancelled' },
  ];
}
