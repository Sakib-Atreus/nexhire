'use client';

import { Briefcase, FileText, Star, Users } from 'lucide-react';
import { useAdminOverview } from '@/hooks/useAdmin';
import { Card, CardHeader } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorState } from '@/components/ui/States';
import { StatCard } from '@/components/dashboard/StatCard';
import { AttentionStrip } from '@/components/admin/overview/AttentionStrip';
import { DailyColumnChart } from '@/components/admin/overview/DailyColumnChart';
import { OverviewSkeleton } from '@/components/admin/overview/OverviewSkeleton';
import { QuickLinks } from '@/components/admin/overview/QuickLinks';
import { RoleBreakdown } from '@/components/admin/overview/RoleBreakdown';
import { TopCompanies } from '@/components/admin/overview/TopCompanies';
import { pluralize } from '@/lib/format';

const sum = (xs: { count: number }[]) => xs.reduce((s, d) => s + d.count, 0);

export default function AdminOverviewPage() {
  const overview = useAdminOverview();
  const data = overview.data;

  return (
    <div>
      <PageHeader title="Overview" description="Platform health, growth over the last 30 days, and anything waiting on an admin." />

      {overview.isLoading ? (
        <OverviewSkeleton />
      ) : overview.isError || !data ? (
        <Card className="p-5">
          <ErrorState
            title="Couldn't load the overview"
            error={overview.error}
            onRetry={() => overview.refetch()}
            retrying={overview.isRefetching}
          />
        </Card>
      ) : (
        <div className="space-y-6">
          <AttentionStrip data={data} />

          <section aria-label="Key metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total users"
              value={data.totalUsers}
              icon={Users}
              href="/admin/users"
              hint={`+${data.newUsersLast30Days.toLocaleString('en-US')} in last 30 days`}
            />
            <StatCard
              label="Open jobs"
              value={data.openJobs}
              icon={Briefcase}
              tone="bg-sky-50 text-sky-600"
              href="/admin/jobs?status=OPEN"
              hint={`of ${pluralize(data.totalJobs, 'job')} total`}
            />
            <StatCard
              label="Applications"
              value={data.totalApplications}
              icon={FileText}
              tone="bg-violet-50 text-violet-600"
              hint={`${data.applicationsLast30Days.toLocaleString('en-US')} in last 30 days`}
            />
            <StatCard
              label="Featured jobs"
              value={data.featuredJobs}
              icon={Star}
              tone="bg-amber-50 text-amber-600"
              href="/admin/jobs?featured=true"
              hint="Highlighted on the job board"
            />
          </section>

          <Card>
            <CardHeader title="Users by role" description={`${pluralize(data.totalUsers, 'account')} in total`} />
            <div className="p-5">
              <RoleBreakdown counts={{ CANDIDATE: data.candidates, RECRUITER: data.recruiters, ADMIN: data.admins }} />
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader
                title="Sign-ups per day"
                description="Last 30 days (UTC)"
                action={<PeriodTotal value={sum(data.signupsPerDay)} label="sign-ups" />}
              />
              <div className="p-5 pt-8">
                <DailyColumnChart data={data.signupsPerDay} unit={['sign-up', 'sign-ups']} emptyMessage="No sign-ups in the last 30 days" />
              </div>
            </Card>
            <Card>
              <CardHeader
                title="Applications per day"
                description="Last 30 days (UTC)"
                action={<PeriodTotal value={sum(data.applicationsPerDay)} label="applications" />}
              />
              <div className="p-5 pt-8">
                <DailyColumnChart data={data.applicationsPerDay} unit={['application', 'applications']} emptyMessage="No applications in the last 30 days" />
              </div>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <CardHeader title="Top companies" description="Most active employers. Select a company to see its jobs." />
            <TopCompanies companies={data.topCompanies} />
          </Card>

          <QuickLinks />
        </div>
      )}
    </div>
  );
}

function PeriodTotal({ value, label }: { value: number; label: string }) {
  return (
    <p className="text-right flex-shrink-0">
      <span className="block text-lg font-bold leading-tight text-fg tabular-nums">{value.toLocaleString('en-US')}</span>
      <span className="block text-xs text-fg-muted">{label}</span>
    </p>
  );
}
