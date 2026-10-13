'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';

/** Link between sign-in and sign-up that keeps `?next=` (e.g. back to the job someone wanted to apply for). */
export function AuthSwitchLink({ to, children }: { to: '/login' | '/register'; children: ReactNode }) {
  const [href, setHref] = useState<string>(to);
  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get('next');
    if (next) setHref(`${to}?next=${encodeURIComponent(next)}`);
  }, [to]);
  return (
    <Link href={href} className="font-medium text-primary-600 hover:text-primary-700 hover:underline">
      {children}
    </Link>
  );
}
