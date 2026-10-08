'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { User, Page, Role } from '@/types';

export function useAllUsers(page = 0, size = 20, sort = 'createdAt,desc') {
  return useQuery({
    queryKey: ['users', { page, size, sort }],
    queryFn: () => api.get<Page<User>>('/users', { params: { page, size, sort } }).then((r) => r.data),
    placeholderData: keepPreviousData,
  });
}

export function useBanUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      api.patch<User>('/users/' + id + '/status', { enabled }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function usePromoteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      api.patch<User>('/users/' + id + '/role', { role }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete('/users/' + id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}
