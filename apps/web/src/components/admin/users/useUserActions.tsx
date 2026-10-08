'use client';

import { useState, type ReactNode } from 'react';
import { useAdminDeleteUser, useSetUserRole, useSetUserStatus, useSetUserVerified } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/Button';
import { FormField, Select } from '@/components/ui/Field';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { ROLE_LABELS } from '@/lib/constants';
import { getErrorMessage } from '@/lib/format';
import { toast } from '@/store/toastStore';
import type { Role, User } from '@/types';
import { ROLES } from './UserBadges';

export type UserActionKind = 'verify' | 'role' | 'status' | 'delete';

interface Pending {
  kind: UserActionKind;
  user: User;
}

/** Consequence text for a role change, shown before the admin confirms. */
function roleConsequence(user: User, next: Role): string {
  if (next === user.role) return 'Pick a different role to continue.';
  const parts: string[] = [];
  if (next === 'ADMIN') parts.push('They will get full administrative access, including managing other users, jobs and site settings.');
  if (user.role === 'ADMIN') parts.push('They will lose access to the admin panel.');
  if (user.role === 'RECRUITER') parts.push('Their recruiter verification will be removed.');
  if (next === 'RECRUITER') parts.push('They will be able to post jobs. Verification is not granted automatically.');
  if (next === 'CANDIDATE') parts.push('They will be able to browse and apply to jobs.');
  return parts.join(' ');
}

function RoleDialog({ user, loading, onClose, onSubmit }: {
  user: User;
  loading: boolean;
  onClose: () => void;
  onSubmit: (role: Role) => void;
}) {
  const [role, setRole] = useState<Role>(user.role);
  const changed = role !== user.role;

  return (
    <Modal
      open
      onClose={onClose}
      title={`Change role for ${user.fullName}`}
      description={`Currently ${ROLE_LABELS[user.role]}.`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            variant={role === 'ADMIN' ? 'danger' : 'primary'}
            onClick={() => onSubmit(role)}
            disabled={!changed}
            loading={loading}
          >
            Change role
          </Button>
        </>
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); if (changed) onSubmit(role); }} className="space-y-3">
        <FormField label="New role">
          {(id) => (
            <Select id={id} value={role} onChange={(e) => setRole(e.target.value as Role)} disabled={loading}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}{r === user.role ? ' (current)' : ''}</option>
              ))}
            </Select>
          )}
        </FormField>
        <p className={changed && role === 'ADMIN' ? 'text-sm text-rose-700' : 'text-sm text-slate-600'} aria-live="polite">
          {roleConsequence(user, role)}
        </p>
      </form>
    </Modal>
  );
}

/**
 * Shared state + dialogs for user moderation actions (verify, role, suspend/restore, delete).
 * Render `dialogs` once; call `request(kind, user)` from menus or buttons.
 */
export function useUserActions({ onDeleted }: { onDeleted?: (user: User) => void } = {}) {
  const [pending, setPending] = useState<Pending | null>(null);
  const setVerified = useSetUserVerified();
  const setStatus = useSetUserStatus();
  const setRole = useSetUserRole();
  const del = useAdminDeleteUser();

  const loading = setVerified.isPending || setStatus.isPending || setRole.isPending || del.isPending;
  const busyId = loading ? pending?.user.id ?? null : null;
  const close = () => { if (!loading) setPending(null); };
  const done = () => setPending(null);

  function request(kind: UserActionKind, user: User) {
    setPending({ kind, user });
  }

  function confirm() {
    if (!pending) return;
    const { kind, user } = pending;
    if (kind === 'verify') {
      const verified = !user.verified;
      setVerified.mutate({ id: user.id, verified }, {
        onSuccess: () => { toast.success(verified ? 'Recruiter verified' : 'Verification removed', user.fullName); done(); },
        onError: (err) => toast.error(verified ? "Couldn't verify recruiter" : "Couldn't remove verification", getErrorMessage(err)),
      });
    } else if (kind === 'status') {
      const enabled = user.enabled === false;
      setStatus.mutate({ id: user.id, enabled }, {
        onSuccess: () => { toast.success(enabled ? 'Account restored' : 'Account suspended', user.fullName); done(); },
        onError: (err) => toast.error("Couldn't update account", getErrorMessage(err)),
      });
    } else if (kind === 'delete') {
      del.mutate(user.id, {
        onSuccess: () => { toast.success('Account deleted', user.fullName); done(); onDeleted?.(user); },
        onError: (err) => toast.error("Couldn't delete account", getErrorMessage(err)),
      });
    }
  }

  function changeRole(role: Role) {
    if (!pending) return;
    const { user } = pending;
    setRole.mutate({ id: user.id, role }, {
      onSuccess: () => { toast.success('Role updated', `${user.fullName} is now ${ROLE_LABELS[role].toLowerCase()}.`); done(); },
      onError: (err) => toast.error("Couldn't change role", getErrorMessage(err)),
    });
  }

  let dialogs: ReactNode = null;
  if (pending) {
    const { kind, user } = pending;
    const name = user.fullName;
    if (kind === 'role') {
      dialogs = <RoleDialog key={user.id} user={user} loading={loading} onClose={close} onSubmit={changeRole} />;
    } else {
      const config =
        kind === 'verify'
          ? user.verified
            ? {
                title: `Remove verification from ${name}?`,
                description: 'The verified badge will be removed from their profile and job posts. You can verify them again later.',
                confirmLabel: 'Remove verification',
                tone: 'danger' as const,
              }
            : {
                title: `Verify ${name}?`,
                description: 'Their profile and job posts will show a verified recruiter badge to candidates. Only verify recruiters whose company you have checked.',
                confirmLabel: 'Verify recruiter',
                tone: 'primary' as const,
              }
          : kind === 'status'
            ? user.enabled === false
              ? {
                  title: `Restore ${name}?`,
                  description: 'They will be able to sign in and use NexHire again.',
                  confirmLabel: 'Restore account',
                  tone: 'primary' as const,
                }
              : {
                  title: `Suspend ${name}?`,
                  description: "They won't be able to sign in until an administrator restores the account. Their data is kept.",
                  confirmLabel: 'Suspend account',
                  tone: 'danger' as const,
                }
            : {
                title: `Delete ${name}?`,
                description: 'This permanently deletes the account and all their jobs and applications. This cannot be undone.',
                confirmLabel: 'Delete account',
                tone: 'danger' as const,
              };
      dialogs = <ConfirmDialog open onClose={close} onConfirm={confirm} loading={loading} {...config} />;
    }
  }

  return { request, dialogs, busyId };
}
