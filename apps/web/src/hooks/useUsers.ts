'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { User, Page, Role } from '@/types';

export function useAllUsers(page = 0, size = 20) {
  return useQuery({
    queryKey: ['users', { page, size }],
    queryFn: () => api.get<Page<User>>('/users', { params: { page, size } }).then((r) => r.data),
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
