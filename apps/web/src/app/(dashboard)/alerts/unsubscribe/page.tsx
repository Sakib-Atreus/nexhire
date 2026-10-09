'use client';

import { Suspense, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BellOff, LinkIcon } from 'lucide-react';
import { useUnsubscribeAlert } from '@/hooks/useCandidate';
import { Card } from '@/components/ui/Card';
import { buttonClasses } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/States';

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<Loading />}>
      <Unsubscribe />
    </Suspense>
  );
}

function Loading() {
  return (
    <Shell>
      <div className="flex flex-col items-center gap-3 py-6" role="status">
        <Spinner className="w-6 h-6" />
        <p className="text-sm text-fg-muted">Unsubscribing…</p>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md py-8 sm:py-12">
      <Card className="p-6 sm:p-8 text-center">{children}</Card>
    </div>
  );
}

function Links() {
  return (
    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
      <Link href="/jobs" className={buttonClasses('secondary')}>Browse jobs</Link>
      <Link href="/alerts" className={buttonClasses('primary')}>Manage alerts</Link>
    </div>
  );
}

function Unsubscribe() {
  const token = useSearchParams().get('token')?.trim() ?? '';
  const { mutate, data: name, isError, isSuccess } = useUnsubscribeAlert();
  // StrictMode runs effects twice in development; the token must only be sent once.
  const sent = useRef(false);

  useEffect(() => {
    if (!token || sent.current) return;
    sent.current = true;
    mutate(token);
  }, [token, mutate]);

  if (!token || isError) {
    return (
      <Shell>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50">
          <LinkIcon className="h-6 w-6 text-rose-500" aria-hidden />
        </div>
        <h1 className="text-lg font-semibold text-fg">This unsubscribe link doesn&apos;t work</h1>
        <p className="mt-2 text-sm text-fg-muted">
          It may be incomplete or the alert may have been deleted. Sign in to manage your job alerts directly.
        </p>
        <Links />
      </Shell>
    );
  }

  if (!isSuccess) return <Loading />;

  return (
    <Shell>
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
        <BellOff className="h-6 w-6 text-emerald-600" aria-hidden />
      </div>
      <h1 className="text-lg font-semibold text-fg break-words">You&apos;ve unsubscribed from &ldquo;{name}&rdquo;</h1>
      <p className="mt-2 text-sm text-fg-muted">
        This alert is now paused, so you won&apos;t get emails or notifications for it. You can turn it back on from your job alerts at any time.
      </p>
      <Links />
    </Shell>
  );
}
