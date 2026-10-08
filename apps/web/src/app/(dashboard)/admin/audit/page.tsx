'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ScrollText, Search, X } from 'lucide-react';
import { useAuditLog } from '@/hooks/useAdmin';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States';
import { Pagination } from '@/components/ui/Pagination';
import { AuditActionSelect, isAuditAction } from '@/components/admin/audit/AuditActionSelect';
import { AuditLogList, AuditLogSkeleton, type AuditTargetType } from '@/components/admin/audit/AuditLogList';
import { pluralize } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { AuditAction } from '@/types';

const PAGE_SIZE = 25;
const DEBOUNCE_MS = 350;
const TARGET_TYPES: AuditTargetType[] = ['USER', 'JOB', 'COMPANY', 'REPORT', 'SETTINGS'];
const TARGET_NOUNS: Record<AuditTargetType, string> = { USER: 'user', JOB: 'job', COMPANY: 'company', REPORT: 'report', SETTINGS: 'settings' };

const TITLE = 'Audit log';
const DESCRIPTION = 'Every moderation and settings change made by administrators, newest first.';

export default function AuditLogPage() {
  return (
    <Suspense
      fallback={
        <div>
          <PageHeader title={TITLE} description={DESCRIPTION} />
          <Card><AuditLogSkeleton /></Card>
        </div>
      }
    >
      <AuditLogBrowser />
    </Suspense>
  );
}

function AuditLogBrowser() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The URL is the source of truth so other admin pages can deep-link (?targetType=USER&targetId=…).
  const actionParam = searchParams.get('action');
  const action: AuditAction | '' = isAuditAction(actionParam) ? actionParam : '';
  const typeParam = searchParams.get('targetType');
  const targetType = TARGET_TYPES.includes(typeParam as AuditTargetType) ? (typeParam as AuditTargetType) : undefined;
  const targetId = searchParams.get('targetId') || undefined;
  const actor = searchParams.get('actor') ?? '';
  const page = Math.max(0, (Number(searchParams.get('page')) || 1) - 1);

  const updateParams = useCallback(
    (updates: Record<string, string | null>, keepPage = false) => {
      const params = new URLSearchParams(window.location.search);
      for (const [k, v] of Object.entries(updates)) {
        if (v) params.set(k, v);
        else params.delete(k);
      }
      if (!keepPage && !('page' in updates)) params.delete('page');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router]
  );

  // Actor search: local input, debounced into the URL.
  const [actorInput, setActorInput] = useState(actor);
  useEffect(() => {
    const next = actorInput.trim();
    if (next === actor) return;
    const t = setTimeout(() => updateParams({ actor: next || null }), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [actorInput, actor, updateParams]);

  const filters = useMemo(
    () => ({ action: action || undefined, targetType, targetId, actor: actor || undefined, page, size: PAGE_SIZE }),
    [action, targetType, targetId, actor, page]
  );
  const { data, isLoading, isError, error, refetch, isRefetching, isPlaceholderData } = useAuditLog(filters);

  const entries = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const hasTarget = !!(targetType || targetId);
  const hasFilters = !!(action || actor || actorInput.trim() || hasTarget);

  // Name the filtered target when the loaded entries tell us what it is.
  const targetLabel = hasTarget ? entries.find((e) => e.targetId === targetId)?.targetLabel?.trim() : undefined;
  const targetNoun = targetType ? TARGET_NOUNS[targetType] : 'item';

  const clearAll = () => {
    setActorInput('');
    updateParams({ action: null, actor: null, targetType: null, targetId: null });
  };

  const goToPage = (p: number) => {
    updateParams({ page: p > 0 ? String(p + 1) : null });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <PageHeader title={TITLE} description={DESCRIPTION} />

      <Card className="p-3 mb-4">
        <form role="search" onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-3 sm:flex-row">
          <div className="sm:w-64">
            <label htmlFor="audit-action" className="sr-only">Action</label>
            <AuditActionSelect
              id="audit-action"
              value={action}
              onChange={(v) => updateParams({ action: v || null })}
            />
          </div>
          <div className="relative flex-1 min-w-0">
            <label htmlFor="audit-actor" className="sr-only">Administrator name or email</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-subtle" aria-hidden />
            <Input
              id="audit-actor"
              type="search"
              value={actorInput}
              onChange={(e) => setActorInput(e.target.value)}
              placeholder="Filter by administrator name or email"
              className="pl-9"
              autoComplete="off"
            />
          </div>
        </form>

        {hasTarget && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-primary-50 py-1 pl-3 pr-1 text-xs font-medium text-primary-700 ring-1 ring-inset ring-primary-600/20">
              <span className="truncate">
                Filtered to one {targetNoun}
                {targetLabel && <>: <span className="font-semibold">{targetLabel}</span></>}
              </span>
              <button
                type="button"
                onClick={() => updateParams({ targetType: null, targetId: null })}
                aria-label={`Remove ${targetNoun} filter`}
                className="flex-shrink-0 rounded-full p-0.5 hover:bg-primary-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <X className="w-3.5 h-3.5" aria-hidden />
              </button>
            </span>
          </div>
        )}
      </Card>

      {!isLoading && !isError && (
        <div className="flex items-center justify-between gap-3 mb-3 min-h-8">
          <p className="text-sm text-fg-tertiary" aria-live="polite">
            <span className="font-semibold text-fg">{pluralize(total, 'entry', 'entries')}</span>
            {hasFilters ? ' match your filters' : ' in total'}
          </p>
          <div className="flex items-center gap-2">
            {isPlaceholderData && <Spinner className="w-4 h-4" />}
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearAll}>
                <X className="w-3.5 h-3.5" aria-hidden /> Clear filters
              </Button>
            )}
          </div>
        </div>
      )}

      <Card className="overflow-hidden">
        {isLoading ? (
          <div aria-busy="true" aria-label="Loading audit log">
            <AuditLogSkeleton />
          </div>
        ) : isError ? (
          <ErrorState title="We couldn't load the audit log" error={error} onRetry={() => refetch()} retrying={isRefetching} />
        ) : entries.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title={hasFilters ? 'No entries match these filters' : 'No admin actions yet'}
            description={
              hasFilters
                ? 'Try another action, a different name or email, or clear the filters.'
                : 'Actions such as suspending users, hiding jobs or changing settings will appear here.'
            }
            action={hasFilters ? <Button variant="secondary" onClick={clearAll}>Clear filters</Button> : undefined}
          />
        ) : (
          <div className={cn('transition-opacity', isPlaceholderData && 'opacity-60')} aria-busy={isPlaceholderData || undefined}>
            <AuditLogList
              entries={entries}
              onFilterTarget={(type, id) => updateParams({ targetType: type, targetId: id })}
            />
          </div>
        )}
      </Card>

      {!isLoading && !isError && (
        <Pagination page={page} totalPages={data?.totalPages ?? 0} onChange={goToPage} />
      )}
    </div>
  );
}
