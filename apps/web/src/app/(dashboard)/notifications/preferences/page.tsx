'use client';

import { useNotificationPreferences, useUpdatePreferences } from '@/hooks/useNotifications';
import { useAuthStore } from '@/store/authStore';
import { Bell, Loader2 } from 'lucide-react';
import type { NotificationPreferences } from '@/types';

type PrefKey = keyof NotificationPreferences;

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
}

function ToggleRow({ label, description, checked, disabled, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        disabled={disabled}
        className={[
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
          'transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2',
          'focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          checked ? 'bg-primary-600' : 'bg-slate-200',
        ].join(' ')}
      >
        <span
          className={[
            'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow',
            'transform ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </button>
    </div>
  );
}

export default function NotificationPreferencesPage() {
  const user = useAuthStore((s) => s.user);
  const { data: prefs, isLoading } = useNotificationPreferences();
  const { mutate: updatePrefs, isPending } = useUpdatePreferences();

  function toggle(key: PrefKey) {
    if (!prefs) return;
    updatePrefs({ ...prefs, [key]: !prefs[key] });
  }

  const role = user?.role;

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary-50 rounded-lg">
          <Bell className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notification Preferences</h1>
          <p className="text-sm text-slate-500 mt-0.5">Choose which notifications you want to receive.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5">
        {isLoading ? (
          <div className="py-10 flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-sm">Loading preferences…</p>
          </div>
        ) : !prefs ? (
          <p className="py-10 text-center text-sm text-slate-500">Could not load preferences.</p>
        ) : (
          <>
            {role === 'RECRUITER' && (
              <ToggleRow
                label="New application received"
                description="Get notified when a candidate applies to one of your jobs."
                checked={prefs.applicationReceived}
                disabled={isPending}
                onChange={() => toggle('applicationReceived')}
              />
            )}

            {role === 'CANDIDATE' && (
              <ToggleRow
                label="Application status changes"
                description="Get notified when a recruiter updates the status of your application."
                checked={prefs.statusChanged}
                disabled={isPending}
                onChange={() => toggle('statusChanged')}
              />
            )}

            <ToggleRow
              label="General announcements"
              description="Platform updates, tips, and important news from NexHire."
              checked={prefs.general}
              disabled={isPending}
              onChange={() => toggle('general')}
            />
          </>
        )}
      </div>

      {isPending && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <Loader2 className="w-3 h-3 animate-spin" />
          Saving…
        </p>
      )}
    </div>
  );
}
