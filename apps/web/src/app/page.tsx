'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  CalendarDays,
  KanbanSquare,
  LayoutDashboard,
  ListChecks,
  Sparkles,
  Users,
  Video,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { buttonClasses } from '@/components/ui/Button';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { HeroSearch } from '@/components/marketing/HeroSearch';
import { HeroGlow } from '@/components/marketing/HeroGlow';
import { HeroPreview } from '@/components/marketing/HeroPreview';
import { HowItWorks } from '@/components/marketing/HowItWorks';
import { LatestJobs, OpenRolesCount } from '@/components/marketing/LatestJobs';
import { useMounted } from '@/components/marketing/useMounted';
import { AnnouncementBanner } from '@/components/layout/AnnouncementBanner';
import { FeaturedJobs } from '@/components/marketing/FeaturedJobs';

const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Sparkles,
    title: 'Jobs matched to you',
    description: 'Recommendations ranked by your skills and headline, plus alerts the moment a matching job is posted.',
  },
  {
    icon: ListChecks,
    title: 'Every application in one place',
    description: 'Follow each application from applied to offer, with a full timeline and messages from the hiring team.',
  },
  {
    icon: CalendarDays,
    title: 'Interviews made easy',
    description: 'Accept or suggest a new time in one click, and keep interviews in sync with Google, Outlook or Apple Calendar.',
  },
  {
    icon: Video,
    title: 'Built-in video calls',
    description: 'Join interviews right in the browser from a private room, with a camera and microphone check first.',
  },
  {
    icon: KanbanSquare,
    title: 'Drag-and-drop pipeline',
    description: 'Move applicants between stages, rate them, keep private notes and message candidates from one panel.',
  },
  {
    icon: Users,
    title: 'Built for hiring teams',
    description: 'Share jobs and applicants with your company team, with analytics for every role you post.',
  },
];

export default function HomePage() {
  const mounted = useMounted();
  const { user, isAuthenticated } = useAuthStore();
  const signedIn = mounted && isAuthenticated && !!user;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <SiteHeader />
      <AnnouncementBanner variant="bar" />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-700 text-white dark:from-[#070a1f] dark:via-primary-950 dark:to-[#2a2380]">
          <HeroGlow />
          <div
            className="absolute inset-0 opacity-[0.07] dark:opacity-[0.1]"
            style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '28px 28px' }}
            aria-hidden
          />
          <div className="relative max-w-7xl mx-auto grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_auto] px-4 sm:px-6 py-16 sm:py-24 lg:py-28">
            <div className="max-w-3xl">
              <OpenRolesCount className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-primary-50 mb-6 backdrop-blur dark:border-white/15 dark:shadow-[0_0_24px_-6px_rgba(129,140,248,0.6)]" />
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
                Find work you care about.
                <span className="block text-primary-200 dark:bg-gradient-to-r dark:from-[#c7d2fe] dark:via-[#7dd3fc] dark:to-[#f0abfc] dark:bg-clip-text dark:text-transparent">
                  Hire people who fit.
                </span>
              </h1>
              <p className="mt-6 text-base sm:text-lg text-primary-100 max-w-xl leading-relaxed dark:text-slate-300">
                NexHire is where job seekers discover open roles and track every application, and where
                recruiters post jobs and manage applicants from first review to offer.
              </p>

              <div className="mt-8">
                <HeroSearch />
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                {signedIn ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 font-semibold text-white hover:text-primary-100 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-surface"
                  >
                    <LayoutDashboard className="w-4 h-4" aria-hidden />
                    Go to your dashboard
                    <ArrowRight className="w-4 h-4" aria-hidden />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register?role=RECRUITER"
                      className="inline-flex items-center gap-1.5 font-semibold text-white hover:text-primary-100 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-surface"
                    >
                      Hiring? Post a job
                      <ArrowRight className="w-4 h-4" aria-hidden />
                    </Link>
                    <Link
                      href="/jobs"
                      className="text-primary-100 hover:text-white rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-surface"
                    >
                      Or browse all jobs
                    </Link>
                  </>
                )}
              </div>
            </div>
            <HeroPreview />
          </div>
        </section>

        <FeaturedJobs />
        <LatestJobs />

        <HowItWorks />

        {/* Features */}
        <section aria-labelledby="features-heading" className="py-16 sm:py-24 bg-canvas border-y border-line/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-12">
              <h2 id="features-heading" className="text-2xl sm:text-3xl font-bold tracking-tight text-fg">
                Built for both sides of hiring
              </h2>
              <p className="mt-3 text-fg-muted text-base sm:text-lg">
                The essentials for finding a role or filling one, without the clutter.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((f) => (
                <div key={f.title} className="rounded-xl border border-line bg-surface p-6 shadow-card">
                  <span className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                    <f.icon className="w-5 h-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-semibold text-fg">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-fg-muted leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-20 bg-surface">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="rounded-2xl bg-primary-600 px-6 py-12 sm:px-12 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {signedIn ? 'Pick up where you left off' : 'Ready when you are'}
              </h2>
              <p className="mt-3 text-primary-100 max-w-xl mx-auto">
                {signedIn
                  ? 'Your dashboard has your latest activity.'
                  : 'Create a free account to apply for roles or start posting jobs.'}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                {signedIn ? (
                  <Link
                    href="/dashboard"
                    className={buttonClasses('secondary', 'lg', 'border-transparent text-primary-700')}
                  >
                    <LayoutDashboard className="w-4 h-4" aria-hidden />
                    Go to dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register?role=CANDIDATE"
                      className={buttonClasses('secondary', 'lg', 'border-transparent text-primary-700')}
                    >
                      I&apos;m looking for a job
                    </Link>
                    <Link
                      href="/register?role=RECRUITER"
                      className={buttonClasses('ghost', 'lg', 'text-white ring-1 ring-inset ring-surface/40 hover:bg-surface/10 hover:text-white focus-visible:ring-surface')}
                    >
                      I&apos;m hiring
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
