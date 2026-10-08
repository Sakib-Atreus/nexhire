'use client';

import { useEffect } from 'react';
import { usePublicSettings } from '@/hooks/useSettings';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { AnnouncementSettingsCard } from '@/components/admin/settings/AnnouncementSettingsCard';
import { CategoriesSettingsCard } from '@/components/admin/settings/CategoriesSettingsCard';
import { SkillsSettingsCard } from '@/components/admin/settings/SkillsSettingsCard';

function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <Card>
      <div className="px-5 py-4 border-b border-slate-100 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-64 max-w-full" />
      </div>
      <div className="p-5 space-y-3">
        {Array.from({ length: lines }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    </Card>
  );
}

export default function AdminSettingsPage() {
  const { data, isLoading, isError, error, refetch, isRefetching } = usePublicSettings();

  // Public settings are cached for 5 minutes; admins should edit the latest values.
  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <div>
      <PageHeader
        title="Site settings"
        description="Announcement banner, job categories and skill suggestions. Changes apply to everyone and are recorded in the audit log."
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:items-start" aria-busy="true" aria-label="Loading settings">
          <div className="space-y-6">
            <CardSkeleton lines={4} />
            <CardSkeleton lines={2} />
          </div>
          <CardSkeleton />
        </div>
      ) : isError || !data ? (
        <Card>
          <ErrorState title="We couldn't load site settings" error={error} onRetry={() => refetch()} retrying={isRefetching} />
        </Card>
      ) : (
        // Two columns on wide screens: banner + skills on the left, the (long) category list on the right.
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:items-start">
          <div className="min-w-0 space-y-6">
            <AnnouncementSettingsCard saved={data.announcement} />
            <SkillsSettingsCard saved={data.skills ?? []} />
          </div>
          <div className="min-w-0">
            <CategoriesSettingsCard saved={data.categories ?? []} />
          </div>
        </div>
      )}
    </div>
  );
}
