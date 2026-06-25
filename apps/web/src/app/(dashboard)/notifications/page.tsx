'use client';

import { useNotifications, useMarkAllRead, useNotificationStream } from '@/hooks/useNotifications';
import { Bell, CheckCheck, Settings } from 'lucide-react';
import { cn } from '@/lib/cn';
import Link from 'next/link';

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications();
  const { mutate: markAllRead, isPending } = useMarkAllRead();
  useNotificationStream();

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        <div className="flex items-center gap-3">
          {(data?.content.some((n) => !n.read)) && (
            <button
              onClick={() => markAllRead()}
              disabled={isPending}
              className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-800 font-medium"
            >
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
          <Link
            href="/notifications/preferences"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-medium"
          >
            <Settings className="w-4 h-4" /> Preferences
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-slate-200 rounded-xl animate-pulse" />)}</div>
      ) : !data?.content?.length ? (
        <div className="text-center py-16 text-slate-500">
          <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No notifications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.content.map((n) => (
            <div key={n.id} className={cn('bg-white rounded-xl border p-4 shadow-sm', n.read ? 'border-slate-200' : 'border-primary-200 bg-primary-50/30')}>
              <div className="flex items-start gap-3">
                {!n.read && <span className="mt-1.5 w-2 h-2 bg-primary-500 rounded-full shrink-0" />}
                <div className={cn(!n.read && 'ml-0', n.read && 'ml-5')}>
                  <p className="font-medium text-slate-800 text-sm">{n.title}</p>
                  <p className="text-slate-500 text-sm mt-0.5">{n.message}</p>
                  <p className="text-slate-400 text-xs mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
