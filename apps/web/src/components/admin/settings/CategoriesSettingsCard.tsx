'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, Check, FolderOpen, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useUpdateSettingList } from '@/hooks/useAdmin';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { getErrorMessage } from '@/lib/format';
import { cn } from '@/lib/cn';
import { toast } from '@/store/toastStore';
import { SettingsCardFooter, SettingsError, UnsavedBadge, sameList } from './SettingsCardParts';

const MAX_CATEGORIES = 50;
const MAX_LENGTH = 50;

/** Validation message for a new or renamed category, or null when it is fine. */
function checkName(name: string, list: string[], ignoreIndex?: number): string | null {
  const v = name.trim();
  if (!v) return 'Enter a category name.';
  if (v.length > MAX_LENGTH) return `Keep category names under ${MAX_LENGTH} characters.`;
  const lower = v.toLowerCase();
  if (list.some((c, i) => i !== ignoreIndex && c.toLowerCase() === lower)) return `“${v}” is already in the list.`;
  return null;
}

const iconButton =
  'p-1.5 rounded-md text-fg-subtle hover:text-fg-secondary hover:bg-subtle disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500';

export function CategoriesSettingsCard({ saved }: { saved: string[] }) {
  const [base, setBase] = useState(saved);
  const [draft, setDraft] = useState(saved);
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ index: number; value: string; error: string | null } | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const update = useUpdateSettingList('categories');

  const dirty = !sameList(draft, base);
  if (!sameList(saved, base) && !dirty) {
    setBase(saved);
    setDraft(saved);
  }

  const atLimit = draft.length >= MAX_CATEGORIES;

  const change = (next: string[]) => {
    setDraft(next);
    setServerError(null);
  };

  const add = () => {
    if (atLimit) return;
    const err = checkName(newName, draft);
    if (err) {
      setAddError(err);
      return;
    }
    change([...draft, newName.trim()]);
    setNewName('');
    setAddError(null);
  };

  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= draft.length) return;
    const next = [...draft];
    [next[index], next[target]] = [next[target], next[index]];
    change(next);
  };

  const remove = (index: number) => {
    if (editing?.index === index) setEditing(null);
    change(draft.filter((_, i) => i !== index));
  };

  const commitRename = () => {
    if (!editing) return;
    const err = checkName(editing.value, draft, editing.index);
    if (err) {
      setEditing({ ...editing, error: err });
      return;
    }
    const next = [...draft];
    next[editing.index] = editing.value.trim();
    change(next);
    setEditing(null);
  };

  const save = () => {
    setEditing(null);
    update.mutate(draft, {
      onSuccess: (result) => {
        const next = result ?? draft;
        setBase(next);
        setDraft(next);
        toast.success('Categories saved', `${next.length} ${next.length === 1 ? 'category' : 'categories'} available to recruiters.`);
      },
      onError: (err) => {
        const msg = getErrorMessage(err, 'We could not save the categories.');
        setServerError(msg);
        toast.error('Categories not saved', msg);
      },
    });
  };

  const discard = () => {
    setDraft(base);
    setEditing(null);
    setNewName('');
    setAddError(null);
    setServerError(null);
  };

  return (
    <Card>
      <CardHeader
        title="Job categories"
        description="Recruiters pick one when posting; candidates filter jobs by it."
        action={<UnsavedBadge show={dirty} />}
      />
      <div className="p-5 space-y-4">
        <SettingsError message={serverError} />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <label htmlFor="new-category" className="block text-sm font-medium text-fg-secondary mb-1.5">Add a category</label>
          <div className="flex gap-2">
            <Input
              id="new-category"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setAddError(null);
              }}
              placeholder={atLimit ? 'Category limit reached' : 'e.g. Engineering'}
              invalid={!!addError}
              disabled={atLimit}
              maxLength={MAX_LENGTH + 10}
              aria-describedby="new-category-help"
              className="min-w-0"
            />
            <Button type="submit" variant="secondary" disabled={atLimit || !newName.trim()}>
              <Plus className="w-4 h-4" aria-hidden />
              Add
            </Button>
          </div>
          <p id="new-category-help" className={cn('mt-1.5 text-xs', addError ? 'text-rose-600' : 'text-fg-muted')} role={addError ? 'alert' : undefined}>
            {addError ?? `${draft.length}/${MAX_CATEGORIES} categories`}
          </p>
        </form>

        {draft.length === 0 ? (
          <div className="flex flex-col items-center text-center rounded-xl border border-dashed border-line-strong px-6 py-8">
            <FolderOpen className="w-6 h-6 text-fg-subtle" aria-hidden />
            <p className="mt-2 text-sm font-medium text-fg-secondary">No categories yet</p>
            <p className="mt-0.5 text-xs text-fg-muted">Without categories, recruiters can&apos;t categorise jobs.</p>
          </div>
        ) : (
          <ol className="rounded-xl border border-line divide-y divide-line-subtle" aria-label="Categories">
            {draft.map((name, i) => {
              const isEditing = editing?.index === i;
              return (
                <li key={name} className="flex items-center gap-2 px-3 py-2 min-w-0">
                  <span className="w-6 text-right text-xs font-medium text-fg-subtle flex-shrink-0" aria-hidden>{i + 1}.</span>
                  {isEditing ? (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <Input
                          autoFocus
                          value={editing.value}
                          onChange={(e) => setEditing({ index: i, value: e.target.value, error: null })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              commitRename();
                            } else if (e.key === 'Escape') {
                              setEditing(null);
                            }
                          }}
                          invalid={!!editing.error}
                          aria-label={`Rename ${name}`}
                          className="h-8 min-w-0"
                        />
                        <button type="button" onClick={commitRename} className={iconButton} aria-label="Save name">
                          <Check className="w-4 h-4" aria-hidden />
                        </button>
                        <button type="button" onClick={() => setEditing(null)} className={iconButton} aria-label="Cancel rename">
                          <X className="w-4 h-4" aria-hidden />
                        </button>
                      </div>
                      {editing.error && <p className="mt-1 text-xs text-rose-600" role="alert">{editing.error}</p>}
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 min-w-0 truncate text-sm text-fg-soft" title={name}>{name}</span>
                      <div className="flex items-center flex-shrink-0">
                        <button type="button" onClick={() => setEditing({ index: i, value: name, error: null })} className={iconButton} aria-label={`Rename ${name}`}>
                          <Pencil className="w-3.5 h-3.5" aria-hidden />
                        </button>
                        <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className={iconButton} aria-label={`Move ${name} up`}>
                          <ArrowUp className="w-4 h-4" aria-hidden />
                        </button>
                        <button type="button" onClick={() => move(i, 1)} disabled={i === draft.length - 1} className={iconButton} aria-label={`Move ${name} down`}>
                          <ArrowDown className="w-4 h-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(i)}
                          className={cn(iconButton, 'hover:text-rose-600 hover:bg-rose-50')}
                          aria-label={`Remove ${name}`}
                        >
                          <Trash2 className="w-4 h-4" aria-hidden />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
      <SettingsCardFooter
        dirty={dirty}
        saving={update.isPending}
        onDiscard={discard}
        onSave={save}
        note="Jobs keep their category if you remove it from this list."
      />
    </Card>
  );
}
