import type { LucideIcon } from 'lucide-react';
import {
  Bell, BellRing, Bookmark, Briefcase, Building2, CalendarClock, CalendarDays, CirclePlus, CircleUserRound, Compass, FileText, Flag,
  LayoutDashboard, MessageSquareText, ScrollText, Settings, ShieldCheck, Users,
} from 'lucide-react';
import type { Role } from '@/types';

export interface NavItem {
  href: string;
  label: string;
  /** Shorter label for the mobile tab bar. */
  short?: string;
  icon: LucideIcon;
}

export interface NavSection {
  /** Small heading above the group; omitted for the first group. */
  title?: string;
  items: NavItem[];
}

const DASHBOARD: NavItem = { href: '/dashboard', label: 'Dashboard', short: 'Home', icon: LayoutDashboard };
const CALENDAR: NavItem = { href: '/calendar', label: 'Calendar', icon: CalendarDays };
const INTERVIEWS: NavItem = { href: '/interviews', label: 'Interviews', icon: CalendarClock };
const BROWSE: NavItem = { href: '/jobs', label: 'Browse jobs', short: 'Jobs', icon: Compass };
const COMPANIES: NavItem = { href: '/companies', label: 'Companies', icon: Building2 };
const NOTIFICATIONS: NavItem = { href: '/notifications', label: 'Notifications', short: 'Inbox', icon: Bell };
const PROFILE: NavItem = { href: '/profile', label: 'Profile', icon: CircleUserRound };
const ADMIN_OVERVIEW: NavItem = { href: '/admin', label: 'Overview', icon: ShieldCheck };

const APPLICATIONS: NavItem = { href: '/applications', label: 'Applications', short: 'Applied', icon: FileText };
const SAVED: NavItem = { href: '/jobs/saved', label: 'Saved jobs', short: 'Saved', icon: Bookmark };
const MY_JOBS: NavItem = { href: '/jobs/my', label: 'My jobs', icon: Briefcase };
const POST_JOB: NavItem = { href: '/jobs/create', label: 'Post a job', short: 'Post', icon: CirclePlus };
const ADMIN_USERS: NavItem = { href: '/admin/users', label: 'Users', icon: Users };
const ADMIN_JOBS: NavItem = { href: '/admin/jobs', label: 'Jobs', icon: Briefcase };
const ADMIN_REPORTS: NavItem = { href: '/admin/reports', label: 'Reports', icon: Flag };

/** Sidebar groups per role, in the order people use them: overview → daily work → setup → account. */
export const SIDEBAR_SECTIONS: Record<Role, NavSection[]> = {
  CANDIDATE: [
    { items: [DASHBOARD, CALENDAR, NOTIFICATIONS] },
    { title: 'Job search', items: [BROWSE, SAVED, { href: '/alerts', label: 'Job alerts', short: 'Alerts', icon: BellRing }, COMPANIES] },
    { title: 'My hiring', items: [APPLICATIONS, INTERVIEWS] },
    { title: 'Account', items: [PROFILE] },
  ],
  RECRUITER: [
    { items: [DASHBOARD, CALENDAR, NOTIFICATIONS] },
    { title: 'Hiring', items: [MY_JOBS, POST_JOB, INTERVIEWS] },
    { title: 'Workspace', items: [
      { href: '/company', label: 'Company', icon: Building2 },
      { href: '/templates', label: 'Message templates', short: 'Templates', icon: MessageSquareText },
    ] },
    { title: 'Account', items: [PROFILE] },
  ],
  ADMIN: [
    { items: [ADMIN_OVERVIEW, NOTIFICATIONS] },
    { title: 'Manage', items: [ADMIN_USERS, ADMIN_JOBS, { href: '/admin/companies', label: 'Companies', icon: Building2 }] },
    { title: 'Trust & safety', items: [ADMIN_REPORTS, { href: '/admin/audit', label: 'Audit log', short: 'Audit', icon: ScrollText }] },
    { title: 'Platform', items: [{ href: '/admin/settings', label: 'Site settings', short: 'Settings', icon: Settings }, PROFILE] },
  ],
};

/** Flat list of every sidebar link for a role. */
export const SIDEBAR_NAV: Record<Role, NavItem[]> = {
  CANDIDATE: SIDEBAR_SECTIONS.CANDIDATE.flatMap((s) => s.items),
  RECRUITER: SIDEBAR_SECTIONS.RECRUITER.flatMap((s) => s.items),
  ADMIN: SIDEBAR_SECTIONS.ADMIN.flatMap((s) => s.items),
};

/** Four main tabs for the mobile bottom bar; a fifth "More" tab opens every other page. */
export const MOBILE_NAV: Record<Role, NavItem[]> = {
  CANDIDATE: [DASHBOARD, BROWSE, APPLICATIONS, CALENDAR],
  RECRUITER: [DASHBOARD, MY_JOBS, POST_JOB, CALENDAR],
  ADMIN: [ADMIN_OVERVIEW, ADMIN_USERS, ADMIN_JOBS, ADMIN_REPORTS],
};

export const PUBLIC_NAV: NavItem[] = [BROWSE, COMPANIES];

/** Pages signed-out visitors may view: job listing/detail and the company directory/profiles. */
export function isPublicPath(pathname: string): boolean {
  if (pathname === '/jobs' || pathname === '/jobs/') return true;
  if (pathname === '/companies' || pathname.startsWith('/companies/')) return true;
  // Public candidate profiles and the email unsubscribe link.
  if (pathname.startsWith('/p/') || pathname.startsWith('/alerts/unsubscribe')) return true;
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
      return pathname.startsWith('/jobs/my') || /^\/jobs\/[^/]+\/(applicants|edit|analytics)/.test(pathname);
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
    '/admin/companies': [{ label: 'Administration', href: '/admin' }, { label: 'Companies' }],
    '/companies': [{ label: 'Companies' }],
    '/company': [{ label: 'Company' }],
    '/templates': [{ label: 'Message templates' }],
    '/interviews': [{ label: 'Interviews' }],
    '/calendar': [{ label: 'Calendar' }],
    '/alerts': [{ label: 'Job alerts' }],
    '/alerts/unsubscribe': [{ label: 'Job alerts' }, { label: 'Unsubscribe' }],
  };
  const clean = pathname.replace(/\/$/, '') || '/';
  if (exact[clean]) return exact[clean];
  if (/^\/interviews\/[^/]+\/call$/.test(clean)) return [{ label: 'Interviews', href: '/interviews' }, { label: 'Video call' }];
  if (/^\/p\/[^/]+$/.test(clean)) return [{ label: 'Profile' }];
  if (/^\/companies\/[^/]+$/.test(clean)) return [{ label: 'Companies', href: '/companies' }, { label: 'Company profile' }];
  if (/^\/jobs\/[^/]+\/analytics$/.test(clean)) return [{ label: 'My jobs', href: '/jobs/my' }, { label: 'Analytics' }];
  if (/^\/admin\/users\/[^/]+$/.test(clean)) return [{ label: 'Users', href: '/admin/users' }, { label: 'User details' }];
  if (/^\/jobs\/[^/]+\/applicants$/.test(clean)) return [{ label: 'My jobs', href: '/jobs/my' }, { label: 'Applicants' }];
  if (/^\/jobs\/[^/]+\/edit$/.test(clean)) return [{ label: 'My jobs', href: '/jobs/my' }, { label: 'Edit job' }];
  if (/^\/jobs\/[^/]+$/.test(clean)) return [jobsRoot, { label: 'Job details' }];
  return [];
}
