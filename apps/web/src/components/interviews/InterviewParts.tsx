'use client';

import { useEffect, useState } from 'react';
import { Building2, CalendarPlus, ExternalLink, Globe, MapPin, Phone, Video, type LucideIcon } from 'lucide-react';
import type { Interview, InterviewType } from '@/types';
import { INTERVIEW_TYPE_LABELS } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { Button, buttonClasses } from '@/components/ui/Button';
import { downloadIcs, isHttpUrl, telHref, timeZoneAbbr } from './interviewUtils';

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

/** "Join" button for video interviews with a link. */
export function JoinButton({ interview, size = 'sm' }: { interview: Interview; size?: 'sm' | 'md' }) {
  const loc = interview.location?.trim();
  if (interview.type !== 'VIDEO' || !isHttpUrl(loc) || interview.status !== 'SCHEDULED') return null;
  return (
    <a href={loc} target="_blank" rel="noopener noreferrer" className={buttonClasses('primary', size)}>
      <Video className="w-3.5 h-3.5" aria-hidden /> Join
      <ExternalLink className="w-3 h-3 opacity-70" aria-hidden />
      <span className="sr-only">video interview (opens in a new tab)</span>
    </a>
  );
}

export function AddToCalendarButton({ interview, size = 'sm', variant = 'secondary' }: {
  interview: Interview;
  size?: 'sm' | 'md';
  variant?: 'secondary' | 'ghost';
}) {
  if (interview.status !== 'SCHEDULED') return null;
  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => downloadIcs(interview, INTERVIEW_TYPE_LABELS[interview.type])}
      aria-label={`Add interview for ${interview.jobTitle} to calendar (.ics file)`}
    >
      <CalendarPlus className="w-3.5 h-3.5" aria-hidden /> Add to calendar
    </Button>
  );
}
