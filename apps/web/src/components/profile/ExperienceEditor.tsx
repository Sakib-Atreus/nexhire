'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Briefcase } from 'lucide-react';
import { useMyExperience, useSaveExperience } from '@/hooks/useCandidate';
import { FormField, Input, Textarea } from '@/components/ui/Field';
import { experiencePeriod } from './CandidateProfileView';
import { ProfileListEditor, type EntryFormProps } from './ProfileListEditor';
import type { WorkExperience } from '@/types';

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

const schema = z
  .object({
    title: z.string().trim().min(1, 'Enter the job title').max(150, 'Keep it under 150 characters'),
    company: z.string().trim().min(1, 'Enter the company').max(150, 'Keep it under 150 characters'),
    location: z.string().trim().max(150, 'Keep it under 150 characters'),
    start: z.string().regex(MONTH, 'Choose the start month'),
    current: z.boolean(),
    end: z.string(),
    description: z.string().trim().max(3000, 'Keep it under 3,000 characters'),
  })
  .superRefine((v, ctx) => {
    if (v.current) return;
    if (!MONTH.test(v.end)) {
      ctx.addIssue({ code: 'custom', path: ['end'], message: 'Choose the end month, or tick "I currently work here"' });
    } else if (MONTH.test(v.start) && v.end < v.start) {
      ctx.addIssue({ code: 'custom', path: ['end'], message: "End date can't be before the start date" });
    }
  });

type FormValues = z.infer<typeof schema>;

/** "2023-02-01" → "2023-02" for <input type="month">. */
const toMonth = (date?: string | null) => (date ? date.slice(0, 7) : '');
/** "2023-02" → "2023-02-01". */
const fromMonth = (month: string) => `${month}-01`;

function ExperienceForm({ formId, initial, onSubmit }: EntryFormProps<WorkExperience>) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initial?.title ?? '',
      company: initial?.company ?? '',
      location: initial?.location ?? '',
      start: toMonth(initial?.startDate),
      current: initial ? !initial.endDate : false,
      end: toMonth(initial?.endDate),
      description: initial?.description ?? '',
    },
  });
  const current = watch('current');
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  return (
    <form
      id={formId}
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit((v) =>
        onSubmit({
          ...(initial?.id ? { id: initial.id } : {}),
          title: v.title,
          company: v.company,
          location: v.location || null,
          startDate: fromMonth(v.start),
          endDate: v.current ? null : fromMonth(v.end),
          description: v.description || null,
        })
      )}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Title" required error={errors.title?.message}>
          {(id) => <Input id={id} placeholder="Senior Frontend Engineer" invalid={!!errors.title} {...register('title')} />}
        </FormField>
        <FormField label="Company" required error={errors.company?.message}>
          {(id) => <Input id={id} placeholder="Acme Inc." invalid={!!errors.company} {...register('company')} />}
        </FormField>
      </div>
      <FormField label="Location" error={errors.location?.message}>
        {(id) => <Input id={id} placeholder="Dhaka, Bangladesh · Remote" {...register('location')} />}
      </FormField>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Start" required error={errors.start?.message}>
          {(id) => <Input id={id} type="month" max={thisMonth} invalid={!!errors.start} {...register('start')} />}
        </FormField>
        <FormField label="End" required={!current} error={current ? undefined : errors.end?.message}>
          {(id) => <Input id={id} type="month" disabled={current} invalid={!current && !!errors.end} {...register('end')} />}
        </FormField>
      </div>
      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-fg-secondary">
        <input type="checkbox" className="h-4 w-4 rounded border-line-strong text-primary-600 focus:ring-primary-500" {...register('current')} />
        I currently work here
      </label>
      <FormField label="Description" error={errors.description?.message} hint="What you worked on, your impact and the tools you used.">
        {(id) => <Textarea id={id} rows={5} className="resize-y" invalid={!!errors.description} {...register('description')} />}
      </FormField>
    </form>
  );
}

/** Work experience card on the candidate's profile page. */
export function ExperienceEditor() {
  const { data, isLoading, error, refetch, isRefetching } = useMyExperience();
  const save = useSaveExperience();

  return (
    <ProfileListEditor<WorkExperience>
      title="Work experience"
      description="Your roles, most recent first. Reorder with the arrows."
      icon={Briefcase}
      noun="role"
      emptyDescription="Add the roles you've held so recruiters can see your track record."
      max={30}
      items={data}
      isLoading={isLoading}
      error={error}
      onRetry={() => refetch()}
      retrying={isRefetching}
      save={(items) => save.mutateAsync(items)}
      saving={save.isPending}
      itemLabel={(e) => `${e.title} at ${e.company}`}
      renderItem={(e) => (
        <>
          <p className="font-semibold text-fg break-words">{e.title}</p>
          <p className="text-sm text-fg-secondary break-words">{e.company}{e.location ? ` · ${e.location}` : ''}</p>
          <p className="mt-0.5 text-xs text-fg-muted">{experiencePeriod(e)}</p>
          {e.description && <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-fg-tertiary">{e.description}</p>}
        </>
      )}
      Form={ExperienceForm}
    />
  );
}
