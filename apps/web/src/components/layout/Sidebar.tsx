'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';
import { useUnreadCount } from '@/hooks/useNotifications';
import { Avatar } from '@/components/ui/Avatar';
import { buttonClasses } from '@/components/ui/Button';
import { ROLE_LABELS } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { BrandMark } from './BrandMark';
import { PUBLIC_NAV, SIDEBAR_NAV, isNavActive, type NavItem } from './nav';

function NavLink({ item, active, badge }: { item: NavItem; active: boolean; badge?: number }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        active ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      )}
    >
      {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary-600" aria-hidden />}
      <Icon
        className={cn('w-4 h-4 flex-shrink-0', active ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600')}
        aria-hidden
      />
      <span className="flex-1 truncate">{item.label}</span>
      {!!badge && badge > 0 && (
        <span className="ml-auto min-w-[1.25rem] h-5 px-1.5 rounded-full bg-primary-600 text-white text-xs font-semibold flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
          <span className="sr-only"> unread</span>
        </span>
      )}
    </Link>
  );
}

export function Sidebar({ guest = false }: { guest?: boolean }) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const pathname = usePathname();
  const { data: unread } = useUnreadCount(!guest);

  const nav = guest || !user ? PUBLIC_NAV : SIDEBAR_NAV[user.role];

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-white border-r border-slate-200 fixed top-0 left-0 z-30">
      <div className="h-16 flex items-center px-5 border-b border-slate-100">
        <BrandMark href={guest ? '/' : '/dashboard'} />
      </div>

      <nav aria-label="Main" className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isNavActive(item.href, pathname)}
            badge={item.href === '/notifications' ? unread : undefined}
          />
        ))}
      </nav>

      {guest || !user ? (
        <div className="p-4 border-t border-slate-100 space-y-3">
          <p className="text-xs text-slate-500">Sign in to apply, save jobs and track your applications.</p>
          <Link href="/login" className={buttonClasses('primary', 'md', 'w-full')}>Sign in</Link>
          <Link href="/register" className={buttonClasses('secondary', 'md', 'w-full')}>Create account</Link>
        </div>
      ) : (
        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 py-2">
            <Link href="/profile" className="flex items-center gap-3 flex-1 min-w-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
              <Avatar name={user.fullName} src={user.avatarUrl} size="sm" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-800 truncate">{user.fullName}</span>
                <span className="block text-xs text-slate-500 truncate">{ROLE_LABELS[user.role]}</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={logout}
              aria-label="Sign out"
              title="Sign out"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <LogOut className="w-4 h-4" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
