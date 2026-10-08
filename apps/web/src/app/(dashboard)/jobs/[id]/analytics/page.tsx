'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { ArrowLeft, Eye, FileSearch, FileText, Info, Lock, Pencil, Star, UserCheck, Users } from 'lucide-react';
import { useJob } from '@/hooks/useJobs';
import { useJobAnalytics } from '@/hooks/useHiring';
import { JOB_STATUS_LABELS, JOB_STATUS_STYLES } from '@/lib/constants';
import { pluralize } from '@/lib/format';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { buttonClasses } from '@/components/ui/Button';
import { CompanyLogo } from '@/components/ui/CompanyLogo';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { StatCard } from '@/components/dashboard/StatCard';
import { DailyColumnChart } from '@/components/admin/overview/DailyColumnChart';
import { FunnelChart } from '@/components/analytics/FunnelChart';
import { StatusBreakdown } from '@/components/analytics/StatusBreakdown';
import { formatPercent } from '@/components/analytics/format';

const httpStatus = (error: unknown) => (axios.isAxiosError(error) ? error.response?.status : undefined);

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading analytics">
      <Card className="p-5 flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </Card>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/jobs/my" className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-primary-600 mb-4">
      <ArrowLeft className="w-4 h-4" aria-hidden /> My jobs
    </Link>
  );
}

export default function JobAnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const analytics = useJobAnalytics(id);
  const jobQuery = useJob(id);

  const aStatus = httpStatus(analytics.error);
  const jStatus = httpStatus(jobQuery.error);

  if (aStatus === 404 || jStatus === 404) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <BackLink />
        <Card>
          <EmptyState
            icon={FileSearch}
            title="Job not found"
            description="This job may have been deleted, or the link is incorrect."
            action={<Link href="/jobs/my" className={buttonClasses('primary')}>Go to my jobs</Link>}
          />
        </Card>
      </div>
    );
  }

  if (aStatus === 403) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <BackLink />
        <Card>
          <EmptyState
            icon={Lock}
            title="Analytics are for the hiring team"
            description="Only recruiters on this job's hiring team (and administrators) can see its performance."
            action={<Link href={`/jobs/${id}`} className={buttonClasses('secondary')}>View job</Link>}
          />
        </Card>
      </div>
    );
  }

  if (analytics.isLoading || jobQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <BackLink />
        <AnalyticsSkeleton />
      </div>
    );
  }

  const data = analytics.data;
  const job = jobQuery.data;
  if (analytics.error || jobQuery.error || !data || !job) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <BackLink />
        <Card>
          <ErrorState
            title="We couldn't load this job's analytics"
            error={analytics.error ?? jobQuery.error}
            onRetry={() => { analytics.refetch(); jobQuery.refetch(); }}
            retrying={analytics.isRefetching || jobQuery.isRefetching}
          />
        </Card>
      </div>
    );
  }

  const openings = data.openings || job.openings || 1;
  const periodTotal = data.applicationsPerDay.reduce((s, d) => s + d.count, 0);
  const openFor =
    job.status === 'DRAFT'
      ? 'Not published yet'
      : job.status === 'OPEN'
        ? `Open for ${pluralize(data.daysOpen, 'day')}`
        : `Listed for ${pluralize(data.daysOpen, 'day')}`;

  return (
    <div className="mx-auto w-full max-w-7xl">
      <BackLink />

      {/* Header */}
      <Card className="p-4 sm:p-5 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
            <CompanyLogo name={job.companyName} src={job.companyLogoUrl} size="md" />
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">Job analytics</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <h1 className="text-xl font-bold text-fg break-words">{job.title}</h1>
                <Badge tone={JOB_STATUS_STYLES[job.status]}>{JOB_STATUS_LABELS[job.status]}</Badge>
              </div>
              <p className="mt-0.5 text-sm text-fg-muted break-words">
                {job.companyName} · {openFor}
              </p>
            </div>
          </div>
          <nav aria-label="Job links" className="flex flex-wrap gap-2 lg:flex-shrink-0">
            <Link href={`/jobs/${job.id}/applicants`} className={buttonClasses('primary', 'sm')}>
              <Users className="w-3.5 h-3.5" aria-hidden /> Applicants pipeline
            </Link>
            <Link href={`/jobs/${job.id}/edit`} className={buttonClasses('secondary', 'sm')}>
              <Pencil className="w-3.5 h-3.5" aria-hidden /> Edit job
            </Link>
            <Link href={`/jobs/${job.id}`} className={buttonClasses('secondary', 'sm')}>
              <Eye className="w-3.5 h-3.5" aria-hidden /> View job
            </Link>
          </nav>
        </div>
      </Card>

      {/* KPIs */}
      <section aria-label="Key numbers" className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Views" value={data.views} hint="Candidate visits to the job page" icon={Eye} tone="bg-sky-50 text-sky-600" />
        <StatCard
          label="Applications"
          value={data.applications}
          hint={data.viewToApplyRate === null ? 'No views yet' : `${formatPercent(data.viewToApplyRate)} of views applied`}
          icon={FileText}
          tone="bg-primary-50 text-primary-600"
        />
        <StatCard
          label="Hired"
          value={`${data.hired.toLocaleString('en-US')} of ${openings.toLocaleString('en-US')}`}
          hint={data.applyToHireRate === null ? 'No applications yet' : `${formatPercent(data.applyToHireRate)} of applicants hired`}
          icon={UserCheck}
          tone="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Average rating"
          value={data.averageRating === null ? 'No ratings yet' : `★ ${data.averageRating.toFixed(1)}`}
          hint={data.averageRating === null ? 'Rate applicants from the pipeline' : 'Hiring team rating, out of 5'}
          icon={Star}
          tone="bg-amber-50 text-amber-600"
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 min-w-0">
          <CardHeader title="Hiring funnel" description="How candidates move from viewing the job to being hired." />
          <div className="p-4 sm:p-5">
            <FunnelChart
              stages={[
                { label: 'Views', count: data.views },
                { label: 'Applications', count: data.applications },
                { label: 'Interviewed', count: data.interviewed },
                { label: 'Offered', count: data.offered },
                { label: 'Hired', count: data.hired },
              ]}
            />
          </div>
        </Card>

        <Card className="min-w-0">
          <CardHeader title="Applications by status" description="Where every application stands right now." />
          <div className="p-4 sm:p-5">
            <StatusBreakdown byStatus={data.byStatus} />
          </div>
        </Card>

        <Card className="lg:col-span-3 min-w-0">
          <CardHeader
            title="Daily applications"
            description="Last 30 days (UTC dates)."
            action={
              <p className="text-right text-xs text-fg-muted flex-shrink-0">
                <span className="block text-lg font-bold text-fg tabular-nums">{periodTotal.toLocaleString('en-US')}</span>
                in 30 days
              </p>
            }
          />
          <div className="p-4 sm:p-5 pt-8 sm:pt-8">
            <DailyColumnChart
              data={data.applicationsPerDay}
              unit={['application', 'applications']}
              emptyMessage="No applications in the last 30 days"
            />
          </div>
        </Card>
      </div>

      <p className="mt-6 flex items-start gap-2 text-xs text-fg-muted">
        <Info className="w-3.5 h-3.5 mt-px flex-shrink-0" aria-hidden />
        Views exclude your hiring team&apos;s own visits.
      </p>
    </div>
  );
}
