'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { Archive, Bell, Briefcase, Check, CheckCheck, Info, RefreshCw, Settings, UserPlus } from 'lucide-react';
import { useMarkAllRead, useMarkRead, useNotifications } from '@/hooks/useNotifications';
import { useAuthStore } from '@/store/authStore';
import { Button, buttonClasses } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { APPLICATION_STATUS_LABELS } from '@/lib/constants';
import { formatDate, getErrorMessage, timeAgo } from '@/lib/format';
import { cn } from '@/lib/cn';
import { toast } from '@/store/toastStore';
import type { ApplicationStatus, Notification, NotificationType, Role } from '@/types';

const TYPE_ICONS: Record<NotificationType, { icon: LucideIcon; tone: string }> = {
  APPLICATION_RECEIVED: { icon: UserPlus, tone: 'bg-primary-50 text-primary-600' },
  APPLICATION_STATUS_CHANGED: { icon: RefreshCw, tone: 'bg-sky-50 text-sky-600' },
  JOB_POSTED: { icon: Briefcase, tone: 'bg-emerald-50 text-emerald-600' },
  JOB_CLOSED: { icon: Archive, tone: 'bg-slate-100 text-slate-600' },
  GENERAL: { icon: Info, tone: 'bg-slate-100 text-slate-600' },
};

/**
 * Where a notification leads. Backend semantics (NotificationService):
 * - APPLICATION_RECEIVED → recruiter, referenceId = application id (no job id), so open "My jobs".
 * - APPLICATION_STATUS_CHANGED → candidate, referenceId = application id → their applications list.
 * - JOB_* with referenceType JOB → the job page.
 */
function targetFor(n: Notification, role?: Role): { href: string; label: string } | null {
  if (n.referenceType === 'JOB' && n.referenceId) return { href: `/jobs/${n.referenceId}`, label: 'View job' };
  if (n.referenceType === 'APPLICATION' || n.type === 'APPLICATION_RECEIVED' || n.type === 'APPLICATION_STATUS_CHANGED') {
    if (role === 'CANDIDATE') return { href: '/applications', label: 'View applications' };
    if (role === 'RECRUITER' || role === 'ADMIN') return { href: '/jobs/my', label: 'Review applicants' };
  }
  return null;
}

/** The API embeds raw status enums in messages ("…is now SHORTLISTED"); show the friendly label. */
function humanize(message: string) {
  return message.replace(/\b(PENDING|REVIEWING|SHORTLISTED|INTERVIEWED|OFFERED|REJECTED|WITHDRAWN)\b/g, (s) =>
    APPLICATION_STATUS_LABELS[s as ApplicationStatus].toLowerCase()
  );
}

function NotificationItem({ n, role }: { n: Notification; role?: Role }) {
  const router = useRouter();
  const markRead = useMarkRead();
  const target = targetFor(n, role);
  const { icon: Icon, tone } = TYPE_ICONS[n.type] ?? TYPE_ICONS.GENERAL;

  function markAsRead() {
    if (n.read) return;
    markRead.mutate(n.id, { onError: (err) => toast.error("Couldn't mark as read", getErrorMessage(err)) });
  }

  function open() {
    markAsRead();
    if (target) router.push(target.href);
  }

  return (
    <li className={cn('relative flex gap-3 sm:gap-4 px-4 sm:px-5 py-4 transition-colors', !n.read && 'bg-primary-50/40', target && 'hover:bg-slate-50')}>
      <span className={cn('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0', tone)}>
        <Icon className="w-4 h-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          {target ? (
            <button
              type="button"
              onClick={open}
              className="text-left text-sm font-semibold text-slate-900 hover:text-primary-700 focus:outline-none focus-visible:underline after:absolute after:inset-0"
            >
              {n.title}
            </button>
          ) : (
            <p className="text-sm font-semibold text-slate-900">{n.title}</p>
          )}
          {!n.read && (
            <>
              <span className="mt-1.5 w-2 h-2 rounded-full bg-primary-600 flex-shrink-0" aria-hidden />
              <span className="sr-only">Unread</span>
            </>
          )}
        </div>
        <p className="mt-0.5 text-sm text-slate-600 break-words">{humanize(n.message)}</p>
        <p className="mt-1.5 text-xs text-slate-500">
          <time dateTime={n.createdAt} title={formatDate(n.createdAt)}>{timeAgo(n.createdAt)}</time>
          {target && <span className="text-primary-600 font-medium"> · {target.label}</span>}
        </p>
      </div>
      {!n.read && (
        <button
          type="button"
          onClick={markAsRead}
          disabled={markRead.isPending}
          aria-label={`Mark "${n.title}" as read`}
          title="Mark as read"
          className="relative z-10 self-start p-2 -m-1 rounded-lg text-slate-400 hover:text-primary-700 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50"
        >
          <Check className="w-4 h-4" aria-hidden />
        </button>
      )}
    </li>
  );
}

export default function NotificationsPage() {
  const role = useAuthStore((s) => s.user?.role);
  const { data, isLoading, isError, error, refetch, isRefetching } = useNotifications();
  const markAll = useMarkAllRead();

  const items = data?.content ?? [];
  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Notifications"
        description={unread > 0 ? `You have ${unread} unread notification${unread === 1 ? '' : 's'}.` : 'Updates about your jobs and applications.'}
        actions={
          <>
            {unread > 0 && (
              <Button
                variant="secondary"
                size="sm"
                loading={markAll.isPending}
                onClick={() =>
                  markAll.mutate(undefined, {
                    onSuccess: () => toast.success('All notifications marked as read'),
                    onError: (err) => toast.error("Couldn't update notifications", getErrorMessage(err)),
                  })
                }
              >
                {!markAll.isPending && <CheckCheck className="w-4 h-4" aria-hidden />} Mark all as read
              </Button>
            )}
            <Link href="/notifications/preferences" className={buttonClasses('ghost', 'sm')}>
              <Settings className="w-4 h-4" aria-hidden /> Settings
            </Link>
          </>
        }
      />

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-5 py-4">
                <Skeleton className="w-9 h-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <ErrorState title="Couldn't load notifications" error={error} onRetry={() => refetch()} retrying={isRefetching} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="You're all caught up"
            description={
              role === 'RECRUITER'
                ? "We'll let you know when candidates apply to your jobs."
                : role === 'CANDIDATE'
                  ? "We'll let you know when recruiters update your applications."
                  : 'New notifications will appear here.'
            }
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((n) => <NotificationItem key={n.id} n={n} role={role} />)}
          </ul>
        )}
      </Card>
      {data && data.totalElements > items.length && (
        <p className="mt-3 text-xs text-slate-500">Showing your {items.length} most recent notifications.</p>
      )}
    </div>
  );
}
