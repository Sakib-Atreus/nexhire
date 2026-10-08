import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Small pill. Pass a style from lib/constants (e.g. JOB_STATUS_STYLES[status]) as `tone`. */
export function Badge({ children, tone = 'bg-slate-100 text-slate-700 ring-slate-500/20', className }: {
  children: ReactNode;
  tone?: string;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap', tone, className)}>
      {children}
    </span>
  );
}
