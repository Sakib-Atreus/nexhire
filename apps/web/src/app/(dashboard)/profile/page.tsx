'use client';

import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Camera, CheckCircle2, Circle, LinkIcon, Plus, Trash2 } from 'lucide-react';
import { useMe, useUpdateProfile } from '@/hooks/useProfile';
import { useFileUpload } from '@/hooks/useFileUpload';
import { SkillsInput } from '@/components/ui/SkillsInput';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { FormField, Input, Textarea } from '@/components/ui/Field';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { Toggle } from '@/components/ui/Toggle';
import { getProfileCompleteness } from '@/components/profile/completeness';
import { ROLE_LABELS, ROLE_STYLES } from '@/lib/constants';
import { formatMonthYear, getErrorMessage } from '@/lib/format';
import { toast } from '@/store/toastStore';
import type { User } from '@/types';

interface ProfileForm {
  firstName: string;
  lastName: string;
  phone: string;
  headline: string;
  bio: string;
  skills: string[];
  portfolioLinks: { url: string }[];
  openToWork: boolean;
}

const MAX_AVATAR_BYTES = 10 * 1024 * 1024;

function toForm(user: User): ProfileForm {
  return {
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    phone: user.phone ?? '',
    headline: user.headline ?? '',
    bio: user.bio ?? '',
    skills: user.skills ?? [],
    portfolioLinks: (user.portfolioLinks ?? []).map((url) => ({ url })),
    openToWork: user.openToWork ?? false,
  };
}

function ProfileSkeleton() {
  return (
    <div>
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-72 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 space-y-4">
          <Skeleton className="w-24 h-24 rounded-full mx-auto" />
          <Skeleton className="h-4 w-3/4 mx-auto" />
          <Skeleton className="h-20" />
        </Card>
        <Card className="lg:col-span-2 p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
        </Card>
      </div>
    </div>
  );
}

/** Avatar with a compact "Change photo" button that uploads immediately. */
function PhotoPicker({ user }: { user: User }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const upload = useFileUpload();
  const update = useUpdateProfile();
  const busy = upload.isPending || update.isPending;

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Choose an image file', 'JPG, PNG or WebP images are supported.');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error('Image is too large', 'Choose an image under 10 MB.');
      return;
    }
    setPreview(URL.createObjectURL(file));
    upload.mutate(file, {
      onSuccess: ({ url }) =>
        update.mutate(
          { avatarUrl: url },
          {
            onSuccess: () => { setPreview(null); toast.success('Profile photo updated'); },
            onError: (err) => { setPreview(null); toast.error("Couldn't save your photo", getErrorMessage(err)); },
          }
        ),
      onError: (err) => { setPreview(null); toast.error('Upload failed', getErrorMessage(err)); },
    });
  }

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative">
        <Avatar name={user.fullName} src={preview ?? user.avatarUrl} size="xl" className="ring-4 ring-white shadow-md" />
        {busy && (
          <span className="absolute inset-0 rounded-full bg-white/60 flex items-center justify-center text-xs font-medium text-slate-700">
            Uploading…
          </span>
        )}
      </div>
      <Button variant="secondary" size="sm" className="mt-4" onClick={() => inputRef.current?.click()} loading={busy}>
        {!busy && <Camera className="w-3.5 h-3.5" aria-hidden />}
        {user.avatarUrl ? 'Change photo' : 'Add photo'}
      </Button>
      <p className="mt-1.5 text-xs text-slate-500">JPG, PNG or WebP, up to 10 MB</p>
      <input ref={inputRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden onChange={onChange} />
    </div>
  );
}

