'use client';

import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/Field';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { invalid?: boolean };

/** Password input with a show/hide toggle. Works with react-hook-form's register(). */
export const PasswordInput = forwardRef<HTMLInputElement, Props>(function PasswordInput(props, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input ref={ref} type={visible ? 'text' : 'password'} className="pr-11" {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        aria-controls={props.id}
        className="absolute inset-y-0 right-0 flex items-center px-3 rounded-r-lg text-fg-subtle hover:text-fg-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        {visible ? <EyeOff className="w-4 h-4" aria-hidden /> : <Eye className="w-4 h-4" aria-hidden />}
      </button>
    </div>
  );
});
