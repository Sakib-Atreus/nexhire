'use client';

import { Star } from 'lucide-react';
import { useJobs } from '@/hooks/useJobs';
import { JobCard } from './LatestJobs';

const FEATURED_PARAMS = { featured: true, size: 6 };

/**
 * Admin-promoted roles. Renders nothing until featured jobs are known to exist
 * (no skeleton, so pages without featured jobs never flash an empty section).
 */
export function FeaturedJobs() {
  const { data, isError } = useJobs(FEATURED_PARAMS);
  // The API puts featured jobs first but the filter is authoritative; double-check client-side anyway.
  const jobs = (data?.content ?? []).filter((j) => j.featured !== false);
  if (isError || jobs.length === 0) return null;

  return (
    <section aria-labelledby="featured-heading" className="py-16 sm:py-20 bg-surface border-b border-line/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h2 id="featured-heading" className="flex items-center gap-2 text-2xl sm:text-3xl font-bold tracking-tight text-fg">
            <Star className="w-6 h-6 fill-amber-400 text-amber-500 flex-shrink-0" aria-hidden />
            Featured jobs
          </h2>
          <p className="mt-2 text-fg-muted">Roles highlighted by the NexHire team.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {jobs.map((job) => <JobCard key={job.id} job={job} />)}
        </div>
      </div>
    </section>
  );
}
