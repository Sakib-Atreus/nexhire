import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm focus-visible:ring-primary-500',
  secondary: 'bg-surface text-fg-secondary border border-line-strong hover:bg-muted shadow-sm focus-visible:ring-primary-500',
  ghost: 'text-fg-tertiary hover:bg-subtle hover:text-fg focus-visible:ring-primary-500',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm focus-visible:ring-rose-500',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm focus-visible:ring-emerald-500',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
};

/** Class string for links styled as buttons (e.g. <Link className={buttonClasses()} />). */
export function buttonClasses(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(
    'inline-flex items-center justify-center rounded-lg font-semibold whitespace-nowrap transition-colors',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:opacity-60 disabled:cursor-not-allowed',
    VARIANTS[variant],
    SIZES[size],
    className
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, disabled, className, children, type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses(variant, size, className)}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});
