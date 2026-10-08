import type { Interview } from '@/types';

// Interview times are ISO instants (UTC). Everything here renders in the viewer's local time zone.

const WEEKDAY_DATE: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
const TIME: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };

/** "2:30 PM" */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', TIME);
}

/** "Sat, Oct 10" */
export function formatWeekdayDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', WEEKDAY_DATE);
}

/** "Oct 10" */
export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** "45 min", "1 hr", "1 hr 30 min" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

/** "2:30 PM – 3:15 PM (45 min)" */
export function formatTimeRange(i: Pick<Interview, 'scheduledAt' | 'durationMinutes'>): string {
  const end = new Date(new Date(i.scheduledAt).getTime() + i.durationMinutes * 60_000).toISOString();
  return `${formatTime(i.scheduledAt)} – ${formatTime(end)} (${formatDuration(i.durationMinutes)})`;
}

/** "Sat, Oct 10 · 2:30 PM (45 min)" */
export function formatInterviewWhen(i: Pick<Interview, 'scheduledAt' | 'durationMinutes'>): string {
  return `${formatWeekdayDate(i.scheduledAt)} · ${formatTime(i.scheduledAt)} (${formatDuration(i.durationMinutes)})`;
}

/** "Sat, Oct 10 · 3:00 PM" */
export function formatSlot(iso: string): string {
  return `${formatWeekdayDate(iso)} · ${formatTime(iso)}`;
}

// ─── Clashes & local date/time inputs ────────────────────────────────────────

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Local "YYYY-MM-DD" for <input type="date">. */
export const toDateInput = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
/** Local "HH:mm" for <input type="time">. */
export const toTimeInput = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

/** Local date + time inputs → ISO instant, or null when incomplete/invalid. */
export function localInputsToIso(date: string, time: string): string | null {
  if (!date || !time) return null;
  const when = new Date(`${date}T${time}`);
  return Number.isNaN(when.getTime()) ? null : when.toISOString();
}

export function hasStarted(i: Pick<Interview, 'scheduledAt'>, now = Date.now()): boolean {
  return new Date(i.scheduledAt).getTime() <= now;
}

/** Half-open [start, end) overlap: back-to-back slots don't clash. */
export function slotsOverlap(aStart: string, aMinutes: number, bStart: string, bMinutes: number): boolean {
  const a = new Date(aStart).getTime();
  const b = new Date(bStart).getTime();
  return a < b + bMinutes * 60_000 && b < a + aMinutes * 60_000;
}

/** The viewer's other SCHEDULED interviews overlapping a slot (excluding `excludeId`). */
export function findClashes(start: string, minutes: number, others: Interview[] | undefined, excludeId?: string): Interview[] {
  return (others ?? []).filter(
    (o) => o.id !== excludeId && o.status === 'SCHEDULED' && slotsOverlap(start, minutes, o.scheduledAt, o.durationMinutes)
  );
}

/** Local-day key, e.g. "2026-10-10". */
export function localDayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** "Today", "Tomorrow", or "Saturday, October 10" (year added when not this year). */
export function dayHeading(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(d) - startOf(now)) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  });
}

/** Group interviews (sorted by time) into local days. */
export function groupByDay(interviews: Interview[]): { key: string; heading: string; items: Interview[] }[] {
  const sorted = [...interviews].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const groups = new Map<string, Interview[]>();
  for (const i of sorted) {
    const key = localDayKey(i.scheduledAt);
    groups.set(key, [...(groups.get(key) ?? []), i]);
  }
  const now = new Date();
  return Array.from(groups, ([key, items]) => ({ key, heading: dayHeading(items[0].scheduledAt, now), items }));
}

/** Short time zone name for the viewer, e.g. "PDT" or "GMT+6". */
export function timeZoneAbbr(date = new Date()): string {
  try {
    const part = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
      .formatToParts(date)
      .find((p) => p.type === 'timeZoneName');
    return part?.value ?? '';
  } catch {
    return '';
  }
}

export function isHttpUrl(value?: string | null): value is string {
  if (!value) return false;
  try {
    const u = new URL(value.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** A phone number we can safely put in a tel: link. */
export function telHref(value?: string | null): string | null {
  if (!value) return null;
  const digits = value.replace(/[^\d+]/g, '');
  return /^\+?\d{6,15}$/.test(digits) ? `tel:${digits}` : null;
}

// ─── .ics export ─────────────────────────────────────────────────────────────

function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function icsEscape(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Fold lines longer than 75 characters (RFC 5545 §3.1). */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  for (let i = 0; i < line.length; i += i === 0 ? 75 : 74) parts.push(line.slice(i, i + (i === 0 ? 75 : 74)));
  return parts.join('\r\n ');
}

export function buildIcs(i: Interview, typeLabel: string): string {
  const start = new Date(i.scheduledAt);
  const end = new Date(start.getTime() + i.durationMinutes * 60_000);
  const description = [
    `${typeLabel} interview for ${i.jobTitle} at ${i.companyName}.`,
    i.location ? `Location: ${i.location}` : '',
    i.message ? `\n${i.message}` : '',
  ].filter(Boolean).join('\n');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NexHire//Interviews//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:interview-${i.id}@nexhire`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsEscape(`Interview: ${i.jobTitle} at ${i.companyName}`)}`,
    i.location ? `LOCATION:${icsEscape(i.location)}` : '',
    `DESCRIPTION:${icsEscape(description)}`,
    isHttpUrl(i.location) ? `URL:${i.location.trim()}` : '',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  return lines.map(fold).join('\r\n') + '\r\n';
}

/** Generate the .ics client-side and trigger a download. */
export function downloadIcs(i: Interview, typeLabel: string): void {
  const blob = new Blob([buildIcs(i, typeLabel)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const slug = `${i.jobTitle}-${i.companyName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  a.href = url;
  a.download = `interview-${slug || i.id}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
