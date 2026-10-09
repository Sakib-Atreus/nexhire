'use client';

import Link from 'next/link';
import { Sparkles, UserPen } from 'lucide-react';
import { useRecommendedJobs } from '@/hooks/useCandidate';
import { useMe } from '@/hooks/useProfile';
import { JobCard, JobCardSkeleton } from '@/components/jobs/JobCard';
import { Card } from '@/components/ui/Card';
import { buttonClasses } from '@/components/ui/Button';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { cn } from '@/lib/cn';

/**
 * Candidate-only list of recommended jobs with match badges.
 * `grid` lays cards out in two columns on wide screens (dashboard); otherwise a single column (jobs page).
 */
export function RecommendedJobs({ size, grid = false, className }: { size: number; grid?: boolean; className?: string }) {
  const recs = useRecommendedJobs(size);
  const me = useMe();
  const layout = cn('grid gap-3', grid && 'xl:grid-cols-2', className);

  if (recs.isLoading) {
    return (
      <div className={layout} aria-busy="true" aria-label="Loading recommendations">
        {Array.from({ length: grid ? 4 : 3 }).map((_, i) => <JobCardSkeleton key={i} />)}
      </div>
    );
  }

  if (recs.isError) {
    return (
      <Card className={className}>
        <ErrorState title="We couldn't load recommendations" error={recs.error} onRetry={() => recs.refetch()} retrying={recs.isRefetching} />
      </Card>
    );
  }

  const list = recs.data ?? [];
  if (list.length === 0) {
    const profileEmpty = !!me.data && !(me.data.skills?.length) && !me.data.headline?.trim();
    return (
      <Card className={className}>
        {profileEmpty ? (
          <EmptyState
            icon={UserPen}
            title="Add skills and a headline to your profile to get recommendations"
            description="We match open jobs against the skills and headline on your profile."
            action={<Link href="/profile" className={buttonClasses('primary', 'sm')}>Update profile</Link>}
          />
        ) : (
          <EmptyState
            icon={Sparkles}
            title="No matches right now"
            description="No open jobs match your profile's skills or headline yet. Adding more skills widens the net, and new jobs are posted regularly."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/profile" className={buttonClasses('secondary', 'sm')}>Add skills</Link>
                <Link href="/jobs" className={buttonClasses('primary', 'sm')}>Browse all jobs</Link>
              </div>
            }
          />
        )}
      </Card>
    );
  }

  return (
    <div className={layout}>
      {list.map((r) => (
        <JobCard key={r.job.id} job={r.job} matchScore={r.matchScore} matchedSkills={r.matchedSkills} />
      ))}
    </div>
  );
}
