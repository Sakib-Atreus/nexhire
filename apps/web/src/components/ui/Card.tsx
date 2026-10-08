import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('bg-surface rounded-xl border border-line shadow-card', className)} {...props} />;
}

export function CardHeader({ title, description, action, className }: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 px-5 py-4 border-b border-line-subtle', className)}>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-fg">{title}</h2>
        {description && <p className="text-xs text-fg-muted mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  );
}
