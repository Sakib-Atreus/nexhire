'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { ArrowLeft, Briefcase, Building2, CalendarDays, ExternalLink, Factory, Globe, MapPin, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCompanyProfile } from '@/hooks/useCompanies';
import { formatMonthYear, pluralize } from '@/lib/format';
import { Card, CardHeader } from '@/components/ui/Card';
import { buttonClasses } from '@/components/ui/Button';
import { CompanyLogo } from '@/components/ui/CompanyLogo';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { JobCard } from '@/components/jobs/JobCard';
import { VerifiedBadge, companySizeLabel } from '@/components/companies/VerifiedBadge';

function displayHost(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function Fact({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 w-4 h-4 flex-shrink-0 text-slate-400" aria-hidden />
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
        <dd className="mt-0.5 text-sm text-slate-900 break-words">{children}</dd>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading company">
      <Skeleton className="h-4 w-36 mb-6" />
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-5">
          <Skeleton className="w-20 h-20 rounded-2xl" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-7 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </Card>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="p-6 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </Card>
        <Card className="p-6 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-40" />
        </Card>
      </div>
    </div>
  );
}

export default function CompanyProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, isError, error, refetch, isRefetching } = useCompanyProfile(slug);

  const backLink = (
    <Link href="/companies" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary-600 mb-6 transition-colors">
      <ArrowLeft className="w-4 h-4" aria-hidden /> All companies
    </Link>
  );

  if (isLoading) return <ProfileSkeleton />;

  if (isError || !data) {
    const notFound = axios.isAxiosError(error) && error.response?.status === 404;
    return (
      <div className="mx-auto max-w-3xl">
        {backLink}
        <Card>
          {notFound ? (
            <EmptyState
              icon={Building2}
              title="Company not found"
              description="This company page doesn't exist or may have been renamed."
              action={<Link href="/companies" className={buttonClasses()}>Browse companies</Link>}
            />
          ) : (
            <ErrorState title="We couldn't load this company" error={error} onRetry={() => refetch()} retrying={isRefetching} />
          )}
        </Card>
      </div>
    );
  }

  const { company, openJobs } = data;
  const size = companySizeLabel(company.size);
  const roleCount = Math.max(company.openJobs, openJobs.length);

  return (
    <div>
      {backLink}

      {/* Header */}
      <Card className="p-5 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-5">
          <CompanyLogo name={company.name} src={company.logoUrl} size="lg" className="sm:w-20 sm:h-20 sm:text-xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 break-words">{company.name}</h1>
              {company.verified && <VerifiedBadge label="Verified company" />}
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
              {company.industry && (
                <li className="flex items-center gap-1.5 min-w-0">
                  <Factory className="w-4 h-4 flex-shrink-0 text-slate-400" aria-hidden />
                  <span className="break-words">{company.industry}</span>
                </li>
              )}
              {company.headquarters && (
                <li className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="w-4 h-4 flex-shrink-0 text-slate-400" aria-hidden />
                  <span className="break-words">{company.headquarters}</span>
                </li>
              )}
              {size && (
                <li className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 flex-shrink-0 text-slate-400" aria-hidden />
                  {size}
                </li>
              )}
              <li className="flex items-center gap-1.5 font-medium text-primary-700">
                <Briefcase className="w-4 h-4 flex-shrink-0" aria-hidden />
                {pluralize(roleCount, 'open role')}
              </li>
            </ul>
          </div>
          {company.website && (
            <div className="sm:self-start">
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses('secondary', 'md', 'w-full sm:w-auto')}
              >
                <Globe className="w-4 h-4" aria-hidden />
                Visit website
                <ExternalLink className="w-3.5 h-3.5 opacity-70" aria-hidden />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </div>
          )}
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="space-y-6 min-w-0">
          <Card>
            <CardHeader title={`About ${company.name}`} />
            <div className="px-5 py-5 sm:px-6">
              {company.description ? (
                <p className="whitespace-pre-line break-words text-[15px] leading-relaxed text-slate-700">{company.description}</p>
              ) : (
                <p className="text-sm text-slate-500">This company hasn&apos;t added a description yet.</p>
              )}
            </div>
          </Card>

          <section aria-labelledby="open-roles">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 id="open-roles" className="text-lg font-semibold text-slate-900">Open roles</h2>
              {openJobs.length > 0 && <span className="text-sm text-slate-500">{pluralize(openJobs.length, 'role')}</span>}
            </div>
            {openJobs.length === 0 ? (
              <Card>
                <EmptyState
                  icon={Briefcase}
                  title="No open roles right now"
                  description={`${company.name} isn't hiring at the moment. Check back later or explore other jobs.`}
                  action={<Link href="/jobs" className={buttonClasses('secondary', 'sm')}>Browse all jobs</Link>}
                />
              </Card>
            ) : (
              <ul className="space-y-3">
                {openJobs.map((job) => (
                  <li key={job.id}><JobCard job={job} /></li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside aria-label="Company facts" className="lg:sticky lg:top-24">
          <Card>
            <CardHeader title="Company facts" />
            <dl className="px-5 py-5 space-y-4">
              {company.website && (
                <Fact icon={Globe} label="Website">
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="font-medium text-primary-600 hover:text-primary-700 hover:underline">
                    {displayHost(company.website)}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </Fact>
              )}
              {company.industry && <Fact icon={Factory} label="Industry">{company.industry}</Fact>}
              {company.headquarters && <Fact icon={MapPin} label="Headquarters">{company.headquarters}</Fact>}
              {size && <Fact icon={Users} label="Company size">{size}</Fact>}
              <Fact icon={Building2} label="Hiring team on NexHire">{pluralize(company.members, 'recruiter')}</Fact>
              <Fact icon={CalendarDays} label="On NexHire since">{formatMonthYear(company.createdAt)}</Fact>
            </dl>
          </Card>
        </aside>
      </div>
    </div>
  );
}
