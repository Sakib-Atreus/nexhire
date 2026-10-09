'use client';

import { useId, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { BellRing, CheckCircle2 } from 'lucide-react';
import { useSaveJobAlert } from '@/hooks/useCandidate';
import { usePublicSettings } from '@/hooks/useSettings';
import { Modal } from '@/components/ui/Modal';
import { Button, buttonClasses } from '@/components/ui/Button';
import { FormField, Input, Select } from '@/components/ui/Field';
import { Toggle } from '@/components/ui/Toggle';
import { ALERT_FREQUENCY_LABELS, EXPERIENCE_OPTIONS, JOB_TYPE_OPTIONS } from '@/lib/constants';
import { getErrorMessage, pluralize } from '@/lib/format';
import { cn } from '@/lib/cn';
import { toast } from '@/store/toastStore';
import type { AlertFrequency, ExperienceLevel, JobAlert, JobType } from '@/types';
import { alertJobsHref, dailyDigestLocalTime, hasAlertFilter, type AlertFilters } from './alertFilters';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Edit this alert; omit to create a new one. */
  alert?: JobAlert | null;
  /** Prefill for a new alert (e.g. the current search). */
  defaults?: AlertFilters;
  /** Optional note shown above the form (e.g. a filter that can't be saved). */
  note?: string;
  /** Show "Manage alerts" in the success view (hide when already on /alerts). */
  showManageLink?: boolean;
}

/** Create/edit a job alert. Mounted only while open so each opening starts from fresh values. */
export function JobAlertModal(props: Props) {
  if (!props.open) return null;
  return <JobAlertDialog {...props} />;
}

const FREQUENCIES: AlertFrequency[] = ['INSTANT', 'DAILY'];

