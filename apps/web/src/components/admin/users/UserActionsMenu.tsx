'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, BadgeX, Eye, MoreHorizontal, ShieldCheck, ShieldOff, Trash2, UserCog } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Spinner } from '@/components/ui/States';
import type { User } from '@/types';
import type { UserActionKind } from './useUserActions';

interface Item {
  key: string;
  label: string;
  icon: LucideIcon;
  danger?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

/** Kebab menu with the moderation actions for one user row. */
export function UserActionsMenu({ user, isSelf, busy, onAction }: {
  user: User;
  isSelf: boolean;
  busy?: boolean;
  onAction: (kind: UserActionKind, user: User) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')?.focus();
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

  const run = (kind: UserActionKind) => () => onAction(kind, user);
  const suspended = user.enabled === false;
  const items: Item[] = [];
  if (user.role === 'RECRUITER') {
    items.push(user.verified
      ? { key: 'verify', label: 'Remove verification', icon: BadgeX, onSelect: run('verify') }
      : { key: 'verify', label: 'Verify recruiter', icon: BadgeCheck, onSelect: run('verify') });
  }
  items.push(
    { key: 'role', label: 'Change role', icon: UserCog, disabled: isSelf, onSelect: run('role') },
    suspended
      ? { key: 'status', label: 'Restore account', icon: ShieldCheck, disabled: isSelf, onSelect: run('status') }
      : { key: 'status', label: 'Suspend account', icon: ShieldOff, disabled: isSelf, danger: true, onSelect: run('status') },
    { key: 'delete', label: 'Delete account', icon: Trash2, disabled: isSelf, danger: true, onSelect: run('delete') },
  );

  function select(item: Item) {
    if (item.disabled) return;
    setOpen(false);
    item.onSelect();
  }

  function onMenuKeyDown(e: React.KeyboardEvent) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const els = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? []);
    if (els.length === 0) return;
    const i = els.indexOf(document.activeElement as HTMLElement);
    const next =
      e.key === 'Home' ? 0
        : e.key === 'End' ? els.length - 1
          : e.key === 'ArrowDown' ? (i + 1) % els.length
            : (i - 1 + els.length) % els.length;
    els[next]?.focus();
  }

  const itemClass = 'w-full px-3.5 py-2 text-left text-sm flex items-center gap-2.5 focus:outline-none';

  return (
    <div className="relative inline-block text-left" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Actions for ${user.fullName}`}
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        {busy ? <Spinner className="w-4 h-4 text-slate-500" /> : <MoreHorizontal className="w-4 h-4" aria-hidden />}
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={`Actions for ${user.fullName}`}
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-30"
        >
          <Link
            href={`/admin/users/${user.id}`}
            role="menuitem"
            onClick={() => setOpen(false)}
            className={cn(itemClass, 'text-slate-700 hover:bg-slate-50 focus:bg-slate-50')}
          >
            <Eye className="w-4 h-4 text-slate-400" aria-hidden />
            View details
          </Link>
          <div className="my-1 border-t border-slate-100" role="separator" />
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              aria-disabled={item.disabled || undefined}
              tabIndex={item.disabled ? -1 : undefined}
              title={item.disabled ? 'This is you. You can’t change your own account here.' : undefined}
              onClick={() => select(item)}
              className={cn(
                itemClass,
                item.disabled
                  ? 'text-slate-400 cursor-not-allowed'
                  : item.danger
                    ? 'text-rose-700 hover:bg-rose-50 focus:bg-rose-50'
                    : 'text-slate-700 hover:bg-slate-50 focus:bg-slate-50'
              )}
            >
              <item.icon className={cn('w-4 h-4', item.disabled ? 'text-slate-300' : item.danger ? 'text-rose-500' : 'text-slate-400')} aria-hidden />
              {item.label}
            </button>
          ))}
          {isSelf && (
            <p className="px-3.5 pt-1.5 pb-1 text-xs text-slate-500 border-t border-slate-100 mt-1">
              This is you. Ask another administrator to change your role, suspend or delete your account.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
