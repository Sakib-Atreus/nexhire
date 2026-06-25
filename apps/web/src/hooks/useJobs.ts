'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Job, Page } from '@/types';

interface JobSearchParams {
  keyword?: string;
  location?: string;
  companyName?: string;
  jobType?: string;
  experienceLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
  page?: number;
  size?: number;
}

export function useJobs(params: JobSearchParams = {}) {
  return useQuery({
    queryKey: ['jobs', params],
    queryFn: () =>
      api.get<Page<Job>>('/jobs', { params: { ...params, size: params.size ?? 10 } }).then((r) => r.data),
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ['jobs', id],
    queryFn: () => api.get<Job>(`/jobs/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useMyJobs() {
  return useQuery({
    queryKey: ['jobs', 'my'],
    queryFn: () => api.get<Page<Job>>('/jobs/my').then((r) => r.data),
  });
}

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Job>) => api.post<Job>('/jobs', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  });
}

export function useUpdateJob(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Job>) => api.patch<Job>(`/jobs/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  });
}

export function useDeleteJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/jobs/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  });
}

export function useSavedJobs(page = 0) {
  return useQuery({
    queryKey: ['jobs', 'saved', page],
    queryFn: () => api.get<Page<Job>>('/jobs/saved', { params: { page, size: 10 } }).then((r) => r.data),
  });
}

export function useSaveJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => api.post<Job>('/jobs/' + jobId + '/save').then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  });
}

export function useUnsaveJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => api.delete('/jobs/' + jobId + '/save'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  });
}
