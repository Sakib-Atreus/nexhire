'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { BadgeCheck, Building2, Search, ShieldOff, X } from 'lucide-react';
import { useAdminCompanies, useSetCompanyVerified } from '@/hooks/useAdmin';
import { cn } from '@/lib/cn';
import { formatDate, getErrorMessage, pluralize } from '@/lib/format';
import { toast } from '@/store/toastStore';
import type { Company } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CompanyLogo } from '@/components/ui/CompanyLogo';
import { FormField, Input, Select } from '@/components/ui/Field';
import { ConfirmDialog } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { VerifiedBadge, companySizeLabel } from '@/components/companies/VerifiedBadge';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

type FilterKey = 'q' | 'verified' | 'page' | 'id';

function readFilters(params: URLSearchParams) {
  const verified = params.get('verified');
  const page = Number(params.get('page'));
  return {
    q: params.get('q')?.trim() ?? '',
    verified: verified === 'true' ? true : verified === 'false' ? false : undefined,
    page: Number.isInteger(page) && page > 1 ? page - 1 : 0,
    // From audit-log links: highlight this company if it's on the current page.
    id: params.get('id') ?? undefined,
  };
}

function StatusBadge({ verified }: { verified: boolean }) {
  return verified
    ? <VerifiedBadge />
    : <Badge>Not verified</Badge>;
}

function VerifyButton({ company, busy, onClick, className }: {
  company: Company; busy: boolean; onClick: () => void; className?: string;
}) {
  return company.verified ? (
    <Button size="sm" variant="secondary" onClick={onClick} loading={busy} className={className}>
      {!busy && <ShieldOff className="w-3.5 h-3.5" aria-hidden />} Remove verification
    </Button>
  ) : (
    <Button size="sm" variant="success" onClick={onClick} loading={busy} className={className}>
      {!busy && <BadgeCheck className="w-3.5 h-3.5" aria-hidden />} Verify
    </Button>
  );
}

function CompanyName({ company }: { company: Company }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <CompanyLogo name={company.name} src={company.logoUrl} size="sm" />
      <div className="min-w-0">
        <Link href={`/companies/${company.slug}`} className="block truncate font-medium text-slate-900 hover:text-primary-700 hover:underline">
          {company.name}
        </Link>
        {company.website && <p className="truncate text-xs text-slate-500">{company.website.replace(/^https?:\/\/(www\.)?/, '')}</p>}
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="divide-y divide-slate-100" aria-busy="true" aria-label="Loading companies">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-4">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="hidden md:block h-8 w-24" />
        </div>
      ))}
    </div>
  );
}

