'use client';

import { AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

/** "Unsaved changes" pill for a card header. */
export function UnsavedBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return <Badge tone="bg-amber-50 text-amber-700 ring-amber-600/20">Unsaved changes</Badge>;
}

/** Inline server/validation error for a settings card. */
export function SettingsError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />
      <p className="min-w-0 break-words">{message}</p>
    </div>
  );
}

/** Card footer with Discard + Save. Save is disabled until something changed. */
export function SettingsCardFooter({ dirty, saving, invalid, onDiscard, onSave, saveLabel = 'Save changes', note }: {
  dirty: boolean;
  saving: boolean;
  invalid?: boolean;
  onDiscard: () => void;
  onSave: () => void;
  saveLabel?: string;
  note?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-t border-line-subtle bg-muted/60 rounded-b-xl">
      <p className="text-xs text-fg-muted min-w-0">{note ?? (dirty ? 'You have unsaved changes.' : 'All changes saved.')}</p>
      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <Button variant="secondary" onClick={onDiscard} disabled={!dirty || saving}>Discard</Button>
        <Button onClick={onSave} loading={saving} disabled={!dirty || invalid}>
          {saving ? 'Saving…' : saveLabel}
        </Button>
      </div>
    </div>
  );
}

/** True when two string lists hold the same items in the same order. */
export function sameList(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}
