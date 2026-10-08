'use client';

import { BarChart3, Briefcase, FileText, Trophy, Users } from 'lucide-react';
import { useAllUsers } from '@/hooks/useUsers';
import { useJobs } from '@/hooks/useJobs';
import { useRecruiterStats } from '@/hooks/useApplications';
import { Card, CardHeader } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { StatCard } from '@/components/dashboard/StatCard';
import { PipelineBars, statsToCounts } from '@/components/dashboard/PipelineBars';
import { APPLICATION_STATUS_BAR, APPLICATION_STATUS_LABELS } from '@/lib/constants';
import type { ApplicationStats, ApplicationStatus } from '@/types';

/** Applications currently at or beyond each stage. Rejected/withdrawn ones are excluded because the API does not record the stage they left from. */
function Funnel({ stats }: { stats: ApplicationStats }) {
  const reachedOffer = stats.offered;
  const reachedInterview = stats.interviewed + reachedOffer;
  const reachedShortlist = stats.shortlisted + reachedInterview;
  const reviewed = stats.reviewing + reachedShortlist;
  const steps: { status: ApplicationStatus; label: string; value: number }[] = [
    { status: 'PENDING', label: 'Submitted', value: stats.total },
    { status: 'REVIEWING', label: 'Reviewed or further', value: reviewed },
    { status: 'SHORTLISTED', label: 'Shortlisted or further', value: reachedShortlist },
    { status: 'INTERVIEWED', label: 'Interviewed or further', value: reachedInterview },
    { status: 'OFFERED', label: APPLICATION_STATUS_LABELS.OFFERED, value: reachedOffer },
  ];
  return (
    <ol className="space-y-3.5">
      {steps.map((s) => {
        const pct = stats.total > 0 ? Math.round((s.value / stats.total) * 100) : 0;
        return (
          <li key={s.status}>
            <div className="flex items-center justify-between gap-3 text-sm mb-1.5">
              <span className="text-slate-600">{s.label}</span>
              <span className="tabular-nums">
                <span className="font-semibold text-slate-900">{s.value.toLocaleString('en-US')}</span>
                <span className="text-xs text-slate-400 ml-1.5">{pct}%</span>
              </span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden" role="img" aria-label={`${s.label}: ${s.value} (${pct}%)`}>
              <div className={`h-full rounded-full ${APPLICATION_STATUS_BAR[s.status]}`} style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function AdminAnalyticsPage() {
  const users = useAllUsers(0, 1);
  const openJobs = useJobs({ size: 1 });
  const stats = useRecruiterStats();

  const s = stats.data;
  const decided = s ? s.offered + s.rejected : 0;
  const offerRate = s && decided > 0 ? `${Math.round((s.offered / decided) * 100)}%` : null;

  return (
    <div>
      <PageHeader title="Analytics" description="Platform-wide hiring activity across all recruiters and job posts." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Users" value={users.isError ? null : users.data?.totalElements} icon={Users} href="/admin/users" />
        <StatCard label="Open jobs" value={openJobs.isError ? null : openJobs.data?.totalElements} icon={Briefcase} tone="bg-sky-50 text-sky-600" href="/jobs" />
        <StatCard label="Applications" value={stats.isError ? null : s?.total} icon={FileText} tone="bg-violet-50 text-violet-600" />
        <StatCard
          label="Offer rate"
          value={stats.isError ? null : s ? offerRate : undefined}
          icon={Trophy}
          tone="bg-emerald-50 text-emerald-600"
          hint="Offers ÷ (offers + rejections)"
        />
      </div>

      {stats.isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[0, 1].map((i) => (
            <Card key={i} className="p-5 space-y-4">
              <Skeleton className="h-4 w-40" />
              {Array.from({ length: 5 }).map((_, j) => <Skeleton key={j} className="h-6" />)}
            </Card>
          ))}
        </div>
      ) : stats.isError ? (
        <Card>
          <ErrorState title="Couldn't load application data" error={stats.error} onRetry={() => stats.refetch()} retrying={stats.isRefetching} />
        </Card>
      ) : !s || s.total === 0 ? (
        <Card>
          <EmptyState icon={BarChart3} title="No applications yet" description="Pipeline and funnel charts appear once candidates start applying." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Current pipeline" description="Where every application stands today" />
            <div className="p-5"><PipelineBars counts={statsToCounts(s)} /></div>
          </Card>
          <Card>
            <CardHeader title="Conversion funnel" description="Applications currently at or beyond each stage (excludes rejected and withdrawn)" />
            <div className="p-5"><Funnel stats={s} /></div>
          </Card>
        </div>
      )}
    </div>
  );
}
