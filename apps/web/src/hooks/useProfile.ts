'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types';

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<User>('/users/me').then((r) => r.data),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);

  return useMutation({
    mutationFn: (data: Partial<User>) =>
      api.patch<User>('/users/me', data).then((r) => r.data),
    onSuccess: (updatedUser) => {
      qc.invalidateQueries({ queryKey: ['me'] });
      qc.invalidateQueries({ queryKey: ['users', 'me'] });
      updateUser(updatedUser);
    },
  });
}
