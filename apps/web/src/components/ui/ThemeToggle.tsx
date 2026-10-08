'use client';

import { useEffect } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useThemeStore, type ThemePreference } from '@/store/themeStore';

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

/** Keeps the theme in sync with storage and, in "system" mode, with the OS setting. Mount once. */
export function ThemeSync() {
  const init = useThemeStore((s) => s.init);
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);

  useEffect(() => init(), [init]);

  useEffect(() => {
    if (preference !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setPreference('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [preference, setPreference]);

  return null;
}

/** Light / Dark / System segmented control (e.g. in the user menu). */
export function ThemeSegmented({ className }: { className?: string }) {
  const { preference, setPreference } = useThemeStore();
  return (
    <div role="radiogroup" aria-label="Theme" className={cn('grid grid-cols-3 gap-1 rounded-lg bg-subtle p-1', className)}>
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setPreference(value)}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
              active ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** Compact icon button that switches between light and dark (for headers). */
export function ThemeIconButton({ className }: { className?: string }) {
  const { resolved, setPreference } = useThemeStore();
  const next = resolved === 'dark' ? 'light' : 'dark';
  const Icon = resolved === 'dark' ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={() => setPreference(next)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-subtle hover:text-fg',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        className
      )}
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden />
    </button>
  );
}
