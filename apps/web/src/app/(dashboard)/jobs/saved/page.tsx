'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bookmark } from 'lucide-react';
import { useSavedJobs } from '@/hooks/useJobs';
import { JobCard, JobCardSkeleton } from '@/components/jobs/JobCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { buttonClasses } from '@/components/ui/Button';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Pagination } from '@/components/ui/Pagination';
import { pluralize } from '@/lib/format';

export default function SavedJobsPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading, isError, error, refetch, isRefetching } = useSavedJobs(page);

  const jobs = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  // If the last job on a page is unsaved, step back so the user isn't left on an empty page.
  if (data && jobs.length === 0 && page > 0) {
    setPage(Math.max(0, Math.min(page - 1, totalPages - 1)));
  }

  const goToPage = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <PageHeader
        title="Saved jobs"
        description={
          data && data.totalElements > 0
            ? `${pluralize(data.totalElements, 'job')} saved for later.`
            : 'Bookmark jobs while you browse and come back to them when you are ready to apply.'
        }
        actions={
          data && data.totalElements > 0 ? (
            <Link href="/jobs" className={buttonClasses('secondary')}>Browse more jobs</Link>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="grid gap-3" aria-busy="true" aria-label="Loading saved jobs">
          {Array.from({ length: 4 }).map((_, i) => <JobCardSkeleton key={i} />)}
        </div>
      ) : isError ? (
        <Card>
          <ErrorState title="We couldn't load your saved jobs" error={error} onRetry={() => refetch()} retrying={isRefetching} />
        </Card>
      ) : jobs.length === 0 ? (
        <Card>
          <EmptyState
            icon={Bookmark}
            title="No saved jobs yet"
            description="Tap the bookmark icon on any job to save it here for easy access."
            action={<Link href="/jobs" className={buttonClasses()}>Browse jobs</Link>}
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-3">
            {jobs.map((job) => <JobCard key={job.id} job={job} />)}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
        </>
      )}
    </div>
  );
}
