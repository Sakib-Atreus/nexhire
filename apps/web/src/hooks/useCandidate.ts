'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type {
  ApplicationEvent, CandidateProfile, Education, JobAlert, JobAlertInput, RecommendedJob, WorkExperience,
} from '@/types';

// ─── Profile details ─────────────────────────────────────────────────────────

export function useMyExperience() {
  return useQuery({
    queryKey: ['me', 'experience'],
    queryFn: () => api.get<WorkExperience[]>('/users/me/experience').then((r) => r.data),
  });
}

/** Replaces the whole ordered list (max 30). 400 if an end date is before its start date. */
export function useSaveExperience() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: WorkExperience[]) => api.put<WorkExperience[]>('/users/me/experience', items).then((r) => r.data),
    onSuccess: (data) => qc.setQueryData(['me', 'experience'], data),
  });
}

export function useMyEducation() {
  return useQuery({
    queryKey: ['me', 'education'],
    queryFn: () => api.get<Education[]>('/users/me/education').then((r) => r.data),
  });
}

export function useSaveEducation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: Education[]) => api.put<Education[]>('/users/me/education', items).then((r) => r.data),
    onSuccess: (data) => qc.setQueryData(['me', 'education'], data),
  });
}

/** Public profile by slug (no login). 404 when not public. */
export function usePublicProfile(slug: string) {
  return useQuery({
    queryKey: ['profiles', slug],
    queryFn: () => api.get<CandidateProfile>(`/profiles/${slug}`).then((r) => r.data),
    enabled: !!slug,
    retry: false,
  });
}

/** An applicant's full profile (incl. email, phone, resume) for the hiring team. */
export function useApplicantProfile(applicationId: string, enabled = true) {
  return useQuery({
    queryKey: ['applications', applicationId, 'candidate-profile'],
    queryFn: () => api.get<CandidateProfile>(`/applications/${applicationId}/candidate-profile`).then((r) => r.data),
    enabled: enabled && !!applicationId,
  });
}

// ─── Recommendations ─────────────────────────────────────────────────────────

/** Open jobs ranked by profile match (candidates only); jobs already applied to are excluded. */
export function useRecommendedJobs(size = 10, enabled = true) {
  return useQuery({
    queryKey: ['jobs', 'recommended', size],
    queryFn: () => api.get<RecommendedJob[]>('/jobs/recommended', { params: { size } }).then((r) => r.data),
    enabled,
  });
}

// ─── Job alerts ──────────────────────────────────────────────────────────────

export function useJobAlerts(enabled = true) {
  return useQuery({
    queryKey: ['job-alerts'],
    queryFn: () => api.get<JobAlert[]>('/job-alerts').then((r) => r.data),
    enabled,
  });
}

/** Create (no id) or update an alert. Max 10 per candidate; at least one filter required. */
export function useSaveJobAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: JobAlertInput & { id?: string }) =>
      (id ? api.put<JobAlert>(`/job-alerts/${id}`, body) : api.post<JobAlert>('/job-alerts', body)).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['job-alerts'] }),
  });
}

export function useDeleteJobAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/job-alerts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['job-alerts'] }),
  });
}

/** One-click unsubscribe from an alert email (no login). Resolves to the alert's name. */
export function useUnsubscribeAlert() {
  return useMutation({
    mutationFn: (token: string) => api.post<{ name: string }>('/job-alerts/unsubscribe', { token }).then((r) => r.data.name),
  });
}

// ─── Timeline ────────────────────────────────────────────────────────────────

/** Application history (candidate or hiring team), oldest first. */
export function useApplicationTimeline(applicationId: string, enabled = true) {
  return useQuery({
    queryKey: ['applications', applicationId, 'timeline'],
    queryFn: () => api.get<ApplicationEvent[]>(`/applications/${applicationId}/timeline`).then((r) => r.data),
    enabled: enabled && !!applicationId,
  });
}
