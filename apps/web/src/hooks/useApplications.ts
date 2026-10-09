'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Application, ApplicationStats, ApplicationStatus, Page } from '@/types';

export function useMyApplications(page = 0) {
  return useQuery({
    queryKey: ['applications', 'my', page],
    queryFn: () => api.get<Page<Application>>('/applications/my', { params: { page, size: 10, sort: 'appliedAt,desc' } }).then((r) => r.data),
  });
}

/** The pipeline needs every applicant (board columns, counts, search), so pages are fetched up to this many. */
export const MAX_PIPELINE_APPLICANTS = 1000;
const APPLICANTS_PAGE = 100;

/**
 * All applicants for a job, newest first, merged into one page (fetched 100 at a time, up to
 * MAX_PIPELINE_APPLICANTS). `totalElements` is the real total, so the UI can say when it's truncated.
 */
export function useJobApplications(jobId: string) {
  return useQuery({
    queryKey: ['applications', 'job', jobId],
    queryFn: async () => {
      const get = (page: number) =>
        api.get<Page<Application>>(`/applications/job/${jobId}`, { params: { page, size: APPLICANTS_PAGE, sort: 'appliedAt,desc' } })
          .then((r) => r.data);
      const first = await get(0);
      const pages = Math.min(first.totalPages, MAX_PIPELINE_APPLICANTS / APPLICANTS_PAGE);
      const rest = await Promise.all(Array.from({ length: Math.max(0, pages - 1) }, (_, i) => get(i + 1)));
      return { ...first, content: [first, ...rest].flatMap((p) => p.content) };
    },
    enabled: !!jobId,
    // A big list: don't refetch it on every tab switch.
    staleTime: 2 * 60_000,
    refetchOnWindowFocus: false,
  });
}

/** The candidate's own applications by status (all of them, for dashboard counts). */
export function useMyApplicationStats(enabled = true) {
  return useQuery({
    queryKey: ['applications', 'my', 'stats'],
    queryFn: () => api.get<ApplicationStats>('/applications/my/stats').then((r) => r.data),
    enabled,
  });
}

export function useApply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { jobId: string; coverLetter?: string; resumeUrl?: string }) =>
      api.post<Application>('/applications', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  });
}

export function useUpdateApplicationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      api.patch<Application>(`/applications/${id}/status`, { status, notes }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  });
}

export function useRecruiterApplications() {
  return useQuery({
    queryKey: ['applications', 'recruiter'],
    queryFn: () => api.get<Page<Application>>('/applications/recruiter', { params: { sort: 'appliedAt,desc' } }).then((r) => r.data),
  });
}

/** The candidate's own application for a job (null when they haven't applied). */
export function useCheckApplied(jobId: string, enabled = true) {
  const { data, isLoading } = useQuery({
    queryKey: ['applications', 'my', 'job', jobId],
    queryFn: () =>
      api.get<Application | ''>(`/applications/my/job/${jobId}`).then((r) => (r.status === 204 || !r.data ? null : r.data)),
    enabled: enabled && !!jobId,
  });
  return { applied: !!data && data.status !== 'WITHDRAWN', application: data ?? undefined, isLoading };
}

export function useBulkUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { applicationIds: string[]; status: ApplicationStatus; notes?: string }) =>
      api.patch<Application[]>('/applications/bulk-status', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  });
}

export function useRecruiterStats() {
  return useQuery({
    queryKey: ['applications', 'recruiter', 'stats'],
    queryFn: () => api.get<ApplicationStats>('/applications/recruiter/stats').then((r) => r.data),
  });
}
