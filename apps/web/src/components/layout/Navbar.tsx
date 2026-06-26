'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';
import { useUnreadCount } from '@/hooks/useNotifications';
import { Bell, Briefcase, LogOut, LayoutDashboard, FileText, PlusCircle, ShieldCheck, Users } from 'lucide-react';
import { cn } from '@/lib/cn';

const ROLE_COLORS: Record<string, string> = {
  CANDIDATE: 'bg-blue-50 text-blue-700',
  RECRUITER: 'bg-purple-50 text-purple-700',
  ADMIN: 'bg-red-50 text-red-700',
};

const MOBILE_NAV: Record<string, { href: string; label: string; icon: React.ElementType }[]> = {
  CANDIDATE: [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/jobs', label: 'Jobs', icon: Briefcase },
    { href: '/applications', label: 'Applied', icon: FileText },
    { href: '/notifications', label: 'Alerts', icon: Bell },
  ],
  RECRUITER: [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/jobs/my', label: 'My Jobs', icon: Briefcase },
    { href: '/jobs/create', label: 'Post', icon: PlusCircle },
    { href: '/notifications', label: 'Alerts', icon: Bell },
  ],
  ADMIN: [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/admin', label: 'Admin', icon: ShieldCheck },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/notifications', label: 'Alerts', icon: Bell },
  ],
};

export function Navbar() {
  const { user } = useAuthStore();
  const logout = useLogout();
  const { data: unreadCount } = useUnreadCount();
  const pathname = usePathname();

  const initials = user
    ? (`${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`).toUpperCase() || '?'
    : '?';
  const mobileNav = MOBILE_NAV[user?.role ?? 'CANDIDATE'];

  return (
    <>
      {/* Top bar — visible on all screen sizes */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 lg:border-b-0">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Mobile logo — links to home page */}
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-900">NexHire</span>
          </Link>

          {/* Page title area (desktop) */}
          <div className="hidden lg:block" />

          {/* Right side actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Notifications */}
            <Link
              href="/notifications"
              className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {!!unreadCount && unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* User info */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-800 leading-tight">{user?.firstName} {user?.lastName}</span>
                <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', ROLE_COLORS[user?.role ?? 'CANDIDATE'])}>
                  {user?.role}
                </span>
              </div>
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={initials}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {initials}
                </div>
              )}
              <button
                onClick={logout}
                className="hidden sm:flex p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 flex">
        {mobileNav.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const isNotif = item.href === '/notifications';
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors',
                active ? 'text-primary-600' : 'text-slate-500'
              )}
            >
              <div className="relative">
                <item.icon className="w-5 h-5" />
                {isNotif && !!unreadCount && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={logout}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium text-slate-500"
        >
          <LogOut className="w-5 h-5" />
          Sign out
        </button>
      </nav>
    </>
  );
}
