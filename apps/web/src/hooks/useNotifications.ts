'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import Cookies from 'js-cookie';
import type { Notification, NotificationPreferences, Page } from '@/types';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () =>
      api.get<Page<Notification>>('/notifications', { params: { sort: 'createdAt,desc' } }).then((r) => r.data),
  });
}

/** Unread badge count. Pass `enabled: false` for signed-out visitors so no 401 is triggered. */
export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data.count),
    refetchInterval: 30000,
    enabled,
  });
}

/** Mark a single notification as read (optimistically updates the list). */
export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onMutate: (id) => {
      qc.setQueryData<Page<Notification>>(['notifications'], (old) =>
        old ? { ...old, content: old.content.map((n) => (n.id === id ? { ...n, read: true } : n)) } : old
      );
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch('/notifications/mark-all-read'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useNotificationStream() {
  const qc = useQueryClient();
  useEffect(() => {
    const accessToken = Cookies.get('accessToken');
    if (!accessToken) return;
    const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api';
    const url = BASE + '/notifications/stream?token=' + encodeURIComponent(accessToken);
    let es: EventSource;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      es = new EventSource(url);
      es.addEventListener('notification', () => {
        qc.invalidateQueries({ queryKey: ['notifications'] });
              });
      es.onerror = () => {
        es.close();
        reconnectTimer = setTimeout(connect, 5000);
      };
    }

    connect();
    return () => {
      es?.close();
      clearTimeout(reconnectTimer);
    };
  }, [qc]);
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['notifications', 'preferences'],
    queryFn: () => api.get<NotificationPreferences>('/notifications/preferences').then((r) => r.data),
  });
}

export function useUpdatePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prefs: NotificationPreferences) =>
      api.patch<NotificationPreferences>('/notifications/preferences', prefs).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', 'preferences'] }),
  });
}
