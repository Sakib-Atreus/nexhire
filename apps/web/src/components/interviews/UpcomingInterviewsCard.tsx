'use client';

import Link from 'next/link';
import { CalendarClock } from 'lucide-react';
import { useUpcomingInterviews } from '@/hooks/useHiring';
import { INTERVIEW_RESPONSE_LABELS, INTERVIEW_RESPONSE_STYLES, INTERVIEW_TYPE_LABELS } from '@/lib/constants';
import { Badge } from '@/components/ui/Badge';
import { buttonClasses } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { InterviewTypeIcon, useTimeZoneAbbr } from './InterviewParts';
import { CANDIDATE_RESPONSE_LABELS, CANDIDATE_RESPONSE_STYLES, canRespond } from './InterviewResponsePanel';
import { dayHeading, formatDuration, formatTime } from './interviewUtils';

/** Dashboard card: the next 3 scheduled interviews for a candidate or recruiter. */
export function UpcomingInterviewsCard({ viewer }: { viewer: 'CANDIDATE' | 'RECRUITER' }) {
  const { data, isLoading, isError, error, refetch, isRefetching } = useUpcomingInterviews(true);
  const tz = useTimeZoneAbbr();
  const recruiter = viewer === 'RECRUITER';
  const next = [...(data ?? [])].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)).slice(0, 3);

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Upcoming interviews"
        description={tz ? `Times in ${tz}` : undefined}
        action={
          <Link href="/interviews" className="text-sm font-medium text-primary-600 hover:text-primary-700 whitespace-nowrap">
            View all
          </Link>
        }
      />
      {isLoading ? (
        <div className="p-5 space-y-4" aria-busy="true" aria-label="Loading interviews">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState className="py-8" title="Couldn't load interviews" error={error} onRetry={() => refetch()} retrying={isRefetching} />
      ) : next.length === 0 ? (
        <div className="px-5 py-6 text-center">
          <CalendarClock className="mx-auto w-5 h-5 text-fg-faint" aria-hidden />
          <p className="mt-2 text-sm text-fg-muted">
            {recruiter
              ? 'No interviews scheduled. Schedule them from a job’s applicant pipeline.'
              : 'No interviews scheduled yet. Invitations will show up here.'}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line-subtle">
          {next.map((i) => {
            const href = recruiter ? `/jobs/${i.jobId}/applicants` : `/applications?application=${i.applicationId}`;
            const askRespond = !recruiter && i.response === 'AWAITING' && canRespond(i);
            return (
              <li key={i.id} className="flex items-center gap-2 pr-4 hover:bg-muted/70 focus-within:bg-muted">
                <Link href={href} className="flex min-w-0 flex-1 gap-3 py-3.5 pl-5 focus:outline-none">
                  <InterviewTypeIcon type={i.type} />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-fg truncate">
                      {recruiter ? i.candidateName : i.jobTitle}
                    </span>
                    <span className="block text-xs text-fg-muted truncate">
                      {recruiter ? i.jobTitle : i.companyName} · {INTERVIEW_TYPE_LABELS[i.type]}
                    </span>
                    <span className="block text-xs font-medium text-fg-secondary mt-0.5">
                      <time dateTime={i.scheduledAt}>
                        {dayHeading(i.scheduledAt)} · {formatTime(i.scheduledAt)} ({formatDuration(i.durationMinutes)})
                      </time>
                    </span>
                    {i.status === 'SCHEDULED' && (
                      <span className="mt-1.5 flex flex-wrap gap-1">
                        <Badge tone={recruiter ? INTERVIEW_RESPONSE_STYLES[i.response] : CANDIDATE_RESPONSE_STYLES[i.response]}>
                          {recruiter ? INTERVIEW_RESPONSE_LABELS[i.response] : CANDIDATE_RESPONSE_LABELS[i.response]}
                        </Badge>
                        {recruiter && i.needsFollowUp && (
                          <Badge tone="bg-amber-50 text-amber-800 ring-amber-600/20">No response 2+ days</Badge>
                        )}
                      </span>
                    )}
                  </span>
                </Link>
                {askRespond && (
                  <Link href={href} className={buttonClasses('primary', 'sm', 'flex-shrink-0')}>
                    Respond<span className="sr-only"> to the {i.jobTitle} interview invitation</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
