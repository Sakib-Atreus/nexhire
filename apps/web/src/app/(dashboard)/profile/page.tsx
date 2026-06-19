'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { User2, Plus, Trash2, LinkIcon } from 'lucide-react';
import { useMe, useUpdateProfile } from '@/hooks/useProfile';
import { FileUpload } from '@/components/ui/FileUpload';
import { SkillsInput } from '@/components/ui/SkillsInput';
import type { User } from '@/types';

// ─── Form shape ───────────────────────────────────────────────────
interface ProfileForm {
  firstName: string;
  lastName: string;
  phone: string;
  headline: string;
  bio: string;
  skills: string[];
  portfolioLinks: { url: string }[];
}

// ─── Loading skeleton ─────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 bg-slate-200 rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
          <div className="w-24 h-24 rounded-full bg-slate-200 mx-auto" />
          <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto" />
          <div className="h-28 bg-slate-100 rounded-lg" />
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Avatar circle ────────────────────────────────────────────────
function Avatar({ user }: { user: User }) {
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.fullName}
        className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-md mx-auto"
      />
    );
  }
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
  return (
    <div className="w-24 h-24 rounded-full bg-primary-600 flex items-center justify-center ring-4 ring-white shadow-md mx-auto">
      <span className="text-2xl font-bold text-white">{initials}</span>
    </div>
  );
}

// ─── Input helper ─────────────────────────────────────────────────
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition';

// ─── Page ─────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { data: user, isLoading } = useMe();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const [toast, setToast] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<ProfileForm>({
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      headline: '',
      bio: '',
      skills: [],
      portfolioLinks: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'portfolioLinks' });

  // Pre-fill form once user data loads
  useEffect(() => {
    if (!user) return;
    reset({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      phone: user.phone ?? '',
      headline: user.headline ?? '',
      bio: user.bio ?? '',
      skills: user.skills ?? [],
      portfolioLinks: (user.portfolioLinks ?? []).map((url) => ({ url })),
    });
  }, [user, reset]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function onSubmit(values: ProfileForm) {
    updateProfile(
      {
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone || undefined,
        headline: values.headline || undefined,
        bio: values.bio || undefined,
        skills: values.skills,
        portfolioLinks: values.portfolioLinks.map((p) => p.url).filter(Boolean),
      },
      {
        onSuccess: () => showToast('Profile updated successfully!'),
      }
    );
  }

  function handleAvatarUpload(url: string) {
    updateProfile({ avatarUrl: url });
  }

  const skills = watch('skills');

  if (isLoading || !user) return <ProfileSkeleton />;

  return (
    <div className="pb-20 lg:pb-0">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
          <User2 className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage your personal information and public presence.</p>
        </div>
      </div>

      {/* Success toast */}
      {toast && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-green-700 text-sm font-medium">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {toast}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left column: avatar + account info ── */}
          <div className="space-y-4">
            {/* Avatar card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center space-y-4">
              <Avatar user={user} />
              <div>
                <p className="font-semibold text-slate-800">{user.fullName}</p>
                <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
                {user.headline && (
                  <p className="text-xs text-primary-600 mt-1 font-medium">{user.headline}</p>
                )}
              </div>
              <FileUpload
                onUpload={handleAvatarUpload}
                accept="image/*"
                label="Upload Photo"
                hint="JPG, PNG or WebP · max 5 MB"
                currentUrl={user.avatarUrl}
              />
            </div>

            {/* Account info card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-semibold text-slate-700">Account Info</h2>
              <div className="space-y-2 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Role</span>
                  <span className="font-medium text-slate-700 capitalize">{user.role.toLowerCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Email verified</span>
                  <span className={user.emailVerified ? 'text-green-600 font-medium' : 'text-yellow-600 font-medium'}>
                    {user.emailVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Member since</span>
                  <span className="font-medium text-slate-700">
                    {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right column: editable fields ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Basic info card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
              <h2 className="text-base font-semibold text-slate-800">Basic Information</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="First Name" error={errors.firstName?.message}>
                  <input
                    {...register('firstName', { required: 'First name is required' })}
                    className={inputCls}
                    placeholder="Jane"
                  />
                </Field>
                <Field label="Last Name" error={errors.lastName?.message}>
                  <input
                    {...register('lastName', { required: 'Last name is required' })}
                    className={inputCls}
                    placeholder="Smith"
                  />
                </Field>
              </div>

              <Field label="Phone">
                <input
                  {...register('phone')}
                  className={inputCls}
                  placeholder="+1 (555) 000-0000"
                  type="tel"
                />
              </Field>

              <Field label="Headline">
                <input
                  {...register('headline')}
                  className={inputCls}
                  placeholder="e.g. Senior React Developer"
                />
              </Field>

              <Field label="Bio">
                <textarea
                  {...register('bio')}
                  rows={4}
                  className={inputCls + ' resize-none'}
                  placeholder="Tell employers a bit about yourself, your experience, and what you're looking for."
                />
              </Field>
            </div>

            {/* Skills card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <h2 className="text-base font-semibold text-slate-800">Skills</h2>
              <SkillsInput
                value={skills}
                onChange={(updated) => setValue('skills', updated, { shouldDirty: true })}
                placeholder="e.g. React, TypeScript, Node.js…"
              />
            </div>

            {/* Portfolio links card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-800">Portfolio Links</h2>
                <button
                  type="button"
                  onClick={() => append({ url: '' })}
                  className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Link
                </button>
              </div>

              {fields.length === 0 ? (
                <div className="text-center py-6 text-slate-400 border-2 border-dashed border-slate-100 rounded-lg">
                  <LinkIcon className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                  <p className="text-xs">No portfolio links yet. Click "Add Link" to add one.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                        <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <input
                        {...register(`portfolioLinks.${index}.url`, {
                          pattern: {
                            value: /^https?:\/\/.+/,
                            message: 'Enter a valid URL starting with http(s)://',
                          },
                        })}
                        className={inputCls + ' flex-1'}
                        placeholder="https://github.com/yourprofile"
                        type="url"
                      />
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        aria-label="Remove link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {/* Field-level errors */}
                  {errors.portfolioLinks && (
                    <p className="text-xs text-red-500">
                      {errors.portfolioLinks.find?.((e) => e?.url)?.url?.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Save button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                {isPending ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Saving…
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
