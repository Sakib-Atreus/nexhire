'use client';

import { Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRegister } from '@/hooks/useAuth';
import type { Role } from '@/types';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['CANDIDATE', 'RECRUITER']),
});

type FormData = z.infer<typeof schema>;

function RegisterForm() {
  const searchParams = useSearchParams();
  const defaultRole = (searchParams.get('role') as Role) ?? 'CANDIDATE';

  const { mutate: register, isPending, error } = useRegister();
  const { register: reg, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: defaultRole === 'RECRUITER' ? 'RECRUITER' : 'CANDIDATE' },
  });

  const role = watch('role');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-primary-700">NexHire</Link>
          <h1 className="mt-4 text-2xl font-semibold text-slate-800">Create your account</h1>
        </div>

        <div className="flex rounded-lg border border-slate-200 p-1 mb-6">
          {(['CANDIDATE', 'RECRUITER'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setValue('role', r)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                role === r ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {r === 'CANDIDATE' ? 'Job Seeker' : 'Recruiter'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit((data) => register(data))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
              <input
                {...reg('firstName')}
                placeholder="John"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
              <input
                {...reg('lastName')}
                placeholder="Doe"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              {...reg('email')}
              type="email"
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              {...reg('password')}
              type="password"
              placeholder="Min 8 characters"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              Registration failed. Please try again.
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
