'use client';

import { BarChart3 } from 'lucide-react';
import { useAllUsers } from '@/hooks/useUsers';
import { useRecruiterStats } from '@/hooks/useApplications';

const FUNNEL_STAGES = [
  { key: 'pending' as const, label: 'Pending', color: 'bg-blue-400' },
  { key: 'reviewing' as const, label: 'Reviewing', color: 'bg-yellow-400' },
  { key: 'shortlisted' as const, label: 'Shortlisted', color: 'bg-purple-400' },
  { key: 'interviewed' as const, label: 'Interviewed', color: 'bg-indigo-400' },
  { key: 'offered' as const, label: 'Offered', color: 'bg-green-400' },
  { key: 'rejected' as const, label: 'Rejected', color: 'bg-red-400' },
];

export default function AdminAnalyticsPage() {
  const { data: usersData } = useAllUsers(0, 1);
  const { data: stats } = useRecruiterStats();

  const total = stats?.total ?? 0;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-7 h-7 text-primary-600" />
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <p className="text-xs text-slate-500 uppercase font-medium mb-1">Total Users</p>
          <p className="text-3xl font-bold text-slate-900">
            {usersData?.totalElements ?? '-'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <p className="text-xs text-slate-500 uppercase font-medium mb-1">Total Jobs</p>
          <p className="text-3xl font-bold text-slate-400">—</p>
          <p className="text-xs text-slate-400 mt-1">Coming soon</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <p className="text-xs text-slate-500 uppercase font-medium mb-1">Total Applications</p>
          <p className="text-3xl font-bold text-slate-900">{total > 0 ? total : '-'}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <p className="text-xs text-slate-500 uppercase font-medium mb-1">Offer Rate</p>
          <p className="text-3xl font-bold text-slate-900">
            {total > 0 && stats ? `${Math.round((stats.offered / total) * 100)}%` : '-'}
          </p>
        </div>
      </div>

      {/* Application funnel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-semibold text-slate-800 mb-5">Application Pipeline</h2>

        {!stats ? (
          <p className="text-slate-400 text-sm">Loading pipeline data...</p>
        ) : total === 0 ? (
          <p className="text-slate-400 text-sm">No application data yet.</p>
        ) : (
          <div className="space-y-4">
            {FUNNEL_STAGES.map(({ key, label, color }) => {
              const count = stats[key] ?? 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;

              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700 w-28">{label}</span>
                    <span className="text-xs text-slate-500 ml-2">
                      {count} &nbsp;
                      <span className="text-slate-400">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
