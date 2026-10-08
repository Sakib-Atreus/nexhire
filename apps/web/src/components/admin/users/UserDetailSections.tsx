'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight, BadgeCheck, BadgeX, Briefcase, CalendarDays, EyeOff, FileText, Flag, History, Mail, Phone,
  ShieldCheck, ShieldOff, Star, Trash2, UserCog,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState, Skeleton } from '@/components/ui/States';
import {
  APPLICATION_STATUS_LABELS, APPLICATION_STATUS_STYLES, AUDIT_ACTION_LABELS, AUDIT_ACTION_STYLES,
  JOB_STATUS_LABELS, JOB_STATUS_STYLES,
} from '@/lib/constants';
import { formatDate, formatMonthYear, pluralize, timeAgo } from '@/lib/format';
import type { AdminUserDetail, Application, AuditLogEntry, Job, User } from '@/types';
import { RoleBadge, SelfBadge, UserStatusBadge, VerifiedBadge } from './UserBadges';
import type { UserActionKind } from './useUserActions';

const linkClass = 'inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:text-primary-800 whitespace-nowrap';

export function UserHeaderCard({ user, isSelf, busy, onAction }: {
  user: User;
  isSelf: boolean;
  busy: boolean;
  onAction: (kind: UserActionKind, user: User) => void;
}) {
  const suspended = user.enabled === false;
  const selfTitle = isSelf ? 'This is you. You can’t change your own account here.' : undefined;

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row gap-5">
        <Avatar name={user.fullName} src={user.avatarUrl} size="xl" className="self-start" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 break-words min-w-0">{user.fullName}</h1>
            {isSelf && <SelfBadge />}
          </div>
          {user.headline && <p className="mt-0.5 text-sm text-slate-600">{user.headline}</p>}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <RoleBadge role={user.role} />
            {user.role === 'RECRUITER' && <VerifiedBadge verified={user.verified} />}
            <UserStatusBadge enabled={user.enabled} />
            {user.role === 'CANDIDATE' && user.openToWork && (
              <Badge tone="bg-emerald-50 text-emerald-700 ring-emerald-600/20">Open to work</Badge>
            )}
          </div>
          <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm text-slate-600 sm:grid-cols-2">
            <div className="flex items-center gap-2 min-w-0">
              <dt className="flex-shrink-0"><Mail className="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden /><span className="sr-only">Email</span></dt>
              <dd className="min-w-0 truncate">
                <a href={`mailto:${user.email}`} className="hover:text-primary-700">{user.email}</a>
                {!user.emailVerified && <span className="ml-1.5 text-xs text-amber-700">(email not confirmed)</span>}
              </dd>
            </div>
            {user.phone && (
              <div className="flex items-center gap-2 min-w-0">
                <dt className="flex-shrink-0"><Phone className="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden /><span className="sr-only">Phone</span></dt>
                <dd className="truncate"><a href={`tel:${user.phone}`} className="hover:text-primary-700">{user.phone}</a></dd>
              </div>
            )}
            <div className="flex items-center gap-2">
              <dt className="flex-shrink-0"><CalendarDays className="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden /><span className="sr-only">Member since</span></dt>
              <dd>Member since {formatMonthYear(user.createdAt)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-5 pt-5 border-t border-slate-100">
        <div className="flex flex-wrap gap-2">
          {user.role === 'RECRUITER' && (
            user.verified ? (
              <Button variant="secondary" size="sm" disabled={busy} onClick={() => onAction('verify', user)}>
                <BadgeX className="w-4 h-4" aria-hidden /> Remove verification
              </Button>
            ) : (
              <Button variant="primary" size="sm" disabled={busy} onClick={() => onAction('verify', user)}>
                <BadgeCheck className="w-4 h-4" aria-hidden /> Verify recruiter
              </Button>
            )
          )}
          <Button variant="secondary" size="sm" disabled={busy || isSelf} title={selfTitle} onClick={() => onAction('role', user)}>
            <UserCog className="w-4 h-4" aria-hidden /> Change role
          </Button>
          {suspended ? (
            <Button variant="secondary" size="sm" disabled={busy || isSelf} title={selfTitle} onClick={() => onAction('status', user)}>
              <ShieldCheck className="w-4 h-4" aria-hidden /> Restore account
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              disabled={busy || isSelf}
              title={selfTitle}
              onClick={() => onAction('status', user)}
              className="text-rose-700 hover:bg-rose-50"
            >
              <ShieldOff className="w-4 h-4" aria-hidden /> Suspend
            </Button>
          )}
          <Button variant="danger" size="sm" disabled={busy || isSelf} title={selfTitle} onClick={() => onAction('delete', user)}>
            <Trash2 className="w-4 h-4" aria-hidden /> Delete
          </Button>
        </div>
        {isSelf && (
          <p className="mt-2 text-xs text-slate-500">
            This is you. Another administrator has to change your role, suspend or delete your account.
          </p>
        )}
      </div>
    </Card>
  );
}

function StatTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-slate-900 tabular-nums leading-tight">{value.toLocaleString('en-US')}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </Card>
  );
}

export function UserStats({ detail }: { detail: AdminUserDetail }) {
  const { user } = detail;
  const showJobs = user.role === 'RECRUITER' || detail.jobsPosted > 0;
  const showApps = user.role === 'CANDIDATE' || detail.applicationsSubmitted > 0;
  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
      {showJobs && <StatTile icon={Briefcase} label="Jobs posted" value={detail.jobsPosted} />}
      {showApps && <StatTile icon={FileText} label="Applications submitted" value={detail.applicationsSubmitted} />}
      <StatTile icon={Flag} label="Reports filed" value={detail.reportsFiled} />
    </div>
  );
}

