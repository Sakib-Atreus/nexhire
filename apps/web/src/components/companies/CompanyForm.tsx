'use client';

import { useEffect, useRef, type ChangeEvent } from 'react';
import { Upload } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Company, CompanyInput } from '@/types';
import { cn } from '@/lib/cn';
import { COMPANY_SIZES, COMPANY_SIZE_LABELS } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select, Textarea } from '@/components/ui/Field';
import { CompanyLogo } from '@/components/ui/CompanyLogo';
import { useFileUpload } from '@/hooks/useFileUpload';
import { toast } from '@/store/toastStore';
import { getErrorMessage } from '@/lib/format';

const DESCRIPTION_MAX = 5000;

const httpsUrl = (label: string) =>
  z
    .string()
    .trim()
    .max(500, `${label} must be 500 characters or fewer`)
    .refine((v) => {
      if (!v) return true;
      try {
        const u = new URL(v);
        return u.protocol === 'https:' && !!u.hostname;
      } catch {
        return false;
      }
    }, `${label} must be a full https:// address`);

const schema = z.object({
  name: z.string().trim().min(1, 'Enter the company name').max(255, 'Name must be 255 characters or fewer'),
  website: httpsUrl('Website'),
  logoUrl: z
    .string()
    .trim()
    .max(500, 'Logo URL must be 500 characters or fewer')
    .refine((v) => !v || /^https?:\/\/.+/.test(v), 'Logo must be a full web address, or upload an image'),
  industry: z.string().trim().max(100, 'Industry must be 100 characters or fewer'),
  size: z.union([z.enum(COMPANY_SIZES), z.literal('')]),
  headquarters: z.string().trim().max(255, 'Headquarters must be 255 characters or fewer'),
  description: z.string().max(DESCRIPTION_MAX, 'Keep the description under 5,000 characters'),
});

type FormValues = z.infer<typeof schema>;

function toValues(company?: Company | null): FormValues {
  const size = company?.size ?? '';
  return {
    name: company?.name ?? '',
    website: company?.website ?? '',
    logoUrl: company?.logoUrl ?? '',
    industry: company?.industry ?? '',
    size: (COMPANY_SIZES as readonly string[]).includes(size) ? (size as FormValues['size']) : '',
    headquarters: company?.headquarters ?? '',
    description: company?.description ?? '',
  };
}

function toInput(v: FormValues): CompanyInput {
  const opt = (s: string) => (s.trim() ? s.trim() : undefined);
  return {
    name: v.name.trim(),
    website: opt(v.website),
    logoUrl: opt(v.logoUrl),
    industry: opt(v.industry),
    size: v.size || undefined,
    headquarters: opt(v.headquarters),
    description: opt(v.description),
  };
}

/**
 * Company profile form used both to create a company and to edit it.
 * `onSubmit` resolves to true on success so the form can mark itself clean.
 */
