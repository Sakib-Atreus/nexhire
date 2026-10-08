'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import { useForgotPassword } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/format';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthAlert } from '@/components/auth/AuthAlert';
import { FormField, Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { mutate: forgotPassword, isPending, error, reset } = useForgotPassword();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    forgotPassword(data, { onSuccess: () => setSentTo(data.email) });
  };

  const footer = (
    <>
      Remembered it?{' '}
      <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700 hover:underline">
        Back to sign in
      </Link>
    </>
  );

  if (sentTo) {
    return (
      <AuthShell title="Check your email" footer={footer}>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
            <MailCheck className="h-6 w-6 text-emerald-600" aria-hidden />
          </div>
          <p className="text-sm text-fg-tertiary leading-relaxed" role="status">
            If an account exists for <span className="font-medium text-fg break-all">{sentTo}</span>,
            we&apos;ve sent a link to reset your password.
          </p>
          <p className="mt-4 text-xs text-fg-muted">
            Didn&apos;t get it? Check your spam folder, or{' '}
            <button
              type="button"
              onClick={() => { reset(); setSentTo(null); }}
              className="font-medium text-primary-600 hover:underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              try another email
            </button>
            .
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter the email you signed up with and we'll send you a link to reset it."
      footer={footer}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <FormField label="Email" error={errors.email?.message}>
          {(id) => (
            <Input
              id={id}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              invalid={!!errors.email}
              {...register('email')}
            />
          )}
        </FormField>

        {error && <AuthAlert>{getErrorMessage(error)}</AuthAlert>}

        <Button type="submit" size="lg" className="w-full" loading={isPending}>
          {isPending ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
    </AuthShell>
  );
}
