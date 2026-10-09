'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { nameInitials } from '@/lib/format';

const SIZES = { sm: 'w-10 h-10 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-16 h-16 text-lg' };

// Stable tint per company so the initials fallback isn't the same color everywhere.
const TINTS = [
  'bg-indigo-50 text-indigo-700', 'bg-emerald-50 text-emerald-700', 'bg-amber-50 text-amber-700',
  'bg-sky-50 text-sky-700', 'bg-rose-50 text-rose-700', 'bg-violet-50 text-violet-700', 'bg-teal-50 text-teal-700',
];

function tint(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TINTS[h % TINTS.length];
}

/** Rounded-square company logo with an initials fallback when the URL is missing or broken. */
export function CompanyLogo({ name, src, size = 'md', className }: {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  // Remember which URL failed, so a new URL (e.g. after an upload) is tried again.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = !!src && failedSrc === src;
  const base = cn('rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden ring-1 ring-line', SIZES[size], className);
  if (src && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={`${name} logo`} loading="lazy" decoding="async" className={cn(base, 'object-cover bg-surface')} onError={() => setFailedSrc(src)} />;
  }
  return (
    <span className={cn(base, 'font-bold', tint(name))} aria-hidden>
      {nameInitials(name)}
    </span>
  );
}
