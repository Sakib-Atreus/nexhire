'use client';

import { Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Building2, Search } from 'lucide-react';
import { useRegister } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/format';
import { cn } from '@/lib/cn';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthAlert } from '@/components/auth/AuthAlert';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { FormField, Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100, 'First name is too long'),
  lastName: z.string().trim().min(1, 'Last name is required').max(100, 'Last name is too long'),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be 128 characters or fewer'),
  role: z.enum(['CANDIDATE', 'RECRUITER']),
});

type FormData = z.infer<typeof schema>;

const ROLE_OPTIONS = [
  { value: 'CANDIDATE', label: "I'm looking for a job", description: 'Find roles and track applications', Icon: Search },
  { value: 'RECRUITER', label: "I'm hiring", description: 'Post jobs and review applicants', Icon: Building2 },
] as const;

function RegisterForm() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role')?.toUpperCase() === 'RECRUITER' ? 'RECRUITER' : 'CANDIDATE';

  const { mutate: registerUser, isPending, error } = useRegister();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: initialRole },
  });

  const role = watch('role');

  return (
    <form onSubmit={handleSubmit((data) => registerUser(data))} className="space-y-5" noValidate>
      <fieldset>
        <legend className="block text-sm font-medium text-fg-secondary mb-2">How will you use NexHire?</legend>
        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3">
          {ROLE_OPTIONS.map(({ value, label, description, Icon }) => {
            const selected = role === value;
            return (
              <label
                key={value}
                className={cn(
                  'relative flex cursor-pointer flex-col gap-1 rounded-lg border p-3.5 transition-colors',
                  'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-500 has-[:focus-visible]:ring-offset-2',
                  selected
                    ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                    : 'border-line-strong bg-surface hover:bg-muted'
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value={value}
                  checked={selected}
                  onChange={() => setValue('role', value, { shouldValidate: true })}
                  className="sr-only"
                />
                <Icon className={cn('w-5 h-5', selected ? 'text-primary-600' : 'text-fg-subtle')} aria-hidden />
                <span className={cn('text-sm font-semibold', selected ? 'text-primary-900' : 'text-fg')}>
                  {label}
                </span>
                <span className="text-xs text-fg-muted">{description}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-4">
        <FormField label="First name" error={errors.firstName?.message}>
          {(id) => (
            <Input id={id} autoComplete="given-name" invalid={!!errors.firstName} {...register('firstName')} />
          )}
        </FormField>
        <FormField label="Last name" error={errors.lastName?.message}>
          {(id) => (
            <Input id={id} autoComplete="family-name" invalid={!!errors.lastName} {...register('lastName')} />
          )}
        </FormField>
      </div>

      <FormField
        label={role === 'RECRUITER' ? 'Work email' : 'Email'}
        error={errors.email?.message}
      >
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

      <FormField label="Password" error={errors.password?.message} hint="Use at least 8 characters.">
        {(id) => (
          <PasswordInput
            id={id}
            autoComplete="new-password"
            invalid={!!errors.password}
            {...register('password')}
          />
        )}
      </FormField>

      {error && <AuthAlert>{getErrorMessage(error, 'We could not create your account. Please try again.')}</AuthAlert>}

      <Button type="submit" size="lg" className="w-full" loading={isPending}>
        {isPending ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Join as a job seeker or as a recruiter."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <Suspense>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
