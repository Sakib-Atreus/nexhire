'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUnreadCount } from '@/hooks/useNotifications';
import { buttonClasses } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { BrandMark } from './BrandMark';
import { UserMenu } from './UserMenu';
import { MOBILE_NAV, getBreadcrumbs, isNavActive } from './nav';

function Breadcrumbs({ pathname }: { pathname: string }) {
  const role = useAuthStore((s) => s.user?.role);
  const crumbs = getBreadcrumbs(pathname, role);
  if (crumbs.length === 0) return <div className="hidden lg:block" />;
  return (
    <nav aria-label="Breadcrumb" className="hidden lg:block min-w-0">
      <ol className="flex items-center gap-1.5 text-sm">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={c.label} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" aria-hidden />}
                {c.href && !last ? (
                  <Link href={c.href} className="text-slate-500 hover:text-slate-800 transition-colors">{c.label}</Link>
                ) : (
                  <span className={cn('truncate', last ? 'font-semibold text-slate-900' : 'text-slate-500')} aria-current={last ? 'page' : undefined}>
                    {c.label}
                  </span>
                )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function Navbar({ guest = false }: { guest?: boolean }) {
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();
  const { data: unreadCount = 0 } = useUnreadCount(!guest);

  const bellLabel = unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications';
  const mobileNav = user && !guest ? MOBILE_NAV[user.role] : [];

  return (
    <>
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <BrandMark href="/" size="sm" className="lg:hidden" />
          <Breadcrumbs pathname={pathname} />

          {guest || !user ? (
            <div className="flex items-center gap-2 ml-auto">
              <Link href="/login" className={buttonClasses('ghost', 'sm')}>Sign in</Link>
              <Link href="/register" className={buttonClasses('primary', 'sm')}>Create account</Link>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-3 ml-auto">
              <Link
                href="/notifications"
                aria-label={bellLabel}
                className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <Bell className="w-5 h-5" aria-hidden />
                {unreadCount > 0 && (
                  <span
                    className="absolute top-1 right-1 min-w-[1.125rem] h-[1.125rem] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none ring-2 ring-white"
                    aria-hidden
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <span className="hidden sm:block w-px h-6 bg-slate-200" aria-hidden />
              <UserMenu user={user} />
            </div>
          )}
        </div>
      </header>

      {mobileNav.length > 0 && (
        <nav
          aria-label="Main"
          className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-[calc(3.5rem+env(safe-area-inset-bottom))] bg-white border-t border-slate-200 flex pb-[env(safe-area-inset-bottom)]"
        >
          {mobileNav.map((item) => {
            const active = isNavActive(item.href, pathname);
            const isNotif = item.href === '/notifications';
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                aria-label={isNotif && unreadCount > 0 ? `${item.label}, ${unreadCount} unread` : undefined}
                className={cn(
                  'flex-1 min-w-0 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors',
                  active ? 'text-primary-600' : 'text-slate-500 hover:text-slate-800'
                )}
              >
                <span className="relative">
                  <Icon className="w-5 h-5" aria-hidden />
                  {isNotif && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" aria-hidden />
                  )}
                </span>
                <span className="truncate max-w-full px-0.5">{item.short ?? item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}
