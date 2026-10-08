import Link from 'next/link';
import { Building2 } from 'lucide-react';
import type { CompanyStat } from '@/types';
import { CompanyLogo } from '@/components/ui/CompanyLogo';
import { EmptyState } from '@/components/ui/States';

/** Companies ranked by the API; each name opens the admin job list filtered to that company. */
export function TopCompanies({ companies }: { companies: CompanyStat[] }) {
  if (companies.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No companies yet"
        description="Companies appear here once recruiters post jobs."
        className="py-10"
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-medium text-slate-500 border-b border-slate-100">
            <th scope="col" className="px-5 py-2.5 font-medium">Company</th>
            <th scope="col" className="px-3 py-2.5 font-medium text-right whitespace-nowrap">Open jobs</th>
            <th scope="col" className="px-5 py-2.5 font-medium text-right">Applications</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {companies.map((c) => (
            <tr key={c.companyName} className="hover:bg-slate-50/70">
              <th scope="row" className="px-5 py-2.5 font-normal text-left">
                <Link
                  href={`/admin/jobs?q=${encodeURIComponent(c.companyName)}`}
                  className="flex items-center gap-3 min-w-0 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 group"
                >
                  <CompanyLogo name={c.companyName} size="sm" className="!w-8 !h-8 flex-shrink-0" />
                  <span className="truncate font-medium text-slate-900 group-hover:text-primary-700">{c.companyName}</span>
                </Link>
              </th>
              <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">{c.openJobs.toLocaleString('en-US')}</td>
              <td className="px-5 py-2.5 text-right tabular-nums text-slate-700">{c.applications.toLocaleString('en-US')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
