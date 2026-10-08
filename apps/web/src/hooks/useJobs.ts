'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { ExperienceLevel, Job, JobStatus, JobType, Page } from '@/types';

/** Body accepted by POST /jobs and PATCH /jobs/{id}. */
export interface JobPayload {
  title?: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  companyName?: string;
  companyLogoUrl?: string;
  location?: string;
  jobType?: JobType;
  experienceLevel?: ExperienceLevel;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string;
  status?: JobStatus;
  tags?: string;
  deadline?: string | null;
  screeningQuestions?: string[];
}

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
  /** Spring sort, e.g. "createdAt,desc". */
  sort?: string;
}

export function useJobs(params: JobSearchParams = {}) {
  return useQuery({
    queryKey: ['jobs', params],
    queryFn: () =>
      api.get<Page<Job>>('/jobs', { params: { ...params, size: params.size ?? 10 } }).then((r) => r.data),
    placeholderData: keepPreviousData,
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ['jobs', id],
    queryFn: () => api.get<Job>(`/jobs/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useMyJobs(page = 0, size = 50) {
  return useQuery({
    queryKey: ['jobs', 'my', page, size],
    queryFn: () =>
      api.get<Page<Job>>('/jobs/my', { params: { page, size, sort: 'createdAt,desc' } }).then((r) => r.data),
    placeholderData: keepPreviousData,
  });
}

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: JobPayload) => api.post<Job>('/jobs', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  });
}

export function useUpdateJob(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: JobPayload) => api.patch<Job>(`/jobs/${id}`, data).then((r) => r.data),
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
    placeholderData: keepPreviousData,
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
