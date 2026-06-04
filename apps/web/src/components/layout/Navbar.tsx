'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';
import { useUnreadCount } from '@/hooks/useNotifications';
import { Bell, Briefcase, LogOut, User } from 'lucide-react';

export function Navbar() {
  const { user } = useAuthStore();
  const logout = useLogout();
  const { data: unreadCount } = useUnreadCount();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-bold text-primary-700">
          NexHire
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/jobs" className="hover:text-primary-600 transition-colors">Browse Jobs</Link>
          {user?.role === 'RECRUITER' && (
            <Link href="/jobs/create" className="hover:text-primary-600 transition-colors">Post a Job</Link>
          )}
          {user?.role === 'CANDIDATE' && (
            <Link href="/applications" className="hover:text-primary-600 transition-colors">My Applications</Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link href="/admin" className="hover:text-primary-600 transition-colors">Admin</Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/notifications" className="relative p-2 rounded-full hover:bg-slate-100 transition-colors">
            <Bell className="w-5 h-5 text-slate-600" />
            {!!unreadCount && unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <div className="flex items-center gap-2 text-sm">
            <span className="hidden md:block text-slate-700 font-medium">{user?.firstName}</span>
            <button
              onClick={logout}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
