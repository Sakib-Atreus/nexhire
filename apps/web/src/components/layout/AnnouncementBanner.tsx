'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2, Megaphone, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { usePublicSettings } from '@/hooks/useSettings';
import { cn } from '@/lib/cn';
import type { Announcement, AnnouncementTone } from '@/types';

const TONES: Record<AnnouncementTone, { box: string; icon: string; link: string; close: string; Icon: LucideIcon }> = {
  info: {
    box: 'bg-primary-50 border-primary-200 text-primary-900',
    icon: 'text-primary-600',
    link: 'text-primary-700 hover:text-primary-900 focus-visible:ring-primary-500',
    close: 'text-primary-500 hover:bg-primary-100 hover:text-primary-800 focus-visible:ring-primary-500',
    Icon: Megaphone,
  },
  success: {
    box: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    icon: 'text-emerald-600',
    link: 'text-emerald-700 hover:text-emerald-900 focus-visible:ring-emerald-500',
    close: 'text-emerald-600 hover:bg-emerald-100 hover:text-emerald-800 focus-visible:ring-emerald-500',
    Icon: CheckCircle2,
  },
  warning: {
    box: 'bg-amber-50 border-amber-200 text-amber-900',
    icon: 'text-amber-600',
    link: 'text-amber-800 hover:text-amber-950 focus-visible:ring-amber-500',
    close: 'text-amber-600 hover:bg-amber-100 hover:text-amber-800 focus-visible:ring-amber-500',
    Icon: AlertTriangle,
  },
};

const STORAGE_PREFIX = 'nexhire:announcement-dismissed:';

function storageKey(message: string) {
  return STORAGE_PREFIX + message.trim();
}

function readDismissed(message: string): boolean {
  try {
    return window.sessionStorage.getItem(storageKey(message)) === '1';
  } catch {
    return false;
  }
}

function writeDismissed(message: string) {
  try {
    window.sessionStorage.setItem(storageKey(message), '1');
  } catch {
    // Storage blocked (private mode etc.): the banner stays hidden for this page view only.
  }
}

type Variant = 'card' | 'bar';

interface BannerViewProps {
  announcement: Announcement;
  onDismiss?: () => void;
  className?: string;
  /** `card`: rounded box inside page content. `bar`: full-width strip (landing page, under the header). */
  variant?: Variant;
}

/** Pure presentation: used by the live banner and the settings preview. */
function BannerView({ announcement, onDismiss, className, variant = 'card' }: BannerViewProps) {
  const tone = TONES[announcement.tone] ?? TONES.info;
  const { Icon } = tone;
  const href = announcement.linkUrl?.trim();
  const label = announcement.linkLabel?.trim() || 'Learn more';
  const external = !!href && !href.startsWith('/');
  const linkClass = cn(
    'inline-flex items-center gap-1 font-semibold underline underline-offset-2 whitespace-nowrap rounded',
    'focus:outline-none focus-visible:ring-2',
    tone.link
  );

  return (
    <div
      role="region"
      aria-label="Announcement"
      className={cn(variant === 'bar' ? 'border-b' : 'border rounded-xl', tone.box, className)}
    >
      <div className={cn('flex items-start gap-3 py-3', variant === 'bar' ? 'max-w-7xl mx-auto px-4 sm:px-6' : 'px-4')}>
        <Icon className={cn('w-5 h-5 flex-shrink-0 mt-px', tone.icon)} aria-hidden />
        <p className="flex-1 min-w-0 text-sm leading-relaxed break-words">
          {announcement.message}
          {href && (
            <>
              {' '}
              {external ? (
                <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  {label}
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              ) : (
                <Link href={href} className={linkClass}>
                  {label}
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden />
                </Link>
              )}
            </>
          )}
        </p>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss announcement"
            className={cn('-m-1 p-1 rounded-md flex-shrink-0 focus:outline-none focus-visible:ring-2', tone.close)}
          >
            <X className="w-4 h-4" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Site-wide announcement from admin settings. Renders nothing unless enabled with a message.
 * Dismissal is remembered for the browser session, keyed by message text (a new message shows again).
 * Pass `preview` to render a given announcement without fetching or a dismiss button.
 */
export function AnnouncementBanner({ preview, className, variant }: {
  preview?: Announcement;
  className?: string;
  variant?: Variant;
}) {
  if (preview) {
    if (!preview.message?.trim()) return null;
    return <BannerView announcement={preview} className={className} variant={variant} />;
  }
  return <LiveAnnouncementBanner className={className} variant={variant} />;
}

function LiveAnnouncementBanner({ className, variant }: { className?: string; variant?: Variant }) {
  const { data } = usePublicSettings();
  const announcement = data?.announcement;
  const message = announcement?.message?.trim() ?? '';
  // Start hidden-unknown until sessionStorage has been read on the client (avoids a flash after dismissal).
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    if (message) setDismissed(readDismissed(message));
  }, [message]);

  if (!announcement?.enabled || !message || dismissed !== false) return null;

  return (
    <BannerView
      announcement={announcement}
      className={className}
      variant={variant}
      onDismiss={() => {
        writeDismissed(message);
        setDismissed(true);
      }}
    />
  );
}
