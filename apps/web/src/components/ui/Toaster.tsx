'use client';

import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToastStore } from '@/store/toastStore';
import { cn } from '@/lib/cn';

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };
const ICON_COLORS = { success: 'text-emerald-500', error: 'text-rose-500', info: 'text-primary-500' };

export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-4 sm:top-auto sm:bottom-6 z-[70] flex flex-col items-center gap-2 px-4 sm:items-end sm:right-6 sm:left-auto"
    >
      {toasts.map((t) => {
        const Icon = ICONS[t.tone];
        return (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto w-full max-w-sm rounded-xl bg-surface shadow-lg ring-1 ring-line p-4 flex gap-3 animate-toast-in"
          >
            <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', ICON_COLORS[t.tone])} aria-hidden />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-fg">{t.title}</p>
              {t.description && <p className="mt-0.5 text-sm text-fg-muted">{t.description}</p>}
            </div>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="p-1 -m-1 h-fit rounded text-fg-subtle hover:text-fg-tertiary">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
