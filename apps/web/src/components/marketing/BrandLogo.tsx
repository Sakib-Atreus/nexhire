import Link from 'next/link';
import { Briefcase } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Briefcase mark + "NexHire" wordmark, linking home. */
export function BrandLogo({ tone = 'dark', className }: { tone?: 'dark' | 'light'; className?: string }) {
  return (
    <Link
      href="/"
      aria-label="NexHire home"
      className={cn(
        'inline-flex items-center gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        className
      )}
    >
      <span className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-sm">
        <Briefcase className="w-4 h-4 text-white" aria-hidden />
      </span>
      <span className={cn('text-lg font-bold tracking-tight', tone === 'light' ? 'text-white' : 'text-slate-900')}>
        NexHire
      </span>
    </Link>
  );
}