export function RecentJobs({ userId, jobs, total }: { userId: string; jobs: Job[]; total: number }) {
  return (
    <Card>
      <CardHeader
        title="Recent jobs"
        description={total > 0 ? `${pluralize(total, 'job')} posted in total` : undefined}
        action={total > 0 ? (
          <Link href={`/admin/jobs?recruiterId=${encodeURIComponent(userId)}`} className={linkClass}>
            View all in Jobs <ArrowRight className="w-3.5 h-3.5" aria-hidden />
          </Link>
        ) : undefined}
      />
      {jobs.length === 0 ? (
        <EmptyState icon={Briefcase} title="No jobs posted yet" className="py-10" />
      ) : (
        <ul className="divide-y divide-slate-100">
          {jobs.map((job) => (
            <li key={job.id} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="min-w-0 flex-1">
                <Link href={`/jobs/${job.id}`} className="text-sm font-medium text-slate-900 hover:text-primary-700 break-words">
                  {job.title}
                </Link>
                <p className="text-xs text-slate-500 mt-0.5">
                  {job.companyName} · Posted {formatDate(job.createdAt)}
                  {typeof job.applicationCount === 'number' && <> · {pluralize(job.applicationCount, 'applicant')}</>}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone={JOB_STATUS_STYLES[job.status]}>{JOB_STATUS_LABELS[job.status]}</Badge>
                {job.hidden && (
                  <Badge tone="bg-amber-50 text-amber-700 ring-amber-600/20">
                    <EyeOff className="w-3 h-3" aria-hidden /> Hidden
                  </Badge>
                )}
                {job.featured && (
                  <Badge tone="bg-indigo-50 text-indigo-700 ring-indigo-600/20">
                    <Star className="w-3 h-3" aria-hidden /> Featured
                  </Badge>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function RecentApplications({ applications, total }: { applications: Application[]; total: number }) {
  return (
    <Card>
      <CardHeader
        title="Recent applications"
        description={total > 0 ? `${pluralize(total, 'application')} submitted in total` : undefined}
      />
      {applications.length === 0 ? (
        <EmptyState icon={FileText} title="No applications yet" className="py-10" />
      ) : (
        <ul className="divide-y divide-slate-100">
          {applications.map((app) => (
            <li key={app.id} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="min-w-0 flex-1">
                <Link href={`/jobs/${app.jobId}`} className="text-sm font-medium text-slate-900 hover:text-primary-700 break-words">
                  {app.jobTitle}
                </Link>
                <p className="text-xs text-slate-500 mt-0.5">{app.companyName} · Applied {formatDate(app.appliedAt)}</p>
              </div>
              <Badge tone={APPLICATION_STATUS_STYLES[app.status]} className="self-start sm:self-auto">
                {APPLICATION_STATUS_LABELS[app.status]}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function ProfileSection({ user }: { user: User }) {
  const skills = user.skills ?? [];
  // Only render http(s) links; never trust user-supplied schemes such as javascript:.
  const links = (user.portfolioLinks ?? []).filter((l) => /^https?:\/\//i.test(l));
  if (!user.bio && skills.length === 0 && links.length === 0) return null;
  return (
    <Card>
      <CardHeader title="Profile" />
      <div className="px-5 py-4 space-y-4">
        {user.bio && (
          <div>
            <h3 className="text-xs font-medium text-slate-500 mb-1">Bio</h3>
            <p className="text-sm text-slate-700 whitespace-pre-line break-words">{user.bio}</p>
          </div>
        )}
        {skills.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-slate-500 mb-1.5">Skills</h3>
            <ul className="flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <li key={s}><Badge>{s}</Badge></li>
              ))}
            </ul>
          </div>
        )}
        {links.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-slate-500 mb-1">Links</h3>
            <ul className="space-y-1">
              {links.map((l) => (
                <li key={l} className="text-sm truncate">
                  <a href={l} target="_blank" rel="noopener noreferrer nofollow" className="text-primary-700 hover:underline">{l}</a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}

export function AdminHistory({ userId, history }: { userId: string; history: AuditLogEntry[] }) {
  return (
    <Card>
      <CardHeader
        title="Admin history"
        description="Moderation actions taken on this account"
        action={
          <Link href={`/admin/audit?targetType=USER&targetId=${encodeURIComponent(userId)}`} className={linkClass}>
            Full audit log <ArrowRight className="w-3.5 h-3.5" aria-hidden />
          </Link>
        }
      />
      {history.length === 0 ? (
        <EmptyState icon={History} title="No admin actions yet" description="Verifications, role changes and suspensions will show here." className="py-10" />
      ) : (
        <ol className="px-5 py-4">
          {history.map((entry, i) => (
            <li key={entry.id} className="relative pl-6 pb-5 last:pb-0">
              {i < history.length - 1 && <span className="absolute left-[5px] top-3 bottom-0 w-px bg-slate-200" aria-hidden />}
              <span className="absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full border-2 border-white bg-slate-300 ring-1 ring-slate-200" aria-hidden />
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Badge tone={AUDIT_ACTION_STYLES[entry.action]}>{AUDIT_ACTION_LABELS[entry.action]}</Badge>
                <time dateTime={entry.createdAt} title={formatDate(entry.createdAt)} className="text-xs text-slate-500">
                  {timeAgo(entry.createdAt)}
                </time>
              </div>
              {entry.details && <p className="mt-1 text-sm text-slate-700 break-words">{entry.details}</p>}
              <p className="mt-0.5 text-xs text-slate-500">
                by {entry.actorName || entry.actorEmail || 'a deleted administrator'}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

export function UserDetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading user">
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-5">
          <Skeleton className="w-24 h-24 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-48 rounded-md" />
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-4 w-64 max-w-full rounded-md" />
          </div>
        </div>
      </Card>
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[74px] rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
