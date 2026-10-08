import type { ApplicationStatus } from '@/types';
import { PIPELINE_STAGES } from '@/lib/constants';

/** Every status the hiring team can move an applicant to (WITHDRAWN is candidate-only). */
export const MOVE_TARGETS: { status: ApplicationStatus; label: string }[] = [
  ...PIPELINE_STAGES,
  { status: 'REJECTED', label: 'Rejected' },
];

const LABELS = Object.fromEntries(MOVE_TARGETS.map((t) => [t.status, t.label])) as Record<ApplicationStatus, string>;
LABELS.WITHDRAWN = 'Withdrawn';

/** Short board label for a status ("Review", "Shortlist", ...). */
export function stageLabel(status: ApplicationStatus): string {
  return LABELS[status] ?? status;
}

/** Statuses that need an explicit confirmation before moving (candidate is notified, may close the job). */
export const CONFIRM_STATUSES: ApplicationStatus[] = ['HIRED', 'REJECTED'];

/** "Oct 10, 2:30 PM" in the viewer's local time. */
export function formatDateTime(iso?: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/** "Thu, Oct 10, 2026 · 2:30 PM" in the viewer's local time. */
export function formatLongDateTime(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${date} · ${time}`;
}

export function isForbidden(error: unknown): boolean {
  const status = (error as { response?: { status?: number } } | null)?.response?.status;
  return status === 403;
}
