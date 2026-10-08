import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Job } from '@/types';
import { Card } from '@/components/ui/Card';
import { CompanyLogo } from '@/components/ui/CompanyLogo';
import { VerifiedIcon } from './VerifiedBadge';

/** Small "About {company}" card for the job detail sidebar. Renders nothing without a company page. */
export function AboutCompanyCard({ job, className }: { job: Job; className?: string }) {
  if (!job.companySlug) return null;
  const verified = !!(job.companyVerified || job.recruiterVerified);
  return (
    <Card className={className}>
      <div className="p-5">
        <h2 className="text-xs font-medium uppercase tracking-wide text-fg-muted">About {job.companyName}</h2>
        <div className="mt-3 flex items-center gap-3">
          <CompanyLogo name={job.companyName} src={job.companyLogoUrl} size="sm" />
          <p className="flex min-w-0 items-center gap-1 font-semibold text-fg">
            <span className="min-w-0 truncate">{job.companyName}</span>
            {verified && <VerifiedIcon />}
          </p>
        </div>
        <Link
          href={`/companies/${job.companySlug}`}
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          View company profile <ArrowRight className="w-4 h-4" aria-hidden />
        </Link>
      </div>
    </Card>
  );
}
