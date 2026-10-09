'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import type { DatesSetArg, EventContentArg } from '@fullcalendar/core';
import { Video } from 'lucide-react';
import type { Interview } from '@/types';
import { cn } from '@/lib/cn';
import { INTERVIEW_TYPE_ICONS } from '@/components/interviews/InterviewParts';
import { formatTime, interviewEnd } from '@/components/interviews/interviewUtils';
import { eventTone } from './eventTone';

export type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';

export interface CalendarHandle {
  prev(): void;
  next(): void;
  today(): void;
  changeView(view: CalendarView): void;
  gotoDate(date: Date): void;
}

interface Props {
  interviews: Interview[];
  recruiter: boolean;
  initialView: CalendarView;
  /** Current view: time grids get a fixed, scrollable height; month and agenda grow with their content. */
  view: CalendarView;
  onRangeChange(range: { start: Date; end: Date; title: string; view: CalendarView }): void;
  onSelect(interview: Interview): void;
}

/** Month / week / day / agenda grid. Rendering of each event is ours, so it matches the rest of the app. */
const InterviewCalendar = forwardRef<CalendarHandle, Props>(function InterviewCalendar(
  { interviews, recruiter, initialView, view, onRangeChange, onSelect },
  ref
) {
  const calRef = useRef<FullCalendar>(null);
  useImperativeHandle(ref, () => ({
    prev: () => calRef.current?.getApi().prev(),
    next: () => calRef.current?.getApi().next(),
    today: () => calRef.current?.getApi().today(),
    changeView: (view) => {
      calRef.current?.getApi().changeView(view);
      // The time grid gets its fixed height on the next render; scroll once it has.
      if (view.startsWith('timeGrid')) setTimeout(() => calRef.current?.getApi().scrollToTime(scrollTime), 50);
    },
    gotoDate: (date) => calRef.current?.getApi().gotoDate(date),
  }));

  const byId = new Map(interviews.map((i) => [i.id, i]));
  // FullCalendar keeps event elements across renders; read the latest data and callback at event time.
  const latest = useRef({ byId, onSelect });
  latest.current = { byId, onSelect };
  const events = interviews.map((i) => ({
    id: i.id,
    title: recruiter ? i.candidateName : i.jobTitle,
    start: i.scheduledAt,
    end: interviewEnd(i).toISOString(),
  }));

  function renderEvent(arg: EventContentArg) {
    const i = byId.get(arg.event.id);
    if (!i) return null;
    const tone = eventTone(i);
    const TypeIcon = INTERVIEW_TYPE_ICONS[i.type];
    const subtitle = recruiter ? i.jobTitle : i.companyName;
    const viewType = arg.view.type;

    if (viewType.startsWith('list')) {
      return (
        <span className="flex min-w-0 items-center gap-2.5">
          <TypeIcon className="h-4 w-4 flex-shrink-0 text-fg-subtle" aria-hidden />
          <span className="min-w-0">
            <span className={cn('block truncate font-medium text-fg', i.status === 'CANCELLED' && 'line-through text-fg-muted')}>
              {arg.event.title}
            </span>
            <span className="block truncate text-xs text-fg-muted">{subtitle}</span>
          </span>
          {i.hasVideoRoom && <Video className="ml-auto h-3.5 w-3.5 flex-shrink-0 text-primary-600" aria-label="NexHire video room" />}
        </span>
      );
    }

    if (viewType === 'dayGridMonth') {
      return (
        <span className={cn('flex w-full min-w-0 items-center gap-1.5 rounded-md px-1.5 py-[3px] text-[11px] leading-4 transition-colors', tone.chip)}>
          <span className={cn('h-1.5 w-1.5 flex-shrink-0 rounded-full', tone.accent)} aria-hidden />
          <span className="flex-shrink-0 font-semibold tabular-nums">{compactTime(i.scheduledAt)}</span>
          <span className="truncate">{arg.event.title}</span>
        </span>
      );
    }

    // Week / day: a block sized to the duration.
    const short = i.durationMinutes < 45;
    return (
      <span className={cn('relative flex h-full w-full overflow-hidden rounded-lg pl-2.5 pr-1.5 py-1 text-xs transition-colors', tone.chip)}>
        <span className={cn('absolute inset-y-0 left-0 w-1', tone.accent)} aria-hidden />
        <span className="min-w-0">
          <span className="flex items-center gap-1 font-semibold leading-4">
            <TypeIcon className="h-3 w-3 flex-shrink-0 opacity-70" aria-hidden />
            <span className="truncate">{arg.event.title}</span>
          </span>
          {!short && <span className="block truncate leading-4 opacity-80">{subtitle}</span>}
          <span className="block truncate leading-4 opacity-70 tabular-nums">
            {formatTime(i.scheduledAt)} – {formatTime(interviewEnd(i).toISOString())}
          </span>
        </span>
      </span>
    );
  }

  return (
    <div className="nh-calendar">
      <FullCalendar
        ref={calRef}
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
        initialView={initialView}
        headerToolbar={false}
        height={view.startsWith('timeGrid') ? 720 : 'auto'}
        events={events}
        eventContent={renderEvent}
        eventClick={(arg) => {
          arg.jsEvent.preventDefault();
          const i = latest.current.byId.get(arg.event.id);
          if (i) latest.current.onSelect(i);
        }}
        eventDidMount={(arg) => {
          // Keyboard access: events are focusable and open with Enter/Space.
          const id = arg.event.id;
          arg.el.setAttribute('tabindex', '0');
          arg.el.setAttribute('role', 'button');
          arg.el.setAttribute('aria-label', `${arg.event.title}, ${arg.event.start?.toLocaleString() ?? ''}`);
          arg.el.onkeydown = (e) => {
            const i = latest.current.byId.get(id);
            if ((e.key === 'Enter' || e.key === ' ') && i) {
              e.preventDefault();
              latest.current.onSelect(i);
            }
          };
        }}
        datesSet={(arg: DatesSetArg) =>
          onRangeChange({ start: arg.start, end: arg.end, title: arg.view.title, view: arg.view.type as CalendarView })
        }
        nowIndicator
        dayMaxEventRows={3}
        firstDay={0}
        scrollTime={scrollTime}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        slotDuration="00:30:00"
        allDaySlot={false}
        expandRows
        eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
        slotLabelFormat={{ hour: 'numeric', meridiem: 'short' }}
        dayHeaderFormat={{ weekday: 'short' }}
        views={{
          timeGridWeek: { dayHeaderFormat: { weekday: 'short', day: 'numeric' } },
          timeGridDay: { dayHeaderFormat: { weekday: 'long', month: 'short', day: 'numeric' } },
          listWeek: { listDayFormat: { weekday: 'long' }, listDaySideFormat: { month: 'short', day: 'numeric' } },
        }}
        noEventsContent={() => <span className="text-sm text-fg-muted">No interviews this week</span>}
      />
    </div>
  );
});

export default InterviewCalendar;

/** "3:54p", "10a" for month cells. */
function compactTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours() % 12 || 12;
  const m = d.getMinutes();
  return `${h}${m ? `:${String(m).padStart(2, '0')}` : ''}${d.getHours() < 12 ? 'a' : 'p'}`;
}

/** Open time grids an hour before now (within working hours), so today's interviews are in view. */
const scrollTime = (() => {
  const h = Math.min(Math.max(new Date().getHours() - 1, 7), 17);
  return `${String(h).padStart(2, '0')}:00:00`;
})();
