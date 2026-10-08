'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Company, CompanyInput, CompanyProfile, MyCompany, Page } from '@/types';

// ─── Public ──────────────────────────────────────────────────────────────────

/** Company directory (no login required). Verified companies come first, then A–Z. */
export function useCompanies(q?: string, page = 0, size = 12) {
  return useQuery({
    queryKey: ['companies', { q, page, size }],
    queryFn: () => api.get<Page<Company>>('/companies', { params: { q: q || undefined, page, size } }).then((r) => r.data),
    placeholderData: keepPreviousData,
  });
}

/** Public company page: profile + open jobs. 404 when the slug doesn't exist. */
export function useCompanyProfile(slug: string) {
  return useQuery({
    queryKey: ['companies', 'profile', slug],
    queryFn: () => api.get<CompanyProfile>(`/companies/${slug}`).then((r) => r.data),
    enabled: !!slug,
  });
}

// ─── Recruiter: my company ───────────────────────────────────────────────────

/** The signed-in recruiter's company and team; `null` when they don't belong to one yet. */
export function useMyCompany(enabled = true) {
  return useQuery({
    queryKey: ['company', 'mine'],
    queryFn: () => api.get<MyCompany | ''>('/company').then((r) => (r.status === 204 || !r.data ? null : r.data)),
    enabled,
  });
}

function useCompanyMutation<TVars>(fn: (vars: TVars) => Promise<MyCompany | void>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company'] });
      qc.invalidateQueries({ queryKey: ['companies'] });
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

/** Create a company (400 if the name is taken or you already belong to one). You become its owner. */
export function useCreateCompany() {
  return useCompanyMutation((body: CompanyInput) => api.post<MyCompany>('/company', body).then((r) => r.data));
}

/** Any team member can edit the profile; jobs pick up name/logo changes automatically. */
export function useUpdateCompany() {
  return useCompanyMutation((body: CompanyInput) => api.put<MyCompany>('/company', body).then((r) => r.data));
}

/** Owner only. The person must already have a recruiter account and no company. */
export function useAddCompanyMember() {
  return useCompanyMutation((email: string) => api.post<MyCompany>('/company/members', { email }).then((r) => r.data));
}

/** Owner only; cannot remove yourself. */
export function useRemoveCompanyMember() {
  return useCompanyMutation((memberId: string) => api.delete<MyCompany>(`/company/members/${memberId}`).then((r) => r.data));
}

/** Owner only: hand ownership to a teammate. */
export function useTransferCompanyOwnership() {
  return useCompanyMutation((memberId: string) => api.post<MyCompany>(`/company/owner/${memberId}`).then((r) => r.data));
}

/** Members only (owners must transfer ownership first). */
export function useLeaveCompany() {
  return useCompanyMutation(() => api.post('/company/leave').then(() => undefined));
}
