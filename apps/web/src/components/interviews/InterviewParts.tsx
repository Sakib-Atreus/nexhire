'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { Building2, CalendarPlus, ChevronDown, Download, ExternalLink, Globe, MapPin, Phone, Video, type LucideIcon } from 'lucide-react';
import type { Interview, InterviewType } from '@/types';
import { INTERVIEW_TYPE_LABELS } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { Button, buttonClasses } from '@/components/ui/Button';
import {
  callPath, downloadIcs, formatTime, googleCalendarUrl, isHttpUrl, outlookCalendarUrl, telHref, timeZoneAbbr, videoRoomOpensAt, videoRoomState,
} from './interviewUtils';

/** Current time, refreshed every `intervalMs` (for buttons that unlock at a set time). */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export const INTERVIEW_TYPE_ICONS: Record<InterviewType, LucideIcon> = {
  VIDEO: Video,
  PHONE: Phone,
  ONSITE: Building2,
};

/** Small tinted square with the interview type icon. */
export function InterviewTypeIcon({ type, className }: { type: InterviewType; className?: string }) {
  const Icon = INTERVIEW_TYPE_ICONS[type];
  return (
    <span className={cn('inline-flex w-9 h-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600', className)}>
      <Icon className="w-4 h-4" aria-hidden />
    </span>
  );
}

/**
 * The viewer's time zone abbreviation. Computed after mount so server and client HTML match
 * (the server's time zone is not the viewer's).
 */
export function useTimeZoneAbbr(): string {
  const [tz, setTz] = useState('');
  useEffect(() => setTz(timeZoneAbbr()), []);
  return tz;
}

/** "Times are shown in your time zone (PDT)." — render once per page. */
export function TimeZoneNote({ className }: { className?: string }) {
  const tz = useTimeZoneAbbr();
  const [zone, setZone] = useState('');
  useEffect(() => {
    try {
      setZone(Intl.DateTimeFormat().resolvedOptions().timeZone ?? '');
    } catch {
      /* ignore */
    }
  }, []);
  if (!tz) return null;
  return (
    <p className={cn('inline-flex items-center gap-1.5 text-xs text-fg-muted', className)}>
      <Globe className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />
      <span>
        All times are in your time zone: <span className="font-medium text-fg-secondary">{tz}</span>
        {zone && zone !== tz && <span className="text-fg-subtle"> ({zone.replace(/_/g, ' ')})</span>}
      </span>
    </p>
  );
}

