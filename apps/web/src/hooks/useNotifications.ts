'use client';

import { useEffect } from 'react';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import api from '@/lib/axios';
import Cookies from 'js-cookie';
import type { Notification, NotificationPreferences, Page } from '@/types';

const NOTIFICATIONS_PAGE = 20;

/** Newest notifications first, 20 at a time ("Load more" fetches the next page). */
export function useNotifications() {
  return useInfiniteQuery({
    queryKey: ['notifications', 'list'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      api
        .get<Page<Notification>>('/notifications', { params: { sort: 'createdAt,desc', page: pageParam, size: NOTIFICATIONS_PAGE } })
        .then((r) => r.data),
    getNextPageParam: (last) => (last.last ? undefined : last.number + 1),
  });
}

/** Unread badge count. Pass `enabled: false` for signed-out visitors so no 401 is triggered. */
export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data.count),
    // Live updates arrive over the notification stream; this is only a safety net.
    refetchInterval: 120_000,
    enabled,
  });
}

/** Mark a single notification as read (optimistically updates the list). */
export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onMutate: (id) => {
      qc.setQueryData<InfiniteData<Page<Notification>>>(['notifications', 'list'], (old) =>
        old
          ? { ...old, pages: old.pages.map((p) => ({ ...p, content: p.content.map((n) => (n.id === id ? { ...n, read: true } : n)) })) }
          : old
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

/**
 * Live notifications over Server-Sent Events. Reconnects with exponential backoff (5 s → 60 s) using a
 * fresh token each time, and disconnects while the tab is hidden so idle tabs don't keep the API awake.
 */
export function useNotificationStream() {
  const qc = useQueryClient();
  useEffect(() => {
    const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api';
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let delay = 5_000;
    let stopped = false;

    function connect() {
      clearTimeout(reconnectTimer);
      const token = Cookies.get('accessToken');
      if (stopped || !token || document.visibilityState === 'hidden') return;
      es = new EventSource(BASE + '/notifications/stream?token=' + encodeURIComponent(token));
      es.onopen = () => {
        delay = 5_000;
      };
      es.addEventListener('notification', () => {
        qc.invalidateQueries({ queryKey: ['notifications'] });
      });
      es.onerror = () => {
        es?.close();
        es = null;
        // An expired token also lands here: refresh the unread count (axios renews the token) before retrying.
        qc.invalidateQueries({ queryKey: ['notifications', 'unread'] });
        reconnectTimer = setTimeout(connect, delay + Math.random() * 1_000);
        delay = Math.min(delay * 2, 60_000);
      };
    }

    function onVisibility() {
      if (document.visibilityState === 'hidden') {
        es?.close();
        es = null;
        clearTimeout(reconnectTimer);
      } else if (!es) {
        delay = 5_000;
        // Catch up on anything missed while hidden, then reconnect.
        qc.invalidateQueries({ queryKey: ['notifications'] });
        connect();
      }
    }

    connect();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stopped = true;
      es?.close();
      clearTimeout(reconnectTimer);
      document.removeEventListener('visibilitychange', onVisibility);
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
