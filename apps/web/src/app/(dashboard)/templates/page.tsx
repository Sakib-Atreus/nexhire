'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, Lock, MessageSquareText, Plus, Sparkles } from 'lucide-react';
import type { MessageTemplate } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useDeleteTemplate, useMessageTemplates, useSaveTemplate } from '@/hooks/useHiring';
import { useMyCompany } from '@/hooks/useCompanies';
import { getErrorMessage, timeAgo } from '@/lib/format';
import { toast } from '@/store/toastStore';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { TemplateEditor, type PreviewValues } from '@/components/templates/TemplateEditor';
import {
  STARTER_TEMPLATES, TEMPLATE_BODY_MAX, TEMPLATE_LIMIT, TEMPLATE_NAME_MAX,
} from '@/components/templates/starterTemplates';

type Selection = { kind: 'none' } | { kind: 'new' } | { kind: 'existing'; id: string };
type Draft = { name: string; body: string };
const EMPTY: Draft = { name: '', body: '' };

function ListSkeleton() {
  return (
    <div className="divide-y divide-slate-100" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="px-4 py-3.5 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

export default function TemplatesPage() {
  const user = useAuthStore((s) => s.user);
  const isRecruiter = user?.role === 'RECRUITER';
  const templates = useMessageTemplates(isRecruiter);
  const company = useMyCompany(isRecruiter);
  const save = useSaveTemplate();
  const del = useDeleteTemplate();

  const [selection, setSelection] = useState<Selection>({ kind: 'none' });
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<{ name?: string; body?: string }>({});
  const [pendingNav, setPendingNav] = useState<Selection | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MessageTemplate | null>(null);
  const [seeding, setSeeding] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const list = useMemo(
    () => [...(templates.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [templates.data]
  );
  const current = selection.kind === 'existing' ? list.find((t) => t.id === selection.id) : undefined;
  const original: Draft = current ? { name: current.name, body: current.body } : EMPTY;
  const dirty = selection.kind !== 'none' && (draft.name !== original.name || draft.body !== original.body);
  const atLimit = list.length >= TEMPLATE_LIMIT;

  // Warn before leaving the page with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  // If the selected template disappears (deleted elsewhere), reset the editor.
  useEffect(() => {
    if (selection.kind === 'existing' && templates.data && !current) {
      setSelection({ kind: 'none' });
      setDraft(EMPTY);
    }
  }, [selection, templates.data, current]);

  const previewValues: PreviewValues = {
    firstName: 'Alex',
    candidateName: 'Alex Morgan',
    jobTitle: 'Frontend Engineer',
    companyName: company.data?.company.name || 'Your company',
    recruiterName: user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'You',
  };

  const applySelection = (next: Selection) => {
    setSelection(next);
    setErrors({});
    if (next.kind === 'existing') {
      const t = list.find((x) => x.id === next.id);
      setDraft(t ? { name: t.name, body: t.body } : EMPTY);
    } else {
      setDraft(EMPTY);
    }
    if (next.kind !== 'none' && typeof window !== 'undefined' && window.innerWidth < 1024) {
      requestAnimationFrame(() => editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  };

  const select = (next: Selection) => {
    const same =
      next.kind === selection.kind && (next.kind !== 'existing' || (selection.kind === 'existing' && selection.id === next.id));
    if (same) return;
    if (dirty) setPendingNav(next);
    else applySelection(next);
  };

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!draft.name.trim()) e.name = 'Give the template a name.';
    else if (draft.name.trim().length > TEMPLATE_NAME_MAX) e.name = `Keep the name under ${TEMPLATE_NAME_MAX} characters.`;
    if (!draft.body.trim()) e.body = 'Write the message.';
    else if (draft.body.length > TEMPLATE_BODY_MAX) e.body = `Keep the message under ${TEMPLATE_BODY_MAX.toLocaleString('en-US')} characters.`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSave = () => {
    if (!validate()) return;
    const id = selection.kind === 'existing' ? selection.id : undefined;
    save.mutate(
      { id, name: draft.name.trim(), body: draft.body },
      {
        onSuccess: (saved) => {
          toast.success(id ? 'Template saved' : 'Template created', saved.name);
          setSelection({ kind: 'existing', id: saved.id });
          setDraft({ name: saved.name, body: saved.body });
        },
        onError: (err) => toast.error('Could not save the template', getErrorMessage(err)),
      }
    );
  };

  const onDelete = () => {
    if (!deleteTarget) return;
    const t = deleteTarget;
    del.mutate(t.id, {
      onSuccess: () => {
        toast.success('Template deleted', t.name);
        setDeleteTarget(null);
        if (selection.kind === 'existing' && selection.id === t.id) applySelection({ kind: 'none' });
      },
      onError: (err) => toast.error('Could not delete the template', getErrorMessage(err)),
    });
  };

  const addStarters = async () => {
    setSeeding(true);
    let created = 0;
    try {
      for (const t of STARTER_TEMPLATES) {
        await save.mutateAsync(t);
        created++;
      }
      toast.success('Starter templates added', 'Edit them to match your voice.');
    } catch (err) {
      toast.error(
        created > 0 ? `Added ${created} of ${STARTER_TEMPLATES.length} templates` : 'Could not add starter templates',
        getErrorMessage(err)
      );
    } finally {
      setSeeding(false);
    }
  };

  if (!user) return null;
  if (!isRecruiter) {
    return (
      <div>
        <PageHeader title="Message templates" />
        <Card>
          <EmptyState icon={Lock} title="Templates are for recruiters" description="Recruiters use templates to message candidates quickly." />
        </Card>
      </div>
    );
  }

  const newButton = (
    <Button onClick={() => select({ kind: 'new' })} disabled={atLimit || selection.kind === 'new'} title={atLimit ? `You can keep up to ${TEMPLATE_LIMIT} templates` : undefined}>
      <Plus className="w-4 h-4" aria-hidden /> New template
    </Button>
  );

  return (
    <div>
      <PageHeader
        title="Message templates"
        description="Reusable messages for candidates. Placeholders like {{firstName}} are filled in when you send."
        actions={list.length > 0 ? newButton : undefined}
      />

      {templates.isError ? (
        <Card>
          <ErrorState title="We couldn't load your templates" error={templates.error} onRetry={() => templates.refetch()} retrying={templates.isRefetching} />
        </Card>
      ) : !templates.isLoading && list.length === 0 && selection.kind !== 'new' ? (
        <Card>
          <EmptyState
            icon={MessageSquareText}
            title="No templates yet"
            description="Save time on common messages. Start with three ready-made templates (thanks for applying, interview invitation and a kind rejection) or write your own."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={addStarters} loading={seeding}>
                  {!seeding && <Sparkles className="w-4 h-4" aria-hidden />} Add starter templates
                </Button>
                <Button variant="secondary" onClick={() => select({ kind: 'new' })} disabled={seeding}>
                  <Plus className="w-4 h-4" aria-hidden /> Write your own
                </Button>
              </div>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)] items-start">
          <Card className="overflow-hidden lg:sticky lg:top-6">
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Your templates</h2>
              <span className="text-xs text-slate-500 tabular-nums">{list.length}/{TEMPLATE_LIMIT}</span>
            </div>
            {templates.isLoading ? (
              <ListSkeleton />
            ) : (
              <ul className="divide-y divide-slate-100 lg:max-h-[calc(100vh-14rem)] lg:overflow-y-auto">
                {selection.kind === 'new' && (
                  <li>
                    <div className="px-4 py-3 bg-primary-50/70 border-l-2 border-primary-600" aria-current="true">
                      <p className="text-sm font-medium text-primary-800 truncate">{draft.name.trim() || 'Untitled template'}</p>
                      <p className="text-xs text-primary-700/80">New, not saved yet</p>
                    </div>
                  </li>
                )}
                {list.map((t) => {
                  const active = selection.kind === 'existing' && selection.id === t.id;
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => select({ kind: 'existing', id: t.id })}
                        aria-current={active ? 'true' : undefined}
                        className={cn(
                          'w-full text-left px-4 py-3 border-l-2 focus:outline-none focus-visible:bg-slate-50',
                          active ? 'bg-primary-50/70 border-primary-600' : 'border-transparent hover:bg-slate-50'
                        )}
                      >
                        <span className={cn('block text-sm font-medium truncate', active ? 'text-primary-800' : 'text-slate-900')}>
                          {active && dirty ? `${draft.name.trim() || 'Untitled'} •` : t.name}
                        </span>
                        <span className="block text-xs text-slate-500 line-clamp-2 break-words mt-0.5">{t.body}</span>
                        <span className="block text-[11px] text-slate-400 mt-1">Updated {timeAgo(t.updatedAt)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {atLimit && (
              <p className="px-4 py-3 text-xs text-amber-700 bg-amber-50 border-t border-amber-100">
                You&apos;ve reached the limit of {TEMPLATE_LIMIT} templates. Delete one to add another.
              </p>
            )}
          </Card>

          <div ref={editorRef} className="min-w-0 scroll-mt-6">
            {selection.kind === 'none' ? (
              <Card>
                <EmptyState
                  icon={FileText}
                  title="Select a template to edit"
                  description="Choose a template from the list, or create a new one."
                  action={newButton}
                />
              </Card>
            ) : (
              <TemplateEditor
                isNew={selection.kind === 'new'}
                name={draft.name}
                body={draft.body}
                dirty={dirty}
                errors={errors}
                onChange={(patch) => {
                  setDraft((d) => ({ ...d, ...patch }));
                  if (patch.name !== undefined && errors.name) setErrors((e) => ({ ...e, name: undefined }));
                  if (patch.body !== undefined && errors.body) setErrors((e) => ({ ...e, body: undefined }));
                }}
                onSave={onSave}
                onDelete={current ? () => setDeleteTarget(current) : undefined}
                onDiscard={() => (selection.kind === 'new' ? applySelection({ kind: 'none' }) : applySelection(selection))}
                saving={save.isPending && !seeding}
                previewValues={previewValues}
              />
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingNav}
        onClose={() => setPendingNav(null)}
        onConfirm={() => {
          if (pendingNav) applySelection(pendingNav);
          setPendingNav(null);
        }}
        title="Discard unsaved changes?"
        description="Your edits to this template haven't been saved. If you continue, they'll be lost."
        confirmLabel="Discard changes"
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => !del.isPending && setDeleteTarget(null)}
        onConfirm={onDelete}
        loading={del.isPending}
        title="Delete this template?"
        description={deleteTarget ? `"${deleteTarget.name}" will be permanently deleted. Messages you've already sent aren't affected.` : undefined}
        confirmLabel="Delete template"
      />
    </div>
  );
}
