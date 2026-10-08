'use client';

import { useId } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useNotificationPreferences, useUpdatePreferences } from '@/hooks/useNotifications';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { Toggle } from '@/components/ui/Toggle';
import { getErrorMessage } from '@/lib/format';
import { toast } from '@/store/toastStore';
import type { NotificationPreferences, Role } from '@/types';

type PrefKey = keyof NotificationPreferences;

interface PrefRow {
  key: PrefKey;
  label: string;
  description: string;
}

function rowsFor(role?: Role): PrefRow[] {
  const general: PrefRow = {
    key: 'general',
    label: 'Account and platform updates',
    description: 'Important notices about your account and changes to NexHire.',
  };
  if (role === 'RECRUITER') {
    return [
      { key: 'applicationReceived', label: 'New applications', description: 'When a candidate applies to one of your jobs.' },
      general,
    ];
  }
  if (role === 'CANDIDATE') {
    return [
      { key: 'statusChanged', label: 'Application updates', description: 'When a recruiter moves your application to a new stage.' },
      general,
    ];
  }
  return [general];
}

function ToggleRow({ row, checked, disabled, onChange }: { row: PrefRow; checked: boolean; disabled: boolean; onChange: (v: boolean) => void }) {
  const labelId = useId();
  const descId = useId();
  return (
    <li className="flex items-start justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <p id={labelId} className="text-sm font-medium text-slate-900">{row.label}</p>
        <p id={descId} className="mt-0.5 text-sm text-slate-500">{row.description}</p>
      </div>
      <div className="pt-0.5">
        <Toggle checked={checked} onChange={onChange} disabled={disabled} labelledBy={labelId} />
      </div>
    </li>
  );
}

export default function NotificationPreferencesPage() {
  const role = useAuthStore((s) => s.user?.role);
  const { data: prefs, isLoading, isError, error, refetch, isRefetching } = useNotificationPreferences();
  const update = useUpdatePreferences();

  // The API returns {} until preferences are first saved; missing keys mean "on" (see NotificationConsumer).
  const current: NotificationPreferences = {
    applicationReceived: prefs?.applicationReceived ?? true,
    statusChanged: prefs?.statusChanged ?? true,
    general: prefs?.general ?? true,
  };

  function setPref(key: PrefKey, value: boolean) {
    update.mutate(
      { ...current, [key]: value },
      {
        onSuccess: () => toast.success('Preferences saved'),
        onError: (err) => toast.error("Couldn't save preferences", getErrorMessage(err)),
      }
    );
  }

  return (
    <div className="max-w-2xl">
      <Link href="/notifications" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4">
        <ArrowLeft className="w-4 h-4" aria-hidden /> Notifications
      </Link>
      <PageHeader title="Notification settings" description="Choose which in-app notifications you receive." />

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-64 max-w-full" />
                </div>
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <ErrorState title="Couldn't load your settings" error={error} onRetry={() => refetch()} retrying={isRefetching} />
        ) : (
          <ul className="divide-y divide-slate-100">
            {rowsFor(role).map((row) => (
              <ToggleRow
                key={row.key}
                row={row}
                checked={update.isPending && update.variables ? update.variables[row.key] : current[row.key]}
                disabled={update.isPending}
                onChange={(v) => setPref(row.key, v)}
              />
            ))}
          </ul>
        )}
      </Card>
      <p className="mt-3 text-xs text-slate-500">Changes are saved automatically.</p>
    </div>
  );
}
