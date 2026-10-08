'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock } from 'lucide-react';
import { useCreateJob } from '@/hooks/useJobs';
import { useAuthStore } from '@/store/authStore';
import { JobForm } from '@/components/jobs/JobForm';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState, Skeleton } from '@/components/ui/States';
import { buttonClasses } from '@/components/ui/Button';
import { getErrorMessage } from '@/lib/format';
import { toast } from '@/store/toastStore';

export default function CreateJobPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const createJob = useCreateJob();

  if (!user) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (user.role !== 'RECRUITER' && user.role !== 'ADMIN') {
    return (
      <Card className="max-w-3xl">
        <EmptyState
          icon={Lock}
          title="Only recruiters can post jobs"
          description="Your account is set up for job seeking. Browse open roles instead."
          action={<Link href="/jobs" className={buttonClasses('primary')}>Browse jobs</Link>}
        />
      </Card>
    );
  }

  return (
    <div className="max-w-3xl">
      <Link href="/jobs/my" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 mb-4">
        <ArrowLeft className="w-4 h-4" aria-hidden /> My jobs
      </Link>
      <PageHeader title="Post a job" description="Fill in the details below. The job goes live as soon as you publish it." />
      <JobForm
        mode="create"
        cancelHref="/jobs/my"
        isSubmitting={createJob.isPending}
        serverError={createJob.error ? getErrorMessage(createJob.error, 'We could not publish this job. Please try again.') : null}
        onSubmit={(payload) =>
          createJob.mutate(payload, {
            onSuccess: (job) => {
              toast.success('Job published', `“${job.title}” is now live.`);
              router.push(`/jobs/${job.id}`);
            },
          })
        }
      />
    </div>
  );
}
