import type { LucideIcon } from 'lucide-react';
import {
  Bell, Bookmark, Briefcase, FileText, Flag, LayoutDashboard, PlusCircle, ScrollText, Search, Settings, User2, Users,
} from 'lucide-react';
import type { Role } from '@/types';

export interface NavItem {
  href: string;
  label: string;
  /** Shorter label for the mobile tab bar. */
  short?: string;
  icon: LucideIcon;
}

const DASHBOARD: NavItem = { href: '/dashboard', label: 'Dashboard', short: 'Home', icon: LayoutDashboard };
const BROWSE: NavItem = { href: '/jobs', label: 'Browse jobs', short: 'Jobs', icon: Search };
const NOTIFICATIONS: NavItem = { href: '/notifications', label: 'Notifications', short: 'Alerts', icon: Bell };
const PROFILE: NavItem = { href: '/profile', label: 'Profile', icon: User2 };
const ADMIN_OVERVIEW: NavItem = { href: '/admin', label: 'Overview', icon: LayoutDashboard };

export const SIDEBAR_NAV: Record<Role, NavItem[]> = {
  CANDIDATE: [
    DASHBOARD,
    BROWSE,
    { href: '/jobs/saved', label: 'Saved jobs', short: 'Saved', icon: Bookmark },
    { href: '/applications', label: 'Applications', short: 'Applied', icon: FileText },
    NOTIFICATIONS,
    PROFILE,
  ],
  RECRUITER: [
    DASHBOARD,
    { href: '/jobs/my', label: 'My jobs', icon: Briefcase },
    { href: '/jobs/create', label: 'Post a job', short: 'Post job', icon: PlusCircle },
    NOTIFICATIONS,
    PROFILE,
  ],
  ADMIN: [
    ADMIN_OVERVIEW,
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/jobs', label: 'Jobs', icon: Briefcase },
    { href: '/admin/reports', label: 'Reports', icon: Flag },
    { href: '/admin/audit', label: 'Audit log', short: 'Audit', icon: ScrollText },
    { href: '/admin/settings', label: 'Site settings', short: 'Settings', icon: Settings },
    NOTIFICATIONS,
    PROFILE,
  ],
};

/** At most five role-specific tabs for the mobile bottom bar (sign-out lives in the avatar menu). */
export const MOBILE_NAV: Record<Role, NavItem[]> = {
  CANDIDATE: [DASHBOARD, BROWSE, SIDEBAR_NAV.CANDIDATE[3], SIDEBAR_NAV.CANDIDATE[2], PROFILE],
  RECRUITER: [DASHBOARD, SIDEBAR_NAV.RECRUITER[1], SIDEBAR_NAV.RECRUITER[2], NOTIFICATIONS, PROFILE],
  ADMIN: [ADMIN_OVERVIEW, SIDEBAR_NAV.ADMIN[1], SIDEBAR_NAV.ADMIN[2], SIDEBAR_NAV.ADMIN[3], PROFILE],
};

export const PUBLIC_NAV: NavItem[] = [BROWSE];

/** Job pages that signed-out visitors may view: the listing and a single job's detail page. */
export function isPublicPath(pathname: string): boolean {
  if (pathname === '/jobs' || pathname === '/jobs/') return true;
  const m = /^\/jobs\/([^/]+)\/?$/.exec(pathname);
  return !!m && !['my', 'saved', 'create'].includes(m[1]);
}

const RESERVED_JOB_SEGMENTS = ['my', 'saved', 'create'];

export function isNavActive(href: string, pathname: string): boolean {
  if (pathname === href) return true;
  switch (href) {
    case '/dashboard':
    case '/admin':
    case '/jobs/create':
      return false;
    case '/jobs/my':
      // A recruiter's job pages (applicants, edit) belong to "My jobs".
      return pathname.startsWith('/jobs/my') || /^\/jobs\/[^/]+\/(applicants|edit)/.test(pathname);
    case '/jobs': {
      const m = /^\/jobs\/([^/]+)\/?$/.exec(pathname);
      return !!m && !RESERVED_JOB_SEGMENTS.includes(m[1]);
    }
    default:
      return pathname.startsWith(href + '/');
  }
}

export interface Crumb {
  label: string;
  href?: string;
}

/** Breadcrumb trail for the top bar, derived from the current path. */
export function getBreadcrumbs(pathname: string, role?: Role): Crumb[] {
  const jobsRoot: Crumb = role === 'RECRUITER' ? { label: 'My jobs', href: '/jobs/my' } : { label: 'Browse jobs', href: '/jobs' };
  const exact: Record<string, Crumb[]> = {
    '/dashboard': [{ label: 'Dashboard' }],
    '/jobs': [{ label: 'Browse jobs' }],
    '/jobs/saved': [{ label: 'Saved jobs' }],
    '/jobs/my': [{ label: 'My jobs' }],
    '/jobs/create': [{ label: 'My jobs', href: '/jobs/my' }, { label: 'Post a job' }],
    '/applications': [{ label: 'Applications' }],
    '/notifications': [{ label: 'Notifications' }],
    '/notifications/preferences': [{ label: 'Notifications', href: '/notifications' }, { label: 'Settings' }],
    '/profile': [{ label: 'Profile' }],
    '/admin': [{ label: 'Administration' }, { label: 'Overview' }],
    '/admin/users': [{ label: 'Administration', href: '/admin' }, { label: 'Users' }],
    '/admin/jobs': [{ label: 'Administration', href: '/admin' }, { label: 'Jobs' }],
    '/admin/reports': [{ label: 'Administration', href: '/admin' }, { label: 'Reports' }],
    '/admin/audit': [{ label: 'Administration', href: '/admin' }, { label: 'Audit log' }],
    '/admin/settings': [{ label: 'Administration', href: '/admin' }, { label: 'Site settings' }],
  };
  const clean = pathname.replace(/\/$/, '') || '/';
  if (exact[clean]) return exact[clean];
  if (/^\/admin\/users\/[^/]+$/.test(clean)) return [{ label: 'Users', href: '/admin/users' }, { label: 'User details' }];
  if (/^\/jobs\/[^/]+\/applicants$/.test(clean)) return [{ label: 'My jobs', href: '/jobs/my' }, { label: 'Applicants' }];
  if (/^\/jobs\/[^/]+\/edit$/.test(clean)) return [{ label: 'My jobs', href: '/jobs/my' }, { label: 'Edit job' }];
  if (/^\/jobs\/[^/]+$/.test(clean)) return [jobsRoot, { label: 'Job details' }];
  return [];
}