function AdminCompaniesView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(() => readFilters(new URLSearchParams(searchParams.toString())), [searchParams]);
  const [search, setSearch] = useState(filters.q);
  const [pending, setPending] = useState<Company | null>(null);
  const setVerified = useSetCompanyVerified();

  const updateParams = useCallback((changes: Partial<Record<FilterKey, string | undefined>>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (!('page' in changes)) next.delete('page');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => { setSearch((s) => (s.trim() === filters.q ? s : filters.q)); }, [filters.q]);

  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed === filters.q) return;
    const t = setTimeout(() => updateParams({ q: trimmed || undefined }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search, filters.q, updateParams]);

  const { data, isLoading, isError, error, refetch, isRefetching, isPlaceholderData } = useAdminCompanies({
    q: filters.q || undefined,
    verified: filters.verified,
    page: filters.page,
    size: PAGE_SIZE,
  });

  useEffect(() => {
    if (data && data.totalPages > 0 && filters.page > data.totalPages - 1) {
      updateParams({ page: data.totalPages > 1 ? String(data.totalPages) : undefined });
    }
  }, [data, filters.page, updateParams]);

  // Scroll a highlighted company (from ?id=) into view once it's rendered.
  const highlightId = filters.id;
  const highlightOnPage = !!highlightId && !!data?.content.some((c) => c.id === highlightId);
  useEffect(() => {
    if (!highlightOnPage || !highlightId) return;
    // Both the table row and the mobile card exist; scroll to whichever is visible.
    const el = Array.from(document.querySelectorAll<HTMLElement>(`[data-company-id="${CSS.escape(highlightId)}"]`))
      .find((node) => node.offsetParent !== null);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightOnPage, highlightId]);

  const filtering = !!filters.q || filters.verified !== undefined;
  const clearFilters = () => {
    setSearch('');
    router.replace(pathname, { scroll: false });
  };

  const confirmToggle = () => {
    if (!pending) return;
    const verified = !pending.verified;
    setVerified.mutate({ id: pending.id, verified }, {
      onSuccess: () => {
        toast.success(
          verified ? 'Company verified' : 'Verification removed',
          verified ? `${pending.name} now shows a verified badge on its profile and jobs.` : `${pending.name} no longer shows a verified badge.`
        );
        setPending(null);
      },
      onError: (err) => toast.error('Could not update verification', getErrorMessage(err)),
    });
  };

  const busyId = setVerified.isPending ? setVerified.variables?.id : undefined;
  const rowTone = (c: Company) => (c.id === highlightId ? 'bg-primary-50/70' : '');

  return (
    <div>
      <PageHeader
        title="Companies"
        description="Review company profiles and manage verification. Verified companies get a badge on their profile and every job they post."
      />

      <Card>
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
            <FormField label="Search">
              {(id) => (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden />
                  <Input
                    id={id}
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Company name or industry"
                    className="pl-9"
                    autoComplete="off"
                  />
                </div>
              )}
            </FormField>
            <FormField label="Verification">
              {(id) => (
                <Select
                  id={id}
                  value={filters.verified === undefined ? '' : String(filters.verified)}
                  onChange={(e) => updateParams({ verified: e.target.value || undefined })}
                >
                  <option value="">All</option>
                  <option value="true">Verified</option>
                  <option value="false">Not verified</option>
                </Select>
              )}
            </FormField>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 min-h-[2rem]">
            <p className="text-sm text-slate-500" aria-live="polite">
              {data ? pluralize(data.totalElements, filtering ? 'matching company' : 'company', filtering ? 'matching companies' : 'companies') : ' '}
            </p>
            {filtering && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-3.5 h-3.5" aria-hidden /> Clear filters
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <ListSkeleton />
        ) : isError ? (
          <ErrorState title="Couldn't load companies" error={error} onRetry={() => refetch()} retrying={isRefetching} />
        ) : !data || data.content.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={filtering ? 'No companies match these filters' : 'No companies yet'}
            description={filtering ? 'Try a different search or clear the filters.' : 'Companies appear here once recruiters create them.'}
            action={filtering ? <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button> : undefined}
          />
        ) : (
          <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : 'transition-opacity'} aria-busy={isPlaceholderData || undefined}>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3">Company</th>
                    <th scope="col" className="px-4 py-3">Industry</th>
                    <th scope="col" className="px-4 py-3">Size</th>
                    <th scope="col" className="px-4 py-3 text-right">Members</th>
                    <th scope="col" className="px-4 py-3 text-right">Open jobs</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3">Created</th>
                    <th scope="col" className="px-4 py-3 text-right"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.content.map((c) => (
                    <tr key={c.id} data-company-id={c.id} className={cn('align-middle', rowTone(c))} aria-current={c.id === highlightId ? 'true' : undefined}>
                      <td className="px-4 py-3 max-w-[18rem]"><CompanyName company={c} /></td>
                      <td className="px-4 py-3 text-slate-600">{c.industry || <span className="text-slate-400">—</span>}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{companySizeLabel(c.size) ?? <span className="text-slate-400">—</span>}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">{c.members}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">{c.openJobs}</td>
                      <td className="px-4 py-3"><StatusBadge verified={c.verified} /></td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(c.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <VerifyButton company={c} busy={busyId === c.id} onClick={() => setPending(c)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / tablet cards */}
            <ul className="lg:hidden divide-y divide-slate-100">
              {data.content.map((c) => (
                <li key={c.id} data-company-id={c.id} className={cn('px-4 py-4 space-y-3', rowTone(c))}>
                  <div className="flex items-start justify-between gap-3">
                    <CompanyName company={c} />
                    <StatusBadge verified={c.verified} />
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    <div><dt className="text-slate-500">Industry</dt><dd className="text-slate-800 break-words">{c.industry || '—'}</dd></div>
                    <div><dt className="text-slate-500">Size</dt><dd className="text-slate-800">{companySizeLabel(c.size) ?? '—'}</dd></div>
                    <div><dt className="text-slate-500">Members · open jobs</dt><dd className="text-slate-800">{c.members} · {c.openJobs}</dd></div>
                    <div><dt className="text-slate-500">Created</dt><dd className="text-slate-800">{formatDate(c.createdAt)}</dd></div>
                  </dl>
                  <VerifyButton company={c} busy={busyId === c.id} onClick={() => setPending(c)} className="w-full sm:w-auto" />
                </li>
              ))}
            </ul>
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

      <ConfirmDialog
        open={!!pending}
        onClose={() => { if (!setVerified.isPending) setPending(null); }}
        onConfirm={confirmToggle}
        loading={setVerified.isPending}
        tone={pending?.verified ? 'danger' : 'primary'}
        title={pending?.verified ? `Remove verification from ${pending.name}?` : `Verify ${pending?.name ?? 'this company'}?`}
        description={
          pending?.verified
            ? 'The verified badge will be removed from the company profile and all of its jobs.'
            : 'Only verify companies you have confirmed are genuine. The badge appears on the company profile and all of its jobs.'
        }
        confirmLabel={pending?.verified ? 'Remove verification' : 'Verify company'}
      />
    </div>
  );
}

export default function AdminCompaniesPage() {
  return (
    <Suspense fallback={<Card><ListSkeleton /></Card>}>
      <AdminCompaniesView />
    </Suspense>
  );
}
