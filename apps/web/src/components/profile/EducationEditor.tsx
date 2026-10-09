'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GraduationCap } from 'lucide-react';
import { useMyEducation, useSaveEducation } from '@/hooks/useCandidate';
import { FormField, Input, Textarea } from '@/components/ui/Field';
import { educationPeriod } from './CandidateProfileView';
import { ProfileListEditor, type EntryFormProps } from './ProfileListEditor';
import type { Education } from '@/types';

const MIN_YEAR = 1950;
const MAX_YEAR = 2100;

const year = z
  .string()
  .trim()
  .refine((v) => v === '' || (/^\d{4}$/.test(v) && +v >= MIN_YEAR && +v <= MAX_YEAR), `Enter a year between ${MIN_YEAR} and ${MAX_YEAR}`);

const schema = z
  .object({
    school: z.string().trim().min(1, 'Enter the school').max(150, 'Keep it under 150 characters'),
    degree: z.string().trim().max(150, 'Keep it under 150 characters'),
    fieldOfStudy: z.string().trim().max(150, 'Keep it under 150 characters'),
    startYear: year,
    endYear: year,
    description: z.string().trim().max(2000, 'Keep it under 2,000 characters'),
  })
  .refine((v) => !v.startYear || !v.endYear || +v.endYear >= +v.startYear, {
    path: ['endYear'],
    message: "End year can't be before the start year",
  });

type FormValues = z.infer<typeof schema>;

function EducationForm({ formId, initial, onSubmit }: EntryFormProps<Education>) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      school: initial?.school ?? '',
      degree: initial?.degree ?? '',
      fieldOfStudy: initial?.fieldOfStudy ?? '',
      startYear: initial?.startYear ? String(initial.startYear) : '',
      endYear: initial?.endYear ? String(initial.endYear) : '',
      description: initial?.description ?? '',
    },
  });

  return (
    <form
      id={formId}
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit((v) =>
        onSubmit({
          ...(initial?.id ? { id: initial.id } : {}),
          school: v.school,
          degree: v.degree || null,
          fieldOfStudy: v.fieldOfStudy || null,
          startYear: v.startYear ? Number(v.startYear) : null,
          endYear: v.endYear ? Number(v.endYear) : null,
          description: v.description || null,
        })
      )}
    >
      <FormField label="School" required error={errors.school?.message}>
        {(id) => <Input id={id} placeholder="University of Dhaka" invalid={!!errors.school} {...register('school')} />}
      </FormField>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Degree" error={errors.degree?.message}>
          {(id) => <Input id={id} placeholder="BSc" invalid={!!errors.degree} {...register('degree')} />}
        </FormField>
        <FormField label="Field of study" error={errors.fieldOfStudy?.message}>
          {(id) => <Input id={id} placeholder="Computer Science" invalid={!!errors.fieldOfStudy} {...register('fieldOfStudy')} />}
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Start year" error={errors.startYear?.message}>
          {(id) => (
            <Input id={id} type="number" inputMode="numeric" min={MIN_YEAR} max={MAX_YEAR} placeholder="2018"
              invalid={!!errors.startYear} {...register('startYear')} />
          )}
        </FormField>
        <FormField label="End year" hint="Or expected" error={errors.endYear?.message}>
          {(id) => (
            <Input id={id} type="number" inputMode="numeric" min={MIN_YEAR} max={MAX_YEAR} placeholder="2022"
              invalid={!!errors.endYear} {...register('endYear')} />
          )}
        </FormField>
      </div>
      <FormField label="Description" error={errors.description?.message} hint="Honours, activities or a thesis worth mentioning.">
        {(id) => <Textarea id={id} rows={4} className="resize-y" invalid={!!errors.description} {...register('description')} />}
      </FormField>
    </form>
  );
}

/** Education card on the candidate's profile page. */
export function EducationEditor() {
  const { data, isLoading, error, refetch, isRefetching } = useMyEducation();
  const save = useSaveEducation();

  return (
    <ProfileListEditor<Education>
      title="Education"
      description="Degrees, diplomas and certifications."
      icon={GraduationCap}
      noun="education"
      emptyDescription="Add your schools and degrees."
      max={30}
      items={data}
      isLoading={isLoading}
      error={error}
      onRetry={() => refetch()}
      retrying={isRefetching}
      save={(items) => save.mutateAsync(items)}
      saving={save.isPending}
      itemLabel={(e) => e.school}
      renderItem={(e) => (
        <>
          <p className="font-semibold text-fg break-words">{e.school}</p>
          {(e.degree || e.fieldOfStudy) && (
            <p className="text-sm text-fg-secondary break-words">{[e.degree, e.fieldOfStudy].filter(Boolean).join(', ')}</p>
          )}
          {educationPeriod(e) && <p className="mt-0.5 text-xs text-fg-muted">{educationPeriod(e)}</p>}
          {e.description && <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-fg-tertiary">{e.description}</p>}
        </>
      )}
      Form={EducationForm}
    />
  );
}
