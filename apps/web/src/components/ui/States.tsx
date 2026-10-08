import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';
import { getErrorMessage } from '@/lib/format';

export function EmptyState({ icon: Icon, title, description, action, className }: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center text-center px-6 py-14', className)}>
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-slate-400" aria-hidden />
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-500 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Shown when a query fails. Pass the query's `error` and `refetch`. */
export function ErrorState({ title = 'Something went wrong', error, onRetry, retrying, className }: {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}) {
  return (
    <div role="alert" className={cn('flex flex-col items-center text-center px-6 py-14', className)}>
      <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-rose-500" aria-hidden />
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 max-w-sm">
        {getErrorMessage(error, 'We could not load this content. Please try again in a moment.')}
      </p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry} loading={retrying}>
          {!retrying && <RefreshCw className="w-3.5 h-3.5" aria-hidden />}
          Try again
        </Button>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-slate-200/70', className)} aria-hidden />;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5 animate-spin text-primary-600', className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}
