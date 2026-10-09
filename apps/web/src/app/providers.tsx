'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { Toaster } from '@/components/ui/Toaster';
import { ThemeSync } from '@/components/ui/ThemeToggle';
import { ServerWakeNotice } from '@/components/layout/ServerWakeNotice';
import { isTransientError } from '@/lib/axios';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            // Retry only errors that can heal on their own (server waking up, network blips), with backoff.
            retry: (failureCount, error) => isTransientError(error) && failureCount < 4,
            retryDelay: (attempt) => Math.min(1500 * 2 ** attempt, 15_000),
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
      <ThemeSync />
      <ServerWakeNotice />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