/** Location rendered as a link when it is a URL (video) or phone number; plain text otherwise. */
export function InterviewLocation({ interview, className }: { interview: Interview; className?: string }) {
  if (interview.hasVideoRoom) {
    return (
      <p className={cn('flex items-start gap-1.5 text-sm text-fg-tertiary', className)}>
        <Video className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-fg-subtle" aria-hidden />
        NexHire video room · opens 15 min before
      </p>
    );
  }
  const loc = interview.location?.trim();
  if (!loc) {
    return (
      <p className={cn('flex items-start gap-1.5 text-sm text-fg-muted', className)}>
        <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden />
        {interview.type === 'VIDEO' ? 'Video link to be shared' : interview.type === 'PHONE' ? 'Phone details to be shared' : 'Location to be shared'}
      </p>
    );
  }
  const Icon = interview.type === 'VIDEO' ? Video : interview.type === 'PHONE' ? Phone : MapPin;
  const tel = interview.type === 'PHONE' ? telHref(loc) : null;
  return (
    <p className={cn('flex items-start gap-1.5 text-sm text-fg-tertiary min-w-0', className)}>
      <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-fg-subtle" aria-hidden />
      {isHttpUrl(loc) ? (
        <a href={loc} target="_blank" rel="noopener noreferrer" className="min-w-0 break-all text-primary-600 hover:text-primary-700 hover:underline">
          {loc}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : tel ? (
        <a href={tel} className="text-primary-600 hover:text-primary-700 hover:underline">{loc}</a>
      ) : (
        <span className="min-w-0 break-words">{loc}</span>
      )}
    </p>
  );
}

/**
 * "Join" button for video interviews: the built-in NexHire room (unlocks 15 minutes before the start),
 * or the pasted meeting link.
 */
export function JoinButton({ interview, size = 'sm' }: { interview: Interview; size?: 'sm' | 'md' }) {
  const now = useNow();
  if (interview.type !== 'VIDEO' || interview.status !== 'SCHEDULED') return null;
  if (interview.hasVideoRoom) {
    const state = videoRoomState(interview, now);
    if (state === 'closed') return null;
    if (state === 'early') {
      return (
        <span
          className={buttonClasses('secondary', size, 'cursor-default opacity-80 hover:bg-surface')}
          title="The video room opens 15 minutes before the interview"
        >
          <Video className="w-3.5 h-3.5" aria-hidden /> Opens {formatTime(videoRoomOpensAt(interview))}
        </span>
      );
    }
    return (
      <Link href={callPath(interview.id)} className={buttonClasses('primary', size)}>
        <Video className="w-3.5 h-3.5" aria-hidden /> Join call
      </Link>
    );
  }
  const loc = interview.location?.trim();
  if (!isHttpUrl(loc)) return null;
  return (
    <a href={loc} target="_blank" rel="noopener noreferrer" className={buttonClasses('primary', size)}>
      <Video className="w-3.5 h-3.5" aria-hidden /> Join
      <ExternalLink className="w-3 h-3 opacity-70" aria-hidden />
      <span className="sr-only">video interview (opens in a new tab)</span>
    </a>
  );
}

/** "Add to calendar" menu: Google Calendar, Outlook.com, or an .ics file (Apple Calendar, Outlook desktop, others). */
export function AddToCalendarButton({ interview, size = 'sm', variant = 'secondary', align = 'right' }: {
  interview: Interview;
  size?: 'sm' | 'md';
  variant?: 'secondary' | 'ghost';
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (interview.status !== 'SCHEDULED') return null;
  const label = INTERVIEW_TYPE_LABELS[interview.type];
  const itemCls =
    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-fg-secondary hover:bg-muted hover:text-fg focus:outline-none focus-visible:bg-muted';

  return (
    <div ref={rootRef} className="relative inline-block">
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Add interview for ${interview.jobTitle} to your calendar`}
      >
        <CalendarPlus className="w-3.5 h-3.5" aria-hidden /> Add to calendar
        <ChevronDown className="w-3.5 h-3.5 opacity-70" aria-hidden />
      </Button>
      {open && (
        <div
          id={menuId}
          className={cn(
            'absolute z-40 mt-1.5 w-56 rounded-xl bg-surface p-1.5 shadow-lg ring-1 ring-line',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          <a href={googleCalendarUrl(interview, label)} target="_blank" rel="noopener noreferrer" className={itemCls} onClick={() => setOpen(false)}>
            <CalendarBrandDot className="bg-[#4285F4]" /> Google Calendar
            <ExternalLink className="ml-auto h-3 w-3 text-fg-faint" aria-hidden />
          </a>
          <a href={outlookCalendarUrl(interview, label)} target="_blank" rel="noopener noreferrer" className={itemCls} onClick={() => setOpen(false)}>
            <CalendarBrandDot className="bg-[#0078D4]" /> Outlook.com
            <ExternalLink className="ml-auto h-3 w-3 text-fg-faint" aria-hidden />
          </a>
          <button
            type="button"
            className={itemCls}
            onClick={() => {
              downloadIcs(interview, label);
              setOpen(false);
            }}
          >
            <Download className="h-3.5 w-3.5 text-fg-subtle" aria-hidden /> Apple / other (.ics)
          </button>
        </div>
      )}
    </div>
  );
}

function CalendarBrandDot({ className }: { className: string }) {
  return <span className={cn('h-2.5 w-2.5 flex-shrink-0 rounded-sm', className)} aria-hidden />;
}
