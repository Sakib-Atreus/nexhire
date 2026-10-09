'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Application, ApplicationStatus } from '@/types';
import { APPLICATION_STATUS_BAR } from '@/lib/constants';
import { buttonClasses } from '@/components/ui/Button';
import { MOVE_TARGETS } from '@/components/pipeline/stages';
import { cn } from '@/lib/cn';

const MENU_WIDTH = 200;
const MENU_HEIGHT = MOVE_TARGETS.length * 36 + 12;

/**
 * "Move to…" menu: any pipeline stage or Rejected (the hiring team may move freely; Withdrawn is
 * candidate-only, so withdrawn applications get no menu). The menu is position:fixed so it isn't
 * clipped by scrolling board columns. The caller performs the move (and any confirmation).
 */
export function ApplicantStatusMenu({ app, onMove, size = 'sm', className }: {
  app: Application;
  onMove: (app: Application, status: ApplicationStatus) => void;
  size?: 'xs' | 'sm';
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = Math.max(8, Math.min(r.right - MENU_WIDTH, vw - MENU_WIDTH - 8));
    const below = r.bottom + 6 + MENU_HEIGHT <= vh;
    setStyle(below ? { left, top: r.bottom + 6, width: MENU_WIDTH } : { left, bottom: vh - r.top + 6, width: MENU_WIDTH });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const close = () => setOpen(false);
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [open]);

  if (app.status === 'WITHDRAWN') return null;
  const targets = MOVE_TARGETS.filter((t) => t.status !== app.status);

  function choose(status: ApplicationStatus) {
    setOpen(false);
    triggerRef.current?.focus();
    onMove(app, status);
  }

  function onMenuKeyDown(e: React.KeyboardEvent) {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []);
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    let next = -1;
    if (e.key === 'ArrowDown') next = (i + 1) % items.length;
    else if (e.key === 'ArrowUp') next = (i - 1 + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    else if (e.key === 'Tab') { setOpen(false); return; }
    if (next < 0) return;
    e.preventDefault();
    items[next]?.focus();
  }

  return (
    <div
      className={cn('relative', className)}
      ref={rootRef}
      data-escape-local=""
      // Keep clicks/drags on the menu from opening the drawer or starting a card drag.
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); }}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Move ${app.candidateName} to another stage`}
        className={size === 'xs'
          ? 'inline-flex flex-shrink-0 items-center gap-1 h-7 px-2 rounded-md text-xs font-medium whitespace-nowrap text-fg-tertiary hover:bg-subtle hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'
          : buttonClasses('secondary', 'sm')}
      >
        Move to
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={`Move ${app.candidateName} to`}
          onKeyDown={onMenuKeyDown}
          style={style}
          className="fixed bg-surface rounded-xl border border-line shadow-lg py-1.5 z-[55]"
        >
          {targets.map((t) => (
            <button
              key={t.status}
              type="button"
              role="menuitem"
              onClick={() => choose(t.status)}
              className={cn(
                'w-full h-9 px-3.5 text-left text-sm flex items-center gap-2.5 hover:bg-muted focus:bg-muted focus:outline-none',
                t.status === 'REJECTED' ? 'text-rose-700' : t.status === 'HIRED' ? 'text-emerald-700' : 'text-fg-secondary'
              )}
            >
              <span className={cn('w-2 h-2 rounded-full flex-shrink-0', APPLICATION_STATUS_BAR[t.status])} aria-hidden />
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
