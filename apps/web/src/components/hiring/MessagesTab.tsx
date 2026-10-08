'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Send } from 'lucide-react';
import { useApplicationMessages, useMessageTemplates, useSendMessage } from '@/hooks/useHiring';
import { MESSAGE_PLACEHOLDERS } from '@/lib/constants';
import { toast } from '@/store/toastStore';
import { formatDate, getErrorMessage, timeAgo } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Select, Textarea } from '@/components/ui/Field';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { cn } from '@/lib/cn';

/** A composer pre-fill from elsewhere in the drawer (e.g. "Send a reminder"); `key` changes for every request. */
export interface MessageDraft { text: string; key: number }

export function MessagesTab({ applicationId, candidateName, draft, onDraftUsed }: {
  applicationId: string;
  candidateName: string;
  draft?: MessageDraft | null;
  /** Called once the draft is in the composer, so it isn't re-applied when the tab remounts. */
  onDraftUsed?: () => void;
}) {
  const messages = useApplicationMessages(applicationId);
  const templates = useMessageTemplates();
  const send = useSendMessage(applicationId);
  const [body, setBody] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const count = messages.data?.length ?? 0;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [count]);

  // Pre-fill the composer (replaces any unsent text) and focus it so the recruiter can review and send.
  useEffect(() => {
    if (!draft) return;
    setBody(draft.text);
    onDraftUsed?.();
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(draft.text.length, draft.text.length);
    });
  }, [draft]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Insert text at the cursor (or replace the selection) and keep the caret after it. */
  function insertAtCursor(text: string) {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? body.length;
    const end = el?.selectionEnd ?? body.length;
    const next = body.slice(0, start) + text + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const caret = start + text.length;
      el.setSelectionRange(caret, caret);
    });
  }

  function onTemplate(id: string) {
    const t = templates.data?.find((x) => x.id === id);
    if (!t) return;
    insertAtCursor(t.body);
  }

  function submit() {
    const text = body.trim();
    if (!text || send.isPending) return;
    send.mutate(text, {
      onSuccess: () => {
        setBody('');
        toast.success('Message sent', `${candidateName} will be notified.`);
      },
      onError: (err) => toast.error('Could not send message', getErrorMessage(err)),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 min-h-[10rem]" aria-live="polite">
        {messages.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-12 w-2/3 ml-auto" />
          </div>
        ) : messages.error ? (
          <ErrorState title="Couldn't load messages" error={messages.error} onRetry={() => messages.refetch()} retrying={messages.isRefetching} className="py-6" />
        ) : count === 0 ? (
          <EmptyState icon={MessageSquare} title="No messages yet" description={`Start the conversation with ${candidateName}.`} className="py-6" />
        ) : (
          <ol className="space-y-3">
            {messages.data!.map((m) => (
              <li key={m.id} className={cn('flex flex-col max-w-[85%]', m.fromCandidate ? 'items-start' : 'items-end ml-auto')}>
                <div
                  className={cn(
                    'rounded-2xl px-3.5 py-2 text-sm whitespace-pre-line break-words',
                    m.fromCandidate ? 'bg-white ring-1 ring-slate-200 text-slate-800 rounded-bl-sm' : 'bg-primary-600 text-white rounded-br-sm'
                  )}
                >
                  {m.body}
                </div>
                <span className="mt-1 text-[11px] text-slate-400">
                  {m.fromCandidate ? candidateName : m.senderName ?? 'Hiring team'} ·{' '}
                  <time dateTime={m.createdAt} title={formatDate(m.createdAt)}>{timeAgo(m.createdAt)}</time>
                </span>
              </li>
            ))}
          </ol>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={`tpl-${applicationId}`} className="sr-only">Insert template</label>
          <Select
            id={`tpl-${applicationId}`}
            value=""
            onChange={(e) => onTemplate(e.target.value)}
            disabled={templates.isLoading || !templates.data?.length}
            className="h-8 text-xs w-auto max-w-full"
          >
            <option value="">
              {templates.isLoading ? 'Loading templates…' : templates.data?.length ? 'Insert template…' : 'No templates yet'}
            </option>
            {templates.data?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
          <Link href="/templates" className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline">
            Manage templates
          </Link>
        </div>

        <label htmlFor={`msg-${applicationId}`} className="sr-only">Message to {candidateName}</label>
        <Textarea
          ref={textareaRef}
          id={`msg-${applicationId}`}
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit(); } }}
          placeholder={`Write to ${candidateName}…`}
          maxLength={5000}
        />

        <div role="group" aria-label="Insert placeholder" className="flex flex-wrap gap-1.5">
          {MESSAGE_PLACEHOLDERS.map((p) => (
            <button
              key={p.token}
              type="button"
              onClick={() => insertAtCursor(p.token)}
              title={p.label}
              className="rounded-md bg-primary-50 px-2 py-0.5 text-[11px] font-mono text-primary-700 ring-1 ring-inset ring-primary-600/20 hover:bg-primary-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              {p.token}
              <span className="sr-only"> ({p.label})</span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">Placeholders are filled in when sent.</p>
          <Button type="submit" size="sm" loading={send.isPending} disabled={!body.trim()}>
            {!send.isPending && <Send className="w-3.5 h-3.5" aria-hidden />}
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
