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

export function useJobApplications(jobId: string) {
  return useQuery({
    queryKey: ['applications', 'job', jobId],
    queryFn: () => api.get<Page<Application>>(`/applications/job/${jobId}`, { params: { size: 100, sort: 'appliedAt,desc' } }).then((r) => r.data),
    enabled: !!jobId,
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
