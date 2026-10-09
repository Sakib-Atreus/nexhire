'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { Check, Copy, ExternalLink, Globe } from 'lucide-react';
import { useUpdateProfile } from '@/hooks/useProfile';
import { Card } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Toggle';
import { buttonClasses } from '@/components/ui/Button';
import { getErrorMessage } from '@/lib/format';
import { toast } from '@/store/toastStore';
import type { User } from '@/types';

/** Opt-in public profile at /p/{slug}, with a copyable link. */
export function PublicProfileCard({ user }: { user: User }) {
  const labelId = useId();
  const update = useUpdateProfile();
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const isPublic = !!user.publicProfile;
  const path = user.profileSlug ? `/p/${user.profileSlug}` : null;
  const url = path ? `${origin}${path}` : '';

  function toggle(next: boolean) {
    update.mutate(
      { publicProfile: next },
      {
        onSuccess: () => toast.success(next ? 'Your profile is public' : 'Your profile is private'),
        onError: (err) => toast.error("Couldn't update visibility", getErrorMessage(err)),
      }
    );
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      toast.error("Couldn't copy the link", 'Select the link and copy it manually.');
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600" aria-hidden>
            <Globe className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p id={labelId} className="text-sm font-semibold text-fg">Make my profile public</p>
            <p className="mt-0.5 text-xs text-fg-muted">Share a link to your profile with anyone, no sign-in needed.</p>
          </div>
        </div>
        <Toggle checked={isPublic} onChange={toggle} disabled={update.isPending} labelledBy={labelId} />
      </div>

      {isPublic && path && (
        <div className="mt-4 space-y-2.5">
          <div className="flex items-center gap-2 rounded-lg border border-line bg-muted px-3 py-2">
            <input
              readOnly
              value={url || path}
              aria-label="Public profile link"
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 bg-transparent text-xs text-fg-secondary focus:outline-none"
            />
            <button
              type="button"
              onClick={copy}
              className="inline-flex flex-shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <Link href={path} target="_blank" className={buttonClasses('secondary', 'sm', 'w-full')}>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden /> View public profile
          </Link>
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-fg-muted">
        <span className="font-medium text-fg-secondary">What&apos;s shared: </span>
        Your name, headline, location, about, skills, experience, education and links. Never your email, phone or resume.
      </p>
      <span className="sr-only" aria-live="polite">{copied ? 'Link copied' : ''}</span>
    </Card>
  );
}
