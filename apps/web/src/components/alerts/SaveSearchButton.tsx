'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BellPlus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button, buttonClasses } from '@/components/ui/Button';
import { JobAlertModal } from './JobAlertModal';
import { hasAlertFilter, type AlertFilters } from './alertFilters';

/**
 * "Save this search" for the jobs page. Candidates open the alert modal prefilled with the current filters;
 * signed-out visitors get a sign-in link; other roles see nothing.
 */
export function SaveSearchButton({ filters, unsupportedNote }: { filters: AlertFilters; unsupportedNote?: string }) {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <Link href="/login" className={buttonClasses('ghost', 'sm')}>
        <BellPlus className="w-3.5 h-3.5" aria-hidden /> Sign in to save searches
      </Link>
    );
  }
  if (user.role !== 'CANDIDATE') return null;

  const enabled = hasAlertFilter(filters);
  const hint = 'Set a keyword, location, category, job type or experience level to save this search as an alert.';

  return (
    <>
      {/* Disabled buttons don't show tooltips reliably, so the wrapper carries the title. */}
      <span title={enabled ? 'Get notified when new jobs match this search' : hint} className="inline-flex">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setOpen(true)}
          disabled={!enabled}
          aria-describedby={enabled ? undefined : 'save-search-hint'}
        >
          <BellPlus className="w-3.5 h-3.5" aria-hidden /> Save this search
        </Button>
      </span>
      {!enabled && <span id="save-search-hint" className="sr-only">{hint}</span>}
      <JobAlertModal open={open} onClose={() => setOpen(false)} defaults={filters} note={unsupportedNote} />
    </>
  );
}
