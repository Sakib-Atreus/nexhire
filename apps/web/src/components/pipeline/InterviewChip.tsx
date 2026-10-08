import { CalendarClock, CalendarX2, CheckCircle2, RefreshCw, type LucideIcon } from 'lucide-react';
import type { InterviewResponse } from '@/types';
import { cn } from '@/lib/cn';
import { formatDateTime } from './stages';

const RESPONSE_CHIP: Record<InterviewResponse, { icon: LucideIcon; tone: string; suffix: string }> = {
  AWAITING: { icon: CalendarClock, tone: 'bg-slate-100 text-slate-700 ring-slate-500/20', suffix: 'awaiting' },
  ACCEPTED: { icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', suffix: 'confirmed' },
  NEW_TIME_REQUESTED: { icon: RefreshCw, tone: 'bg-amber-50 text-amber-800 ring-amber-600/20', suffix: 'new time requested' },
  DECLINED: { icon: CalendarX2, tone: 'bg-rose-50 text-rose-700 ring-rose-600/20', suffix: 'declined' },
};

/**
 * Next scheduled interview with the candidate's response, e.g. "Interview Oct 10, 2:30 PM · awaiting"
 * (local time). New time requested / declined replace the date because they need the recruiter's action.
 */
export function InterviewChip({ at, response, className }: { at?: string | null; response?: InterviewResponse | null; className?: string }) {
  if (!at) return null;
  const r = RESPONSE_CHIP[response ?? 'AWAITING'] ?? RESPONSE_CHIP.AWAITING;
  const Icon = r.icon;
  const needsAction = response === 'NEW_TIME_REQUESTED' || response === 'DECLINED';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset whitespace-nowrap',
        r.tone,
        className
      )}
      title={`Interview ${formatDateTime(at)} · ${r.suffix}`}
    >
      <Icon className="w-3 h-3 flex-shrink-0" aria-hidden />
      {needsAction ? (
        <span>
          {response === 'NEW_TIME_REQUESTED' ? 'New time requested' : 'Interview declined'}
          <span className="sr-only"> for the interview on <time dateTime={at}>{formatDateTime(at)}</time></span>
        </span>
      ) : (
        <span>
          Interview <time dateTime={at}>{formatDateTime(at)}</time> · {r.suffix}
        </span>
      )}
    </span>
  );
}
