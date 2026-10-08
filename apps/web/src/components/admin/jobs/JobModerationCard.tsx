'use client';

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import type { Job } from '@/types';
import { Card } from '@/components/ui/Card';
import { JobModerationActions } from './JobModerationActions';

/** Compact admin-only moderation panel for the job detail page. */
export function JobModerationCard({ job, className }: { job: Job; className?: string }) {
  const state = job.hidden ? 'Hidden from candidates' : job.featured ? 'Featured in search' : 'Visible to candidates';
  return (
    <Card className={className}>
      <section aria-labelledby="moderation-heading" className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 id="moderation-heading" className="flex items-center gap-1.5 text-sm font-semibold text-fg">
            <ShieldCheck className="w-4 h-4 text-primary-600" aria-hidden /> Moderation
          </h2>
          <Link
            href={`/admin/jobs?q=${encodeURIComponent(job.title)}`}
            className="text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            Open in admin
          </Link>
        </div>
        <p className="mt-1 text-xs text-fg-muted">{state}</p>
        <JobModerationActions job={job} className="mt-3" />
      </section>
    </Card>
  );
}
