import { BadgeCheck } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ROLE_LABELS, ROLE_STYLES } from '@/lib/constants';
import type { Role } from '@/types';

export const ROLES: Role[] = ['CANDIDATE', 'RECRUITER', 'ADMIN'];

export function RoleBadge({ role }: { role: Role }) {
  return <Badge tone={ROLE_STYLES[role]}>{ROLE_LABELS[role]}</Badge>;
}

export function UserStatusBadge({ enabled }: { enabled?: boolean }) {
  return enabled === false
    ? <Badge tone="bg-rose-50 text-rose-700 ring-rose-600/20">Suspended</Badge>
    : <Badge tone="bg-emerald-50 text-emerald-700 ring-emerald-600/20">Active</Badge>;
}

/** Only meaningful for recruiters: verified shows a check, unverified a muted pill. */
export function VerifiedBadge({ verified }: { verified?: boolean }) {
  return verified ? (
    <Badge tone="bg-emerald-50 text-emerald-700 ring-emerald-600/20">
      <BadgeCheck className="w-3.5 h-3.5" aria-hidden />
      Verified
    </Badge>
  ) : (
    <Badge tone="bg-slate-50 text-slate-500 ring-slate-400/20">Not verified</Badge>
  );
}

export function SelfBadge() {
  return <Badge tone="bg-primary-50 text-primary-700 ring-primary-600/20">You</Badge>;
}
