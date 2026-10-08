'use client';

import Link from 'next/link';
import { Briefcase, Building2, Flag, History, Settings, User as UserIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/States';
import { AUDIT_ACTION_LABELS, AUDIT_ACTION_STYLES } from '@/lib/constants';
import { parseDate, timeAgo } from '@/lib/format';
import type { AuditLogEntry } from '@/types';

export type AuditTargetType = NonNullable<AuditLogEntry['targetType']>;

const TARGET_META: Record<AuditTargetType, { icon: LucideIcon; noun: string }> = {
  USER: { icon: UserIcon, noun: 'User' },
  JOB: { icon: Briefcase, noun: 'Job' },
  COMPANY: { icon: Building2, noun: 'Company' },
  REPORT: { icon: Flag, noun: 'Report' },
  SETTINGS: { icon: Settings, noun: 'Site settings' },
};

function targetHref(entry: AuditLogEntry): string | null {
  if (!entry.targetId) return null;
  if (entry.targetType === 'USER') return `/admin/users/${entry.targetId}`;
  if (entry.targetType === 'JOB') return `/jobs/${entry.targetId}`;
  if (entry.targetType === 'COMPANY') return `/admin/companies?id=${entry.targetId}`;
  return null;
}

function fullDate(value: string) {
  return parseDate(value).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function AuditRow({ entry, onFilterTarget }: {
  entry: AuditLogEntry;
  onFilterTarget?: (type: AuditTargetType, id: string) => void;
}) {
  const meta = entry.targetType ? TARGET_META[entry.targetType] : null;
  const TargetIcon = meta?.icon;
  const label = entry.targetLabel?.trim() || meta?.noun || 'Unknown target';
  const href = targetHref(entry);
  const canFilter = !!(onFilterTarget && entry.targetType && entry.targetId && entry.targetType !== 'SETTINGS');
  const actor = entry.actorName?.trim() || entry.actorEmail || 'System';

  return (
    <li className="px-4 sm:px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <Badge tone={AUDIT_ACTION_STYLES[entry.action]}>{AUDIT_ACTION_LABELS[entry.action] ?? entry.action}</Badge>
          <span className="inline-flex items-center gap-1.5 min-w-0 text-sm">
            {TargetIcon && <TargetIcon className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" aria-hidden />}
            {meta && entry.targetType !== 'SETTINGS' && <span className="sr-only">{meta.noun}:</span>}
            {href ? (
              <Link
                href={href}
                className="font-medium text-slate-900 hover:text-primary-700 hover:underline truncate rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                {label}
              </Link>
            ) : (
              <span className="font-medium text-slate-900 truncate">{label}</span>
            )}
          </span>
          {canFilter && (
            <button
              type="button"
              onClick={() => onFilterTarget!(entry.targetType!, entry.targetId!)}
              className="inline-flex items-center gap-1 rounded text-xs text-slate-500 hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              title={`Show all actions on this ${meta!.noun.toLowerCase()}`}
            >
              <History className="w-3.5 h-3.5" aria-hidden />
              <span>History<span className="sr-only"> for {label}</span></span>
            </button>
          )}
        </div>
        {entry.details?.trim() && (
          <p className="mt-1.5 text-sm text-slate-600 break-words whitespace-pre-line">{entry.details}</p>
        )}
      </div>

      <div className="flex sm:flex-col sm:items-end justify-between gap-x-3 gap-y-0.5 text-xs sm:text-right sm:w-56 flex-shrink-0 min-w-0">
        <div className="min-w-0">
          <p className="font-medium text-slate-700 truncate">{actor}</p>
          {entry.actorEmail && entry.actorName && (
            <p className="text-slate-400 truncate">{entry.actorEmail}</p>
          )}
        </div>
        <time dateTime={entry.createdAt} title={fullDate(entry.createdAt)} className="text-slate-400 whitespace-nowrap">
          {timeAgo(entry.createdAt)}
        </time>
      </div>
    </li>
  );
}

export function AuditLogList({ entries, onFilterTarget }: {
  entries: AuditLogEntry[];
  onFilterTarget?: (type: AuditTargetType, id: string) => void;
}) {
  return (
    <ul className="divide-y divide-slate-100">
      {entries.map((e) => <AuditRow key={e.id} entry={e} onFilterTarget={onFilterTarget} />)}
    </ul>
  );
}

export function AuditLogSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <ul className="divide-y divide-slate-100" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="px-4 sm:px-5 py-4 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-3.5 w-2/3" />
          </div>
          <div className="space-y-1.5 sm:w-56 sm:flex sm:flex-col sm:items-end">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </li>
      ))}
    </ul>
  );
}
