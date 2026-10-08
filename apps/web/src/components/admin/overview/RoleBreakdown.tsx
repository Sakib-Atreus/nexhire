import Link from 'next/link';
import type { Role } from '@/types';
import { ROLE_LABELS } from '@/lib/constants';
import { cn } from '@/lib/cn';

// Same hue family as ROLE_STYLES badges so a role reads the same everywhere.
const ROLE_BAR: Record<Role, string> = {
  CANDIDATE: 'bg-sky-500',
  RECRUITER: 'bg-indigo-500',
  ADMIN: 'bg-rose-500',
};

const ROLE_PLURALS: Record<Role, string> = {
  CANDIDATE: 'Job seekers',
  RECRUITER: 'Recruiters',
  ADMIN: 'Administrators',
};

/** One stacked bar of accounts by role, with a legend that carries the exact counts. */
export function RoleBreakdown({ counts }: { counts: Record<Role, number> }) {
  const roles: Role[] = ['CANDIDATE', 'RECRUITER', 'ADMIN'];
  const total = roles.reduce((s, r) => s + counts[r], 0);
  const pct = (v: number) => (total > 0 ? (v / total) * 100 : 0);
  const label = roles.map((r) => `${ROLE_PLURALS[r]}: ${counts[r].toLocaleString('en-US')} (${Math.round(pct(counts[r]))}%)`).join(', ');

  return (
    <div>
      <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-slate-100" role="img" aria-label={total > 0 ? label : 'No users yet'}>
        {roles.filter((r) => counts[r] > 0).map((r) => (
          <div key={r} className={cn('h-full first:rounded-l-full last:rounded-r-full', ROLE_BAR[r])} style={{ width: `${pct(counts[r])}%`, minWidth: 4 }} />
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {roles.map((r) => (
          <li key={r}>
            <Link
              href={`/admin/users?role=${r}`}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 -mx-2 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <span className={cn('w-2.5 h-2.5 rounded-sm flex-shrink-0', ROLE_BAR[r])} aria-hidden />
              <span className="min-w-0 flex-1 text-sm text-slate-600 truncate" title={ROLE_LABELS[r]}>{ROLE_PLURALS[r]}</span>
              <span className="tabular-nums text-sm font-semibold text-slate-900">{counts[r].toLocaleString('en-US')}</span>
              <span className="tabular-nums text-xs text-slate-400 w-9 text-right">{Math.round(pct(counts[r]))}%</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
