'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type {
  AdminOverview, AdminUserDetail, Announcement, AuditAction, AuditLogEntry, Job, JobReport, JobStatus, Page,
  ReportStatus, Role, User,
} from '@/types';

// All endpoints here require an ADMIN session (backend: /admin/**).

export function useAdminOverview() {
  return useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: () => api.get<AdminOverview>('/admin/overview').then((r) => r.data),
  });
}

// ─── Users ───────────────────────────────────────────────────────────────────

export interface AdminUserFilters {
  q?: string;
  role?: Role;
  status?: 'active' | 'suspended';
  verified?: boolean;
  page?: number;
  size?: number;
}

export function useAdminUsers(filters: AdminUserFilters) {
  const { page = 0, size = 20, ...rest } = filters;
  return useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: () => api.get<Page<User>>('/admin/users', { params: { ...rest, page, size } }).then((r) => r.data),
    placeholderData: keepPreviousData,
  });
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: ['admin', 'users', 'detail', id],
    queryFn: () => api.get<AdminUserDetail>(`/admin/users/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

/** Invalidate everything admin-related plus the legacy ['users'] list after a user change. */
function useInvalidateAdmin() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['admin'] });
    qc.invalidateQueries({ queryKey: ['users'] });
  };
}

export function useSetUserVerified() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) =>
      api.patch<User>(`/admin/users/${id}/verified`, { verified }).then((r) => r.data),
    onSuccess: invalidate,
  });
}

export function useSetUserStatus() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      api.patch<User>(`/users/${id}/status`, { enabled }).then((r) => r.data),
    onSuccess: invalidate,
  });
}

export function useSetUserRole() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      api.patch<User>(`/users/${id}/role`, { role }).then((r) => r.data),
    onSuccess: invalidate,
  });
}

export function useAdminDeleteUser() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: invalidate,
  });
}

// ─── Jobs ────────────────────────────────────────────────────────────────────

export interface AdminJobFilters {
  q?: string;
  status?: JobStatus;
  hidden?: boolean;
  featured?: boolean;
  category?: string;
  recruiterId?: string;
  page?: number;
  size?: number;
}

export function useAdminJobs(filters: AdminJobFilters) {
  const { page = 0, size = 20, ...rest } = filters;
  return useQuery({
    queryKey: ['admin', 'jobs', filters],
    queryFn: () => api.get<Page<Job>>('/admin/jobs', { params: { ...rest, page, size } }).then((r) => r.data),
    placeholderData: keepPreviousData,
  });
}

export interface JobModeration {
  hidden?: boolean;
  featured?: boolean;
  status?: JobStatus;
  reason?: string;
}

export function useModerateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: JobModeration & { id: string }) =>
      api.patch<Job>(`/admin/jobs/${id}`, body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useAdminDeleteJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/jobs/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export function useAdminReports(status: ReportStatus | undefined, page = 0, size = 20) {
  return useQuery({
    queryKey: ['admin', 'reports', { status, page, size }],
    queryFn: () => api.get<Page<JobReport>>('/admin/reports', { params: { status, page, size } }).then((r) => r.data),
    placeholderData: keepPreviousData,
  });
}

export function useResolveReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; status: Exclude<ReportStatus, 'OPEN'>; note?: string; hideJob?: boolean }) =>
      api.patch<JobReport>(`/admin/reports/${id}`, body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

// ─── Audit log ───────────────────────────────────────────────────────────────

export interface AuditFilters {
  action?: AuditAction;
  targetType?: string;
  targetId?: string;
  actor?: string;
  page?: number;
  size?: number;
}

export function useAuditLog(filters: AuditFilters) {
  const { page = 0, size = 25, ...rest } = filters;
  return useQuery({
    queryKey: ['admin', 'audit', filters],
    queryFn: () => api.get<Page<AuditLogEntry>>('/admin/audit', { params: { ...rest, page, size } }).then((r) => r.data),
    placeholderData: keepPreviousData,
  });
}

// ─── Settings ────────────────────────────────────────────────────────────────

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Announcement) => api.put<Announcement>('/admin/settings/announcement', body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      qc.invalidateQueries({ queryKey: ['admin', 'audit'] });
    },
  });
}

export function useUpdateSettingList(key: 'categories' | 'skills') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: string[]) => api.put<string[]>(`/admin/settings/${key}`, { items }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      qc.invalidateQueries({ queryKey: ['admin', 'audit'] });
    },
  });
}
