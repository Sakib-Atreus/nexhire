import { cn } from '@/lib/cn';

export function Toggle({ checked, onChange, disabled, id, label, labelledBy }: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  /** Accessible name when there is no visible label to reference. */
  label?: string;
  labelledBy?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-labelledby={labelledBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50',
        checked ? 'bg-primary-600' : 'bg-slate-200'
      )}
    >
      <span className={cn('pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition', checked ? 'translate-x-5' : 'translate-x-0')} />
    </button>
  );
}
