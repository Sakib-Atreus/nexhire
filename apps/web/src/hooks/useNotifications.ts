'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import Cookies from 'js-cookie';
import type { Notification, NotificationPreferences, Page } from '@/types';

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
        qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
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
