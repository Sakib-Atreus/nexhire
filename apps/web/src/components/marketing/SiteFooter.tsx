import Link from 'next/link';
import { BrandLogo } from './BrandLogo';

const COLUMNS = [
  {
    title: 'Job seekers',
    links: [
      { href: '/jobs', label: 'Browse jobs' },
      { href: '/register?role=CANDIDATE', label: 'Create a profile' },
    ],
  },
  {
    title: 'Employers',
    links: [
      { href: '/register?role=RECRUITER', label: 'Post a job' },
      { href: '/login', label: 'Recruiter sign in' },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/login', label: 'Sign in' },
      { href: '/register', label: 'Create an account' },
      { href: '/forgot-password', label: 'Reset password' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400 dark:bg-slate-950 dark:border-t dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <BrandLogo tone="light" />
            <p className="mt-3 text-sm leading-relaxed max-w-xs">
              A job board and hiring workspace for candidates and recruiters.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200">{col.title}</h2>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm hover:text-white transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col gap-3 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} NexHire. All rights reserved.</p>
          <nav aria-label="Legal" className="flex gap-5">
            <Link href="/privacy" className="hover:text-white transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400">Terms of Service</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
