'use client';

import Link from 'next/link';
import { Controller, useFieldArray, useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import type { Job, JobStatus } from '@/types';
import type { JobPayload } from '@/hooks/useJobs';
import { Button, buttonClasses } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { FormField, Input, Select, Textarea } from '@/components/ui/Field';
import { CompanyLogo } from '@/components/ui/CompanyLogo';
import { SkillsInput } from '@/components/ui/SkillsInput';
import {
  CURRENCIES,
  EXPERIENCE_OPTIONS,
  JOB_STATUS_LABELS,
  JOB_TYPE_OPTIONS,
} from '@/lib/constants';
import { parseTags } from '@/lib/format';

const MAX_QUESTIONS = 5;
const JOB_STATUSES: JobStatus[] = ['OPEN', 'DRAFT', 'CLOSED', 'FILLED'];

/** Empty input → undefined (never 0); anything else must be a non-negative whole amount. */
const money = z.preprocess(
  (v) => {
    if (v === '' || v === null || v === undefined) return undefined;
    if (typeof v === 'number') return Number.isNaN(v) ? undefined : v;
    const n = Number(String(v).replace(/[,\s]/g, ''));
    return Number.isNaN(n) ? v : n;
  },
  z
    .number({ invalid_type_error: 'Enter a number, e.g. 85000' })
    .min(0, 'Salary cannot be negative')
    .max(1_000_000_000, 'That amount looks too large')
    .optional()
);

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function makeSchema(mode: 'create' | 'edit') {
  return z
    .object({
      title: z.string().trim().min(3, 'Enter a job title (at least 3 characters)').max(255, 'Keep the title under 255 characters'),
      companyName: z.string().trim().min(1, 'Enter the company name').max(255, 'Keep the company name under 255 characters'),
      companyLogoUrl: z
        .string()
        .trim()
        .refine((v) => v === '' || /^https?:\/\/\S+$/i.test(v), 'Enter a full URL starting with https://'),
      location: z.string().trim().max(255, 'Keep the location under 255 characters'),
      jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'REMOTE'], {
        errorMap: () => ({ message: 'Choose a job type' }),
      }),
      experienceLevel: z.enum(['ENTRY', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE'], {
        errorMap: () => ({ message: 'Choose an experience level' }),
      }),
      status: z.enum(['OPEN', 'DRAFT', 'CLOSED', 'FILLED']).optional(),
      salaryCurrency: z.string().min(1, 'Choose a currency'),
      salaryMin: money,
      salaryMax: money,
      description: z.string().trim().min(20, 'Describe the role in at least 20 characters'),
      responsibilities: z.string(),
      requirements: z.string(),
      tags: z.array(z.string()),
      deadline: z.string(),
      screeningQuestions: z
        .array(z.object({ value: z.string().trim().max(300, 'Keep each question under 300 characters') }))
        .max(MAX_QUESTIONS, `You can add up to ${MAX_QUESTIONS} questions`),
    })
    .superRefine((v, ctx) => {
      if (v.salaryMin != null && v.salaryMax != null && v.salaryMin > v.salaryMax) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['salaryMax'],
          message: 'Maximum salary must be greater than or equal to the minimum',
        });
      }
      if (mode === 'create' && v.deadline && v.deadline < todayISO()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['deadline'], message: 'Choose today or a later date' });
      }
    });
}

type Schema = ReturnType<typeof makeSchema>;
type FormInput = z.input<Schema>;
type FormOutput = z.output<Schema>;

function defaultsFrom(job?: Job): FormInput {
  return {
    title: job?.title ?? '',
    companyName: job?.companyName ?? '',
    companyLogoUrl: job?.companyLogoUrl ?? '',
    location: job?.location ?? '',
    jobType: job?.jobType ?? 'FULL_TIME',
    experienceLevel: job?.experienceLevel ?? 'MID',
    status: job?.status,
    salaryCurrency: job?.salaryCurrency || 'USD',
    salaryMin: job?.salaryMin ?? '',
    salaryMax: job?.salaryMax ?? '',
    description: job?.description ?? '',
    responsibilities: job?.responsibilities ?? '',
    requirements: job?.requirements ?? '',
    tags: parseTags(job?.tags),
    deadline: job?.deadline?.slice(0, 10) ?? '',
    screeningQuestions: (job?.screeningQuestions ?? []).map((value) => ({ value })),
  };
}

