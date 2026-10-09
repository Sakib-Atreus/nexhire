'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, CalendarDays, ChevronRight, LayoutGrid, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUnreadCount } from '@/hooks/useNotifications';
import { buttonClasses } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { BrandMark } from './BrandMark';
import { ThemeIconButton } from '@/components/ui/ThemeToggle';
import { UserMenu } from './UserMenu';
import { MOBILE_NAV, PUBLIC_NAV, SIDEBAR_NAV, SIDEBAR_SECTIONS, getBreadcrumbs, isNavActive } from './nav';

const iconButton =
  'relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-subtle hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500';

function Breadcrumbs({ pathname }: { pathname: string }) {
  const role = useAuthStore((s) => s.user?.role);
  const crumbs = getBreadcrumbs(pathname, role);
  if (crumbs.length === 0) return <div className="hidden lg:block" />;
  const section = (role ? SIDEBAR_NAV[role] : PUBLIC_NAV).find((item) => isNavActive(item.href, pathname));
  const SectionIcon = section?.icon;
  return (
    <nav aria-label="Breadcrumb" className="hidden lg:flex items-center gap-3 min-w-0">
      {SectionIcon && (
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600" aria-hidden>
          <SectionIcon className="h-4 w-4" />
        </span>
      )}
      <ol className="flex items-center gap-1.5 text-sm min-w-0">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={c.label} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <ChevronRight className="w-4 h-4 text-fg-faint flex-shrink-0" aria-hidden />}
                {c.href && !last ? (
                  <Link href={c.href} className="text-fg-muted hover:text-fg-soft transition-colors">{c.label}</Link>
                ) : (
                  <span className={cn('truncate', last ? 'font-semibold text-fg' : 'text-fg-muted')} aria-current={last ? 'page' : undefined}>
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
  const [moreOpen, setMoreOpen] = useState(false);
  useEffect(() => setMoreOpen(false), [pathname]);
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMoreOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [moreOpen]);
  // "More" is highlighted when the current page isn't one of the four main tabs.
  const moreActive = mobileNav.length > 0 && !mobileNav.some((item) => isNavActive(item.href, pathname));

  return (
    <>
      <header className="sticky top-0 z-20 bg-surface/95 backdrop-blur border-b border-line">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <BrandMark href="/" size="sm" className="lg:hidden" />
          <Breadcrumbs pathname={pathname} />

          {guest || !user ? (
            <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
              <ThemeIconButton />
              <Link href="/login" className={buttonClasses('ghost', 'sm')}>Sign in</Link>
              <Link href="/register" className={buttonClasses('primary', 'sm')}>Create account</Link>
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-1.5 ml-auto">
              {user.role !== 'ADMIN' && (
                <Link
                  href="/calendar"
                  aria-label="Calendar"
                  title="Calendar"
                  aria-current={pathname === '/calendar' ? 'page' : undefined}
                  className={cn(iconButton, 'hidden sm:inline-flex', pathname === '/calendar' && 'bg-primary-50 text-primary-600')}
                >
                  <CalendarDays className="h-[18px] w-[18px]" aria-hidden />
                </Link>
              )}
              <ThemeIconButton />
              <Link href="/notifications" aria-label={bellLabel} title="Notifications" className={iconButton}>
                <Bell className="h-[18px] w-[18px]" aria-hidden />
                {unreadCount > 0 && (
                  <span
                    className="absolute top-0.5 right-0.5 min-w-[1.125rem] h-[1.125rem] px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none ring-2 ring-surface"
                    aria-hidden
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <span className="mx-1 hidden sm:block w-px h-6 bg-emphasis" aria-hidden />
              <UserMenu user={user} />
            </div>
          )}
        </div>
      </header>

      {mobileNav.length > 0 && (
        <nav
          aria-label="Main"
          className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-[calc(3.5rem+env(safe-area-inset-bottom))] bg-surface border-t border-line flex pb-[env(safe-area-inset-bottom)]"
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
                  active ? 'text-primary-600' : 'text-fg-muted hover:text-fg-soft'
                )}
              >
                <span className="relative">
                  <Icon className="w-5 h-5" aria-hidden />
                  {isNotif && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-surface" aria-hidden />
                  )}
                </span>
                <span className="truncate max-w-full px-0.5">{item.short ?? item.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            className={cn(
              'flex-1 min-w-0 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors',
              moreActive || moreOpen ? 'text-primary-600' : 'text-fg-muted hover:text-fg-soft'
            )}
          >
            <LayoutGrid className="w-5 h-5" aria-hidden />
            <span>More</span>
          </button>
        </nav>
      )}

      {moreOpen && user && (
        <div className="lg:hidden fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="All pages">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/40" onClick={() => setMoreOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-surface border-t border-line shadow-xl pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="sticky top-0 flex items-center justify-between bg-surface px-4 pt-4 pb-2">
              <p className="text-sm font-semibold text-fg">All pages</p>
              <button type="button" onClick={() => setMoreOpen(false)} aria-label="Close" className={iconButton}>
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="px-4 space-y-4">
              {SIDEBAR_SECTIONS[user.role].map((section, i) => (
                <div key={section.title ?? i}>
                  {section.title && (
                    <p className="pb-2 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">{section.title}</p>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isNavActive(item.href, pathname);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'relative flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center text-xs font-medium transition-colors',
                            active ? 'border-primary-200 bg-primary-50 text-primary-700' : 'border-line text-fg-secondary hover:bg-muted'
                          )}
                        >
                          <Icon className="h-5 w-5" aria-hidden />
                          <span className="leading-tight">{item.label}</span>
                          {item.href === '/notifications' && unreadCount > 0 && (
                            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500" aria-hidden />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
