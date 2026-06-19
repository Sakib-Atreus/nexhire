'use client';

import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useResetPassword } from '@/hooks/useAuth';

const schema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
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
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        Invalid reset link. Please request a new one.
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

  if (success) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
        Password reset successfully! Redirecting to login...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">New password</label>
        <input
          {...register('newPassword')}
          type="password"
          placeholder="••••••••"
          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        {errors.newPassword && <p className="mt-1 text-sm text-red-500">{errors.newPassword.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Confirm password</label>
        <input
          {...register('confirmPassword')}
          type="password"
          placeholder="••••••••"
          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {(error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Something went wrong. Please try again.'}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2.5 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-primary-700">NexHire</Link>
          <h1 className="mt-4 text-2xl font-semibold text-slate-800">Set new password</h1>
          <p className="text-slate-500 mt-1">Choose a strong password for your account</p>
        </div>

        <Suspense>
          <ResetPasswordForm />
        </Suspense>

        <p className="mt-6 text-center text-sm text-slate-600">
          Back to{' '}
          <Link href="/login" className="text-primary-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
