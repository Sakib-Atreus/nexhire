'use client';

import { Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLogin } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/format';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthAlert } from '@/components/auth/AuthAlert';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { FormField, Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

function loginErrorMessage(error: unknown) {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    return 'Invalid email or password.';
  }
  return getErrorMessage(error, 'We could not sign you in. Please try again.');
}

function LoginForm() {
  const searchParams = useSearchParams();
  const expired = searchParams.get('expired') === '1';
  const { mutate: login, isPending, error } = useLogin();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit((data) => login(data))} className="space-y-5" noValidate>
      {expired && !error && (
        <AuthAlert tone="info">Your session expired. Please sign in again.</AuthAlert>
      )}
      {error && <AuthAlert>{loginErrorMessage(error)}</AuthAlert>}

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

      <div className="space-y-1.5">
        <FormField label="Password" error={errors.password?.message}>
          {(id) => (
            <PasswordInput
              id={id}
              autoComplete="current-password"
              invalid={!!errors.password}
              {...register('password')}
            />
          )}
        </FormField>
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full" loading={isPending}>
        {isPending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your NexHire account."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-primary-600 hover:text-primary-700 hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
