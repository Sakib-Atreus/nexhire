'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { CalendarDays, Check, Link2, UserX } from 'lucide-react';
import { usePublicProfile } from '@/hooks/useCandidate';
import { CandidateProfileView } from '@/components/profile/CandidateProfileView';
import { Button, buttonClasses } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { formatMonthYear } from '@/lib/format';
import { toast } from '@/store/toastStore';
import type { CandidateProfile } from '@/types';

function PublicProfileSkeleton() {
  return (
    <Card className="overflow-hidden" aria-busy>
      <div className="h-24 bg-subtle" />
      <div className="p-6 sm:p-8 space-y-8">
        <div className="flex items-start gap-4">
          <Skeleton className="h-20 w-20 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2.5 pt-1">
            <Skeleton className="h-7 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading profile…</span>
    </Card>
  );
}

function ShareButton() {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      toast.error("Couldn't copy the link", 'Copy it from the address bar instead.');
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={copy}>
      {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Link2 className="h-3.5 w-3.5" aria-hidden />}
      {copied ? 'Link copied' : 'Copy link'}
    </Button>
  );
}

function ProfileCard({ profile }: { profile: CandidateProfile }) {
  // The public endpoint never returns contact details, but strip them defensively so this page can't leak them.
  const safe: CandidateProfile = { ...profile, email: null, phone: null, resumeUrl: null };

  return (
    <Card className="overflow-hidden">
      <div className="h-24 bg-gradient-to-r from-primary-50 via-sky-50 to-emerald-50 border-b border-line-subtle" aria-hidden />
      <div className="p-6 sm:p-8">
        <CandidateProfileView profile={safe} />
      </div>
      <div className="flex flex-col gap-3 border-t border-line-subtle bg-muted/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="inline-flex items-center gap-1.5 text-sm text-fg-muted">
          <CalendarDays className="h-4 w-4" aria-hidden />
          Member since {formatMonthYear(profile.memberSince)}
        </p>
        <ShareButton />
      </div>
    </Card>
  );
}

export default function PublicProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: profile, isLoading, isError, error, refetch, isRefetching } = usePublicProfile(slug);

  useEffect(() => {
    if (!profile) return;
    const previous = document.title;
    document.title = `${profile.fullName}${profile.headline ? ` – ${profile.headline}` : ''} · NexHire`;
    return () => { document.title = previous; };
  }, [profile]);

  const notFound = isError && axios.isAxiosError(error) && error.response?.status === 404;

  return (
    <div className="mx-auto w-full max-w-4xl">
      {isLoading ? (
        <PublicProfileSkeleton />
      ) : notFound ? (
        <Card>
          <EmptyState
            icon={UserX}
            title="This profile isn't available"
            description="The profile is private or doesn't exist. Check the link with the person who shared it."
            action={<Link href="/jobs" className={buttonClasses('primary')}>Browse jobs</Link>}
            className="py-20"
          />
        </Card>
      ) : isError || !profile ? (
        <Card>
          <ErrorState title="We couldn't load this profile" error={error} onRetry={() => refetch()} retrying={isRefetching} />
        </Card>
      ) : (
        <>
          <ProfileCard profile={profile} />
          <p className="mt-6 text-center text-xs text-fg-subtle">
            Public profile on NexHire.{' '}
            <Link href="/jobs" className="font-medium text-primary-600 hover:underline">Find your next role</Link>
          </p>
        </>
      )}
    </div>
  );
}