function JobAlertDialog({ onClose, alert, defaults, note, showManageLink = true }: Props) {
  const ids = useId();
  const editing = !!alert;
  const src: AlertFilters = alert ?? defaults ?? {};
  const [name, setName] = useState(alert?.name ?? '');
  const [keyword, setKeyword] = useState(src.keyword ?? '');
  const [location, setLocation] = useState(src.location ?? '');
  const [category, setCategory] = useState(src.category ?? '');
  const [jobType, setJobType] = useState<JobType | ''>(src.jobType ?? '');
  const [level, setLevel] = useState<ExperienceLevel | ''>(src.experienceLevel ?? '');
  const [frequency, setFrequency] = useState<AlertFrequency>(alert?.frequency ?? 'INSTANT');
  const [emailEnabled, setEmailEnabled] = useState(alert?.emailEnabled ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<JobAlert | null>(null);

  const save = useSaveJobAlert();
  const { data: settings } = usePublicSettings();
  const categoryOptions = useMemo(() => {
    const list = settings?.categories ?? [];
    return category && !list.includes(category) ? [...list, category] : list;
  }, [settings?.categories, category]);

  const filters: AlertFilters = { keyword, location, category, jobType: jobType || null, experienceLevel: level || null };
  const canSave = hasAlertFilter(filters);
  const digestTime = dailyDigestLocalTime();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSave) {
      setError('Choose at least one filter: a keyword, location, category, job type or experience level.');
      return;
    }
    setError(null);
    save.mutate(
      {
        id: alert?.id,
        name: name.trim() || undefined,
        keyword: keyword.trim() || undefined,
        location: location.trim() || undefined,
        category: category || undefined,
        jobType: jobType || null,
        experienceLevel: level || null,
        frequency,
        emailEnabled,
        active: alert?.active ?? true,
      },
      {
        onSuccess: (data) => {
          setSaved(data);
          toast.success(editing ? 'Alert updated' : 'Alert saved', `“${data.name}”`);
        },
        onError: (err) => setError(getErrorMessage(err, 'We could not save this alert. Please try again.')),
      }
    );
  };

  if (saved) {
    return (
      <Modal
        open
        onClose={onClose}
        title={editing ? 'Alert updated' : 'Alert saved'}
        size="sm"
        footer={
          <>
            {showManageLink && <Link href="/alerts" className={buttonClasses('secondary')}>Manage alerts</Link>}
            <Button onClick={onClose}>Done</Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-emerald-600" aria-hidden />
          <div className="min-w-0 space-y-2 text-sm">
            <p className="font-medium text-fg break-words">“{saved.name}”</p>
            <p className="text-fg-secondary">
              {saved.currentMatches > 0 ? (
                <>
                  <Link href={alertJobsHref(saved)} onClick={onClose} className="font-semibold text-primary-600 hover:text-primary-700">
                    {pluralize(saved.currentMatches, 'job')} match
                  </Link>{' '}
                  right now.
                </>
              ) : (
                'No open jobs match right now.'
              )}
            </p>
            <p className="text-fg-muted">
              We&apos;ll notify you{' '}
              {saved.frequency === 'INSTANT' ? 'as soon as a new matching job is posted' : `once a day (around ${digestTime} your time) when there are new matches`}.
            </p>
          </div>
        </div>
      </Modal>
    );
  }

  const formId = `${ids}-form`;
  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? 'Edit job alert' : 'Save this search'}
      description="We'll notify you when new jobs match these filters."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>Cancel</Button>
          <Button type="submit" form={formId} loading={save.isPending}>
            {!save.isPending && <BellRing className="w-4 h-4" aria-hidden />}
            {editing ? 'Save changes' : 'Create alert'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="space-y-5" noValidate>
        {note && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{note}</p>}

        <FormField label="Alert name" hint="Optional. We'll name it after your filters if you leave this blank.">
          {(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="e.g. Remote React roles" />}
        </FormField>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-fg-secondary">Filters <span className="font-normal text-fg-muted">(at least one)</span></legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Keyword">
              {(id) => <Input id={id} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Job title, skill or keyword" />}
            </FormField>
            <FormField label="Location">
              {(id) => <Input id={id} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, country or remote" />}
            </FormField>
            <FormField label="Category">
              {(id) => (
                <Select id={id} value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">Any category</option>
                  {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              )}
            </FormField>
            <FormField label="Job type">
              {(id) => (
                <Select id={id} value={jobType} onChange={(e) => setJobType(e.target.value as JobType | '')}>
                  <option value="">Any job type</option>
                  {JOB_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
              )}
            </FormField>
            <FormField label="Experience level" className="sm:col-span-2">
              {(id) => (
                <Select id={id} value={level} onChange={(e) => setLevel(e.target.value as ExperienceLevel | '')}>
                  <option value="">Any experience level</option>
                  {EXPERIENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
              )}
            </FormField>
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium text-fg-secondary">How often</legend>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FREQUENCIES.map((f) => (
              <label
                key={f}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors',
                  frequency === f ? 'border-primary-500 bg-primary-50' : 'border-line hover:bg-muted'
                )}
              >
                <input
                  type="radio"
                  name={`${ids}-frequency`}
                  value={f}
                  checked={frequency === f}
                  onChange={() => setFrequency(f)}
                  className="mt-0.5 accent-primary-600"
                />
                <span className="min-w-0">
                  <span className="block font-medium text-fg">{ALERT_FREQUENCY_LABELS[f]}</span>
                  <span className="block text-xs text-fg-muted">
                    {f === 'INSTANT' ? 'One notification per new matching job.' : `One summary a day, around ${digestTime} your time.`}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex items-start justify-between gap-4 rounded-lg border border-line p-3">
          <div className="min-w-0">
            <p id={`${ids}-email`} className="text-sm font-medium text-fg">Also send emails</p>
            <p className="text-xs text-fg-muted">You&apos;ll always get an in-app notification. Emails include a one-click unsubscribe link.</p>
          </div>
          <Toggle checked={emailEnabled} onChange={setEmailEnabled} labelledBy={`${ids}-email`} />
        </div>

        {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      </form>
    </Modal>
  );
}
