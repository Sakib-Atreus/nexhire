'use client';

import { useEffect, useState } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import api from '@/lib/axios';

/** Requests pending this long are almost always the API host waking from sleep. */
const SLOW_AFTER_MS = 6_000;

/**
 * The API runs on a host that sleeps when idle; the first request after a pause can take up to a minute.
 * This pings the API as soon as the app loads (so it starts waking early) and, if requests stay pending,
 * explains the wait instead of leaving people looking at skeletons.
 */
export function ServerWakeNotice() {
  const busy = useIsFetching() + useIsMutating() > 0;
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    api.get('/actuator/health', { timeout: 70_000 }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!busy) {
      setSlow(false);
      return;
    }
    const t = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(t);
  }, [busy]);

  if (!slow) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-[65] mx-auto flex w-[calc(100%-2rem)] max-w-md items-start gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl ring-1 ring-white/10 lg:bottom-6"
    >
      <Loader2 className="mt-0.5 h-4 w-4 flex-shrink-0 animate-spin text-primary-300" aria-hidden />
      <p>
        <span className="font-semibold">Starting up the server…</span>
        <span className="block text-slate-300">It sleeps when nobody has used it for a while. This can take up to a minute; your page will load by itself.</span>
      </p>
    </div>
  );
}
