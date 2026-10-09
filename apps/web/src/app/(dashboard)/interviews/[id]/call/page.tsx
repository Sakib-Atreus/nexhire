'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Clock, LogOut, RotateCcw, ShieldCheck, Video } from 'lucide-react';
import type { DailyCall, DailyThemeConfig } from '@daily-co/daily-js';
import { useVideoJoin } from '@/hooks/useHiring';
import { useThemeStore } from '@/store/themeStore';
import { getErrorMessage } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { Button, buttonClasses } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/States';
import { formatTimeRange, formatWeekdayDate } from '@/components/interviews/interviewUtils';

const THEMES: Record<'light' | 'dark', DailyThemeConfig> = {
  light: {
    colors: {
      accent: '#4f46e5', accentText: '#ffffff', background: '#ffffff', backgroundAccent: '#f1f5f9', baseText: '#0f172a',
      border: '#e2e8f0', mainAreaBg: '#0f172a', mainAreaBgAccent: '#1e293b', mainAreaText: '#ffffff', supportiveText: '#64748b',
    },
  },
  dark: {
    colors: {
      accent: '#6366f1', accentText: '#ffffff', background: '#0f172a', backgroundAccent: '#1e293b', baseText: '#f1f5f9',
      border: '#334155', mainAreaBg: '#020617', mainAreaBgAccent: '#0f172a', mainAreaText: '#ffffff', supportiveText: '#94a3b8',
    },
  },
};

type CallState = 'joining' | 'in-call' | 'left' | 'error';

/** The interview's private NexHire video room (Daily Prebuilt), joined with a personal token. */
export default function InterviewCallPage() {
  const { id } = useParams<{ id: string }>();
  const join = useVideoJoin(id);
  const resolvedTheme = useThemeStore((s) => s.resolved);
  const containerRef = useRef<HTMLDivElement>(null);
  const callRef = useRef<DailyCall | null>(null);
  const [state, setState] = useState<CallState>('joining');
  const [callError, setCallError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const details = join.data;

  useEffect(() => {
    if (!details || !containerRef.current) return;
    let cancelled = false;
    const container = containerRef.current;
    setState('joining');
    setCallError(null);

    (async () => {
      const { default: DailyIframe } = await import('@daily-co/daily-js');
      // Only one call object may exist (React may run this effect twice in development).
      await DailyIframe.getCallInstance()?.destroy();
      if (cancelled) return;
      const call = DailyIframe.createFrame(container, {
        iframeStyle: { width: '100%', height: '100%', border: '0', borderRadius: '0' },
        showLeaveButton: true,
        showFullscreenButton: true,
        theme: THEMES[useThemeStore.getState().resolved],
      });
      callRef.current = call;
      call
        .on('joined-meeting', () => setState('in-call'))
        .on('left-meeting', () => setState((s) => (s === 'error' ? s : 'left')))
        .on('error', (e) => {
          setCallError(e?.errorMsg ?? 'The call ended unexpectedly.');
          setState('error');
        });
      try {
        await call.join({ url: details.roomUrl, token: details.token, userName: details.userName });
      } catch (e) {
        if (!cancelled) {
          setCallError(getErrorMessage(e, 'Couldn’t connect to the video room.'));
          setState('error');
        }
      }
    })();

    return () => {
      cancelled = true;
      const call = callRef.current;
      callRef.current = null;
      void call?.destroy();
    };
  }, [details, attempt]);

  // Follow the app theme while in the call.
  useEffect(() => {
    void callRef.current?.setTheme(THEMES[resolvedTheme]);
  }, [resolvedTheme]);

  const backHref = details?.owner ? '/interviews' : '/applications';

  if (join.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status">
        <Spinner className="h-8 w-8" />
        <span className="sr-only">Preparing your video room…</span>
      </div>
    );
  }

  if (join.isError || !details) {
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
          <Clock className="h-6 w-6" aria-hidden />
        </span>
        <h1 className="mt-4 text-lg font-semibold text-fg">You can’t join this call right now</h1>
        <p className="mt-1.5 text-sm text-fg-muted">{getErrorMessage(join.error, 'This video room isn’t available.')}</p>
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="secondary" onClick={() => join.refetch()} loading={join.isRefetching}>Try again</Button>
          <Link href="/calendar" className={buttonClasses('primary')}>Open calendar</Link>
        </div>
      </Card>
    );
  }

  const subtitle = details.owner ? `${details.candidateName} · ${details.jobTitle}` : `${details.jobTitle} · ${details.companyName}`;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={backHref} aria-label="Back" className={buttonClasses('ghost', 'sm', 'h-9 w-9 px-0')}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Link>
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white">
            <Video className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-fg">Interview: {subtitle}</h1>
            <p className="truncate text-sm text-fg-muted">
              {formatWeekdayDate(details.scheduledAt)} · {formatTimeRange(details)}
            </p>
          </div>
        </div>
        <p className="inline-flex items-center gap-1.5 text-xs text-fg-muted">
          <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden />
          Private room · only invited people can join
          {details.owner && <span className="ml-1 rounded bg-primary-50 px-1.5 py-0.5 font-medium text-primary-700">Host</span>}
        </p>
      </div>

      <Card className="relative overflow-hidden bg-slate-950">
        <div ref={containerRef} className="h-[calc(100dvh-15rem)] min-h-[420px] w-full lg:h-[calc(100dvh-13rem)]" />

        {state === 'joining' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950 text-slate-300" role="status">
            <Spinner className="h-8 w-8" />
            <p className="text-sm">Connecting to the video room…</p>
          </div>
        )}

        {(state === 'left' || state === 'error') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 px-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
              <LogOut className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-white">{state === 'left' ? 'You left the call' : 'Call disconnected'}</h2>
            <p className="mt-1 max-w-sm text-sm text-slate-400">
              {state === 'error' ? callError : 'You can rejoin while the room is open (until an hour after the scheduled end).'}
            </p>
            <div className="mt-6 flex gap-2">
              <Button onClick={() => setAttempt((a) => a + 1)}>
                <RotateCcw className="h-4 w-4" aria-hidden /> Rejoin
              </Button>
              <Link href={backHref} className={buttonClasses('secondary')}>Back to NexHire</Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
