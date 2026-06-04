'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Notification, Page } from '@/types';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<Page<Notification>>('/notifications').then((r) => r.data),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data.count),
    refetchInterval: 30000,
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch('/notifications/mark-all-read'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
