import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { BadgeCheck, CheckCircle2, ChevronRight, EyeOff, Flag, UserX } from 'lucide-react';
import type { AdminOverview } from '@/types';
import { cn } from '@/lib/cn';

interface Item {
  href: string;
  count: number;
  singular: string;
  plural: string;
  icon: LucideIcon;
}

/** Queue of things an admin should act on. Highlighted (amber) only when something is waiting. */
export function AttentionStrip({ data }: { data: AdminOverview }) {
  const items: Item[] = [
    { href: '/admin/reports', count: data.openReports, singular: 'open report', plural: 'open reports', icon: Flag },
    { href: '/admin/users?role=RECRUITER&verified=false', count: data.unverifiedRecruiters, singular: 'unverified recruiter', plural: 'unverified recruiters', icon: BadgeCheck },
    { href: '/admin/users?status=suspended', count: data.suspendedUsers, singular: 'suspended user', plural: 'suspended users', icon: UserX },
    { href: '/admin/jobs?hidden=true', count: data.hiddenJobs, singular: 'hidden job', plural: 'hidden jobs', icon: EyeOff },
  ];

  return (
    <section aria-labelledby="needs-attention-heading">
      <h2 id="needs-attention-heading" className="text-sm font-semibold text-fg mb-3">Needs attention</h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map(({ href, count, singular, plural, icon: Icon }) => {
          const pending = count > 0;
          const StatusIcon = pending ? Icon : CheckCircle2;
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'group flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                  pending
                    ? 'border-amber-200 bg-amber-50 hover:bg-amber-100/70'
                    : 'border-line bg-surface hover:bg-muted',
                )}
              >
                <span
                  className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                    pending ? 'bg-amber-100 text-amber-700' : 'bg-subtle text-fg-subtle',
                  )}
                >
                  <StatusIcon className="w-[18px] h-[18px]" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block text-lg font-bold leading-tight tabular-nums', pending ? 'text-amber-900' : 'text-fg')}>
                    {count.toLocaleString('en-US')}
                  </span>
                  <span className={cn('block text-xs truncate', pending ? 'text-amber-800' : 'text-fg-muted')}>
                    {count === 1 ? singular : plural}
                    {!pending && <span className="text-fg-subtle"> · all clear</span>}
                  </span>
                </span>
                <ChevronRight
                  className={cn('w-4 h-4 flex-shrink-0', pending ? 'text-amber-500' : 'text-fg-faint group-hover:text-primary-600')}
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
