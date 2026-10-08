'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Application, ApplicationStatus } from '@/types';
import { useUpdateApplicationStatus } from '@/hooks/useApplications';
import { ALLOWED_TRANSITIONS, APPLICATION_STATUS_BAR, APPLICATION_STATUS_LABELS } from '@/lib/constants';
import { getErrorMessage } from '@/lib/format';
import { toast } from '@/store/toastStore';
import { buttonClasses } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/States';
import { cn } from '@/lib/cn';

/** "Move to…" dropdown offering only the transitions allowed from the application's current status. */
export function ApplicantStatusMenu({ app }: { app: Application }) {
  const update = useUpdateApplicationStatus();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const transitions = ALLOWED_TRANSITIONS[app.status];
  if (transitions.length === 0) return null;

  function choose(status: ApplicationStatus) {
    setOpen(false);
    triggerRef.current?.focus();
    update.mutate(
      { id: app.id, status },
      {
        onSuccess: () => toast.success(`${app.candidateName} moved to ${APPLICATION_STATUS_LABELS[status]}`),
        onError: (err) => toast.error('Could not update status', getErrorMessage(err)),
      }
    );
  }

  function onMenuKeyDown(e: React.KeyboardEvent) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []);
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
    items[next]?.focus();
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={update.isPending}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Change status for ${app.candidateName}`}
        className={buttonClasses('secondary', 'sm')}
      >
        {update.isPending ? <Spinner className="w-3.5 h-3.5 text-slate-500" /> : null}
        Move to
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Move application to"
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-20"
        >
          {transitions.map((s) => (
            <button
              key={s}
              type="button"
              role="menuitem"
              onClick={() => choose(s)}
              className={cn(
                'w-full px-3.5 py-2 text-left text-sm flex items-center gap-2.5 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none',
                s === 'REJECTED' ? 'text-rose-700' : 'text-slate-700'
              )}
            >
              <span className={cn('w-2 h-2 rounded-full flex-shrink-0', APPLICATION_STATUS_BAR[s])} aria-hidden />
              {APPLICATION_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
