'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type {
  Application, ApplicationMessage, ApplicationNote, Interview, InterviewConflict, InterviewInput, InterviewResponse, Job, JobAnalytics,
  MessageTemplate,
} from '@/types';

// Hiring-team tools for one application. Notes and rating are private to the hiring team;
// messages and interviews are shared with the candidate.

// ─── Rating & notes ──────────────────────────────────────────────────────────

export function useRateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rating }: { id: string; rating: number | null }) =>
      api.patch<Application>(`/applications/${id}/rating`, { rating }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  });
}

export function useApplicationNotes(applicationId: string, enabled = true) {
  return useQuery({
    queryKey: ['applications', applicationId, 'notes'],
    queryFn: () => api.get<ApplicationNote[]>(`/applications/${applicationId}/notes`).then((r) => r.data),
    enabled: enabled && !!applicationId,
  });
}

export function useAddNote(applicationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => api.post<ApplicationNote>(`/applications/${applicationId}/notes`, { body }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  });
}

/** Authors (and admins) can delete their own notes. */
export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => api.delete(`/applications/notes/${noteId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  });
}

// ─── Messages (candidate ⇄ hiring team) ─────────────────────────────────────

export function useApplicationMessages(applicationId: string, enabled = true) {
  return useQuery({
    queryKey: ['applications', applicationId, 'messages'],
    queryFn: () => api.get<ApplicationMessage[]>(`/applications/${applicationId}/messages`).then((r) => r.data),
    enabled: enabled && !!applicationId,
    refetchInterval: 30_000,
  });
}

/** From the hiring team, {{placeholders}} are filled in server-side. */
export function useSendMessage(applicationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      api.post<ApplicationMessage>(`/applications/${applicationId}/messages`, { body }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  });
}

// ─── Interviews ──────────────────────────────────────────────────────────────

export function useApplicationInterviews(applicationId: string, enabled = true) {
  return useQuery({
    queryKey: ['applications', applicationId, 'interviews'],
    queryFn: () => api.get<Interview[]>(`/applications/${applicationId}/interviews`).then((r) => r.data),
    enabled: enabled && !!applicationId,
  });
}

function useInvalidateInterviews() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['applications'] });
    qc.invalidateQueries({ queryKey: ['interviews'] });
  };
}

/**
 * Schedule an interview (hiring team). scheduledAt must be an ISO instant in the future.
 * The applicant moves to the Interview stage if they were earlier in the pipeline.
 */
export function useScheduleInterview(applicationId: string) {
  const invalidate = useInvalidateInterviews();
  return useMutation({
    mutationFn: (body: InterviewInput) =>
      api.post<Interview>(`/applications/${applicationId}/interviews`, body).then((r) => r.data),
    onSuccess: invalidate,
  });
}

/** Reschedule/edit, or set status COMPLETED / CANCELLED. Candidates are notified of reschedules and cancellations. */
export function useUpdateInterview() {
  const invalidate = useInvalidateInterviews();
  return useMutation({
    mutationFn: ({ id, ...body }: InterviewInput & { id: string }) =>
      api.patch<Interview>(`/interviews/${id}`, body).then((r) => r.data),
    onSuccess: invalidate,
  });
}

/**
 * Interviews that would clash with a proposed slot (for you or the candidate). Pass `start` = null to skip.
 * Saving a clashing slot without `allowConflicts: true` returns 409 with the same list (see getInterviewConflicts).
 */
export function useInterviewConflicts(applicationId: string, start: string | null, durationMinutes: number, excludeInterviewId?: string) {
  return useQuery({
    queryKey: ['interviews', 'conflicts', applicationId, start, durationMinutes, excludeInterviewId],
    queryFn: () =>
      api.get<InterviewConflict[]>(`/applications/${applicationId}/interviews/conflicts`, {
        params: { start, durationMinutes, excludeInterviewId },
      }).then((r) => r.data),
    enabled: !!applicationId && !!start,
    staleTime: 15_000,
  });
}

/** The clash list from a 409 response when saving an interview, or null for any other error. */
export function getInterviewConflicts(error: unknown): InterviewConflict[] | null {
  const res = (error as { response?: { status?: number; data?: { conflicts?: InterviewConflict[] } } })?.response;
  return res?.status === 409 && Array.isArray(res.data?.conflicts) ? res.data!.conflicts! : null;
}

/**
 * Candidate: accept, decline, or ask for another time (proposedTimes: 1–3 future ISO instants, required for
 * NEW_TIME_REQUESTED). The recruiter is notified. Can be changed until the interview starts.
 */
export function useRespondToInterview() {
  const invalidate = useInvalidateInterviews();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; response: Exclude<InterviewResponse, 'AWAITING'>; note?: string; proposedTimes?: string[] }) =>
      api.post<Interview>(`/interviews/${id}/respond`, body).then((r) => r.data),
    onSuccess: invalidate,
  });
}

/** Upcoming scheduled interviews for the signed-in candidate, or across all jobs a recruiter manages. */
export function useUpcomingInterviews(enabled = true) {
  return useQuery({
    queryKey: ['interviews', 'upcoming'],
    queryFn: () => api.get<Interview[]>('/interviews/upcoming').then((r) => r.data),
    enabled,
  });
}

// ─── Templates ───────────────────────────────────────────────────────────────

export function useMessageTemplates(enabled = true) {
  return useQuery({
    queryKey: ['templates'],
    queryFn: () => api.get<MessageTemplate[]>('/message-templates').then((r) => r.data),
    enabled,
  });
}

export function useSaveTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name, body }: { id?: string; name: string; body: string }) =>
      (id
        ? api.put<MessageTemplate>(`/message-templates/${id}`, { name, body })
        : api.post<MessageTemplate>('/message-templates', { name, body })
      ).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/message-templates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
}

// ─── Jobs: analytics & duplicate ─────────────────────────────────────────────

export function useJobAnalytics(jobId: string) {
  return useQuery({
    queryKey: ['jobs', jobId, 'analytics'],
    queryFn: () => api.get<JobAnalytics>(`/jobs/${jobId}/analytics`).then((r) => r.data),
    enabled: !!jobId,
  });
}

/** Copy a job as a new DRAFT; returns the copy (navigate to its edit page). */
export function useDuplicateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => api.post<Job>(`/jobs/${jobId}/duplicate`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  });
}
