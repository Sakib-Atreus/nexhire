'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';
import { cn } from '@/lib/cn';
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  FileText,
  Bell,
  PlusCircle,
  Search,
  Users,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Bookmark,
  User2,
  BarChart3,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const CANDIDATE_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jobs', label: 'Browse Jobs', icon: Search },
  { href: '/applications', label: 'My Applications', icon: FileText },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/jobs/saved', label: 'Saved Jobs', icon: Bookmark },
  { href: '/profile', label: 'My Profile', icon: User2 },
];

const RECRUITER_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jobs/my', label: 'My Jobs', icon: Building2 },
  { href: '/jobs', label: 'Browse Jobs', icon: Search },
  { href: '/jobs/create', label: 'Post a Job', icon: PlusCircle },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/profile', label: 'My Profile', icon: User2 },
];

const ADMIN_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin', label: 'Admin Panel', icon: ShieldCheck },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/jobs', label: 'All Jobs', icon: Briefcase },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
];

function getNav(role?: string): NavItem[] {
  if (role === 'RECRUITER') return RECRUITER_NAV;
  if (role === 'ADMIN') return ADMIN_NAV;
  return CANDIDATE_NAV;
}

const ROLE_COLORS: Record<string, string> = {
  CANDIDATE: 'bg-blue-50 text-blue-700',
  RECRUITER: 'bg-purple-50 text-purple-700',
  ADMIN: 'bg-red-50 text-red-700',
};

function isNavActive(href: string, pathname: string): boolean {
  if (pathname === href) return true;
  if (href === '/dashboard') return false;
  // /jobs/my: also active when viewing a specific job's applicants page
  if (href === '/jobs/my') {
    return (
      pathname.startsWith('/jobs/my') ||
      /^\/jobs\/[^/]+\/applicants/.test(pathname)
    );
  }
  // /jobs browse: active on /jobs/ID detail but NOT /jobs/my, /jobs/create, /jobs/saved, /jobs/*/applicants
  if (href === '/jobs') {
    return (
      pathname.startsWith('/jobs/') &&
      !pathname.startsWith('/jobs/my') &&
      !pathname.startsWith('/jobs/create') &&
      !pathname.startsWith('/jobs/saved') &&
      !/^\/jobs\/[^/]+\/applicants/.test(pathname)
    );
  }
  // /jobs/create: exact only (already handled by pathname === href above)
  if (href === '/jobs/create') return false;
  // /admin panel: exact only (separate from /admin/users)
  if (href === '/admin') return pathname === '/admin';
  // Default: prefix match
  return pathname.startsWith(href + '/');
}

export function Sidebar() {
  const { user } = useAuthStore();
  const logout = useLogout();
  const pathname = usePathname();

  const nav = getNav(user?.role);
  const initials = user
    ? (`${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`).toUpperCase() || '?'
    : '?';

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white border-r border-slate-200 fixed top-0 left-0 z-30">
      {/* Logo — links to landing home page */}
      <Link href="/" className="h-16 flex items-center gap-2.5 px-5 border-b border-slate-100 hover:bg-slate-50 transition-colors">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Briefcase className="w-4 h-4 text-white" />
        </div>
        <span className="text-xl font-bold text-slate-900">NexHire</span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          const active = isNavActive(item.href, pathname);
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                active
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <item.icon
                className={cn(
                  'w-4 h-4 flex-shrink-0',
                  active ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'
                )}
              />
              {item.label}
              {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-primary-400" />}
            </Link>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{user?.fullName}</p>
            <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', ROLE_COLORS[user?.role ?? 'CANDIDATE'])}>
              {user?.role}
            </span>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
