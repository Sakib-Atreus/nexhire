'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { AlertTriangle, Info, Link2, MapPin, Phone, ShieldCheck, Video } from 'lucide-react';
import type { Interview, InterviewConflict, InterviewType } from '@/types';
import { getInterviewConflicts, useInterviewConflicts, useScheduleInterview, useUpdateInterview } from '@/hooks/useHiring';
import { INTERVIEW_TYPE_LABELS } from '@/lib/constants';
import { getErrorMessage } from '@/lib/format';
import { usePublicSettings } from '@/hooks/useSettings';
import { toast } from '@/store/toastStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select, Textarea } from '@/components/ui/Field';
import { cn } from '@/lib/cn';

const DURATIONS = [15, 30, 45, 60, 90];
const TYPES: { value: InterviewType; icon: typeof Video }[] = [
  { value: 'VIDEO', icon: Video },
  { value: 'PHONE', icon: Phone },
  { value: 'ONSITE', icon: MapPin },
];
const LOCATION_FIELD: Record<InterviewType, { label: string; placeholder: string; type: string }> = {
  VIDEO: { label: 'Meeting link', placeholder: 'https://meet.google.com/abc-defg-hij', type: 'url' },
  PHONE: { label: 'Phone number', placeholder: '+1 555 123 4567', type: 'tel' },
  ONSITE: { label: 'Address', placeholder: 'Office address, floor, who to ask for', type: 'text' },
};

const pad = (n: number) => String(n).padStart(2, '0');

