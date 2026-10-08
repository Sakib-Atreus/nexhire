'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { JobReport, PublicSettings, ReportReason } from '@/types';

/** Public site settings (announcement banner, categories, skills). No login required; cached for 5 minutes. */
export function usePublicSettings() {
  return useQuery({
    queryKey: ['settings', 'public'],
    queryFn: () => api.get<PublicSettings>('/settings/public').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

/** Report a job posting to the moderators (any signed-in user except the job's own recruiter). */
export function useReportJob() {
  return useMutation({
    mutationFn: ({ jobId, reason, details }: { jobId: string; reason: ReportReason; details?: string }) =>
      api.post<JobReport>(`/jobs/${jobId}/report`, { reason, details }).then((r) => r.data),
  });
}
