'use client';

import Link from 'next/link';
import { LayoutDashboard, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';
import { ROLE_LABELS, ROLE_STYLES } from '@/lib/constants';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { buttonClasses } from '@/components/ui/Button';
import { BrandLogo } from './BrandLogo';
import { useMounted } from './useMounted';

export function SiteHeader() {
  const mounted = useMounted();
  const { user, isAuthenticated } = useAuthStore();
  const logout = useLogout();
  const signedIn = mounted && isAuthenticated && !!user;
  const fullName = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email : '';

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200/70">
      <nav aria-label="Main" className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <BrandLogo />

        <div className="flex items-center gap-1 sm:gap-2">
          <Link href="/jobs" className={buttonClasses('ghost', 'md', 'hidden sm:inline-flex')}>
            Browse jobs
          </Link>

          {signedIn && user ? (
            <>
              <Link href="/dashboard" className={buttonClasses('ghost', 'md', 'hidden md:inline-flex')}>
                <LayoutDashboard className="w-4 h-4" aria-hidden />
                Dashboard
              </Link>
              <div className="flex items-center gap-2.5 pl-2 sm:pl-3 ml-1 border-l border-slate-200">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2.5 rounded-lg p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  aria-label={`Go to dashboard (${fullName})`}
                >
                  <span className="hidden sm:flex flex-col items-end min-w-0">
                    <span className="text-sm font-semibold text-slate-800 leading-tight truncate max-w-[10rem]">
                      {fullName}
                    </span>
                    {user.role && (
                      <Badge tone={ROLE_STYLES[user.role]} className="mt-0.5 px-1.5 py-0 text-[11px]">
                        {ROLE_LABELS[user.role]}
                      </Badge>
                    )}
                  </span>
                  <Avatar name={fullName} src={user.avatarUrl} size="sm" />
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  aria-label="Sign out"
                  title="Sign out"
                  className="p-2 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <LogOut className="w-4 h-4" aria-hidden />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonClasses('ghost', 'md')}>
                Sign in
              </Link>
              <Link href="/register" className={buttonClasses('primary', 'md')}>
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
