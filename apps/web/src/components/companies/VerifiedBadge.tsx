import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { COMPANY_SIZE_LABELS, COMPANY_SIZES } from '@/lib/constants';

/** Human label for a company size band, or null when unknown. */
export function companySizeLabel(size?: string | null): string | null {
  if (!size) return null;
  return (COMPANY_SIZES as readonly string[]).includes(size)
    ? COMPANY_SIZE_LABELS[size as (typeof COMPANY_SIZES)[number]]
    : size;
}

/** Emerald "Verified" pill used on company cards and profiles. */
export function VerifiedBadge({ label = 'Verified', className }: { label?: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 whitespace-nowrap',
        className
      )}
      title="Verified by NexHire"
    >
      <BadgeCheck className="w-3.5 h-3.5" aria-hidden />
      {label}
    </span>
  );
}

/** Compact check icon with a "Verified employer" tooltip and screen-reader text. */
export function VerifiedIcon({ className, label = 'Verified employer' }: { className?: string; label?: string }) {
  return (
    <span className={cn('inline-flex flex-shrink-0 text-emerald-600', className)} title={label}>
      <BadgeCheck className="w-4 h-4" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}
