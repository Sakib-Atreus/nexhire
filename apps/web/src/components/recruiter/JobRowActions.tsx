'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarChart3, Copy, Eye, Lock, MoreHorizontal, Pencil, RotateCcw, Send, Trash2, Users } from 'lucide-react';
import type { Job } from '@/types';
import { useUpdateJob } from '@/hooks/useJobs';
import { useDuplicateJob } from '@/hooks/useHiring';
import { getErrorMessage, pluralize } from '@/lib/format';
import { toast } from '@/store/toastStore';
import { Button, buttonClasses } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/States';
import { cn } from '@/lib/cn';

const iconBtn =
  'inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors ' +
  'hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50';

const menuItem =
  'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none disabled:opacity-50';

/**
 * Per-row actions for a hiring-team job: applicants, publish/close/reopen, analytics, edit,
 * plus a "more" menu (view, duplicate, delete). useUpdateJob is bound to a single job id.
 */
export function JobRowActions({ job, onDelete }: { job: Job; onDelete: (job: Job) => void }) {
  const router = useRouter();
  const update = useUpdateJob(job.id);
  const duplicate = useDuplicateJob();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const applicants = job.applicationCount ?? 0;
  const isDraft = job.status === 'DRAFT';
  const canClose = job.status === 'OPEN';
  const canOpen = job.status === 'CLOSED' || isDraft;
  const openLabel = isDraft ? 'Publish' : 'Reopen';

  // Close the menu on outside click.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  // Focus the first item when the menu opens.
  useEffect(() => {
    if (menuOpen) menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, [menuOpen]);

  function closeMenu(restoreFocus = true) {
    setMenuOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }

  function onMenuKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? []);
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'Escape') { e.preventDefault(); closeMenu(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length]?.focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length]?.focus(); }
    else if (e.key === 'Home') { e.preventDefault(); items[0]?.focus(); }
    else if (e.key === 'End') { e.preventDefault(); items[items.length - 1]?.focus(); }
    else if (e.key === 'Tab') setMenuOpen(false);
  }

  function setStatus(status: 'OPEN' | 'CLOSED') {
    update.mutate(
      { status },
      {
        onSuccess: () => {
          if (status === 'CLOSED') toast.success('Job closed', `“${job.title}” no longer accepts applications.`);
          else if (isDraft) toast.success('Job published', `“${job.title}” is now live.`);
          else toast.success('Job reopened', `“${job.title}” is accepting applications again.`);
        },
        onError: (err) => toast.error('Could not update job status', getErrorMessage(err)),
      }
    );
  }

  function duplicateJob() {
    closeMenu(false);
    duplicate.mutate(job.id, {
      onSuccess: (copy) => {
        toast.success('Copy created as a draft', `Review “${copy.title}” and publish it when it’s ready.`);
        router.push(`/jobs/${copy.id}/edit`);
      },
      onError: (err) => toast.error('Could not duplicate job', getErrorMessage(err)),
    });
  }

  return (
    <div ref={wrapRef} className="flex flex-wrap items-center gap-1.5">
      <Link href={`/jobs/${job.id}/applicants`} className={buttonClasses('secondary', 'sm', 'text-primary-700')}>
        <Users className="w-3.5 h-3.5" aria-hidden />
        {pluralize(applicants, 'applicant')}
      </Link>

      {(canClose || canOpen) && (
        <Button
          variant={isDraft ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setStatus(canClose ? 'CLOSED' : 'OPEN')}
          disabled={update.isPending}
          aria-label={canClose ? `Close ${job.title}` : `${openLabel} ${job.title}`}
        >
          {update.isPending ? (
            <Spinner className={cn('w-3.5 h-3.5', isDraft ? 'text-white' : 'text-slate-500')} />
          ) : canClose ? (
            <Lock className="w-3.5 h-3.5" aria-hidden />
          ) : isDraft ? (
            <Send className="w-3.5 h-3.5" aria-hidden />
          ) : (
            <RotateCcw className="w-3.5 h-3.5" aria-hidden />
          )}
          <span className={isDraft ? undefined : 'hidden sm:inline'}>{canClose ? 'Close' : openLabel}</span>
        </Button>
      )}

      <Link href={`/jobs/${job.id}/analytics`} className={iconBtn} aria-label={`Analytics for ${job.title}`} title="Analytics">
        <BarChart3 className="w-4 h-4" aria-hidden />
      </Link>
      <Link href={`/jobs/${job.id}/edit`} className={iconBtn} aria-label={`Edit ${job.title}`} title="Edit job">
        <Pencil className="w-4 h-4" aria-hidden />
      </Link>

      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          className={iconBtn}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-controls={menuOpen ? menuId : undefined}
          aria-label={`More actions for ${job.title}`}
          title="More actions"
          onClick={() => setMenuOpen((o) => !o)}
          disabled={duplicate.isPending}
        >
          {duplicate.isPending ? <Spinner className="w-4 h-4 text-slate-500" /> : <MoreHorizontal className="w-4 h-4" aria-hidden />}
        </button>
        {menuOpen && (
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label={`Actions for ${job.title}`}
            onKeyDown={onMenuKeyDown}
            className="absolute right-0 top-full z-20 mt-1.5 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          >
            <Link href={`/jobs/${job.id}`} role="menuitem" className={menuItem} onClick={() => setMenuOpen(false)}>
              <Eye className="w-4 h-4 text-slate-400" aria-hidden /> View job
            </Link>
            <button type="button" role="menuitem" className={menuItem} onClick={duplicateJob}>
              <Copy className="w-4 h-4 text-slate-400" aria-hidden /> Duplicate
            </button>
            <div className="my-1 border-t border-slate-100" role="separator" />
            <button
              type="button"
              role="menuitem"
              className={cn(menuItem, 'text-rose-600 hover:bg-rose-50 focus:bg-rose-50')}
              onClick={() => { closeMenu(false); onDelete(job); }}
            >
              <Trash2 className="w-4 h-4" aria-hidden /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
