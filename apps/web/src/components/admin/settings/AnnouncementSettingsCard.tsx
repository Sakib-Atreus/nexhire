'use client';

import { useId, useState } from 'react';
import { useUpdateAnnouncement } from '@/hooks/useAdmin';
import { AnnouncementBanner } from '@/components/layout/AnnouncementBanner';
import { Card, CardHeader } from '@/components/ui/Card';
import { FormField, Input, Textarea } from '@/components/ui/Field';
import { Toggle } from '@/components/ui/Toggle';
import { getErrorMessage } from '@/lib/format';
import { cn } from '@/lib/cn';
import { toast } from '@/store/toastStore';
import type { Announcement, AnnouncementTone } from '@/types';
import { SettingsCardFooter, SettingsError, UnsavedBadge } from './SettingsCardParts';

const MAX_MESSAGE = 300;

const TONE_OPTIONS: { value: AnnouncementTone; label: string; swatch: string }[] = [
  { value: 'info', label: 'Info', swatch: 'bg-primary-500' },
  { value: 'success', label: 'Success', swatch: 'bg-emerald-500' },
  { value: 'warning', label: 'Warning', swatch: 'bg-amber-500' },
];

function normalize(a?: Partial<Announcement> | null): Announcement {
  return {
    enabled: !!a?.enabled,
    message: a?.message ?? '',
    tone: a?.tone ?? 'info',
    linkUrl: a?.linkUrl ?? '',
    linkLabel: a?.linkLabel ?? '',
  };
}

function sameAnnouncement(a: Announcement, b: Announcement) {
  return a.enabled === b.enabled && a.message === b.message && a.tone === b.tone
    && a.linkUrl === b.linkUrl && a.linkLabel === b.linkLabel;
}

function validate(a: Announcement): { message?: string; linkUrl?: string } {
  const errors: { message?: string; linkUrl?: string } = {};
  const msg = a.message.trim();
  if (a.enabled && !msg) errors.message = 'Enter a message to show the banner, or turn it off.';
  else if (msg.length > MAX_MESSAGE) errors.message = `Keep the message under ${MAX_MESSAGE} characters.`;
  const url = a.linkUrl.trim();
  if (url && !url.startsWith('https://') && !url.startsWith('/')) {
    errors.linkUrl = 'Use a full https:// address or a site path starting with /.';
  }
  return errors;
}

export function AnnouncementSettingsCard({ saved }: { saved?: Announcement | null }) {
  const savedValue = normalize(saved);
  const [base, setBase] = useState(savedValue);
  const [draft, setDraft] = useState(savedValue);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const update = useUpdateAnnouncement();
  const toggleLabelId = useId();
  const toneName = useId();

  const dirty = !sameAnnouncement(draft, base);
  // Pick up fresh server values (e.g. a refetch) as long as nothing is being edited.
  if (!sameAnnouncement(savedValue, base) && !dirty) {
    setBase(savedValue);
    setDraft(savedValue);
  }

  const errors = validate(draft);
  const invalid = Object.keys(errors).length > 0;
  const set = <K extends keyof Announcement>(key: K, value: Announcement[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setServerError(null);
  };

  const save = () => {
    setShowErrors(true);
    if (invalid) return;
    const body: Announcement = {
      ...draft,
      message: draft.message.trim(),
      linkUrl: draft.linkUrl.trim(),
      linkLabel: draft.linkLabel.trim(),
    };
    update.mutate(body, {
      onSuccess: (result) => {
        const next = normalize(result ?? body);
        setBase(next);
        setDraft(next);
        setShowErrors(false);
        toast.success(next.enabled ? 'Announcement published' : 'Announcement saved', next.enabled ? 'It is now visible across the site.' : 'The banner is turned off.');
      },
      onError: (err) => {
        const msg = getErrorMessage(err, 'We could not save the announcement.');
        setServerError(msg);
        toast.error('Announcement not saved', msg);
      },
    });
  };

  const discard = () => {
    setDraft(base);
    setServerError(null);
    setShowErrors(false);
  };

  const length = draft.message.length;
  const messageError = showErrors || length > MAX_MESSAGE ? errors.message : undefined;
  const linkError = showErrors ? errors.linkUrl : undefined;

  return (
    <Card>
      <CardHeader
        title="Announcement banner"
        description="A short message shown at the top of every page, including the home page."
        action={<UnsavedBadge show={dirty} />}
      />
      <div className="p-5 space-y-5">
        <SettingsError message={serverError} />

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p id={toggleLabelId} className="text-sm font-medium text-slate-700">Show banner</p>
            <p className="text-xs text-slate-500 mt-0.5">Visitors can dismiss it for their current session.</p>
          </div>
          <Toggle checked={draft.enabled} onChange={(v) => set('enabled', v)} labelledBy={toggleLabelId} />
        </div>

        <FormField
          label="Message"
          required={draft.enabled}
          error={messageError}
          hint={`${length}/${MAX_MESSAGE} characters`}
        >
          {(id) => (
            <>
              <Textarea
                id={id}
                rows={3}
                value={draft.message}
                onChange={(e) => set('message', e.target.value)}
                invalid={!!messageError}
                placeholder="e.g. Scheduled maintenance on Saturday 02:00–03:00 UTC."
              />
              {messageError && (
                <p className={cn('text-right text-xs', length > MAX_MESSAGE ? 'text-rose-600' : 'text-slate-400')}>
                  {length}/{MAX_MESSAGE}
                </p>
              )}
            </>
          )}
        </FormField>

        <fieldset>
          <legend className="text-sm font-medium text-slate-700">Tone</legend>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:max-w-sm">
            {TONE_OPTIONS.map((t) => (
              <label
                key={t.value}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors',
                  'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-500',
                  draft.tone === t.value
                    ? 'border-primary-500 bg-primary-50 text-primary-800 font-medium'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                )}
              >
                <input
                  type="radio"
                  name={toneName}
                  value={t.value}
                  checked={draft.tone === t.value}
                  onChange={() => set('tone', t.value)}
                  className="sr-only"
                />
                <span className={cn('w-2.5 h-2.5 rounded-full', t.swatch)} aria-hidden />
                {t.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField label="Link URL" error={linkError} hint="Optional. https://… or a site path such as /jobs.">
            {(id) => (
              <Input
                id={id}
                inputMode="url"
                value={draft.linkUrl}
                onChange={(e) => set('linkUrl', e.target.value)}
                invalid={!!linkError}
                placeholder="/jobs"
              />
            )}
          </FormField>
          <FormField label="Link text" hint="Defaults to “Learn more”.">
            {(id) => (
              <Input
                id={id}
                value={draft.linkLabel}
                onChange={(e) => set('linkLabel', e.target.value)}
                placeholder="Learn more"
                disabled={!draft.linkUrl.trim()}
              />
            )}
          </FormField>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</p>
            {!draft.enabled && <p className="text-xs text-slate-400">Turned off: visitors won&apos;t see this.</p>}
          </div>
          {draft.message.trim() ? (
            <div className={cn(!draft.enabled && 'opacity-60')}>
              <AnnouncementBanner preview={{ ...draft, linkUrl: errors.linkUrl ? '' : draft.linkUrl.trim() }} />
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-400">
              Type a message to see the banner preview.
            </p>
          )}
        </div>
      </div>
      <SettingsCardFooter
        dirty={dirty}
        saving={update.isPending}
        invalid={showErrors && invalid}
        onDiscard={discard}
        onSave={save}
      />
    </Card>
  );
}
