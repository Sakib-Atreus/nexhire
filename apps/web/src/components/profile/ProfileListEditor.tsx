'use client';

import { useId, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { getErrorMessage } from '@/lib/format';
import { toast } from '@/store/toastStore';

export interface EntryFormProps<T> {
  /** Attach to the <form> so the modal footer's submit button targets it. */
  formId: string;
  initial: T | null;
  onSubmit: (item: T) => void;
}

interface ProfileListEditorProps<T> {
  title: string;
  description: string;
  icon: LucideIcon;
  /** Singular noun for buttons and dialogs, e.g. "role". */
  noun: string;
  emptyDescription: string;
  max: number;
  items: T[] | undefined;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  retrying?: boolean;
  /** Saves the whole ordered list. */
  save: (items: T[]) => Promise<unknown>;
  saving: boolean;
  itemLabel: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  Form: (props: EntryFormProps<T>) => ReactNode;
}

const iconButton =
  'p-1.5 rounded-md text-fg-subtle hover:text-fg-secondary hover:bg-subtle disabled:opacity-40 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500';

/**
 * Card with an ordered list of profile entries (experience, education).
 * Add/edit happen in a modal; every change saves the whole list.
 */
export function ProfileListEditor<T>({
  title, description, icon: Icon, noun, emptyDescription, max, items, isLoading, error, onRetry, retrying,
  save, saving, itemLabel, renderItem, Form,
}: ProfileListEditorProps<T>) {
  const formId = useId();
  // null = closed, -1 = adding, otherwise the index being edited.
  const [editing, setEditing] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const list = items ?? [];
  const atMax = list.length >= max;

  function openEditor(index: number) {
    setFormError(null);
    setEditing(index);
  }

  async function commit(next: T[], { successMessage, onDone }: { successMessage: string; onDone?: () => void }) {
    try {
      await save(next);
      onDone?.();
      toast.success(successMessage);
      return true;
    } catch (err) {
      return getErrorMessage(err);
    }
  }

  async function submit(item: T) {
    if (editing === null) return;
    setFormError(null);
    const next = editing === -1 ? [...list, item] : list.map((existing, i) => (i === editing ? item : existing));
    const result = await commit(next, {
      successMessage: editing === -1 ? `${capitalize(noun)} added` : `${capitalize(noun)} updated`,
      onDone: () => setEditing(null),
    });
    if (result !== true) setFormError(result);
  }

  async function move(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    const result = await commit(next, { successMessage: 'Order updated' });
    if (result !== true) toast.error("Couldn't reorder", result);
  }

  async function confirmDelete() {
    if (deleting === null) return;
    const result = await commit(list.filter((_, i) => i !== deleting), {
      successMessage: `${capitalize(noun)} removed`,
      onDone: () => setDeleting(null),
    });
    if (result !== true) toast.error(`Couldn't remove this ${noun}`, result);
  }

  const addButton = (
    <Button variant="ghost" size="sm" onClick={() => openEditor(-1)} disabled={atMax || isLoading || !!error}>
      <Plus className="w-3.5 h-3.5" aria-hidden /> Add {noun}
    </Button>
  );

  return (
    <Card>
      <CardHeader title={title} description={description} action={list.length > 0 ? addButton : undefined} />

      {isLoading ? (
        <div className="p-5 space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState title={`We couldn't load your ${title.toLowerCase()}`} error={error} onRetry={onRetry} retrying={retrying} className="py-10" />
      ) : list.length === 0 ? (
        <EmptyState
          icon={Icon}
          title={`No ${title.toLowerCase()} yet`}
          description={emptyDescription}
          className="py-10"
          action={
            <Button variant="secondary" size="sm" onClick={() => openEditor(-1)}>
              <Plus className="w-3.5 h-3.5" aria-hidden /> Add {noun}
            </Button>
          }
        />
      ) : (
        <ol className="divide-y divide-line-subtle">
          {list.map((item, index) => {
            const label = itemLabel(item);
            return (
              <li key={index} className="flex gap-3 px-5 py-4">
                <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-subtle text-fg-muted" aria-hidden>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">{renderItem(item)}</div>
                <div className="flex flex-shrink-0 flex-col items-end gap-0.5 sm:flex-row sm:items-start">
                  <div className="flex">
                    <button type="button" className={iconButton} onClick={() => move(index, -1)} disabled={index === 0 || saving} aria-label={`Move ${label} up`}>
                      <ArrowUp className="h-4 w-4" aria-hidden />
                    </button>
                    <button type="button" className={iconButton} onClick={() => move(index, 1)} disabled={index === list.length - 1 || saving} aria-label={`Move ${label} down`}>
                      <ArrowDown className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                  <div className="flex">
                    <button type="button" className={iconButton} onClick={() => openEditor(index)} disabled={saving} aria-label={`Edit ${label}`}>
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      className={`${iconButton} hover:!text-rose-600 hover:!bg-rose-50`}
                      onClick={() => setDeleting(index)}
                      disabled={saving}
                      aria-label={`Remove ${label}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {atMax && <p className="px-5 pb-4 text-xs text-fg-muted">You&apos;ve reached the limit of {max} entries.</p>}

      <Modal
        open={editing !== null}
        onClose={() => !saving && setEditing(null)}
        title={editing === -1 ? `Add ${noun}` : `Edit ${noun}`}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
            <Button type="submit" form={formId} loading={saving}>{editing === -1 ? `Add ${noun}` : 'Save'}</Button>
          </>
        }
      >
        {formError && (
          <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700 ring-1 ring-inset ring-rose-600/20">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
            {formError}
          </div>
        )}
        {editing !== null && (
          // React submit events bubble through the portal; keep them from reaching an enclosing page form.
          <div onSubmit={(e) => e.stopPropagation()}>
            <Form key={editing} formId={formId} initial={editing === -1 ? null : list[editing] ?? null} onSubmit={submit} />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title={`Remove this ${noun}?`}
        description={deleting !== null && list[deleting] ? `"${itemLabel(list[deleting])}" will be removed from your profile.` : undefined}
        confirmLabel="Remove"
        loading={saving}
      />
    </Card>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
