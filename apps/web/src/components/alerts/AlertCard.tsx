'use client';

import { useId } from 'react';
import Link from 'next/link';
import { BellOff, BellRing, Mail, Pencil, Trash2 } from 'lucide-react';
import { useSaveJobAlert } from '@/hooks/useCandidate';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { Skeleton } from '@/components/ui/States';
import { ALERT_FREQUENCY_LABELS } from '@/lib/constants';
import { getErrorMessage, pluralize, timeAgo } from '@/lib/format';
import { cn } from '@/lib/cn';
import { toast } from '@/store/toastStore';
import type { JobAlert, JobAlertInput } from '@/types';
import { alertFilterChips, alertJobsHref, alertToInput } from './alertFilters';

export function AlertCard({ alert, onEdit, onDelete }: { alert: JobAlert; onEdit: () => void; onDelete: () => void }) {
  const ids = useId();
  const save = useSaveJobAlert();
  const pending = save.isPending ? (save.variables as JobAlertInput | undefined) : undefined;
  // Show the requested value while the update is in flight.
  const active = pending?.active ?? alert.active;
  const emailEnabled = pending?.emailEnabled ?? alert.emailEnabled;

  const update = (overrides: Partial<JobAlertInput>, label: string) =>
    save.mutate(
      { id: alert.id, ...alertToInput(alert, overrides) },
      {
        onSuccess: () => toast.success(label),
        onError: (err) => toast.error('Could not update alert', getErrorMessage(err)),
      }
    );

  const chips = alertFilterChips(alert);

  return (
    <Card className={cn('p-5 transition-opacity', !active && 'opacity-80')}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {active ? (
              <BellRing className="w-4 h-4 text-primary-600" aria-hidden />
            ) : (
              <BellOff className="w-4 h-4 text-fg-subtle" aria-hidden />
            )}
            <h2 className="min-w-0 text-base font-semibold text-fg break-words">{alert.name}</h2>
            {!active && <Badge>Paused</Badge>}
          </div>

          {chips.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Filters">
              {chips.map((c) => (
                <li key={c} className="max-w-full truncate rounded-md bg-subtle px-2 py-0.5 text-xs font-medium text-fg-tertiary">{c}</li>
              ))}
            </ul>
          )}

          <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-fg-muted">
            <div className="flex gap-1">
              <dt className="sr-only">Frequency</dt>
              <dd>{ALERT_FREQUENCY_LABELS[alert.frequency]}</dd>
            </div>
            <div className="flex gap-1">
              <dt className="sr-only">Matching jobs</dt>
              <dd>
                <Link href={alertJobsHref(alert)} className="font-medium text-primary-600 hover:text-primary-700">
                  {pluralize(alert.currentMatches, 'open job')} match now
                </Link>
              </dd>
            </div>
            <div className="flex gap-1">
              <dt className="sr-only">Last sent</dt>
              <dd>{alert.lastSentAt ? `Last notified ${timeAgo(alert.lastSentAt)}` : 'No notifications sent yet'}</dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 md:flex-col md:items-end">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span id={`${ids}-active`} className="text-sm text-fg-secondary">Active</span>
              <Toggle
                checked={active}
                disabled={save.isPending}
                labelledBy={`${ids}-active`}
                onChange={(v) => update({ active: v }, v ? 'Alert resumed' : 'Alert paused')}
              />
            </div>
            <div className="flex items-center gap-2">
              <span id={`${ids}-email`} className="flex items-center gap-1 text-sm text-fg-secondary">
                <Mail className="w-3.5 h-3.5 text-fg-subtle" aria-hidden /> Email
              </span>
              <Toggle
                checked={emailEnabled}
                disabled={save.isPending}
                labelledBy={`${ids}-email`}
                onChange={(v) => update({ emailEnabled: v }, v ? 'Email notifications on' : 'Email notifications off')}
              />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onEdit} aria-label={`Edit ${alert.name}`}>
              <Pencil className="w-3.5 h-3.5" aria-hidden /> Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} aria-label={`Delete ${alert.name}`} className="hover:text-rose-700 hover:bg-rose-50">
              <Trash2 className="w-3.5 h-3.5" aria-hidden /> Delete
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function AlertCardSkeleton() {
  return (
    <Card className="p-5 space-y-3" aria-hidden>
      <Skeleton className="h-4 w-1/3" />
      <div className="flex gap-1.5"><Skeleton className="h-5 w-16" /><Skeleton className="h-5 w-20" /></div>
      <Skeleton className="h-3.5 w-1/2" />
    </Card>
  );
}
