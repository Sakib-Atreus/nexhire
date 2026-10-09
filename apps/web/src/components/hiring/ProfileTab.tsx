'use client';

import { useApplicantProfile } from '@/hooks/useCandidate';
import { CandidateProfileView } from '@/components/profile/CandidateProfileView';
import { ErrorState, Skeleton } from '@/components/ui/States';

/** The applicant's full candidate profile (experience, education, links, contact) for the hiring team. */
export function ProfileTab({ applicationId }: { applicationId: string }) {
  const { data, isLoading, isError, error, refetch, isRefetching } = useApplicantProfile(applicationId);

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading profile">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
        <Skeleton className="h-16" />
        <Skeleton className="h-24" />
      </div>
    );
  }
  if (isError || !data) {
    return <ErrorState className="py-8" title="Couldn't load the profile" error={error} onRetry={() => refetch()} retrying={isRefetching} />;
  }
  return <CandidateProfileView profile={data} compact />;
}
