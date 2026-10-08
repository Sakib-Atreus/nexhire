'use client';

import { useId, useRef } from 'react';
import { Eye, Plus, Save, Trash2 } from 'lucide-react';
import { MESSAGE_PLACEHOLDERS } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';
import { TEMPLATE_BODY_MAX, TEMPLATE_NAME_MAX } from './starterTemplates';

export type PreviewValues = Record<string, string>;

/** Replace {{token}} placeholders with sample values; unknown tokens are left as typed. */
export function fillPlaceholders(body: string, values: PreviewValues): string {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => values[key] ?? match);
}

export function TemplateEditor({
  isNew, name, body, dirty, onChange, onSave, onDelete, onDiscard, saving, previewValues, errors,
}: {
  isNew: boolean;
  name: string;
  body: string;
  dirty: boolean;
  onChange: (patch: { name?: string; body?: string }) => void;
  onSave: () => void;
  onDelete?: () => void;
  onDiscard: () => void;
  saving: boolean;
  previewValues: PreviewValues;
  errors: { name?: string; body?: string };
}) {
  const nameId = useId();
  const bodyId = useId();
  const counterId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertToken = (token: string) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? body.length;
    const end = el?.selectionEnd ?? body.length;
    const next = body.slice(0, start) + token + body.slice(end);
    if (next.length > TEMPLATE_BODY_MAX) return;
    onChange({ body: next });
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const remaining = TEMPLATE_BODY_MAX - body.length;
  const preview = fillPlaceholders(body, previewValues);

  return (
    <Card>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
        noValidate
      >
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-line-subtle">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-fg">{isNew ? 'New template' : 'Edit template'}</h2>
            <p className="text-xs text-fg-muted mt-0.5">
              {dirty ? 'Unsaved changes' : isNew ? 'Not saved yet' : 'All changes saved'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isNew && onDelete && (
              <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={onDelete}>
                <Trash2 className="w-3.5 h-3.5" aria-hidden /> Delete
              </Button>
            )}
            {dirty && (
              <Button variant="secondary" size="sm" onClick={onDiscard} disabled={saving}>
                {isNew ? 'Cancel' : 'Discard changes'}
              </Button>
            )}
            <Button type="submit" size="sm" loading={saving} disabled={!dirty && !isNew}>
              {!saving && <Save className="w-3.5 h-3.5" aria-hidden />}
              {isNew ? 'Create template' : 'Save changes'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2">
          <div className="p-5 space-y-5 min-w-0">
            <div className="space-y-1.5">
              <label htmlFor={nameId} className="block text-sm font-medium text-fg-secondary">
                Name<span className="text-rose-500 ml-0.5" aria-hidden>*</span>
              </label>
              <Input
                id={nameId}
                value={name}
                maxLength={TEMPLATE_NAME_MAX}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="e.g. Invitation to interview"
                invalid={!!errors.name}
                aria-describedby={errors.name ? `${nameId}-err` : undefined}
                required
              />
              {errors.name ? (
                <p id={`${nameId}-err`} className="text-xs text-rose-600" role="alert">{errors.name}</p>
              ) : (
                <p className="text-xs text-fg-muted">Only you see the name. {name.length}/{TEMPLATE_NAME_MAX}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor={bodyId} className="block text-sm font-medium text-fg-secondary">
                Message<span className="text-rose-500 ml-0.5" aria-hidden>*</span>
              </label>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Insert placeholder at cursor">
                {MESSAGE_PLACEHOLDERS.map((p) => (
                  <button
                    key={p.token}
                    type="button"
                    onClick={() => insertToken(p.token)}
                    title={`Insert ${p.token}`}
                    className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 ring-1 ring-inset ring-primary-600/20 hover:bg-primary-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    <Plus className="w-3 h-3" aria-hidden />
                    {p.label}
                    <span className="sr-only"> ({p.token})</span>
                  </button>
                ))}
              </div>
              <Textarea
                ref={textareaRef}
                id={bodyId}
                rows={14}
                value={body}
                maxLength={TEMPLATE_BODY_MAX}
                onChange={(e) => onChange({ body: e.target.value })}
                placeholder={'Hi {{firstName}},\n\nThanks for applying for {{jobTitle}}…'}
                invalid={!!errors.body}
                aria-describedby={counterId}
                className="font-mono text-[13px] min-h-[16rem]"
                required
              />
              <div id={counterId} className="flex flex-wrap justify-between gap-2 text-xs">
                {errors.body ? (
                  <span className="text-rose-600" role="alert">{errors.body}</span>
                ) : (
                  <span className="text-fg-muted">Placeholders are filled in for each candidate when you send.</span>
                )}
                <span className={cn('tabular-nums', remaining < 200 ? 'text-amber-600' : 'text-fg-subtle')}>
                  {body.length.toLocaleString('en-US')}/{TEMPLATE_BODY_MAX.toLocaleString('en-US')}
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 border-t xl:border-t-0 xl:border-l border-line-subtle bg-muted/50 min-w-0">
            <h3 className="flex items-center gap-1.5 text-sm font-medium text-fg-secondary">
              <Eye className="w-4 h-4 text-fg-subtle" aria-hidden /> Preview
            </h3>
            <p className="text-xs text-fg-muted mt-0.5">With sample values, as a candidate would see it.</p>
            <div className="mt-3 rounded-2xl rounded-tl-sm bg-surface p-4 ring-1 ring-inset ring-line shadow-sm" aria-live="polite">
              <p className="text-xs font-semibold text-fg-secondary">{previewValues.recruiterName}</p>
              {preview.trim() ? (
                <p className="mt-1 text-sm leading-relaxed text-fg-secondary whitespace-pre-line break-words">{preview}</p>
              ) : (
                <p className="mt-1 text-sm text-fg-subtle italic">Start typing to see a preview.</p>
              )}
            </div>
          </div>
        </div>
      </form>
    </Card>
  );
}
