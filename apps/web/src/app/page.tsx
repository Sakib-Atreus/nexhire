'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  Bell,
  Bookmark,
  Building2,
  ClipboardList,
  KanbanSquare,
  LayoutDashboard,
  ListChecks,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { buttonClasses } from '@/components/ui/Button';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { HeroSearch } from '@/components/marketing/HeroSearch';
import { HeroGlow } from '@/components/marketing/HeroGlow';
import { LatestJobs, OpenRolesCount } from '@/components/marketing/LatestJobs';
import { useMounted } from '@/components/marketing/useMounted';
import { AnnouncementBanner } from '@/components/layout/AnnouncementBanner';
import { FeaturedJobs } from '@/components/marketing/FeaturedJobs';

const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: SlidersHorizontal,
    title: 'Focused search',
    description: 'Filter open roles by keyword, location, company, job type, experience level and salary.',
  },
  {
    icon: Bookmark,
    title: 'Save for later',
    description: 'Bookmark interesting roles and come back to them when you are ready to apply.',
  },
  {
    icon: ListChecks,
    title: 'Clear application status',
    description: 'See where each application stands, from applied and under review to interview and offer.',
  },
  {
    icon: Bell,
    title: 'Status notifications',
    description: 'Get notified in the app when a recruiter moves your application forward.',
  },
  {
    icon: ClipboardList,
    title: 'Structured job posts',
    description: 'Recruiters describe responsibilities, requirements, salary range and deadline in one consistent format.',
  },
  {
    icon: KanbanSquare,
    title: 'Applicant pipeline',
    description: 'Review applicants per job, read cover letters and resumes, and update their status.',
  },
];

const TRACKS = [
  {
    id: 'seekers',
    icon: Search,
    title: 'For job seekers',
    cta: { href: '/register?role=CANDIDATE', label: 'Create a job seeker account' },
    steps: [
      { title: 'Create your profile', desc: 'Add your headline, skills and experience so recruiters know who you are.' },
      { title: 'Find and apply', desc: 'Search open roles, save the ones you like and apply with a cover letter.' },
      { title: 'Track your progress', desc: 'Follow each application on your dashboard as recruiters review it.' },
    ],
  },
  {
    id: 'recruiters',
    icon: Building2,
    title: 'For recruiters',
    cta: { href: '/register?role=RECRUITER', label: 'Create a recruiter account' },
    steps: [
      { title: 'Post a role', desc: 'Publish a job with salary range, requirements and optional screening questions.' },
      { title: 'Review applicants', desc: 'See everyone who applied, with their cover letter and resume in one place.' },
      { title: 'Move candidates forward', desc: 'Shortlist, interview and make offers, and candidates are kept informed.' },
    ],
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
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-28">
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
          </div>
        </section>

        <FeaturedJobs />
        <LatestJobs />

        {/* How it works: two tracks */}
        <section aria-labelledby="how-heading" className="py-16 sm:py-24 bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-12">
              <h2 id="how-heading" className="text-2xl sm:text-3xl font-bold tracking-tight text-fg">
                How NexHire works
              </h2>
              <p className="mt-3 text-fg-muted text-base sm:text-lg">
                One platform, two sides of the same process.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {TRACKS.map((track) => (
                <div key={track.id} className="rounded-2xl border border-line bg-muted/60 p-6 sm:p-8">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center">
                      <track.icon className="w-5 h-5" aria-hidden />
                    </span>
                    <h3 className="text-lg font-semibold text-fg">{track.title}</h3>
                  </div>
                  <ol className="mt-6 space-y-5">
                    {track.steps.map((step, i) => (
                      <li key={step.title} className="flex gap-4">
                        <span
                          className="flex-shrink-0 w-7 h-7 rounded-full bg-surface ring-1 ring-line text-xs font-semibold text-primary-700 flex items-center justify-center"
                          aria-hidden
                        >
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-fg">{step.title}</p>
                          <p className="mt-0.5 text-sm text-fg-muted leading-relaxed">{step.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  {!signedIn && (
                    <Link href={track.cta.href} className={buttonClasses('secondary', 'md', 'mt-7')}>
                      {track.cta.label}
                      <ArrowRight className="w-4 h-4" aria-hidden />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

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
