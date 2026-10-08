'use client';

import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/States';
import { formatDate } from '@/lib/format';
import type { User } from '@/types';
import { RoleBadge, SelfBadge, UserStatusBadge, VerifiedBadge } from './UserBadges';
import { UserActionsMenu } from './UserActionsMenu';
import type { UserActionKind } from './useUserActions';

interface ListProps {
  users: User[];
  currentUserId?: string;
  busyId: string | null;
  onAction: (kind: UserActionKind, user: User) => void;
}

function NameLink({ user, isSelf }: { user: User; isSelf: boolean }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Link
        href={`/admin/users/${user.id}`}
        className="font-medium text-fg hover:text-primary-700 truncate focus:outline-none focus-visible:underline"
      >
        {user.fullName}
      </Link>
      {isSelf && <SelfBadge />}
    </div>
  );
}

/** Desktop table (md+). */
export function UsersTable({ users, currentUserId, busyId, onAction }: ListProps) {
  return (
    <table className="hidden md:table w-full text-sm">
      <thead className="bg-muted text-left text-xs font-medium text-fg-muted">
        <tr>
          <th scope="col" className="px-5 py-3">User</th>
          <th scope="col" className="px-5 py-3">Role</th>
          <th scope="col" className="px-5 py-3">Status</th>
          <th scope="col" className="px-5 py-3">Joined</th>
          <th scope="col" className="px-5 py-3 text-right"><span className="sr-only">Actions</span></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line-subtle">
        {users.map((u) => {
          const isSelf = u.id === currentUserId;
          return (
            <tr key={u.id} className="hover:bg-muted/60">
              <td className="px-5 py-3 max-w-xs lg:max-w-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={u.fullName} src={u.avatarUrl} size="sm" />
                  <div className="min-w-0">
                    <NameLink user={u} isSelf={isSelf} />
                    <p className="text-fg-muted truncate">{u.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <RoleBadge role={u.role} />
                  {u.role === 'RECRUITER' && <VerifiedBadge verified={u.verified} />}
                </div>
              </td>
              <td className="px-5 py-3"><UserStatusBadge enabled={u.enabled} /></td>
              <td className="px-5 py-3 text-fg-muted whitespace-nowrap">{formatDate(u.createdAt)}</td>
              <td className="px-5 py-3 text-right">
                <UserActionsMenu user={u} isSelf={isSelf} busy={busyId === u.id} onAction={onAction} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Stacked cards for small screens. */
export function UsersCards({ users, currentUserId, busyId, onAction }: ListProps) {
  return (
    <ul className="md:hidden divide-y divide-line-subtle">
      {users.map((u) => {
        const isSelf = u.id === currentUserId;
        return (
          <li key={u.id} className="px-4 py-4">
            <div className="flex items-start gap-3 min-w-0">
              <Avatar name={u.fullName} src={u.avatarUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <NameLink user={u} isSelf={isSelf} />
                <p className="text-sm text-fg-muted truncate">{u.email}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <RoleBadge role={u.role} />
                  {u.role === 'RECRUITER' && <VerifiedBadge verified={u.verified} />}
                  <UserStatusBadge enabled={u.enabled} />
                </div>
                <p className="mt-1.5 text-xs text-fg-muted">Joined {formatDate(u.createdAt)}</p>
              </div>
              <UserActionsMenu user={u} isSelf={isSelf} busy={busyId === u.id} onAction={onAction} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function UsersListSkeleton() {
  return (
    <div className="divide-y divide-line-subtle" aria-busy="true" aria-label="Loading users">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-4">
          <Skeleton className="w-9 h-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56 max-w-full" />
          </div>
          <Skeleton className="hidden md:block h-5 w-20 rounded-full" />
          <Skeleton className="hidden md:block h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
