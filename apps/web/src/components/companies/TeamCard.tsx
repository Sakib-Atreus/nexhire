'use client';

import { useState, type FormEvent } from 'react';
import { Crown, LogOut, UserMinus, UserPlus } from 'lucide-react';
import type { CompanyMember, MyCompany } from '@/types';
import {
  useAddCompanyMember, useLeaveCompany, useRemoveCompanyMember, useTransferCompanyOwnership,
} from '@/hooks/useCompanies';
import { formatDate, getErrorMessage, pluralize } from '@/lib/format';
import { toast } from '@/store/toastStore';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Field';
import { ConfirmDialog } from '@/components/ui/Modal';

type Pending =
  | { kind: 'remove'; member: CompanyMember }
  | { kind: 'transfer'; member: CompanyMember }
  | { kind: 'leave' }
  | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function AddMemberForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const add = useAddCompanyMember();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setError('Enter a valid email address');
      return;
    }
    setError(null);
    add.mutate(value, {
      onSuccess: () => {
        toast.success('Teammate added', `${value} now shares your company's jobs and applicants.`);
        setEmail('');
      },
      onError: (err) => {
        const msg = getErrorMessage(err, 'Could not add this person.');
        setError(msg);
        toast.error('Could not add teammate', msg);
      },
    });
  };

  return (
    <form onSubmit={submit} noValidate className="px-5 py-4 border-t border-slate-100 bg-slate-50/60 rounded-b-xl">
      <label htmlFor="add-member-email" className="block text-sm font-medium text-slate-700">Add a teammate</label>
      <p className="mt-0.5 text-xs text-slate-500">They need an existing recruiter account that isn&apos;t part of another company.</p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <Input
          id="add-member-email"
          type="email"
          inputMode="email"
          autoComplete="off"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (error) setError(null); }}
          placeholder="name@company.com"
          invalid={!!error}
          aria-describedby={error ? 'add-member-error' : undefined}
          className="min-w-0 flex-1"
        />
        <Button type="submit" loading={add.isPending} disabled={!email.trim()}>
          {!add.isPending && <UserPlus className="w-4 h-4" aria-hidden />}
          Add
        </Button>
      </div>
      {error && <p id="add-member-error" role="alert" className="mt-1.5 text-xs text-rose-600">{error}</p>}
    </form>
  );
}

/** Team list for the recruiter's company. Owners manage members; others can leave. */
export function TeamCard({ data, currentUserId }: { data: MyCompany; currentUserId?: string }) {
  const { members, isOwner, company } = data;
  const [pending, setPending] = useState<Pending>(null);
  const remove = useRemoveCompanyMember();
  const transfer = useTransferCompanyOwnership();
  const leave = useLeaveCompany();
  const busy = remove.isPending || transfer.isPending || leave.isPending;

  // Owner first, then by name.
  const sorted = [...members].sort((a, b) => Number(b.owner) - Number(a.owner) || a.fullName.localeCompare(b.fullName));

  const close = () => { if (!busy) setPending(null); };

  const confirm = () => {
    if (!pending) return;
    if (pending.kind === 'remove') {
      remove.mutate(pending.member.id, {
        onSuccess: () => { toast.success('Teammate removed', `${pending.member.fullName} no longer has access to ${company.name}.`); setPending(null); },
        onError: (err) => toast.error('Could not remove teammate', getErrorMessage(err)),
      });
    } else if (pending.kind === 'transfer') {
      transfer.mutate(pending.member.id, {
        onSuccess: () => { toast.success('Ownership transferred', `${pending.member.fullName} is now the owner of ${company.name}.`); setPending(null); },
        onError: (err) => toast.error('Could not transfer ownership', getErrorMessage(err)),
      });
    } else {
      leave.mutate(undefined, {
        onSuccess: () => { toast.success('You left the company', `You no longer have access to ${company.name}'s jobs.`); setPending(null); },
        onError: (err) => toast.error('Could not leave the company', getErrorMessage(err)),
      });
    }
  };

  return (
    <Card>
      <CardHeader
        title="Team"
        description={`${pluralize(members.length, 'recruiter')} · everyone shares jobs and applicants`}
      />
      <ul className="divide-y divide-slate-100">
        {sorted.map((m) => {
          const isMe = m.id === currentUserId;
          return (
            <li key={m.id} className="px-5 py-4">
              <div className="flex items-start gap-3">
                <Avatar name={m.fullName} src={m.avatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-sm font-medium text-slate-900 break-words">
                      {m.fullName}
                      {isMe && <span className="font-normal text-slate-500"> (you)</span>}
                    </p>
                    {m.owner && (
                      <Badge tone="bg-amber-50 text-amber-700 ring-amber-600/20">
                        <Crown className="w-3 h-3" aria-hidden /> Owner
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 break-all">{m.email}</p>
                  <p className="mt-0.5 text-xs text-slate-400">Joined {formatDate(m.joinedAt)}</p>
                  {isOwner && !m.owner && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setPending({ kind: 'transfer', member: m })} disabled={busy}>
                        <Crown className="w-3.5 h-3.5" aria-hidden /> Make owner
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => setPending({ kind: 'remove', member: m })}
                        disabled={busy}
                        aria-label={`Remove ${m.fullName}`}
                      >
                        <UserMinus className="w-3.5 h-3.5" aria-hidden /> Remove
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {isOwner ? (
        <AddMemberForm />
      ) : (
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/60 rounded-b-xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">Only the owner can add or remove teammates.</p>
          <Button size="sm" variant="secondary" onClick={() => setPending({ kind: 'leave' })} disabled={busy}>
            <LogOut className="w-3.5 h-3.5" aria-hidden /> Leave company
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={pending?.kind === 'remove'}
        onClose={close}
        onConfirm={confirm}
        loading={remove.isPending}
        title={pending?.kind === 'remove' ? `Remove ${pending.member.fullName}?` : 'Remove teammate?'}
        description={`They will lose access to ${company.name}'s jobs and applicants. Jobs they posted stay with the company.`}
        confirmLabel="Remove"
      />
      <ConfirmDialog
        open={pending?.kind === 'transfer'}
        onClose={close}
        onConfirm={confirm}
        loading={transfer.isPending}
        tone="primary"
        title={pending?.kind === 'transfer' ? `Make ${pending.member.fullName} the owner?` : 'Transfer ownership?'}
        description="They will be able to add and remove teammates. You'll stay on the team as a regular member and can no longer manage the team."
        confirmLabel="Transfer ownership"
      />
      <ConfirmDialog
        open={pending?.kind === 'leave'}
        onClose={close}
        onConfirm={confirm}
        loading={leave.isPending}
        title={`Leave ${company.name}?`}
        description="You'll lose access to the company's jobs and applicants. The owner can add you back later."
        confirmLabel="Leave company"
      />
    </Card>
  );
}
