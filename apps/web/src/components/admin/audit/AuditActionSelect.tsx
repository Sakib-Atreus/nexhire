'use client';

import { Select } from '@/components/ui/Field';
import { AUDIT_ACTION_LABELS } from '@/lib/constants';
import type { AuditAction } from '@/types';

const ALL_ACTIONS = Object.keys(AUDIT_ACTION_LABELS) as AuditAction[];

const GROUPS: { label: string; prefix: string }[] = [
  { label: 'Users', prefix: 'USER_' },
  { label: 'Jobs', prefix: 'JOB_' },
  { label: 'Reports', prefix: 'REPORT_' },
  { label: 'Settings', prefix: 'SETTINGS_' },
];

export function isAuditAction(v: string | null | undefined): v is AuditAction {
  return !!v && v in AUDIT_ACTION_LABELS;
}

export function AuditActionSelect({ id, value, onChange, className }: {
  id?: string;
  value: AuditAction | '';
  onChange: (value: AuditAction | '') => void;
  className?: string;
}) {
  return (
    <Select id={id} value={value} onChange={(e) => onChange(e.target.value as AuditAction | '')} className={className}>
      <option value="">All actions</option>
      {GROUPS.map((g) => (
        <optgroup key={g.prefix} label={g.label}>
          {ALL_ACTIONS.filter((a) => a.startsWith(g.prefix)).map((a) => (
            <option key={a} value={a}>{AUDIT_ACTION_LABELS[a]}</option>
          ))}
        </optgroup>
      ))}
    </Select>
  );
}
