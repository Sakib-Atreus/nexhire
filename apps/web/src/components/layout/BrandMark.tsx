import Link from 'next/link';
import { Briefcase } from 'lucide-react';
import { cn } from '@/lib/cn';

export function BrandMark({ href, className, size = 'md' }: { href: string; className?: string; size?: 'sm' | 'md' }) {
  return (
    <Link href={href} className={cn('flex items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500', className)}>
      <span className={cn('bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0', size === 'sm' ? 'w-7 h-7' : 'w-8 h-8')}>
        <Briefcase className={cn('text-white', size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4')} aria-hidden />
      </span>
      <span className={cn('font-bold text-fg tracking-tight', size === 'sm' ? 'text-base' : 'text-xl')}>NexHire</span>
    </Link>
  );
}