function toPayload(v: FormOutput, mode: 'create' | 'edit'): JobPayload {
  const payload: JobPayload = {
    title: v.title,
    companyName: v.companyName,
    companyLogoUrl: v.companyLogoUrl,
    location: v.location,
    jobType: v.jobType,
    experienceLevel: v.experienceLevel,
    salaryCurrency: v.salaryCurrency,
    salaryMin: v.salaryMin ?? undefined,
    salaryMax: v.salaryMax ?? undefined,
    description: v.description,
    responsibilities: v.responsibilities.trim(),
    requirements: v.requirements.trim(),
    tags: v.tags.join(','),
    deadline: v.deadline || undefined,
    screeningQuestions: v.screeningQuestions.map((q) => q.value).filter(Boolean),
  };
  if (mode === 'edit') payload.status = v.status;
  return payload;
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">{children}</div>
    </Card>
  );
}

export interface JobFormProps {
  mode: 'create' | 'edit';
  job?: Job;
  onSubmit: (payload: JobPayload) => void;
  isSubmitting?: boolean;
  /** Message from the last failed submit (use getErrorMessage). */
  serverError?: string | null;
  cancelHref: string;
}

/** Shared create/edit form for job postings. */
export function JobForm({ mode, job, onSubmit, isSubmitting, serverError, cancelHref }: JobFormProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<FormInput, any, FormOutput>({
    // zodResolver (v3) types its result as the schema input; the parsed output is what handleSubmit receives.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(makeSchema(mode)) as unknown as Resolver<FormInput, any, FormOutput>,
    defaultValues: defaultsFrom(job),
    mode: 'onTouched',
  });
  const questions = useFieldArray({ control, name: 'screeningQuestions' });

  const companyName = watch('companyName');
  const logoUrl = watch('companyLogoUrl');
  const currency = watch('salaryCurrency');
  const validLogo = /^https?:\/\/\S+$/i.test(logoUrl?.trim() ?? '') ? logoUrl.trim() : null;

  const submit = handleSubmit((values) => onSubmit(toPayload(values, mode)));

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {serverError && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />
          <p>{serverError}</p>
        </div>
      )}

      <Section title="Role" description="The basics candidates see first.">
        <FormField label="Job title" required error={errors.title?.message} className="sm:col-span-2">
          {(id) => <Input id={id} {...register('title')} invalid={!!errors.title} placeholder="e.g. Senior Frontend Engineer" />}
        </FormField>

        <FormField label="Company name" required error={errors.companyName?.message}>
          {(id) => <Input id={id} {...register('companyName')} invalid={!!errors.companyName} placeholder="e.g. Acme Inc." autoComplete="organization" />}
        </FormField>

        <FormField label="Company logo URL" error={errors.companyLogoUrl?.message} hint="Optional. A square image works best.">
          {(id) => (
            <div className="flex items-center gap-3">
              <CompanyLogo key={validLogo ?? 'none'} name={companyName || 'Company'} src={validLogo} size="sm" />
              <Input
                id={id}
                type="url"
                inputMode="url"
                {...register('companyLogoUrl')}
                invalid={!!errors.companyLogoUrl}
                placeholder="https://…/logo.png"
                className="min-w-0"
              />
            </div>
          )}
        </FormField>

        <FormField label="Location" error={errors.location?.message} hint="City and country, or “Remote”." className="sm:col-span-2">
          {(id) => <Input id={id} {...register('location')} invalid={!!errors.location} placeholder="e.g. Berlin, Germany" />}
        </FormField>

        <FormField label="Job type" required error={errors.jobType?.message}>
          {(id) => (
            <Select id={id} {...register('jobType')} invalid={!!errors.jobType}>
              {JOB_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          )}
        </FormField>

        <FormField label="Experience level" required error={errors.experienceLevel?.message}>
          {(id) => (
            <Select id={id} {...register('experienceLevel')} invalid={!!errors.experienceLevel}>
              {EXPERIENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          )}
        </FormField>

        {mode === 'edit' && (
          <FormField
            label="Status"
            error={errors.status?.message}
            hint="Only open jobs accept new applications."
            className="sm:col-span-2"
          >
            {(id) => (
              <Select id={id} {...register('status')} className="sm:max-w-xs">
                {JOB_STATUSES.map((s) => <option key={s} value={s}>{JOB_STATUS_LABELS[s]}</option>)}
              </Select>
            )}
          </FormField>
        )}
      </Section>

      <Card>
        <CardHeader title="Compensation" description="Annual base salary. Leave blank if you prefer not to share it." />
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-5">
          <FormField label="Currency" error={errors.salaryCurrency?.message}>
            {(id) => (
              <Select id={id} {...register('salaryCurrency')}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            )}
          </FormField>
          <FormField label={`Minimum (${currency || 'USD'})`} error={errors.salaryMin?.message}>
            {(id) => (
              <Input id={id} type="number" inputMode="numeric" min={0} step={1000} {...register('salaryMin')} invalid={!!errors.salaryMin} placeholder="e.g. 80000" />
            )}
          </FormField>
          <FormField label={`Maximum (${currency || 'USD'})`} error={errors.salaryMax?.message}>
            {(id) => (
              <Input id={id} type="number" inputMode="numeric" min={0} step={1000} {...register('salaryMax')} invalid={!!errors.salaryMax} placeholder="e.g. 110000" />
            )}
          </FormField>
        </div>
        {mode === 'edit' && (
          <p className="px-5 pb-4 -mt-2 text-xs text-slate-500">Clearing a salary field keeps the currently published amount.</p>
        )}
      </Card>

      <Card>
        <CardHeader title="Details" description="What the job involves and who you are looking for." />
        <div className="p-5 space-y-5">
          <FormField label="Description" required error={errors.description?.message}>
            {(id) => (
              <Textarea id={id} rows={6} {...register('description')} invalid={!!errors.description} placeholder="Summarize the role, the team and what success looks like." />
            )}
          </FormField>
          <FormField label="Responsibilities" error={errors.responsibilities?.message} hint="One item per line.">
            {(id) => (
              <Textarea id={id} rows={5} {...register('responsibilities')} placeholder={'Build and ship product features\nReview pull requests'} />
            )}
          </FormField>
          <FormField label="Requirements" error={errors.requirements?.message} hint="One item per line.">
            {(id) => (
              <Textarea id={id} rows={5} {...register('requirements')} placeholder={'3+ years with React and TypeScript\nStrong written communication'} />
            )}
          </FormField>
        </div>
      </Card>

      <Card>
        <CardHeader title="Skills & tags" description="Help candidates find this job in search." />
        <div className="p-5">
          <Controller
            control={control}
            name="tags"
            render={({ field }) => (
              <SkillsInput value={field.value ?? []} onChange={field.onChange} placeholder="Type a skill and press Enter…" maxSkills={15} />
            )}
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Application" description="Deadline and optional questions for applicants." />
        <div className="p-5 space-y-6">
          <FormField label="Application deadline" error={errors.deadline?.message} hint="Optional." className="sm:max-w-xs">
            {(id) => (
              <Input id={id} type="date" min={mode === 'create' ? todayISO() : undefined} {...register('deadline')} invalid={!!errors.deadline} />
            )}
          </FormField>

          <fieldset>
            <legend className="text-sm font-medium text-slate-700">Screening questions</legend>
            <p className="text-xs text-slate-500 mt-0.5">
              Optional. Applicants answer these when they apply. Up to {MAX_QUESTIONS}.
            </p>
            {questions.fields.length > 0 && (
              <ol className="mt-3 space-y-2">
                {questions.fields.map((field, index) => {
                  const err = errors.screeningQuestions?.[index]?.value?.message;
                  return (
                    <li key={field.id}>
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-xs font-medium text-slate-400 text-right flex-shrink-0" aria-hidden>{index + 1}.</span>
                        <Input
                          {...register(`screeningQuestions.${index}.value` as const)}
                          aria-label={`Screening question ${index + 1}`}
                          invalid={!!err}
                          placeholder="e.g. Are you authorized to work in this country?"
                          className="min-w-0"
                        />
                        <button
                          type="button"
                          onClick={() => questions.remove(index)}
                          aria-label={`Remove question ${index + 1}`}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden />
                        </button>
                      </div>
                      {err && <p className="mt-1 ml-7 text-xs text-rose-600" role="alert">{err}</p>}
                    </li>
                  );
                })}
              </ol>
            )}
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => questions.append({ value: '' })}
              disabled={questions.fields.length >= MAX_QUESTIONS}
            >
              <Plus className="w-3.5 h-3.5" aria-hidden />
              Add question
            </Button>
          </fieldset>
        </div>
      </Card>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <Link href={cancelHref} className={buttonClasses('secondary')}>Cancel</Link>
        <Button type="submit" loading={isSubmitting}>
          {mode === 'create' ? (isSubmitting ? 'Publishing…' : 'Publish job') : isSubmitting ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