export default function ProfilePage() {
  const { data: user, isLoading, isError, error, refetch, isRefetching } = useMe();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const openToWorkLabelId = useId();

  const {
    register, handleSubmit, reset, watch, setValue, control,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    defaultValues: { firstName: '', lastName: '', phone: '', headline: '', bio: '', skills: [], portfolioLinks: [], openToWork: false },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'portfolioLinks' });

  useEffect(() => {
    // keepDirtyValues: a background refetch (e.g. after a photo upload) must not wipe unsaved edits.
    if (user) reset(toForm(user), { keepDirtyValues: true });
  }, [user, reset]);

  const isCandidate = user?.role === 'CANDIDATE';
  const values = watch();

  function onSubmit(v: ProfileForm) {
    const payload: Partial<User> = {
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim(),
      phone: v.phone.trim(),
      headline: v.headline.trim(),
      bio: v.bio.trim(),
    };
    if (isCandidate) {
      payload.skills = v.skills;
      payload.portfolioLinks = v.portfolioLinks.map((p) => p.url.trim()).filter(Boolean);
      payload.openToWork = v.openToWork;
    }
    updateProfile(payload, {
      onSuccess: (updated) => {
        reset(toForm(updated));
        toast.success('Profile saved');
      },
      onError: (err) => toast.error("Couldn't save your profile", getErrorMessage(err)),
    });
  }

  if (isError) {
    return (
      <Card className="max-w-md mx-auto mt-10">
        <ErrorState title="We couldn't load your profile" error={error} onRetry={() => refetch()} retrying={isRefetching} />
      </Card>
    );
  }

  if (isLoading || !user) return <ProfileSkeleton />;

  // Live completeness reflects unsaved edits too, so the meter responds as the form is filled in.
  const completeness = getProfileCompleteness({
    avatarUrl: user.avatarUrl,
    headline: values.headline,
    bio: values.bio,
    skills: values.skills,
    phone: values.phone,
    portfolioLinks: values.portfolioLinks?.map((p) => p.url),
  });
  const portfolioError = errors.portfolioLinks?.find?.((e) => e?.url)?.url?.message;

  return (
    <div>
      <PageHeader
        title="Profile"
        description={isCandidate ? 'Recruiters see this information when you apply for a job.' : 'Your name and details as candidates and teammates see them.'}
      />

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left column */}
          <div className="space-y-6">
            <Card className="p-6">
              <PhotoPicker user={user} />
              <div className="mt-5 pt-5 border-t border-slate-100 text-center">
                <p className="font-semibold text-slate-900">{user.fullName}</p>
                <p className="text-sm text-slate-500 break-all">{user.email}</p>
                {user.headline && <p className="mt-1 text-sm text-slate-700">{user.headline}</p>}
              </div>
              <dl className="mt-5 pt-5 border-t border-slate-100 space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">Account type</dt>
                  <dd><Badge tone={ROLE_STYLES[user.role]}>{ROLE_LABELS[user.role]}</Badge></dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">Email</dt>
                  <dd>
                    {user.emailVerified ? (
                      <Badge tone="bg-emerald-50 text-emerald-700 ring-emerald-600/20">Verified</Badge>
                    ) : (
                      <Badge tone="bg-amber-50 text-amber-700 ring-amber-600/20">Not verified</Badge>
                    )}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">Member since</dt>
                  <dd className="font-medium text-slate-700">{formatMonthYear(user.createdAt)}</dd>
                </div>
              </dl>
            </Card>

            {isCandidate && (
              <Card className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-slate-900">Profile strength</h2>
                  <span className="text-sm font-semibold text-primary-700 tabular-nums">{completeness.percent}%</span>
                </div>
                <div
                  className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden"
                  role="progressbar"
                  aria-label="Profile completeness"
                  aria-valuenow={completeness.percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="h-full rounded-full bg-primary-600 transition-all" style={{ width: `${completeness.percent}%` }} />
                </div>
                <ul className="mt-4 space-y-2 text-sm">
                  {completeness.items.map((item) => (
                    <li key={item.key} className={item.done ? 'flex items-center gap-2 text-slate-500' : 'flex items-center gap-2 text-slate-800'}>
                      {item.done
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" aria-hidden />
                        : <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" aria-hidden />}
                      {item.label}
                      <span className="sr-only">{item.done ? '— complete' : '— missing'}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {isCandidate && (
              <Card className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p id={openToWorkLabelId} className="text-sm font-semibold text-slate-900">Open to work</p>
                    <p className="text-xs text-slate-500 mt-0.5">Show recruiters that you&apos;re actively looking.</p>
                  </div>
                  <Toggle
                    checked={values.openToWork}
                    onChange={(checked) => setValue('openToWork', checked, { shouldDirty: true })}
                    labelledBy={openToWorkLabelId}
                  />
                </div>
                <p className="mt-3 text-xs text-slate-500">Saved with the rest of your profile.</p>
              </Card>
            )}
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader title="Basic information" />
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="First name" required error={errors.firstName?.message}>
                    {(id) => (
                      <Input id={id} autoComplete="given-name" invalid={!!errors.firstName}
                        {...register('firstName', { validate: (v) => !!v.trim() || 'Enter your first name' })} />
                    )}
                  </FormField>
                  <FormField label="Last name" required error={errors.lastName?.message}>
                    {(id) => (
                      <Input id={id} autoComplete="family-name" invalid={!!errors.lastName}
                        {...register('lastName', { validate: (v) => !!v.trim() || 'Enter your last name' })} />
                    )}
                  </FormField>
                </div>

                <FormField label="Phone" hint="Only shared with recruiters you apply to.">
                  {(id) => <Input id={id} type="tel" autoComplete="tel" placeholder="+1 555 000 0000" {...register('phone')} />}
                </FormField>

                <FormField label="Headline" hint={isCandidate ? 'Your current role or the role you want, e.g. "Senior React Developer".' : 'Your title, e.g. "Talent Partner at Acme".'}>
                  {(id) => <Input id={id} maxLength={120} {...register('headline')} />}
                </FormField>

                <FormField label={isCandidate ? 'About you' : 'Bio'}>
                  {(id) => (
                    <Textarea
                      id={id}
                      rows={5}
                      className="resize-y"
                      placeholder={isCandidate ? 'Your experience, strengths and what you are looking for next.' : 'A short introduction for candidates.'}
                      {...register('bio')}
                    />
                  )}
                </FormField>
              </div>
            </Card>

            {isCandidate && (
              <Card>
                <CardHeader title="Skills" description="Add the tools, languages and strengths recruiters search for." />
                <div className="p-5">
                  <SkillsInput
                    value={values.skills}
                    onChange={(updated) => setValue('skills', updated, { shouldDirty: true })}
                    placeholder="e.g. React, TypeScript, Node.js"
                  />
                </div>
              </Card>
            )}

            {isCandidate && (
              <Card>
                <CardHeader
                  title="Portfolio links"
                  description="GitHub, personal site, Behance, LinkedIn…"
                  action={
                    <Button variant="ghost" size="sm" onClick={() => append({ url: '' })}>
                      <Plus className="w-3.5 h-3.5" aria-hidden /> Add link
                    </Button>
                  }
                />
                <div className="p-5">
                  {fields.length === 0 ? (
                    <p className="text-sm text-slate-500">No links yet.</p>
                  ) : (
                    <ul className="space-y-2.5">
                      {fields.map((field, index) => (
                        <li key={field.id} className="flex items-center gap-2">
                          <LinkIcon className="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden />
                          <Input
                            type="url"
                            aria-label={`Portfolio link ${index + 1}`}
                            placeholder="https://github.com/you"
                            invalid={!!errors.portfolioLinks?.[index]?.url}
                            className="flex-1 min-w-0"
                            {...register(`portfolioLinks.${index}.url`, {
                              pattern: { value: /^https?:\/\/\S+$/, message: 'Links must start with http:// or https://' },
                            })}
                          />
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            aria-label={`Remove portfolio link ${index + 1}`}
                            className="flex-shrink-0 p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {portfolioError && <p className="mt-2 text-xs text-rose-600" role="alert">{portfolioError}</p>}
                </div>
              </Card>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
              {isDirty && <p className="text-sm text-slate-500 sm:mr-auto">You have unsaved changes.</p>}
              <Button variant="secondary" onClick={() => reset(toForm(user))} disabled={!isDirty || isPending}>
                Discard
              </Button>
              <Button type="submit" loading={isPending} disabled={!isDirty}>
                Save changes
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
