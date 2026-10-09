'use client';

import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Camera, LinkIcon, MapPin, Plus, Trash2 } from 'lucide-react';
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
import { CompletenessCard } from '@/components/profile/CompletenessCard';
import { EducationEditor } from '@/components/profile/EducationEditor';
import { ExperienceEditor } from '@/components/profile/ExperienceEditor';
import { PublicProfileCard } from '@/components/profile/PublicProfileCard';
import { ResumeCard } from '@/components/profile/ResumeCard';
import { cn } from '@/lib/cn';
import { ROLE_LABELS, ROLE_STYLES } from '@/lib/constants';
import { formatMonthYear, getErrorMessage } from '@/lib/format';
import { toast } from '@/store/toastStore';
import type { User } from '@/types';

interface ProfileForm {
  firstName: string;
  lastName: string;
  phone: string;
  location: string;
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
    location: user.location ?? '',
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
        <Avatar name={user.fullName} src={preview ?? user.avatarUrl} size="xl" className="ring-4 ring-surface shadow-md" />
        {busy && (
          <span className="absolute inset-0 rounded-full bg-surface/60 flex items-center justify-center text-xs font-medium text-fg-secondary">
            Uploading…
          </span>
        )}
      </div>
      <Button variant="secondary" size="sm" className="mt-4" onClick={() => inputRef.current?.click()} loading={busy}>
        {!busy && <Camera className="w-3.5 h-3.5" aria-hidden />}
        {user.avatarUrl ? 'Change photo' : 'Add photo'}
      </Button>
      <p className="mt-1.5 text-xs text-fg-muted">JPG, PNG or WebP, up to 10 MB</p>
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
    defaultValues: { firstName: '', lastName: '', phone: '', location: '', headline: '', bio: '', skills: [], portfolioLinks: [], openToWork: false },
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
      location: v.location.trim(),
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

  const portfolioError = errors.portfolioLinks?.find?.((e) => e?.url)?.url?.message;

  return (
    <div>
      <PageHeader
        title="Profile"
        description={isCandidate ? 'Recruiters see this information when you apply for a job.' : 'Your name and details as candidates and teammates see them.'}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left column */}
          <div className="space-y-6">
            <Card className="p-6">
              <PhotoPicker user={user} />
              <div className="mt-5 pt-5 border-t border-line-subtle text-center">
                <p className="font-semibold text-fg">{user.fullName}</p>
                <p className="text-sm text-fg-muted break-all">{user.email}</p>
                {user.headline && <p className="mt-1 text-sm text-fg-secondary">{user.headline}</p>}
                {user.location && (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-fg-muted">
                    <MapPin className="w-3.5 h-3.5" aria-hidden />{user.location}
                  </p>
                )}
              </div>
              <dl className="mt-5 pt-5 border-t border-line-subtle space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-fg-muted">Account type</dt>
                  <dd><Badge tone={ROLE_STYLES[user.role]}>{ROLE_LABELS[user.role]}</Badge></dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-fg-muted">Email</dt>
                  <dd>
                    {user.emailVerified ? (
                      <Badge tone="bg-emerald-50 text-emerald-700 ring-emerald-600/20">Verified</Badge>
                    ) : (
                      <Badge tone="bg-amber-50 text-amber-700 ring-amber-600/20">Not verified</Badge>
                    )}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-fg-muted">Member since</dt>
                  <dd className="font-medium text-fg-secondary">{formatMonthYear(user.createdAt)}</dd>
                </div>
              </dl>
            </Card>

            {isCandidate && (
              // Live values so the meter responds to unsaved edits too.
              <CompletenessCard
                fields={{
                  avatarUrl: user.avatarUrl,
                  resumeUrl: user.resumeUrl,
                  headline: values.headline,
                  location: values.location,
                  bio: values.bio,
                  skills: values.skills,
                  phone: values.phone,
                  portfolioLinks: values.portfolioLinks?.map((p) => p.url),
                }}
              />
            )}

            {isCandidate && <ResumeCard user={user} />}

            {isCandidate && <PublicProfileCard user={user} />}

            {isCandidate && (
              <Card className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p id={openToWorkLabelId} className="text-sm font-semibold text-fg">Open to work</p>
                    <p className="text-xs text-fg-muted mt-0.5">Show recruiters that you&apos;re actively looking.</p>
                  </div>
                  <Toggle
                    checked={values.openToWork}
                    onChange={(checked) => setValue('openToWork', checked, { shouldDirty: true })}
                    labelledBy={openToWorkLabelId}
                  />
                </div>
                <p className="mt-3 text-xs text-fg-muted">Saved with the rest of your profile.</p>
              </Card>
            )}
          </div>

          {/* Main column. Experience and education save on their own; everything else saves with this form. */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="lg:col-span-2 space-y-6 min-w-0">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Location" hint="City and country, or Remote.">
                    {(id) => <Input id={id} autoComplete="address-level2" maxLength={150} placeholder="Dhaka, Bangladesh" {...register('location')} />}
                  </FormField>
                  <FormField label="Phone" hint={isCandidate ? 'Only shared with recruiters you apply to.' : undefined}>
                    {(id) => <Input id={id} type="tel" autoComplete="tel" placeholder="+1 555 000 0000" {...register('phone')} />}
                  </FormField>
                </div>

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

            {isCandidate && <ExperienceEditor />}

            {isCandidate && <EducationEditor />}

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
                    <p className="text-sm text-fg-muted">No links yet.</p>
                  ) : (
                    <ul className="space-y-2.5">
                      {fields.map((field, index) => (
                        <li key={field.id} className="flex items-center gap-2">
                          <LinkIcon className="w-4 h-4 text-fg-subtle flex-shrink-0" aria-hidden />
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
                            className="flex-shrink-0 p-2 rounded-lg text-fg-subtle hover:text-rose-600 hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
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

            <div
              className={cn(
                'flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3',
                isDirty && 'sticky bottom-20 lg:bottom-4 z-10 rounded-xl border border-line bg-surface/95 p-3 shadow-lg backdrop-blur'
              )}
            >
              {isDirty && <p className="text-sm text-fg-muted sm:mr-auto sm:pl-1">You have unsaved changes.</p>}
              <Button variant="secondary" onClick={() => reset(toForm(user))} disabled={!isDirty || isPending}>
                Discard
              </Button>
              <Button type="submit" loading={isPending} disabled={!isDirty}>
                Save changes
              </Button>
            </div>
          </form>
      </div>
    </div>
  );
}
