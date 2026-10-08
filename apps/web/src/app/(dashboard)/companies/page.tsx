'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Building2, Search, X } from 'lucide-react';
import { useCompanies } from '@/hooks/useCompanies';
import { pluralize } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Field';
import { PageHeader } from '@/components/ui/PageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { CompanyCard, CompanyCardSkeleton } from '@/components/companies/CompanyCard';

const PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 350;

function readParams(params: URLSearchParams) {
  const page = Number(params.get('page'));
  return {
    q: params.get('q')?.trim() ?? '',
    // URL page is 1-based for humans; the API is 0-based.
    page: Number.isInteger(page) && page > 1 ? page - 1 : 0,
  };
}

function CompanyGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading companies">
      {Array.from({ length: 6 }, (_, i) => <CompanyCardSkeleton key={i} />)}
    </div>
  );
}

function CompaniesView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { q, page } = useMemo(() => readParams(new URLSearchParams(searchParams.toString())), [searchParams]);
  const [search, setSearch] = useState(q);

  const updateParams = useCallback((changes: { q?: string; page?: string }) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (!('page' in changes)) next.delete('page');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  // Keep the box in sync when the URL changes elsewhere (back button, clear).
  useEffect(() => { setSearch((s) => (s.trim() === q ? s : q)); }, [q]);

  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed === q) return;
    const t = setTimeout(() => updateParams({ q: trimmed || undefined }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search, q, updateParams]);

  const { data, isLoading, isError, error, refetch, isRefetching, isPlaceholderData } = useCompanies(q || undefined, page, PAGE_SIZE);

  const clear = () => {
    setSearch('');
    router.replace(pathname, { scroll: false });
  };

  return (
    <div>
      <PageHeader
        title="Companies"
        description="Explore the teams hiring on NexHire. Verified companies are listed first."
      />

      <Card className="p-4 mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <label htmlFor="company-search" className="sr-only">Search companies</label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden />
            <Input
              id="company-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by company name or industry"
              className="pl-9"
              autoComplete="off"
            />
          </div>
          <p className="text-sm text-slate-500 sm:whitespace-nowrap" aria-live="polite">
            {data ? pluralize(data.totalElements, q ? 'matching company' : 'company', q ? 'matching companies' : 'companies') : ' '}
          </p>
        </div>
      </Card>

      {isLoading ? (
        <CompanyGridSkeleton />
      ) : isError ? (
        <Card>
          <ErrorState title="Couldn't load companies" error={error} onRetry={() => refetch()} retrying={isRefetching} />
        </Card>
      ) : !data || data.content.length === 0 ? (
        <Card>
          <EmptyState
            icon={Building2}
            title={q ? `No companies match "${q}"` : 'No companies yet'}
            description={q ? 'Try a different name or industry.' : 'Companies will appear here as recruiters set up their teams.'}
            action={q ? (
              <Button variant="secondary" size="sm" onClick={clear}>
                <X className="w-3.5 h-3.5" aria-hidden /> Clear search
              </Button>
            ) : undefined}
          />
        </Card>
      ) : (
        <div
          className={isPlaceholderData ? 'opacity-60 transition-opacity' : 'transition-opacity'}
          aria-busy={isPlaceholderData || undefined}
        >
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.content.map((c) => (
              <li key={c.id} className="min-w-0">
                <CompanyCard company={c} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {data && (
        <Pagination
          page={page}
          totalPages={data.totalPages}
          onChange={(p) => {
            updateParams({ page: p > 0 ? String(p + 1) : undefined });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}
    </div>
  );
}

export default function CompaniesPage() {
  return (
    <Suspense
      fallback={
        <div>
          <Skeleton className="h-8 w-48 mb-6" />
          <CompanyGridSkeleton />
        </div>
      }
    >
      <CompaniesView />
    </Suspense>
  );
}
