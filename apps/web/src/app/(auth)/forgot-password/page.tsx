'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useForgotPassword } from '@/hooks/useAuth';

const schema = z.object({
  email: z.string().email('Must be a valid email address'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [success, setSuccess] = useState(false);
  const { mutate: forgotPassword, isPending, error } = useForgotPassword();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    forgotPassword(data, {
      onSuccess: () => setSuccess(true),
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-primary-700">NexHire</Link>
          <h1 className="mt-4 text-2xl font-semibold text-slate-800">Reset your password</h1>
          <p className="text-slate-500 mt-1">Enter your email to receive reset instructions</p>
        </div>

        {success ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            Check your server logs for the reset token
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
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
              {isPending ? 'Sending...' : 'Send reset instructions'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-600">
          Remember your password?{' '}
          <Link href="/login" className="text-primary-600 hover:underline font-medium">
            Sign in &rarr;
          </Link>
        </p>
      </div>
    </div>
  );
}