export function CompanyForm({ company, mode, submitting, onSubmit }: {
  company?: Company | null;
  mode: 'create' | 'edit';
  submitting?: boolean;
  onSubmit: (input: CompanyInput) => Promise<boolean>;
}) {
  const {
    register, handleSubmit, reset, watch, setValue, formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toValues(company) });

  // Re-sync when the saved company changes (e.g. a teammate edited it and the query refetched)
  // but never clobber the user's in-progress edits.
  useEffect(() => {
    if (!isDirty) reset(toValues(company));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company]);

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (mode !== 'edit' || !isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [mode, isDirty]);

  const name = watch('name');
  const logoUrl = watch('logoUrl');
  const description = watch('description') ?? '';
  const logoValid = !errors.logoUrl && /^https?:\/\/.+/.test(logoUrl?.trim() ?? '');
  const upload = useFileUpload();
  const fileRef = useRef<HTMLInputElement>(null);

  function onLogoFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Choose an image', 'PNG, JPG or WebP work best.');
    if (file.size > 5 * 1024 * 1024) return toast.error('Image is too large', 'Use an image under 5 MB.');
    upload.mutate(file, {
      onSuccess: ({ url }) => setValue('logoUrl', url, { shouldDirty: true, shouldValidate: true }),
      onError: (err) => toast.error('Couldn’t upload the logo', getErrorMessage(err)),
    });
  }

  const submit = handleSubmit(async (values) => {
    const ok = await onSubmit(toInput(values));
    if (ok && mode === 'edit') reset(values);
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="Company name" required error={errors.name?.message} className="md:col-span-2">
          {(id) => <Input id={id} {...register('name')} invalid={!!errors.name} autoComplete="organization" placeholder="e.g. Acme Inc." />}
        </FormField>

        <FormField label="Website" error={errors.website?.message} hint="Full address, e.g. https://acme.com">
          {(id) => <Input id={id} type="url" inputMode="url" {...register('website')} invalid={!!errors.website} placeholder="https://" />}
        </FormField>

        <FormField label="Logo" error={errors.logoUrl?.message} hint="A square image works best (PNG, JPG or WebP, up to 5 MB).">
          {(id) => (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <CompanyLogo
                  key={logoValid ? logoUrl : 'fallback'}
                  name={name?.trim() || 'Company'}
                  src={logoValid ? logoUrl.trim() : null}
                  size="md"
                />
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={onLogoFile} tabIndex={-1} aria-hidden />
                <Button type="button" variant="secondary" size="sm" loading={upload.isPending} onClick={() => fileRef.current?.click()}>
                  {!upload.isPending && <Upload className="w-3.5 h-3.5" aria-hidden />}
                  {logoValid ? 'Replace logo' : 'Upload logo'}
                </Button>
                {logoValid && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setValue('logoUrl', '', { shouldDirty: true, shouldValidate: true })}>
                    Remove
                  </Button>
                )}
              </div>
              <Input id={id} type="url" inputMode="url" {...register('logoUrl')} invalid={!!errors.logoUrl} placeholder="Or paste an image link (https://…)" className="min-w-0 text-xs" />
            </div>
          )}
        </FormField>

        <FormField label="Industry" error={errors.industry?.message}>
          {(id) => <Input id={id} {...register('industry')} invalid={!!errors.industry} placeholder="e.g. Software, Healthcare" />}
        </FormField>

        <FormField label="Company size" error={errors.size?.message}>
          {(id) => (
            <Select id={id} {...register('size')} invalid={!!errors.size}>
              <option value="">Not specified</option>
              {COMPANY_SIZES.map((s) => <option key={s} value={s}>{COMPANY_SIZE_LABELS[s]}</option>)}
            </Select>
          )}
        </FormField>

        <FormField label="Headquarters" error={errors.headquarters?.message} className="md:col-span-2">
          {(id) => <Input id={id} {...register('headquarters')} invalid={!!errors.headquarters} placeholder="e.g. Berlin, Germany" />}
        </FormField>

        <FormField label="Description" error={errors.description?.message} className="md:col-span-2">
          {(id) => (
            <div>
              <Textarea
                id={id}
                rows={7}
                {...register('description')}
                invalid={!!errors.description}
                placeholder="What does your company do, and what is it like to work there?"
                aria-describedby={`${id}-count`}
              />
              <p
                id={`${id}-count`}
                className={cn('mt-1 text-right text-xs', description.length > DESCRIPTION_MAX ? 'text-rose-600 font-medium' : 'text-fg-subtle')}
              >
                {description.length.toLocaleString('en-US')} / {DESCRIPTION_MAX.toLocaleString('en-US')}
              </p>
            </div>
          )}
        </FormField>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-line-subtle pt-5 sm:flex-row sm:items-center sm:justify-end">
        {mode === 'edit' && (
          <p className="text-sm text-fg-muted sm:mr-auto" aria-live="polite">
            {isDirty ? <span className="font-medium text-amber-700">You have unsaved changes</span> : 'All changes saved'}
          </p>
        )}
        {mode === 'edit' && (
          <Button variant="secondary" disabled={!isDirty || submitting} onClick={() => reset(toValues(company))}>
            Discard
          </Button>
        )}
        <Button type="submit" loading={submitting} disabled={mode === 'edit' && !isDirty}>
          {mode === 'create' ? 'Create company' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
