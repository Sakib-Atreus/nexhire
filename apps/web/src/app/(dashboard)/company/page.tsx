'use client';

import Link from 'next/link';
import { Building2, ExternalLink, Info, ShieldCheck, Users } from 'lucide-react';
import { useCreateCompany, useMyCompany, useUpdateCompany } from '@/hooks/useCompanies';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import { getErrorMessage } from '@/lib/format';
import type { CompanyInput, MyCompany } from '@/types';
import { buttonClasses } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { CompanyForm } from '@/components/companies/CompanyForm';
import { TeamCard } from '@/components/companies/TeamCard';
import { VerifiedBadge } from '@/components/companies/VerifiedBadge';

function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading company">
      <Skeleton className="h-8 w-40 mb-2" />
      <Skeleton className="h-4 w-72 mb-6" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" />
          </div>
          <Skeleton className="h-32 w-full" />
        </Card>
        <Card className="p-6 space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </Card>
      </div>
    </div>
  );
}

function CreateCompanyView({ email }: { email?: string }) {
  const create = useCreateCompany();

  const onSubmit = (input: CompanyInput) =>
    create.mutateAsync(input).then(
      () => { toast.success('Company created', 'You are the owner. Add teammates from the Team panel.'); return true; },
      (err) => { toast.error('Could not create company', getErrorMessage(err)); return false; }
    );

  return (
    <div>
      <PageHeader
        title="Set up your company"
        description="Create a company profile so candidates know who they're applying to, and invite your hiring team."
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
        <Card>
          <CardHeader title="Company profile" description="Shown on your public company page and on every job you post." />
          <div className="p-5 sm:p-6">
            <CompanyForm mode="create" submitting={create.isPending} onSubmit={onSubmit} />
          </div>
        </Card>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <Users className="w-5 h-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-fg">How teams work</h2>
                <ul className="mt-2 space-y-1.5 text-sm text-fg-tertiary list-disc pl-4">
                  <li>Recruiters on the same team share jobs and applicants.</li>
                  <li>Jobs are always posted under your company&apos;s name and logo.</li>
                  <li>The person who creates the company becomes its owner and can add or remove teammates.</li>
                </ul>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-subtle text-fg-muted">
                <Info className="w-5 h-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-fg">Already have a company on NexHire?</h2>
                <p className="mt-1 text-sm text-fg-tertiary">
                  Don&apos;t create a duplicate. Ask its owner to add you using your email:
                </p>
                {email && <p className="mt-2 rounded-md bg-muted px-2.5 py-1.5 text-sm font-medium text-fg break-all ring-1 ring-inset ring-line">{email}</p>}
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function ManageCompanyView({ data, currentUserId }: { data: MyCompany; currentUserId?: string }) {
  const update = useUpdateCompany();
  const { company } = data;

  const onSubmit = (input: CompanyInput) =>
    update.mutateAsync(input).then(
      () => { toast.success('Company profile saved', 'Your jobs now show the updated name and logo.'); return true; },
      (err) => { toast.error('Could not save changes', getErrorMessage(err)); return false; }
    );

  return (
    <div>
      <PageHeader
        title={company.name}
        description="Manage your company profile and hiring team."
        actions={
          <Link href={`/companies/${company.slug}`} className={buttonClasses('secondary')}>
            View public page <ExternalLink className="w-4 h-4" aria-hidden />
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] items-start">
        <Card className="min-w-0">
          <CardHeader
            title="Company profile"
            description="Any teammate can edit this. Changes apply to all of your company's jobs."
            action={company.verified ? <VerifiedBadge /> : undefined}
          />
          {!company.verified && (
            <div className="mx-5 mt-5 flex items-start gap-2.5 rounded-lg bg-muted px-3.5 py-3 text-sm text-fg-tertiary ring-1 ring-inset ring-line sm:mx-6">
              <ShieldCheck className="mt-0.5 w-4 h-4 flex-shrink-0 text-fg-subtle" aria-hidden />
              <p><span className="font-medium text-fg">Not verified yet</span> — an administrator verifies companies. Verified companies get a badge on their jobs and appear first in the directory.</p>
            </div>
          )}
          <div className="p-5 sm:p-6">
            <CompanyForm mode="edit" company={company} submitting={update.isPending} onSubmit={onSubmit} />
          </div>
        </Card>

        <div className="xl:sticky xl:top-24 min-w-0">
          <TeamCard data={data} currentUserId={currentUserId} />
        </div>
      </div>
    </div>
  );
}

export default function MyCompanyPage() {
  const user = useAuthStore((s) => s.user);
  const isRecruiter = user?.role === 'RECRUITER';
  const { data, isLoading, isError, error, refetch, isRefetching } = useMyCompany(isRecruiter);

  if (!user) return <PageSkeleton />;

  if (!isRecruiter) {
    return (
      <Card className="mx-auto max-w-2xl">
        <EmptyState
          icon={Building2}
          title="Company pages are for recruiters"
          description="Recruiters use this page to manage their company profile and hiring team. You can still browse every company hiring on NexHire."
          action={<Link href="/companies" className={buttonClasses()}>Browse companies</Link>}
        />
      </Card>
    );
  }

  if (isLoading) return <PageSkeleton />;

  if (isError) {
    return (
      <Card className="mx-auto max-w-2xl">
        <ErrorState title="Couldn't load your company" error={error} onRetry={() => refetch()} retrying={isRefetching} />
      </Card>
    );
  }

  if (!data) return <CreateCompanyView email={user.email} />;
  return <ManageCompanyView data={data} currentUserId={user.id} />;
}
