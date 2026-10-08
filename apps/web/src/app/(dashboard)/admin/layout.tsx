'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Spinner } from '@/components/ui/States';

/**
 * Admin-only section. AppShell has already hydrated the session and sent signed-out
 * visitors to /login; here we send any other role back to their dashboard.
 * (The API enforces this too — this just avoids rendering pages that would 403.)
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);
  const isAdmin = role === 'ADMIN';

  useEffect(() => {
    if (role && !isAdmin) router.replace('/dashboard');
  }, [role, isAdmin, router]);

  if (!isAdmin) {
    return (
      <div className="flex justify-center py-24" role="status" aria-label="Checking access">
        <Spinner className="w-6 h-6" />
      </div>
    );
  }
  return <>{children}</>;
}
