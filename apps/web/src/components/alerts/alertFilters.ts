import { EXPERIENCE_LABELS, JOB_TYPE_LABELS } from '@/lib/constants';
import type { ExperienceLevel, JobAlert, JobAlertInput, JobType } from '@/types';

export const MAX_ALERTS = 10;

export interface AlertFilters {
  keyword?: string | null;
  location?: string | null;
  category?: string | null;
  jobType?: JobType | null;
  experienceLevel?: ExperienceLevel | null;
}

export function hasAlertFilter(f: AlertFilters): boolean {
  return !!(f.keyword?.trim() || f.location?.trim() || f.category?.trim() || f.jobType || f.experienceLevel);
}

/** Human-readable chips for an alert's filters. */
export function alertFilterChips(f: AlertFilters): string[] {
  const chips: string[] = [];
  if (f.keyword?.trim()) chips.push(`“${f.keyword.trim()}”`);
  if (f.location?.trim()) chips.push(f.location.trim());
  if (f.category?.trim()) chips.push(f.category.trim());
  if (f.jobType) chips.push(JOB_TYPE_LABELS[f.jobType]);
  if (f.experienceLevel) chips.push(EXPERIENCE_LABELS[f.experienceLevel]);
  return chips;
}

/** Link to the jobs page with the alert's filters applied (uses the jobs page's URL parameter names). */
export function alertJobsHref(f: AlertFilters): string {
  const params = new URLSearchParams();
  if (f.keyword?.trim()) params.set('keyword', f.keyword.trim());
  if (f.location?.trim()) params.set('location', f.location.trim());
  if (f.jobType) params.set('type', f.jobType);
  if (f.experienceLevel) params.set('level', f.experienceLevel);
  if (f.category?.trim()) params.set('category', f.category.trim());
  const qs = params.toString();
  return qs ? `/jobs?${qs}` : '/jobs';
}

/** Full PUT body for an existing alert, with overrides (e.g. { active: false }). */
export function alertToInput(alert: JobAlert, overrides: Partial<JobAlertInput> = {}): JobAlertInput {
  return {
    name: alert.name,
    keyword: alert.keyword ?? undefined,
    location: alert.location ?? undefined,
    category: alert.category ?? undefined,
    jobType: alert.jobType ?? null,
    experienceLevel: alert.experienceLevel ?? null,
    frequency: alert.frequency,
    active: alert.active,
    emailEnabled: alert.emailEnabled,
    ...overrides,
  };
}

/** 8:00 UTC (the daily digest time) in the viewer's local time, e.g. "2:00 PM". Client-side only. */
export function dailyDigestLocalTime(): string {
  const d = new Date();
  d.setUTCHours(8, 0, 0, 0);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
