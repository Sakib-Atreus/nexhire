'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ExternalLink, FileText, Mail, X } from 'lucide-react';
import type { Application, ApplicationStatus } from '@/types';
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_STYLES } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { buttonClasses } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { StarRatingInput } from '@/components/pipeline/StarRating';
import { MOVE_TARGETS } from '@/components/pipeline/stages';
import { OverviewTab } from './OverviewTab';
import { NotesTab } from './NotesTab';
import { MessagesTab, type MessageDraft } from './MessagesTab';
import { InterviewsTab } from './InterviewsTab';

type Tab = 'overview' | 'notes' | 'messages' | 'interviews';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Applicant details for the hiring team: right-side panel on desktop, full-screen sheet on mobile.
 * Escape closes it (unless a nested dialog or menu has focus); focus is trapped and restored.
 */
export function ApplicantDrawer({ app, onClose, onMove }: {
  app: Application | null;
  onClose: () => void;
  onMove: (app: Application, status: ApplicationStatus) => void;
}) {
  const open = !!app;
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = useId();
  const tabsId = useId();
  const [tab, setTab] = useState<Tab>('overview');
  const [messageDraft, setMessageDraft] = useState<MessageDraft | null>(null);

  // Reset to Overview when switching applicants.
  const appId = app?.id;
  useEffect(() => {
    setTab('overview');
    setMessageDraft(null);
  }, [appId]);

  /** Open the Messages tab with the composer pre-filled (e.g. an interview reminder). */
  function composeMessage(text: string) {
    setMessageDraft({ text, key: Date.now() });
    setTab('messages');
  }

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      const panel = panelRef.current;
      if (!panel) return;
      const active = document.activeElement as HTMLElement | null;
      // Let nested dialogs (Modal/ConfirmDialog) and open menus handle their own keys.
      const topDialog = active?.closest('[role="dialog"]');
      if (topDialog && topDialog !== panel) return;
      if (active?.closest('[role="menu"]')) return;
      if (e.key === 'Escape' && !e.defaultPrevented) {
        onCloseRef.current();
        return;
      }
      if (e.key === 'Tab') {
        const els = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
        if (els.length === 0) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (!panel.contains(active)) { e.preventDefault(); first.focus(); }
        else if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      if (previouslyFocused && document.contains(previouslyFocused)) previouslyFocused.focus?.();
    };
  }, [open]);

  if (!app) return null;

  const withdrawn = app.status === 'WITHDRAWN';
  const tabs: { id: Tab; label: string; count?: number | null }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'notes', label: 'Notes', count: app.noteCount },
    { id: 'messages', label: 'Messages', count: app.messageCount },
    { id: 'interviews', label: 'Interviews' },
  ];

  function onTabKey(e: React.KeyboardEvent) {
    const i = tabs.findIndex((t) => t.id === tab);
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    setTab(tabs[next].id);
    document.getElementById(`${tabsId}-tab-${tabs[next].id}`)?.focus();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full sm:max-w-[560px] h-full bg-white shadow-2xl flex flex-col focus:outline-none"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 pt-4 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <Avatar name={app.candidateName} src={app.candidateAvatarUrl} size="md" />
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-lg font-bold text-slate-900 break-words leading-tight">{app.candidateName}</h2>
              {app.candidateHeadline && <p className="text-sm text-slate-600 break-words">{app.candidateHeadline}</p>}
              <a href={`mailto:${app.candidateEmail}`} className="mt-0.5 text-sm text-slate-500 hover:text-primary-600 inline-flex items-center gap-1 max-w-full">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />
                <span className="truncate">{app.candidateEmail}</span>
              </a>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close applicant details"
              className="-mr-2 -mt-1 p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <X className="w-5 h-5" aria-hidden />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
            {withdrawn ? (
              <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                <Badge tone={APPLICATION_STATUS_STYLES.WITHDRAWN}>{APPLICATION_STATUS_LABELS.WITHDRAWN}</Badge>
                Withdrawn by the candidate
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <label htmlFor={`${titleId}-status`} className="text-xs font-medium text-slate-500">Stage</label>
                <Select
                  id={`${titleId}-status`}
                  value={app.status}
                  onChange={(e) => onMove(app, e.target.value as ApplicationStatus)}
                  className="h-8 text-sm w-auto py-0"
                >
                  {MOVE_TARGETS.map((t) => <option key={t.status} value={t.status}>{t.label}</option>)}
                </Select>
              </div>
            )}
            <StarRatingInput applicationId={app.id} rating={app.rating} candidateName={app.candidateName} />
            {app.resumeUrl && (
              <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" className={buttonClasses('secondary', 'sm', 'sm:ml-auto')}>
                <FileText className="w-3.5 h-3.5" aria-hidden />
                Resume
                <ExternalLink className="w-3 h-3 text-slate-400" aria-hidden />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div role="tablist" aria-label="Applicant sections" onKeyDown={onTabKey} className="flex gap-1 px-2 sm:px-4 border-b border-slate-200 overflow-x-auto">
          {tabs.map((t) => {
            const selected = tab === t.id;
            return (
              <button
                key={t.id}
                id={`${tabsId}-tab-${t.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`${tabsId}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setTab(t.id)}
                className={cn(
                  'relative flex-shrink-0 px-3 py-2.5 text-sm font-medium inline-flex items-center gap-1.5 border-b-2 -mb-px focus:outline-none focus-visible:bg-slate-50',
                  selected ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
              >
                {t.label}
                {!!t.count && (
                  <span className={cn('text-[11px] tabular-nums rounded-full px-1.5', selected ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-500')}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div
          id={`${tabsId}-panel`}
          role="tabpanel"
          aria-labelledby={`${tabsId}-tab-${tab}`}
          tabIndex={0}
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 focus:outline-none"
        >
          {tab === 'overview' && <OverviewTab app={app} />}
          {tab === 'notes' && <NotesTab applicationId={app.id} candidateName={app.candidateName} />}
          {tab === 'messages' && <MessagesTab applicationId={app.id} candidateName={app.candidateName} draft={messageDraft} onDraftUsed={() => setMessageDraft(null)} />}
          {tab === 'interviews' && (
            <InterviewsTab applicationId={app.id} candidateName={app.candidateName} readOnly={withdrawn} onSendReminder={composeMessage} />
          )}
        </div>
      </div>
    </div>
  );
}
