import axios from 'axios';

/** Currency-aware compact salary range, e.g. "BDT 2.4M – 3.6M", "€95K – €120K". */
export function formatSalary(min?: number | null, max?: number | null, currency = 'USD'): string | null {
  const lo = min && min > 0 ? min : null;
  const hi = max && max > 0 ? max : null;
  if (!lo && !hi) return null;

  const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
  let f = (n: number) => `${currency} ${compact.format(n)}`;
  try {
    const withSymbol = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      notation: 'compact',
      maximumFractionDigits: 1,
    });
    const symbol = withSymbol.format(1).replace(/[\d.,\s]/g, '');
    // Use the symbol only when it is unambiguous ("$" alone means USD; SGD/CAD get their code).
    const unambiguous = symbol && !/^[A-Z]{3}$/.test(symbol) && (symbol !== '$' || currency === 'USD');
    if (unambiguous) f = (n: number) => withSymbol.format(n);
  } catch {
    // Unknown currency code: keep the "CODE 1.2K" fallback.
  }

  if (lo && hi) return `${f(lo)} – ${f(hi)}`;
  if (lo) return `From ${f(lo)}`;
  return `Up to ${f(hi!)}`;
}

/** Parse an ISO timestamp or a date-only "YYYY-MM-DD" string without UTC off-by-one errors. */
export function parseDate(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(value);
}

/** "Oct 8, 2026" */
export function formatDate(value?: string | null): string {
  if (!value) return '';
  return parseDate(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** "Oct 2026" */
export function formatMonthYear(value?: string | null): string {
  if (!value) return '';
  return parseDate(value).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/** "just now", "5 min ago", "3 days ago", falling back to a date after ~4 weeks. */
export function timeAgo(value?: string | null): string {
  if (!value) return '';
  const diff = Date.now() - parseDate(value).getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
  const day = Math.round(hr / 24);
  if (day < 28) return `${day} day${day === 1 ? '' : 's'} ago`;
  return formatDate(value);
}

/** Days until a date-only deadline (negative when passed). */
export function daysUntil(value?: string | null): number | null {
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((parseDate(value).getTime() - today.getTime()) / 86_400_000);
}

/** Split a comma-separated tag string into trimmed, unique, non-empty tags. */
export function parseTags(tags?: string | null): string[] {
  if (!tags) return [];
  return Array.from(new Set(tags.split(',').map((t) => t.trim()).filter(Boolean)));
}

export function initials(first?: string | null, last?: string | null): string {
  return `${first?.trim()?.[0] ?? ''}${last?.trim()?.[0] ?? ''}`.toUpperCase() || '?';
}

/** Initials from a free-form name such as a company name. */
export function nameInitials(name?: string | null): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  return (parts.slice(0, 2).map((p) => p[0]).join('') || '?').toUpperCase();
}

/** Split multi-line text (one item per line, optional "-", "*" or "•" bullets) into list items. */
export function toListItems(text?: string | null): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '').trim())
    .filter(Boolean);
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count.toLocaleString('en-US')} ${count === 1 ? singular : plural}`;
}

/** Best human-readable message from an API error (Spring's `{ message }` body), with a fallback. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'We could not reach the server. Check your connection and try again.';
    const data = error.response.data as { message?: string; fieldErrors?: Record<string, string> } | undefined;
    const field = data?.fieldErrors && Object.values(data.fieldErrors)[0];
    if (field) return field;
    if (data?.message) return data.message;
  }
  return fallback;
}
