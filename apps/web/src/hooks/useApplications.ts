'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Application, Page } from '@/types';

export function useMyApplications() {
  return useQuery({
    queryKey: ['applications', 'my'],
    queryFn: () => api.get<Page<Application>>('/applications/my').then((r) => r.data),
  });
}

export function useJobApplications(jobId: string) {
  return useQuery({
    queryKey: ['applications', 'job', jobId],
    queryFn: () => api.get<Page<Application>>(`/applications/job/${jobId}`).then((r) => r.data),
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
    queryFn: () => api.get<Page<Application>>('/applications/recruiter').then((r) => r.data),
  });
}

export function useCheckApplied(jobId: string) {
  const { data } = useMyApplications();
  const applied = data?.content.find((a) => a.jobId === jobId && a.status !== 'WITHDRAWN');
  return { applied: !!applied, application: applied };
}
