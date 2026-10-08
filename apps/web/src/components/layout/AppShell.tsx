'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStream } from '@/hooks/useNotifications';
import { Spinner } from '@/components/ui/States';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { isPublicPath } from './nav';
import { AnnouncementBanner } from './AnnouncementBanner';

/** True once the persisted auth store has been read from localStorage. */
function useAuthHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useAuthStore.persist.hasHydrated());
    return unsub;
  }, []);
  return hydrated;
}

/** Live notification updates for the whole signed-in session (keeps the unread badge fresh). */
function NotificationStream() {
  useNotificationStream();
  return null;
}

function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas" role="status">
      <Spinner className="w-8 h-8" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/**
 * Dashboard chrome + auth guard. Signed-out visitors may browse /jobs and /jobs/{id};
 * every other route redirects to /login once the persisted session has been checked.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const hydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated && !!s.user);
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = isPublicPath(pathname);
  const mustRedirect = hydrated && !isAuthenticated && !isPublic;

  useEffect(() => {
    if (mustRedirect) router.replace('/login');
  }, [mustRedirect, router]);

  if (!hydrated || mustRedirect) return <FullPageSpinner />;

  const guest = !isAuthenticated;

  return (
    <div className="min-h-screen bg-canvas">
      {!guest && <NotificationStream />}
      <Sidebar guest={guest} />
      <div className="lg:pl-64">
        <Navbar guest={guest} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-24 sm:pt-8 lg:pb-10">
          <AnnouncementBanner className="mb-6" />
          {children}
        </main>
      </div>
    </div>
  );
}
