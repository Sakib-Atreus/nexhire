'use client';

import { ApplicationTimeline } from '@/components/timeline/ApplicationTimeline';

/** Full application history for the hiring team: stage changes (with messages sent), interviews, withdrawals. */
export function ActivityTab({ applicationId }: { applicationId: string }) {
  return (
    <div>
      <p className="mb-4 text-xs text-fg-muted">
        Everything that happened on this application. Messages sent with stage changes are visible to the candidate.
      </p>
      <ApplicationTimeline applicationId={applicationId} audience="team" />
    </div>
  );
}
