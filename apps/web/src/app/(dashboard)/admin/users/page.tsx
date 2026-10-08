'use client';

import { useCallback, useMemo, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { useAllUsers, useBanUser, usePromoteUser } from '@/hooks/useUsers';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Field';
import { ConfirmDialog } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { ROLE_LABELS, ROLE_STYLES } from '@/lib/constants';
import { formatDate, getErrorMessage, pluralize } from '@/lib/format';
import { toast } from '@/store/toastStore';
import type { Role, User } from '@/types';

const ROLES: Role[] = ['CANDIDATE', 'RECRUITER', 'ADMIN'];
const PAGE_SIZE = 20;

type PendingAction =
  | { kind: 'role'; user: User; role: Role }
  | { kind: 'status'; user: User; enabled: boolean };

function StatusBadge({ enabled }: { enabled?: boolean }) {
  return enabled === false
    ? <Badge tone="bg-rose-50 text-rose-700 ring-rose-600/20">Suspended</Badge>
    : <Badge tone="bg-emerald-50 text-emerald-700 ring-emerald-600/20">Active</Badge>;
}

function RoleSelect({ user, isSelf, busy, onChange }: { user: User; isSelf: boolean; busy: boolean; onChange: (r: Role) => void }) {
  return (
    <Select
      value={user.role}
      disabled={isSelf || busy}
      onChange={(e) => onChange(e.target.value as Role)}
      aria-label={`Role for ${user.fullName}`}
      title={isSelf ? "You can't change your own role" : undefined}
      className="h-9 text-sm w-auto min-w-[9rem]"
    >
      {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
    </Select>
  );
}

function StatusButton({ user, isSelf, busy, onClick }: { user: User; isSelf: boolean; busy: boolean; onClick: () => void }) {
  const suspended = user.enabled === false;
  return (
    <Button
      variant={suspended ? 'secondary' : 'ghost'}
      size="sm"
      disabled={isSelf || busy}
      onClick={onClick}
      title={isSelf ? "You can't suspend your own account" : undefined}
      className={suspended ? undefined : 'text-rose-600 hover:bg-rose-50 hover:text-rose-700'}
    >
      {suspended ? 'Restore' : 'Suspend'}
    </Button>
  );
}

export default function AdminUsersPage() {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const [pending, setPending] = useState<PendingAction | null>(null);

  const { data, isLoading, isError, error, refetch, isRefetching, isPlaceholderData } = useAllUsers(page, PAGE_SIZE);
  const banUser = useBanUser();
  const promoteUser = usePromoteUser();
  const busyId = (banUser.isPending && banUser.variables?.id) || (promoteUser.isPending && promoteUser.variables?.id) || null;

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.content ?? []).filter((u) =>
      (!roleFilter || u.role === roleFilter) &&
      (!q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    );
  }, [data, query, roleFilter]);

  const filtering = !!query.trim() || !!roleFilter;
  const mutating = banUser.isPending || promoteUser.isPending;
  // Stable reference: Modal re-runs its focus effect whenever onClose changes.
  const closeDialog = useCallback(() => { if (!mutating) setPending(null); }, [mutating]);

  function confirm() {
    if (!pending) return;
    const { user } = pending;
    const done = () => setPending(null);
    if (pending.kind === 'role') {
      promoteUser.mutate(
        { id: user.id, role: pending.role },
        {
          onSuccess: () => { toast.success('Role updated', `${user.fullName} is now ${ROLE_LABELS[pending.role].toLowerCase()}.`); done(); },
          onError: (err) => toast.error("Couldn't change role", getErrorMessage(err)),
        }
      );
    } else {
      banUser.mutate(
        { id: user.id, enabled: pending.enabled },
        {
          onSuccess: () => {
            toast.success(pending.enabled ? 'Account restored' : 'Account suspended', user.fullName);
            done();
          },
          onError: (err) => toast.error("Couldn't update account", getErrorMessage(err)),
        }
      );
    }
  }

  const dialog = pending?.kind === 'role'
    ? {
        title: `Change role to ${ROLE_LABELS[pending.role]}?`,
        description:
          pending.role === 'ADMIN'
            ? `${pending.user.fullName} will get full administrative access, including managing other users.`
            : `${pending.user.fullName} will switch from ${ROLE_LABELS[pending.user.role]} to ${ROLE_LABELS[pending.role]}.`,
        confirmLabel: 'Change role',
        tone: (pending.role === 'ADMIN' ? 'danger' : 'primary') as 'danger' | 'primary',
      }
    : pending?.kind === 'status'
      ? pending.enabled
        ? { title: `Restore ${pending.user.fullName}?`, description: 'They will be able to sign in and use NexHire again.', confirmLabel: 'Restore account', tone: 'primary' as const }
        : { title: `Suspend ${pending.user.fullName}?`, description: "They won't be able to sign in until an administrator restores the account. Their data is kept.", confirmLabel: 'Suspend account', tone: 'danger' as const }
      : null;

  return (
    <div>
      <PageHeader
        title="Users"
        description={data ? `${pluralize(data.totalElements, 'registered account')}. Change roles or suspend access.` : 'Change roles or suspend access.'}
      />

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter this page by name or email…"
              aria-label="Filter users on this page by name or email"
              className="pl-9"
            />
          </div>
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as Role | '')}
            aria-label="Filter by role"
            className="sm:w-48"
          >
            <option value="">All roles</option>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </Select>
        </div>

        {isLoading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-4">
                <Skeleton className="w-9 h-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56 max-w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <ErrorState title="Couldn't load users" error={error} onRetry={() => refetch()} retrying={isRefetching} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Users}
            title={filtering ? 'No matching users on this page' : 'No users yet'}
            description={filtering ? 'Filtering only covers the page shown. Clear the filter or try another page.' : undefined}
            action={filtering ? <Button variant="secondary" size="sm" onClick={() => { setQuery(''); setRoleFilter(''); }}>Clear filters</Button> : undefined}
          />
        ) : (
          <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
            {/* Desktop table */}
            <table className="hidden md:table w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3">User</th>
                  <th scope="col" className="px-5 py-3">Role</th>
                  <th scope="col" className="px-5 py-3">Status</th>
                  <th scope="col" className="px-5 py-3">Joined</th>
                  <th scope="col" className="px-5 py-3 text-right"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((u) => {
                  const isSelf = u.id === currentUserId;
                  const busy = busyId === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar name={u.fullName} src={u.avatarUrl} size="sm" />
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">
                              {u.fullName}
                              {isSelf && <span className="ml-2 text-xs font-normal text-slate-500">(you)</span>}
                            </p>
                            <p className="text-slate-500 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <RoleSelect user={u} isSelf={isSelf} busy={busy} onChange={(role) => role !== u.role && setPending({ kind: 'role', user: u, role })} />
                      </td>
                      <td className="px-5 py-3"><StatusBadge enabled={u.enabled} /></td>
                      <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                      <td className="px-5 py-3 text-right">
                        <StatusButton user={u} isSelf={isSelf} busy={busy} onClick={() => setPending({ kind: 'status', user: u, enabled: u.enabled === false })} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile list */}
            <ul className="md:hidden divide-y divide-slate-100">
              {rows.map((u) => {
                const isSelf = u.id === currentUserId;
                const busy = busyId === u.id;
                return (
                  <li key={u.id} className="px-4 py-4 space-y-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <Avatar name={u.fullName} src={u.avatarUrl} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900 truncate">
                          {u.fullName}
                          {isSelf && <span className="ml-1.5 text-xs font-normal text-slate-500">(you)</span>}
                        </p>
                        <p className="text-sm text-slate-500 truncate">{u.email}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <Badge tone={ROLE_STYLES[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                          <StatusBadge enabled={u.enabled} />
                          <span className="text-xs text-slate-500">Joined {formatDate(u.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    {!isSelf && (
                      <div className="flex items-center gap-2 pl-12">
                        <RoleSelect user={u} isSelf={isSelf} busy={busy} onChange={(role) => role !== u.role && setPending({ kind: 'role', user: u, role })} />
                        <StatusButton user={u} isSelf={isSelf} busy={busy} onClick={() => setPending({ kind: 'status', user: u, enabled: u.enabled === false })} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </Card>

      {data && (
        <Pagination page={page} totalPages={data.totalPages} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
      )}

      {dialog && (
        <ConfirmDialog
          open
          onClose={closeDialog}
          onConfirm={confirm}
          title={dialog.title}
          description={dialog.description}
          confirmLabel={dialog.confirmLabel}
          tone={dialog.tone}
          loading={mutating}
        />
      )}
    </div>
  );
}
