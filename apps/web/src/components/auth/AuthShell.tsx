import type { ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { BrandLogo } from '@/components/marketing/BrandLogo';
import { Card } from '@/components/ui/Card';
import { ThemeIconButton } from '@/components/ui/ThemeToggle';

const HIGHLIGHTS = [
  'Search open roles by keyword, location, job type and experience level.',
  'Follow every application from submitted to offer in one place.',
  'Recruiters post roles and move candidates through a clear hiring pipeline.',
];

/**
 * Shared frame for all auth pages: brand panel on large screens,
 * centered card with logo, title and optional footer everywhere.
 */
export function AuthShell({ title, subtitle, children, footer }: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-canvas">
      {/* Brand panel */}
      <aside className="hidden lg:flex lg:w-[44%] xl:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '24px 24px' }}
          aria-hidden
        />
        <div className="relative flex flex-col justify-between w-full max-w-xl mx-auto px-12 py-12">
          <BrandLogo tone="light" />
          <div>
            <h2 className="text-3xl xl:text-4xl font-bold leading-tight">
              Hiring and job search,<br />in one place.
            </h2>
            <p className="mt-4 text-primary-100 leading-relaxed max-w-md">
              NexHire connects people looking for their next role with the teams hiring for it.
            </p>
            <ul className="mt-8 space-y-4">
              {HIGHLIGHTS.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-primary-50">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-primary-300" aria-hidden />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-primary-200">© {new Date().getFullYear()} NexHire</p>
        </div>
      </aside>

      {/* Form column */}
      <main className="relative flex-1 flex flex-col items-center justify-center px-4 py-10 sm:px-6">
        <ThemeIconButton className="absolute top-4 right-4" />
        <div className="w-full max-w-md">
          <div className="flex justify-center lg:hidden mb-8">
            <BrandLogo />
          </div>
          <Card className="p-6 sm:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight text-fg">{title}</h1>
              {subtitle && <p className="mt-1.5 text-sm text-fg-muted">{subtitle}</p>}
            </div>
            {children}
          </Card>
          {footer && <div className="mt-6 text-center text-sm text-fg-tertiary">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