/** "Fri, Oct 9 · 2:30 PM (45 min)" in the viewer's local time. */
export function slotLabel(iso: string, minutes: number) {
  const d = new Date(iso);
  const day = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${day} · ${time} (${minutes} min)`;
}

/** Local date + time inputs → ISO instant, or null when incomplete, invalid or in the past. */
function toFutureIso(date: string, time: string): string | null {
  if (!date || !time) return null;
  const when = new Date(`${date}T${time}`);
  if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) return null;
  return when.toISOString();
}

/** Amber warning listing the recruiter's own interviews that overlap a slot (the candidate's calendar is never checked). */
export function ConflictWarning({ conflicts, footer }: { conflicts: InterviewConflict[]; footer?: React.ReactNode }) {
  return (
    <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="flex items-center gap-2 text-sm font-semibold text-amber-800">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden />
        {conflicts.length === 1 ? 'You already have an interview at this time' : `You already have ${conflicts.length} interviews at this time`}
      </p>
      <ul className="mt-2 space-y-1.5 text-sm text-amber-900">
        {conflicts.map((c, i) => (
          <li key={c.interviewId ?? `${c.who}-${i}`}>
            {c.label} — {slotLabel(c.scheduledAt, c.durationMinutes)}
          </li>
        ))}
      </ul>
      {footer ?? <p className="mt-2 text-xs text-amber-800">Pick another time, or schedule anyway if the overlap is intentional.</p>}
    </div>
  );
}

/** "Jane" from "Jane Doe" (falls back to "The candidate"). */
export function firstNameOf(name: string) {
  return name.trim().split(/\s+/)[0] || 'The candidate';
}
const toDateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toTimeInput = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

function initialState(interview?: Interview) {
  if (interview) {
    const d = new Date(interview.scheduledAt);
    return {
      date: toDateInput(d),
      time: toTimeInput(d),
      duration: interview.durationMinutes || 30,
      type: interview.type,
      location: interview.location ?? '',
      message: interview.message ?? '',
      /** null = default (built-in room when video calls are available). */
      useRoom: null as boolean | null,
    };
  }
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return { date: toDateInput(tomorrow), time: '10:00', duration: 30, type: 'VIDEO' as InterviewType, location: '', message: '', useRoom: null as boolean | null };
}

/**
 * Schedule (or, with `interview`, reschedule/edit) an interview. Date and time are entered in the
 * viewer's local time and sent as an ISO instant.
 */
export function ScheduleInterviewModal({ open, onClose, applicationId, candidateName, interview }: {
  open: boolean;
  onClose: () => void;
  applicationId: string;
  candidateName: string;
  interview?: Interview;
}) {
  const schedule = useScheduleInterview(applicationId);
  const { data: settings } = usePublicSettings();
  const videoEnabled = !!settings?.videoEnabled;
  const update = useUpdateInterview();
  const formId = useId();
  const [form, setForm] = useState(() => initialState(interview));
  const [error, setError] = useState<string | null>(null);
  // Clashes reported by the server on save (covers anything booked after the live check ran).
  const [serverConflicts, setServerConflicts] = useState<InterviewConflict[] | null>(null);

  useEffect(() => {
    if (open) {
      setForm(initialState(interview));
      setError(null);
      setServerConflicts(null);
    }
  }, [open, interview]);

  // Live clash check, debounced so typing a time doesn't fire a request per keystroke.
  const slotIso = useMemo(() => toFutureIso(form.date, form.time), [form.date, form.time]);
  const [debounced, setDebounced] = useState({ start: slotIso, duration: form.duration });
  useEffect(() => {
    const t = setTimeout(() => setDebounced({ start: slotIso, duration: form.duration }), 400);
    return () => clearTimeout(t);
  }, [slotIso, form.duration]);
  useEffect(() => setServerConflicts(null), [slotIso, form.duration]);
  const unchangedSlot = !!interview && slotIso === new Date(interview.scheduledAt).toISOString() && form.duration === interview.durationMinutes;
  const live = useInterviewConflicts(
    open && !unchangedSlot ? applicationId : '',
    debounced.start,
    debounced.duration,
    interview?.id
  );
  const conflicts = serverConflicts ?? (!unchangedSlot && debounced.start === slotIso ? live.data ?? [] : []);
  const hasConflicts = conflicts.length > 0;

  const pending = schedule.isPending || update.isPending;
  const loc = LOCATION_FIELD[form.type];
  const hasRoom = !!interview?.hasVideoRoom && form.type === 'VIDEO';
  // Built-in room: new VIDEO interviews (or ones without a room yet) when the site has video calls set up.
  const wantsRoom = form.type === 'VIDEO' && !hasRoom && videoEnabled && (form.useRoom ?? !interview?.location);
  const showLocation = !(form.type === 'VIDEO' && (hasRoom || wantsRoom));
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const firstName = firstNameOf(candidateName);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // Shown clashes + submit = the user chose "Schedule anyway".
    const allowConflicts = hasConflicts || undefined;
    if (!form.date || !form.time) return setError('Choose a date and time.');
    const when = new Date(`${form.date}T${form.time}`);
    if (Number.isNaN(when.getTime())) return setError('Enter a valid date and time.');
    if (when.getTime() <= Date.now()) return setError('Choose a time in the future.');
    setError(null);

    const body = {
      scheduledAt: when.toISOString(),
      durationMinutes: form.duration,
      type: form.type,
      location: showLocation ? form.location.trim() || undefined : undefined,
      message: form.message.trim() || undefined,
      allowConflicts,
      createVideoRoom: wantsRoom || undefined,
    };
    const opts = {
      onSuccess: () => {
        toast.success(interview ? 'Interview updated' : 'Interview scheduled', `${candidateName} has been notified.`);
        onClose();
      },
      onError: (err: unknown) => {
        const clashes = getInterviewConflicts(err);
        if (clashes) {
          setServerConflicts(clashes);
          setError(null);
        } else {
          setError(getErrorMessage(err));
        }
      },
    };
    if (interview) update.mutate({ id: interview.id, ...body }, opts);
    else schedule.mutate(body, opts);
  }

  return (
    <Modal
      open={open}
      onClose={pending ? () => {} : onClose}
      title={interview ? 'Reschedule interview' : 'Schedule interview'}
      description={`With ${candidateName}. Times are in your local time zone (${tz}).`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>Cancel</Button>
          <Button type="submit" form={formId} loading={pending}>
            {hasConflicts ? (interview ? 'Save anyway' : 'Schedule anyway') : interview ? 'Save changes' : 'Schedule interview'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="space-y-5" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Date" required>
            {(id) => (
              <Input id={id} type="date" value={form.date} min={toDateInput(new Date())} onChange={(e) => set('date', e.target.value)} required />
            )}
          </FormField>
          <FormField label="Time" required>
            {(id) => <Input id={id} type="time" value={form.time} onChange={(e) => set('time', e.target.value)} required />}
          </FormField>
          <FormField label="Duration">
            {(id) => (
              <Select id={id} value={form.duration} onChange={(e) => set('duration', Number(e.target.value))}>
                {DURATIONS.map((d) => <option key={d} value={d}>{d} minutes</option>)}
              </Select>
            )}
          </FormField>
        </div>

        {hasConflicts && <ConflictWarning conflicts={conflicts} />}

        <fieldset>
          <legend className="block text-sm font-medium text-fg-secondary mb-1.5">Interview type</legend>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map(({ value, icon: Icon }) => (
              <label
                key={value}
                className={cn(
                  'flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 text-sm cursor-pointer transition-colors',
                  'focus-within:ring-2 focus-within:ring-primary-500/40',
                  form.type === value ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium' : 'border-line-strong text-fg-tertiary hover:bg-muted'
                )}
              >
                <input type="radio" name={`${formId}-type`} value={value} checked={form.type === value} onChange={() => set('type', value)} className="sr-only" />
                <Icon className="w-4 h-4" aria-hidden />
                {INTERVIEW_TYPE_LABELS[value]}
              </label>
            ))}
          </div>
        </fieldset>

        {form.type === 'VIDEO' && hasRoom && (
          <div className="flex items-start gap-3 rounded-lg bg-primary-50 px-3.5 py-3 text-sm ring-1 ring-inset ring-primary-200">
            <Video className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-600" aria-hidden />
            <p className="text-primary-800">
              <span className="font-semibold">NexHire video room is ready.</span> It opens 15 minutes before the interview and moves
              automatically if you change the time.
            </p>
          </div>
        )}

        {form.type === 'VIDEO' && !hasRoom && videoEnabled && (
          <fieldset>
            <legend className="mb-1.5 block text-sm font-medium text-fg-secondary">Where to meet</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { room: true, title: 'NexHire video room', hint: 'Private room, nothing to install. Opens 15 min before.', icon: ShieldCheck },
                { room: false, title: 'My own meeting link', hint: 'Zoom, Google Meet, Teams…', icon: Link2 },
              ].map(({ room, title, hint, icon: Icon }) => (
                <label
                  key={title}
                  className={cn(
                    'flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors focus-within:ring-2 focus-within:ring-primary-500/40',
                    wantsRoom === room ? 'border-primary-500 bg-primary-50' : 'border-line-strong hover:bg-muted'
                  )}
                >
                  <input type="radio" name={`${formId}-room`} checked={wantsRoom === room} onChange={() => set('useRoom', room)} className="sr-only" />
                  <Icon className={cn('mt-0.5 h-4 w-4 flex-shrink-0', wantsRoom === room ? 'text-primary-600' : 'text-fg-subtle')} aria-hidden />
                  <span className="min-w-0">
                    <span className={cn('block text-sm font-medium', wantsRoom === room ? 'text-primary-700' : 'text-fg-secondary')}>
                      {title}
                      {room && <span className="ml-1.5 rounded bg-primary-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary-700">Recommended</span>}
                    </span>
                    <span className="block text-xs text-fg-muted">{hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {showLocation && (
          <FormField label={loc.label}>
            {(id) => (
              <Input id={id} type={loc.type} value={form.location} placeholder={loc.placeholder} onChange={(e) => set('location', e.target.value)} />
            )}
          </FormField>
        )}

        <FormField label="Message to candidate" hint="Included in the invitation the candidate receives.">
          {(id) => (
            <Textarea
              id={id}
              rows={3}
              value={form.message}
              onChange={(e) => set('message', e.target.value)}
              placeholder="e.g. You'll meet our engineering lead. Please bring a recent project to discuss."
            />
          )}
        </FormField>

        <div className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-fg-tertiary">
          <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-fg-subtle" aria-hidden />
          <p>
            {firstName} will be asked to confirm this time or suggest another.
            {interview && ` Changing the time asks ${firstName} to confirm again.`}
          </p>
        </div>

        {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
      </form>
    </Modal>
  );
}
