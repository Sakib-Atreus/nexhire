'use client';

import { useEffect, Suspense, type ReactNode } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useVerifyEmail, useResendVerification } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/lib/format';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthAlert } from '@/components/auth/AuthAlert';
import { Button, buttonClasses } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/States';
import { useMounted } from '@/components/marketing/useMounted';

function StatusBlock({ icon, title, description, children }: {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="text-center" role="status" aria-live="polite">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">{icon}</div>
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      {children && <div className="mt-6 space-y-3">{children}</div>}
    </div>
  );
}

function ResendAction() {
  const mounted = useMounted();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated) && mounted;
  const { mutate: resend, isPending, isSuccess, error } = useResendVerification();

  if (!isAuthenticated) {
    return (
      <Link href="/login" className={buttonClasses('primary', 'lg', 'w-full')}>
        Sign in to request a new link
      </Link>
    );
  }
  if (isSuccess) {
    return <AuthAlert tone="success">We&apos;ve sent a new verification email. Check your inbox.</AuthAlert>;
  }
  return (
    <>
      {error && <AuthAlert>{getErrorMessage(error, 'We could not send a new link. Please try again.')}</AuthAlert>}
      <Button size="lg" className="w-full" loading={isPending} onClick={() => resend()}>
        {isPending ? 'Sending…' : 'Send a new verification link'}
      </Button>
    </>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const { mutate: verifyEmail, isPending, isSuccess, isError, error } = useVerifyEmail();

  useEffect(() => {
    if (token) {
      verifyEmail({ token }, { onSuccess: () => setTimeout(() => router.push('/login'), 2000) });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) {
    return (
      <StatusBlock
        icon={<XCircle className="h-12 w-12 text-rose-500" aria-hidden />}
        title="This verification link is incomplete"
        description="Open the link from your email again, or request a new one."
      >
        <ResendAction />
      </StatusBlock>
    );
  }

  if (isSuccess) {
    return (
      <StatusBlock
        icon={<CheckCircle2 className="h-12 w-12 text-emerald-500" aria-hidden />}
        title="Email verified"
        description="Thanks for confirming. Taking you to sign in…"
      >
        <Link href="/login" className={buttonClasses('secondary', 'md')}>
          Sign in now
        </Link>
      </StatusBlock>
    );
  }

  if (isError) {
    return (
      <StatusBlock
        icon={<XCircle className="h-12 w-12 text-rose-500" aria-hidden />}
        title="We couldn't verify your email"
        description={getErrorMessage(error, 'This link may have expired or already been used.')}
      >
        <ResendAction />
      </StatusBlock>
    );
  }

  // Pending, or the brief moment before the request starts.
  return (
    <StatusBlock
      icon={<Spinner className="h-8 w-8" />}
      title={isPending ? 'Verifying your email…' : 'Preparing verification…'}
      description="This only takes a moment."
    />
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthShell
      title="Verify your email"
      footer={
        <>
          Back to{' '}
          <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="flex justify-center py-6"><Spinner className="h-8 w-8" /></div>}>
        <VerifyEmailContent />
      </Suspense>
    </AuthShell>
  );
}
