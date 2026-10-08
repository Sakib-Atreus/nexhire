import Link from 'next/link';
import { Briefcase, Users } from 'lucide-react';
import type { Company } from '@/types';
import { cn } from '@/lib/cn';
import { pluralize } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { CompanyLogo } from '@/components/ui/CompanyLogo';
import { Skeleton } from '@/components/ui/States';
import { VerifiedBadge, companySizeLabel } from './VerifiedBadge';

/** Directory card: the whole card links to the public company page. */
export function CompanyCard({ company }: { company: Company }) {
  const size = companySizeLabel(company.size);
  const meta = [company.industry, company.headquarters].filter(Boolean).join(' · ');

  return (
    <article className="group relative flex h-full flex-col bg-surface rounded-xl border border-line shadow-card p-5 transition hover:border-primary-300 hover:shadow-md focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-500/20">
      <div className="flex items-start gap-4">
        <CompanyLogo name={company.name} src={company.logoUrl} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="min-w-0 text-base font-semibold leading-snug text-fg break-words">
              <Link
                href={`/companies/${company.slug}`}
                className="focus:outline-none group-hover:text-primary-700 after:absolute after:inset-0 after:rounded-xl after:content-['']"
              >
                {company.name}
              </Link>
            </h2>
            {company.verified && <VerifiedBadge />}
          </div>
          {meta && <p className="mt-0.5 text-sm text-fg-muted truncate">{meta}</p>}
        </div>
      </div>

      {company.description ? (
        <p className="mt-3 text-sm leading-relaxed text-fg-tertiary line-clamp-2 break-words">{company.description}</p>
      ) : (
        <p className="mt-3 text-sm text-fg-subtle">No description yet.</p>
      )}

      <ul className="mt-auto pt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-fg-muted">
        <li
          className={cn(
            'inline-flex items-center gap-1.5 font-medium',
            company.openJobs > 0 ? 'text-primary-700' : 'text-fg-muted'
          )}
        >
          <Briefcase className="w-3.5 h-3.5" aria-hidden />
          {company.openJobs > 0 ? pluralize(company.openJobs, 'open job') : 'No open jobs'}
        </li>
        {size && (
          <li className="inline-flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-fg-subtle" aria-hidden />
            {size}
          </li>
        )}
      </ul>
    </article>
  );
}

export function CompanyCardSkeleton() {
  return (
    <Card className="p-5" aria-hidden>
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3.5 w-1/2" />
        </div>
      </div>
      <Skeleton className="mt-4 h-3.5 w-full" />
      <Skeleton className="mt-2 h-3.5 w-4/5" />
      <div className="mt-5 flex gap-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-24" />
      </div>
    </Card>
  );
}
