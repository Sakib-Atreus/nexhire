'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Lock } from 'lucide-react';
import { useJob, useUpdateJob } from '@/hooks/useJobs';
import { useMyCompany } from '@/hooks/useCompanies';
import { useAuthStore } from '@/store/authStore';
import { JobForm } from '@/components/jobs/JobForm';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { buttonClasses } from '@/components/ui/Button';
import { getErrorMessage } from '@/lib/format';
import { toast } from '@/store/toastStore';

function FormSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6" aria-busy="true" aria-label="Loading job">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-56" />
      {[0, 1, 2].map((i) => (
        <Card key={i} className="p-5 space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function EditJobPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: job, isLoading, error, refetch, isRefetching } = useJob(id);
  const updateJob = useUpdateJob(id);
  const myCompany = useMyCompany(user?.role === 'RECRUITER');

  if (isLoading || !user || (user.role === 'RECRUITER' && myCompany.isLoading)) return <FormSkeleton />;

  if (error || !job) {
    return (
      <Card className="mx-auto max-w-2xl">
        <ErrorState title="We couldn't load this job" error={error} onRetry={() => refetch()} retrying={isRefetching} />
      </Card>
    );
  }

  // The poster, any teammate on the job's company, or an admin (mirrors the server's rule).
  const onJobTeam = !!job.companyId && myCompany.data?.company.id === job.companyId;
  // job.canManage comes from the server (poster, company teammate or admin); onJobTeam covers a stale cache.
  const canEdit = user.role === 'ADMIN' || !!job.canManage || (user.role === 'RECRUITER' && (user.id === job.recruiterId || onJobTeam));
  if (!canEdit) {
    return (
      <Card className="mx-auto max-w-2xl">
        <EmptyState
          icon={Lock}
          title="You can't edit this job"
          description="Only the job's hiring team or an administrator can make changes."
          action={<Link href={`/jobs/${job.id}`} className={buttonClasses('secondary')}>View job</Link>}
        />
      </Card>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <Link href={`/jobs/${job.id}`} className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-primary-600 mb-4">
        <ArrowLeft className="w-4 h-4" aria-hidden /> Back to job
      </Link>
      <PageHeader
        title={job.status === 'DRAFT' ? 'Edit draft' : 'Edit job'}
        description={`${job.title} · ${job.companyName}`}
      />
      <JobForm
        key={job.id}
        mode="edit"
        job={job}
        cancelHref={`/jobs/${job.id}`}
        isSubmitting={updateJob.isPending}
        serverError={updateJob.error ? getErrorMessage(updateJob.error, 'We could not save your changes. Please try again.') : null}
        onSubmit={(payload, action) =>
          updateJob.mutate(payload, {
            onSuccess: (saved) => {
              if (action === 'publish') toast.success('Job published', `“${saved.title}” is now live.`);
              else toast.success(saved.status === 'DRAFT' ? 'Draft saved' : 'Changes saved');
              router.push(`/jobs/${job.id}`);
            },
          })
        }
      />
    </div>
  );
}
