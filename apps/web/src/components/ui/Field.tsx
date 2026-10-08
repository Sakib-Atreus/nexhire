import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export const controlClasses = (invalid?: boolean) =>
  cn(
    'block w-full rounded-lg border bg-surface px-3.5 text-sm text-fg shadow-sm transition',
    'placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500',
    'disabled:bg-muted disabled:text-fg-muted',
    invalid ? 'border-rose-400 focus:ring-rose-500/30 focus:border-rose-500' : 'border-line-strong'
  );

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function Input({ className, invalid, ...props }, ref) {
    return <input ref={ref} aria-invalid={invalid || undefined} className={cn(controlClasses(invalid), 'h-10', className)} {...props} />;
  }
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  function Textarea({ className, invalid, ...props }, ref) {
    return <textarea ref={ref} aria-invalid={invalid || undefined} className={cn(controlClasses(invalid), 'py-2.5 leading-relaxed', className)} {...props} />;
  }
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(
  function Select({ className, invalid, ...props }, ref) {
    return <select ref={ref} aria-invalid={invalid || undefined} className={cn(controlClasses(invalid), 'h-10 pr-8', className)} {...props} />;
  }
);

interface FormFieldProps {
  label: string;
  /** Receives the generated id; pass it to the control's `id` so the label is linked. */
  children: (id: string) => ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
}

/** Label + control + hint/error, with correct htmlFor/aria wiring. */
export function FormField({ label, children, error, hint, required, className }: FormFieldProps) {
  const id = useId();
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-medium text-fg-secondary">
        {label}
        {required && <span className="text-rose-500 ml-0.5" aria-hidden>*</span>}
      </label>
      {children(id)}
      {error ? (
        <p className="text-xs text-rose-600" role="alert">{error}</p>
      ) : hint ? (
        <p className="text-xs text-fg-muted">{hint}</p>
      ) : null}
    </div>
  );
}
