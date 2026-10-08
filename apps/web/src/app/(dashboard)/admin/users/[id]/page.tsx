'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ArrowLeft, UserX } from 'lucide-react';
import { useAdminUser } from '@/hooks/useAdmin';
import { useAuthStore } from '@/store/authStore';
import { buttonClasses } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorState } from '@/components/ui/States';
import {
  AdminHistory, ProfileSection, RecentApplications, RecentJobs, UserDetailSkeleton, UserHeaderCard, UserStats,
} from '@/components/admin/users/UserDetailSections';
import { useUserActions } from '@/components/admin/users/useUserActions';

function BackLink() {
  return (
    <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg mb-4">
      <ArrowLeft className="w-4 h-4" aria-hidden /> All users
    </Link>
  );
}

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { data, isLoading, isError, error, refetch, isRefetching } = useAdminUser(id);
  // After a delete the detail query 404s while we navigate away; don't flash "User not found".
  const [deleted, setDeleted] = useState(false);
  const { request, dialogs, busyId } = useUserActions({
    onDeleted: () => { setDeleted(true); router.replace('/admin/users'); },
  });

  if (isLoading || deleted) {
    return (
      <div>
        <BackLink />
        <UserDetailSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    const notFound = axios.isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 400);
    return (
      <div>
        <BackLink />
        <Card>
          {notFound ? (
            <EmptyState
              icon={UserX}
              title="User not found"
              description="This account may have been deleted, or the link is incorrect."
              action={<Link href="/admin/users" className={buttonClasses('secondary', 'sm')}>Back to users</Link>}
            />
          ) : (
            <ErrorState title="Couldn't load this user" error={error} onRetry={() => refetch()} retrying={isRefetching} />
          )}
        </Card>
      </div>
    );
  }

  const { user } = data;
  const isSelf = user.id === currentUserId;
  const showJobs = user.role === 'RECRUITER' || data.recentJobs.length > 0;
  const showApps = user.role === 'CANDIDATE' || data.recentApplications.length > 0;

  return (
    <div>
      <BackLink />
      <div className="space-y-6">
        <UserHeaderCard user={user} isSelf={isSelf} busy={busyId === user.id} onAction={request} />
        <UserStats detail={data} />

        <div className="grid gap-6 lg:grid-cols-3 items-start">
          {showJobs || showApps ? (
            <>
              <div className="space-y-6 lg:col-span-2 min-w-0">
                {showJobs && <RecentJobs userId={user.id} jobs={data.recentJobs} total={data.jobsPosted} />}
                {showApps && <RecentApplications applications={data.recentApplications} total={data.applicationsSubmitted} />}
                <ProfileSection user={user} />
              </div>
              <div className="min-w-0">
                <AdminHistory userId={user.id} history={data.history} />
              </div>
            </>
          ) : (
            // Administrators have no jobs or applications: give the history the main column.
            <div className="space-y-6 lg:col-span-2 min-w-0">
              <AdminHistory userId={user.id} history={data.history} />
              <ProfileSection user={user} />
            </div>
          )}
        </div>
      </div>

      {dialogs}
    </div>
  );
}
