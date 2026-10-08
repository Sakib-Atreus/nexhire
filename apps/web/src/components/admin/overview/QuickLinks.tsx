import Link from 'next/link';
import { ArrowRight, Briefcase, Flag, ScrollText, Settings, Users } from 'lucide-react';

const LINKS = [
  { href: '/admin/users', label: 'Users', description: 'Roles, verification, suspensions', icon: Users },
  { href: '/admin/jobs', label: 'Jobs', description: 'Moderate, feature or hide posts', icon: Briefcase },
  { href: '/admin/reports', label: 'Reports', description: 'Review flagged job posts', icon: Flag },
  { href: '/admin/audit', label: 'Audit log', description: 'Every admin action, in order', icon: ScrollText },
  { href: '/admin/settings', label: 'Site settings', description: 'Announcement and lists', icon: Settings },
] as const;

export function QuickLinks() {
  return (
    <nav aria-labelledby="quick-links-heading">
      <h2 id="quick-links-heading" className="text-sm font-semibold text-slate-900 mb-3">Administration</h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {LINKS.map(({ href, label, description, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex h-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-card hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <span className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-slate-900">{label}</span>
                <span className="block text-xs text-slate-500 truncate">{description}</span>
              </span>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-600 flex-shrink-0" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
