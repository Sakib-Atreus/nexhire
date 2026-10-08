'use client';

import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, KeyRound } from 'lucide-react';
import { useResetPassword } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/format';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthAlert } from '@/components/auth/AuthAlert';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { FormField } from '@/components/ui/Field';
import { Button, buttonClasses } from '@/components/ui/Button';

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be 128 characters or fewer'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const [success, setSuccess] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const { mutate: resetPassword, isPending, error } = useResetPassword();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  if (!token) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
          <KeyRound className="h-6 w-6 text-amber-600" aria-hidden />
        </div>
        <h2 className="text-sm font-semibold text-slate-900">This reset link is incomplete</h2>
        <p className="mt-1 text-sm text-slate-500">
          Open the link from your email again, or request a new one.
        </p>
        <Link href="/forgot-password" className={buttonClasses('primary', 'lg', 'mt-6 w-full')}>
          Request a new reset link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center" role="status">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" aria-hidden />
        </div>
        <h2 className="text-sm font-semibold text-slate-900">Password updated</h2>
        <p className="mt-1 text-sm text-slate-500">Taking you to sign in…</p>
        <Link href="/login" className={buttonClasses('secondary', 'md', 'mt-6')}>
          Sign in now
        </Link>
      </div>
    );
  }

  const onSubmit = (data: FormData) => {
    resetPassword(
      { token, newPassword: data.newPassword },
      {
        onSuccess: () => {
          setSuccess(true);
          setTimeout(() => router.push('/login'), 2000);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <FormField label="New password" error={errors.newPassword?.message} hint="Use at least 8 characters.">
        {(id) => (
          <PasswordInput
            id={id}
            autoComplete="new-password"
            invalid={!!errors.newPassword}
            {...register('newPassword')}
          />
        )}
      </FormField>

      <FormField label="Confirm new password" error={errors.confirmPassword?.message}>
        {(id) => (
          <PasswordInput
            id={id}
            autoComplete="new-password"
            invalid={!!errors.confirmPassword}
            {...register('confirmPassword')}
          />
        )}
      </FormField>

      {error && (
        <AuthAlert>
          {getErrorMessage(error, 'We could not reset your password. The link may have expired.')}{' '}
          <Link href="/forgot-password" className="font-medium underline">
            Request a new link
          </Link>
        </AuthAlert>
      )}

      <Button type="submit" size="lg" className="w-full" loading={isPending}>
        {isPending ? 'Updating…' : 'Update password'}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a strong password for your NexHire account."
      footer={
        <>
          Back to{' '}
          <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
