'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { nameInitials } from '@/lib/format';

const SIZES = { xs: 'w-7 h-7 text-[11px]', sm: 'w-9 h-9 text-xs', md: 'w-11 h-11 text-sm', lg: 'w-16 h-16 text-lg', xl: 'w-24 h-24 text-2xl' };

/** Round user avatar: image when available, initials otherwise. */
export function Avatar({ name, src, size = 'sm', className }: {
  name?: string | null;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  // Remember which URL failed, so a new URL (e.g. after an upload) is tried again.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = !!src && failedSrc === src;
  const base = cn('rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden', SIZES[size], className);
  if (src && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name ?? ''} loading="lazy" decoding="async" className={cn(base, 'object-cover')} onError={() => setFailedSrc(src)} />;
  }
  return (
    <span className={cn(base, 'bg-primary-100 text-primary-700 font-semibold')} aria-hidden={!name} title={name ?? undefined}>
      {nameInitials(name)}
    </span>
  );
}
