import type { QueryClient } from '@tanstack/react-query';
import type { Application, Job } from '@/types';

/**
 * Small, targeted cache updates so one action (a rating, a note, saving a job) changes the item in every
 * cached list instead of refetching every list on the page.
 */

type Paged<T> = { content: T[] };
const isPaged = <T,>(v: unknown): v is Paged<T> => !!v && typeof v === 'object' && Array.isArray((v as Paged<T>).content);

function patchEverywhere<T extends { id: string }>(data: unknown, id: string, patch: (item: T) => T): unknown {
  if (Array.isArray(data)) return data.map((x) => (x && (x as T).id === id ? patch(x as T) : x));
  if (isPaged<T>(data)) return { ...data, content: data.content.map((x) => (x.id === id ? patch(x) : x)) };
  if (data && typeof data === 'object' && (data as T).id === id) return patch(data as T);
  return data;
}

/** Update one application wherever it is cached under ['applications', …]. */
export function patchApplication(qc: QueryClient, id: string, patch: (a: Application) => Application) {
  qc.setQueriesData({ queryKey: ['applications'] }, (old: unknown) => patchEverywhere<Application>(old, id, patch));
}

/** Update one job wherever it is cached under ['jobs', …] (lists, details, recommendations). */
export function patchJob(qc: QueryClient, id: string, patch: (j: Job) => Job) {
  qc.setQueriesData({ queryKey: ['jobs'] }, (old: unknown) => {
    // Recommendations wrap the job: [{ job, matchScore, … }].
    if (Array.isArray(old) && old.length && (old[0] as { job?: Job }).job) {
      return old.map((r: { job: Job }) => (r.job.id === id ? { ...r, job: patch(r.job) } : r));
    }
    return patchEverywhere<Job>(old, id, patch);
  });
}
