'use client';

import { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useVerifyEmail, useResendVerification } from '@/hooks/useAuth';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const { mutate: verifyEmail, isPending, isSuccess, isError, error } = useVerifyEmail();
  const { mutate: resendVerification, isPending: isResending, isSuccess: isResent } = useResendVerification();

  useEffect(() => {
    if (token) {
      verifyEmail(
        { token },
        {
          onSuccess: () => {
            setTimeout(() => router.push('/login'), 2000);
          },
        }
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) {
    return (
      <div className="text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-red-100">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p className="text-slate-700 font-medium">Invalid verification link</p>
        <p className="text-slate-500 text-sm mt-1">The link you followed is missing a verification token.</p>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4">
          <svg className="animate-spin w-10 h-10 text-primary-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
        <p className="text-slate-600 font-medium">Verifying your email...</p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-green-100">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-slate-800 font-semibold text-lg">Email verified!</p>
        <p className="text-slate-500 text-sm mt-1">Redirecting to login...</p>
      </div>
    );
  }

  if (isError) {
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Verification failed. The link may have expired.';

    return (
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-red-100">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div>
          <p className="text-slate-800 font-semibold">Verification failed</p>
          <p className="text-slate-500 text-sm mt-1">{message}</p>
        </div>
        {isResent ? (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            Verification email sent! Check your inbox.
          </div>
        ) : (
          <button
            onClick={() => resendVerification()}
            disabled={isResending}
            className="w-full py-2.5 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isResending ? 'Sending...' : 'Request new verification'}
          </button>
        )}
      </div>
    );
  }

  return null;
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-primary-700">NexHire</Link>
          <h1 className="mt-4 text-2xl font-semibold text-slate-800">Email Verification</h1>
        </div>

        <Suspense>
          <VerifyEmailContent />
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
