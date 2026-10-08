'use client';

import { useState } from 'react';
import { Lock, StickyNote, Trash2 } from 'lucide-react';
import type { ApplicationNote } from '@/types';
import { useAddNote, useApplicationNotes, useDeleteNote } from '@/hooks/useHiring';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import { formatDate, getErrorMessage, timeAgo } from '@/lib/format';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import { ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';

export function NotesTab({ applicationId, candidateName }: { applicationId: string; candidateName: string }) {
  const user = useAuthStore((s) => s.user);
  const notes = useApplicationNotes(applicationId);
  const add = useAddNote(applicationId);
  const del = useDeleteNote();
  const [body, setBody] = useState('');
  const [toDelete, setToDelete] = useState<ApplicationNote | null>(null);

  function submit() {
    const text = body.trim();
    if (!text || add.isPending) return;
    add.mutate(text, {
      onSuccess: () => setBody(''),
      onError: (err) => toast.error('Could not add note', getErrorMessage(err)),
    });
  }

  function confirmDelete() {
    if (!toDelete) return;
    del.mutate(toDelete.id, {
      onSuccess: () => { toast.success('Note deleted'); setToDelete(null); },
      onError: (err) => { toast.error('Could not delete note', getErrorMessage(err)); setToDelete(null); },
    });
  }

  return (
    <div className="space-y-5">
      <p className="flex items-center gap-1.5 text-xs text-fg-muted bg-muted rounded-lg px-3 py-2">
        <Lock className="w-3.5 h-3.5" aria-hidden /> Only your hiring team can see notes.
      </p>

      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-2">
        <label htmlFor={`note-${applicationId}`} className="sr-only">Add a note about {candidateName}</label>
        <Textarea
          id={`note-${applicationId}`}
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit(); } }}
          placeholder={`Add a note about ${candidateName}…`}
          maxLength={5000}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-fg-subtle hidden sm:inline">⌘/Ctrl + Enter to save</span>
          <Button type="submit" size="sm" loading={add.isPending} disabled={!body.trim()} className="ml-auto">Add note</Button>
        </div>
      </form>

      {notes.isLoading ? (
        <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : notes.error ? (
        <ErrorState title="Couldn't load notes" error={notes.error} onRetry={() => notes.refetch()} retrying={notes.isRefetching} className="py-8" />
      ) : !notes.data?.length ? (
        <EmptyState icon={StickyNote} title="No notes yet" description="Capture interview impressions and decisions for your team." className="py-8" />
      ) : (
        <ul className="space-y-3">
          {notes.data.map((n) => {
            const canDelete = !!user && (n.authorId === user.id || user.role === 'ADMIN');
            return (
              <li key={n.id} className="rounded-lg border border-line p-3">
                <div className="flex items-center gap-2">
                  <Avatar name={n.authorName ?? 'Former member'} size="xs" />
                  <span className="text-sm font-medium text-fg-soft truncate">
                    {n.authorName ?? 'Former member'}
                    {n.authorId === user?.id && <span className="text-fg-subtle font-normal"> (you)</span>}
                  </span>
                  <time dateTime={n.createdAt} title={formatDate(n.createdAt)} className="text-xs text-fg-subtle whitespace-nowrap">
                    {timeAgo(n.createdAt)}
                  </time>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setToDelete(n)}
                      aria-label="Delete note"
                      className="ml-auto p-1.5 rounded text-fg-subtle hover:text-rose-600 hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden />
                    </button>
                  )}
                </div>
                <p className="mt-2 text-sm text-fg-secondary whitespace-pre-line break-words">{n.body}</p>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={del.isPending}
        title="Delete this note?"
        description="This can't be undone."
        confirmLabel="Delete note"
      />
    </div>
  );
}
