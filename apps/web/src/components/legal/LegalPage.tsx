import type { ReactNode } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

export const CONTACT_EMAIL = 'sakibmia0718@gmail.com';

/** Shared layout for the Privacy Policy and Terms of Service: title, contents list and readable sections. */
export function LegalPage({ title, intro, updated, sections, related }: {
  title: string;
  intro: ReactNode;
  updated: string;
  sections: LegalSection[];
  related: { href: string; label: string };
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SiteHeader />
      <main className="flex-1">
        <div className="border-b border-line bg-canvas">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
            <p className="text-sm font-medium text-primary-600">Legal</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-fg sm:text-4xl">{title}</h1>
            <p className="mt-3 text-sm text-fg-muted">Last updated: {updated}</p>
            <div className="mt-6 max-w-3xl text-base leading-relaxed text-fg-tertiary">{intro}</div>
          </div>
        </div>

        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">On this page</p>
            <ol className="mt-3 space-y-2 text-sm">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-fg-tertiary hover:text-primary-600">
                    {i + 1}. {s.title}
                  </a>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-sm">
              <Link href={related.href} className="font-medium text-primary-600 hover:text-primary-700">{related.label} →</Link>
            </p>
          </nav>

          <div className="min-w-0 space-y-10">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="text-xl font-semibold text-fg">
                  {i + 1}. {s.title}
                </h2>
                <div className="legal-body mt-3 space-y-3 text-[15px] leading-7 text-fg-secondary [&_a]:font-medium [&_a]:text-primary-600 hover:[&_a]:text-primary-700 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-fg [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
                  {s.body}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
