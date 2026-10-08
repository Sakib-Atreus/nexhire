import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/States';
import { cn } from '@/lib/cn';

/** KPI tile. `value` undefined renders a skeleton; null renders an em dash (unavailable). */
export function StatCard({ label, value, hint, icon: Icon, tone = 'bg-primary-50 text-primary-600', href }: {
  label: string;
  value: number | string | null | undefined;
  hint?: string;
  icon: LucideIcon;
  tone?: string;
  href?: string;
}) {
  const body = (
    <Card className={cn('p-5 h-full', href && 'transition-shadow group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-primary-500')}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-fg-muted">{label}</p>
        <span className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', tone)}>
          <Icon className="w-[18px] h-[18px]" aria-hidden />
        </span>
      </div>
      {value === undefined ? (
        <Skeleton className="h-8 w-16 mt-2" />
      ) : (
        <p className="mt-1 text-2xl font-bold tracking-tight text-fg tabular-nums">
          {value === null ? '—' : typeof value === 'number' ? value.toLocaleString('en-US') : value}
        </p>
      )}
      {(hint || href) && (
        <p className="mt-1 text-xs text-fg-muted flex items-center gap-1">
          {hint}
          {href && <ChevronRight className="w-3 h-3 ml-auto text-fg-subtle group-hover:text-primary-600" aria-hidden />}
        </p>
      )}
    </Card>
  );
  return href ? (
    <Link href={href} className="group block rounded-xl focus:outline-none">{body}</Link>
  ) : body;
}
