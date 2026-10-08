'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BellRing, ChevronDown, LogOut, User2 } from 'lucide-react';
import { useLogout } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { ROLE_LABELS } from '@/lib/constants';
import type { User } from '@/types';
import { ThemeSegmented } from '@/components/ui/ThemeToggle';

/** Avatar button that opens an account menu (Profile, Notification settings, Sign out). */
export function UserMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const logout = useLogout();
  const pathname = usePathname();

  // Close on navigation.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
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

  const itemCls =
    'flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-fg-secondary hover:bg-muted hover:text-fg focus:outline-none focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-primary-500';

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Account menu for ${user.fullName}`}
        className="flex items-center gap-2 rounded-full sm:rounded-lg sm:pl-1 sm:pr-2 sm:py-1 hover:bg-subtle transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <Avatar name={user.fullName} src={user.avatarUrl} size="sm" />
        <span className="hidden sm:flex flex-col items-start text-left min-w-0">
          <span className="text-sm font-semibold text-fg-soft leading-tight truncate max-w-[10rem]">{user.fullName}</span>
          <span className="text-xs text-fg-muted leading-tight">{ROLE_LABELS[user.role]}</span>
        </span>
        <ChevronDown className="hidden sm:block w-4 h-4 text-fg-subtle" aria-hidden />
      </button>

      {open && (
        <div
          id={menuId}
          className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl bg-surface shadow-lg ring-1 ring-line p-1.5 z-40"
        >
          <div className="px-3 py-2.5 border-b border-line-subtle mb-1">
            <p className="text-sm font-semibold text-fg truncate">{user.fullName}</p>
            <p className="text-xs text-fg-muted truncate">{user.email}</p>
            <p className="text-xs text-fg-muted mt-0.5">{ROLE_LABELS[user.role]}</p>
          </div>
          <ul>
            <li>
              <Link href="/profile" className={itemCls}>
                <User2 className="w-4 h-4 text-fg-subtle" aria-hidden /> Profile
              </Link>
            </li>
            <li>
              <Link href="/notifications/preferences" className={itemCls}>
                <BellRing className="w-4 h-4 text-fg-subtle" aria-hidden /> Notification settings
              </Link>
            </li>
            <li className="mt-1 pt-2 pb-1 px-1.5 border-t border-line-subtle">
              <p className="px-1.5 pb-1.5 text-xs font-medium text-fg-muted">Theme</p>
              <ThemeSegmented />
            </li>
            <li className="mt-1 pt-1 border-t border-line-subtle">
              <button type="button" onClick={logout} className={`${itemCls} text-rose-600 hover:text-rose-700 hover:bg-rose-50`}>
                <LogOut className="w-4 h-4" aria-hidden /> Sign out
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
