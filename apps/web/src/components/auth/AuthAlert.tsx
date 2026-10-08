import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/cn';

const TONES = {
  error: { cls: 'bg-rose-50 border-rose-200 text-rose-700', Icon: AlertCircle },
  info: { cls: 'bg-sky-50 border-sky-200 text-sky-800', Icon: Info },
  success: { cls: 'bg-emerald-50 border-emerald-200 text-emerald-800', Icon: CheckCircle2 },
} as const;

/** Inline banner for form-level messages on auth pages. */
export function AuthAlert({ tone = 'error', children, className }: {
  tone?: keyof typeof TONES;
  children: ReactNode;
  className?: string;
}) {
  const { cls, Icon } = TONES[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex gap-2.5 rounded-lg border px-3.5 py-3 text-sm', cls, className)}
    >
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />
      <div className="min-w-0 leading-relaxed">{children}</div>
    </div>
  );
}
