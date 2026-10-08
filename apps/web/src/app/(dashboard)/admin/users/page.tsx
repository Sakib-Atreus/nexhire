'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, Users, X } from 'lucide-react';
import { useAdminUsers, type AdminUserFilters } from '@/hooks/useAdmin';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormField, Input, Select } from '@/components/ui/Field';
import { PageHeader } from '@/components/ui/PageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { ROLES } from '@/components/admin/users/UserBadges';
import { UsersCards, UsersListSkeleton, UsersTable } from '@/components/admin/users/UsersList';
import { useUserActions } from '@/components/admin/users/useUserActions';
import { ROLE_LABELS } from '@/lib/constants';
import { pluralize } from '@/lib/format';
import type { Role } from '@/types';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

type FilterKey = 'q' | 'role' | 'status' | 'verified' | 'page';

/** Parse and validate filters from the URL so hand-edited links can't send junk to the API. */
function readFilters(params: URLSearchParams) {
  const role = params.get('role');
  const status = params.get('status');
  const verified = params.get('verified');
  const page = Number(params.get('page'));
  return {
    q: params.get('q')?.trim() ?? '',
    role: ROLES.includes(role as Role) ? (role as Role) : undefined,
    status: status === 'active' || status === 'suspended' ? status : undefined,
    verified: verified === 'true' ? true : verified === 'false' ? false : undefined,
    // URL page is 1-based for humans; the API is 0-based.
    page: Number.isInteger(page) && page > 1 ? page - 1 : 0,
  } satisfies AdminUserFilters & { q: string; page: number };
}

function AdminUsersView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const filters = useMemo(() => readFilters(new URLSearchParams(searchParams.toString())), [searchParams]);
  const [search, setSearch] = useState(filters.q);

  const updateParams = useCallback((changes: Partial<Record<FilterKey, string | undefined>>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    // Any filter change starts from the first page.
    if (!('page' in changes)) next.delete('page');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  // Keep the box in sync when the URL changes from elsewhere (back button, "Clear filters", links).
  useEffect(() => { setSearch((s) => (s.trim() === filters.q ? s : filters.q)); }, [filters.q]);

  // Debounced push of the search box into the URL.
  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed === filters.q) return;
    const t = setTimeout(() => updateParams({ q: trimmed || undefined }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search, filters.q, updateParams]);

  const { data, isLoading, isError, error, refetch, isRefetching, isPlaceholderData } = useAdminUsers({
    q: filters.q || undefined,
    role: filters.role,
    status: filters.status,
    verified: filters.verified,
    page: filters.page,
    size: PAGE_SIZE,
  });

  // If the current page disappeared (e.g. after deleting the last user on it), step back.
  useEffect(() => {
    if (data && data.totalPages > 0 && filters.page > data.totalPages - 1) {
      updateParams({ page: data.totalPages > 1 ? String(data.totalPages) : undefined });
    }
  }, [data, filters.page, updateParams]);

  const { request, dialogs, busyId } = useUserActions();

  const filtering = !!filters.q || !!filters.role || !!filters.status || filters.verified !== undefined;
  const clearFilters = () => {
    setSearch('');
    router.replace(pathname, { scroll: false });
  };

  const verifiedWithoutRecruiter = filters.verified !== undefined && filters.role !== 'RECRUITER';

  return (
    <div>
      <PageHeader
        title="Users"
        description="Search accounts, verify recruiters, change roles and suspend or remove access."
      />

      <Card>
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
            <FormField label="Search" className="sm:col-span-2 lg:col-span-1">
              {(id) => (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden />
                  <Input
                    id={id}
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Name or email"
                    className="pl-9"
                    autoComplete="off"
                  />
                </div>
              )}
            </FormField>
            <FormField label="Role">
              {(id) => (
                <Select id={id} value={filters.role ?? ''} onChange={(e) => updateParams({ role: e.target.value || undefined })}>
                  <option value="">All roles</option>
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </Select>
              )}
            </FormField>
            <FormField label="Status">
              {(id) => (
                <Select id={id} value={filters.status ?? ''} onChange={(e) => updateParams({ status: e.target.value || undefined })}>
                  <option value="">All statuses</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </Select>
              )}
            </FormField>
            <FormField label="Verification">
              {(id) => (
                <Select
                  id={id}
                  value={filters.verified === undefined ? '' : String(filters.verified)}
                  onChange={(e) => updateParams({ verified: e.target.value || undefined })}
                >
                  <option value="">Any</option>
                  <option value="true">Verified</option>
                  <option value="false">Not verified</option>
                </Select>
              )}
            </FormField>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 min-h-[2rem]">
            <p className="text-sm text-slate-500" aria-live="polite">
              {data ? (
                <>
                  {pluralize(data.totalElements, filtering ? 'matching user' : 'user')}
                  {verifiedWithoutRecruiter && (
                    <span className="block sm:inline sm:ml-2 text-xs text-slate-400">
                      Showing recruiters only — verification applies to recruiters.
                    </span>
                  )}
                </>
              ) : ' '}
            </p>
            {filtering && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-3.5 h-3.5" aria-hidden />
                Clear filters
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <UsersListSkeleton />
        ) : isError ? (
          <ErrorState title="Couldn't load users" error={error} onRetry={() => refetch()} retrying={isRefetching} />
        ) : !data || data.content.length === 0 ? (
          <EmptyState
            icon={Users}
            title={filtering ? 'No users match these filters' : 'No users yet'}
            description={filtering ? 'Try a different name or email, or clear the filters to see everyone.' : 'Accounts will appear here as people sign up.'}
            action={filtering ? <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button> : undefined}
          />
        ) : (
          <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : 'transition-opacity'} aria-busy={isPlaceholderData || undefined}>
            <UsersTable users={data.content} currentUserId={currentUserId} busyId={busyId} onAction={request} />
            <UsersCards users={data.content} currentUserId={currentUserId} busyId={busyId} onAction={request} />
          </div>
        )}
      </Card>

      {data && (
        <Pagination
          page={filters.page}
          totalPages={data.totalPages}
          onChange={(p) => {
            updateParams({ page: p > 0 ? String(p + 1) : undefined });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {dialogs}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<Card><UsersListSkeleton /></Card>}>
      <AdminUsersView />
    </Suspense>
  );
}
