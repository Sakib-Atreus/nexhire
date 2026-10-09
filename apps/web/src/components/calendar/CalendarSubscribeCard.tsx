'use client';

import { useState } from 'react';
import { Check, Copy, Link2, RefreshCw, Rss } from 'lucide-react';
import { useCalendarFeed, useResetCalendarFeed } from '@/hooks/useHiring';
import { toast } from '@/store/toastStore';
import { getErrorMessage } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { Button, buttonClasses } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/States';

/**
 * Private iCal link: Google Calendar, Outlook and Apple Calendar keep NexHire interviews in sync
 * (reschedules and cancellations included). Anyone with the link can see the interviews, so it can be reset.
 */
export function CalendarSubscribeCard() {
  const { data: url, isLoading, isError } = useCalendarFeed();
  const reset = useResetCalendarFeed();
  const [copied, setCopied] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const webcal = url?.replace(/^https?:\/\//, 'webcal://');
  const googleAdd = url ? `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal ?? url)}` : undefined;
  const outlookAdd = url
    ? `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(url)}&name=${encodeURIComponent('NexHire interviews')}`
    : undefined;

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Couldn’t copy. Select the link and copy it manually.');
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
          <Rss className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-fg">Sync with your calendar</h2>
          <p className="mt-0.5 text-xs text-fg-muted">
            Subscribe once and new, moved and cancelled interviews update automatically.
          </p>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="mt-4 h-9 w-full" />
      ) : isError || !url ? (
        <p className="mt-4 text-xs text-rose-700">Couldn’t load your calendar link.</p>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted px-2.5 py-2 ring-1 ring-inset ring-line">
            <Link2 className="h-3.5 w-3.5 flex-shrink-0 text-fg-subtle" aria-hidden />
            <input
              readOnly
              value={url}
              aria-label="Calendar subscription link"
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 bg-transparent text-xs text-fg-tertiary outline-none"
            />
            <button
              type="button"
              onClick={copy}
              className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-primary-700 hover:bg-primary-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <a href={googleAdd} target="_blank" rel="noopener noreferrer" className={buttonClasses('secondary', 'sm', 'justify-center')}>Google</a>
            <a href={outlookAdd} target="_blank" rel="noopener noreferrer" className={buttonClasses('secondary', 'sm', 'justify-center')}>Outlook</a>
            <a href={webcal} className={buttonClasses('secondary', 'sm', 'justify-center')}>Apple</a>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-line-subtle pt-3">
            <p className="text-[11px] leading-4 text-fg-muted">Keep this link private. Calendars refresh it every few hours.</p>
            <Button variant="ghost" size="sm" onClick={() => setConfirmReset(true)} className="flex-shrink-0">
              <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Reset
            </Button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() =>
          reset.mutate(undefined, {
            onSuccess: () => {
              setConfirmReset(false);
              toast.success('New calendar link created. Re-subscribe with the new link.');
            },
            onError: (e) => toast.error(getErrorMessage(e)),
          })
        }
        loading={reset.isPending}
        title="Reset your calendar link?"
        description="The current link stops working right away. Calendars subscribed with it will stop updating until you add the new link."
        confirmLabel="Reset link"
      />
    </Card>
  );
}
