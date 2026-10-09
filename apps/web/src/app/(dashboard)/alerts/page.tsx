'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BellRing, Plus, Search } from 'lucide-react';
import { useDeleteJobAlert, useJobAlerts } from '@/hooks/useCandidate';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button, buttonClasses } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { AlertCard, AlertCardSkeleton } from '@/components/alerts/AlertCard';
import { JobAlertModal } from '@/components/alerts/JobAlertModal';
import { MAX_ALERTS } from '@/components/alerts/alertFilters';
import { getErrorMessage } from '@/lib/format';
import type { JobAlert } from '@/types';

export default function AlertsPage() {
  const user = useAuthStore((s) => s.user);
  const isCandidate = user?.role === 'CANDIDATE';
  const alerts = useJobAlerts(isCandidate);
  const del = useDeleteJobAlert();

  // undefined = closed, null = new alert, JobAlert = editing
  const [editing, setEditing] = useState<JobAlert | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<JobAlert | null>(null);

  if (user && !isCandidate) {
    return (
      <Card>
        <EmptyState icon={BellRing} title="Job alerts are for job seekers" description="Sign in with a candidate account to get notified about new jobs." />
      </Card>
    );
  }

  const list = alerts.data ?? [];
  const atLimit = list.length >= MAX_ALERTS;

  const confirmDelete = () => {
    if (!deleting) return;
    del.mutate(deleting.id, {
      onSuccess: () => {
        toast.success('Alert deleted', `“${deleting.name}”`);
        setDeleting(null);
      },
      onError: (err) => toast.error('Could not delete alert', getErrorMessage(err)),
    });
  };

  const newButton = (
    <span title={atLimit ? `You can have up to ${MAX_ALERTS} alerts. Delete one to add another.` : undefined} className="inline-flex">
      <Button onClick={() => setEditing(null)} disabled={atLimit || alerts.isLoading}>
        <Plus className="w-4 h-4" aria-hidden /> New alert
      </Button>
    </span>
  );

  return (
    <div>
      <PageHeader
        title="Job alerts"
        description="Get notified when new jobs match the searches you care about."
        actions={list.length > 0 ? newButton : undefined}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {alerts.isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <AlertCardSkeleton key={i} />)
          ) : alerts.isError ? (
            <Card>
              <ErrorState title="We couldn't load your alerts" error={alerts.error} onRetry={() => alerts.refetch()} retrying={alerts.isRefetching} />
            </Card>
          ) : list.length === 0 ? (
            <Card>
              <EmptyState
                icon={BellRing}
                title="No job alerts yet"
                description="Save a search and we'll notify you when new matching jobs are posted, either right away or in a daily digest."
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Link href="/jobs" className={buttonClasses('secondary', 'sm')}>
                      <Search className="w-3.5 h-3.5" aria-hidden /> Search jobs
                    </Link>
                    <Button size="sm" onClick={() => setEditing(null)}>
                      <Plus className="w-3.5 h-3.5" aria-hidden /> New alert
                    </Button>
                  </div>
                }
              />
            </Card>
          ) : (
            <>
              {list.map((a) => (
                <AlertCard key={a.id} alert={a} onEdit={() => setEditing(a)} onDelete={() => setDeleting(a)} />
              ))}
              <p className="text-xs text-fg-muted px-1">
                {list.length} of {MAX_ALERTS} alerts used. Up to {MAX_ALERTS} alerts.
              </p>
            </>
          )}
        </div>

        <aside aria-labelledby="how-alerts-work">
          <Card className="p-5 lg:sticky lg:top-24">
            <h2 id="how-alerts-work" className="text-sm font-semibold text-fg">How alerts work</h2>
            <ul className="mt-3 space-y-2.5 text-sm text-fg-tertiary list-disc pl-4 marker:text-fg-faint">
              <li>When a newly published job matches an alert, we&apos;ll notify you in the app, and by email if email is turned on for that alert.</li>
              <li><span className="font-medium text-fg-secondary">Instant</span> alerts notify you as soon as a job is posted. <span className="font-medium text-fg-secondary">Daily</span> alerts send one digest at 8:00 UTC.</li>
              <li>Every alert email has a one-click unsubscribe link. You can also pause an alert here at any time.</li>
              <li>You can have up to {MAX_ALERTS} alerts. Each needs at least one filter.</li>
            </ul>
          </Card>
        </aside>
      </div>

      <JobAlertModal open={editing !== undefined} onClose={() => setEditing(undefined)} alert={editing ?? undefined} showManageLink={false} />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete this alert?"
        description={deleting ? `You'll stop getting notifications for “${deleting.name}”. This can't be undone.` : undefined}
        confirmLabel="Delete alert"
        loading={del.isPending}
      />
    </div>
  );
}
