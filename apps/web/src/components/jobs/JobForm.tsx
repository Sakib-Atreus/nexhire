'use client';

import Link from 'next/link';
import { Controller, useFieldArray, useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Banknote, Briefcase, CheckCircle2, Circle, ClipboardList, FileText, FolderOpen, MapPin, Plus, Tags, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Job, JobStatus } from '@/types';
import type { JobPayload } from '@/hooks/useJobs';
import { usePublicSettings } from '@/hooks/useSettings';
import { Button, buttonClasses } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FormField, Input, Select, Textarea } from '@/components/ui/Field';
import { CompanyLogo } from '@/components/ui/CompanyLogo';
import { SkillsInput } from '@/components/ui/SkillsInput';
import {
  CURRENCIES,
  EXPERIENCE_LABELS,
  EXPERIENCE_OPTIONS,
  EXPERIENCE_STYLES,
  JOB_STATUS_LABELS,
  JOB_TYPE_LABELS,
  JOB_TYPE_OPTIONS,
} from '@/lib/constants';
import { formatDate, formatSalary, parseTags, toListItems } from '@/lib/format';
import { cn } from '@/lib/cn';

const MAX_QUESTIONS = 5;
const MAX_TAGS = 15;
const MAX_SUGGESTIONS = 12;
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
      category: z.string().trim().max(50, 'Keep the category under 50 characters'),
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
    category: job?.category ?? '',
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
    // Blank clears the category on edit (backend stores blank as null).
    category: v.category,
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

function Section({ step, icon: Icon, title, description, children, bodyClassName }: {
  step: number;
  icon: LucideIcon;
  title: string;
  description?: string;
  children: React.ReactNode;
  bodyClassName?: string;
}) {
  return (
    <Card>
      <div className="flex items-start gap-3 px-4 sm:px-6 py-4 border-b border-slate-100">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600" aria-hidden>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900">
            <span className="text-slate-400 font-medium mr-1.5">{step}.</span>
            {title}
          </h2>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className={cn('p-4 sm:p-6', bodyClassName ?? 'grid grid-cols-1 sm:grid-cols-2 gap-5')}>{children}</div>
    </Card>
  );
}

/** How the posting will look in search results, updated as the recruiter types. */
function PreviewCard({ v }: { v: FormInput }) {
  const toNum = (x: unknown) => {
    const n = Number(String(x ?? '').replace(/[,\s]/g, ''));
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const salary = formatSalary(toNum(v.salaryMin), toNum(v.salaryMax), v.salaryCurrency || 'USD');
  const logo = /^https?:\/\/\S+$/i.test(v.companyLogoUrl?.trim() ?? '') ? v.companyLogoUrl.trim() : null;
  const tags = v.tags ?? [];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <CompanyLogo key={logo ?? 'none'} name={v.companyName?.trim() || 'Company'} src={logo} size="sm" />
        <div className="min-w-0 flex-1">
          <p className={cn('font-semibold leading-snug break-words', v.title?.trim() ? 'text-slate-900' : 'text-slate-400')}>
            {v.title?.trim() || 'Job title'}
          </p>
          <p className="text-sm text-slate-500 truncate">{v.companyName?.trim() || 'Company name'}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden />{v.location?.trim() || 'Location'}</span>
        <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" aria-hidden />{JOB_TYPE_LABELS[v.jobType]}</span>
        {v.category?.trim() && (
          <span className="inline-flex items-center gap-1 min-w-0"><FolderOpen className="h-3.5 w-3.5 flex-shrink-0" aria-hidden /><span className="truncate">{v.category.trim()}</span></span>
        )}
        {salary && <span className="inline-flex items-center gap-1"><Banknote className="h-3.5 w-3.5" aria-hidden />{salary}</span>}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge tone={EXPERIENCE_STYLES[v.experienceLevel]}>{EXPERIENCE_LABELS[v.experienceLevel]}</Badge>
        {tags.slice(0, 3).map((t) => (
          <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{t}</span>
        ))}
        {tags.length > 3 && <span className="px-1 py-0.5 text-xs text-slate-400">+{tags.length - 3}</span>}
      </div>
      {v.deadline && <p className="mt-3 text-xs text-slate-400">Applications close {formatDate(v.deadline)}</p>}
    </div>
  );
}

/** Quality checklist; only the first two items are required to publish. */
function Checklist({ v }: { v: FormInput }) {
  const items = [
    { label: 'Job title and company', done: (v.title?.trim().length ?? 0) >= 3 && !!v.companyName?.trim() },
    { label: 'Description (20+ characters)', done: (v.description?.trim().length ?? 0) >= 20 },
    { label: 'Location', done: !!v.location?.trim() },
    { label: 'Salary range', done: String(v.salaryMin ?? '') !== '' || String(v.salaryMax ?? '') !== '' },
    { label: 'Responsibilities', done: toListItems(v.responsibilities).length > 0 },
    { label: 'Requirements', done: toListItems(v.requirements).length > 0 },
    { label: 'At least 3 skills', done: (v.tags?.length ?? 0) >= 3 },
  ];
  const done = items.filter((i) => i.done).length;
  const pct = Math.round((done / items.length) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700">Posting quality</span>
        <span className="text-slate-500">{done} of {items.length}</span>
      </div>
      <div
        className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Posting completeness"
      >
        <div className={cn('h-full rounded-full transition-all', pct === 100 ? 'bg-emerald-500' : 'bg-primary-500')} style={{ width: `${pct}%` }} />
      </div>
      <ul className="mt-3 space-y-1.5">
        {items.map((i) => (
          <li key={i.label} className={cn('flex items-center gap-2 text-xs', i.done ? 'text-slate-600' : 'text-slate-400')}>
            {i.done
              ? <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" aria-hidden />
              : <Circle className="h-4 w-4 flex-shrink-0 text-slate-300" aria-hidden />}
            <span>{i.label}</span>
            <span className="sr-only">{i.done ? '(done)' : '(not done yet)'}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate-400">Complete postings get noticeably more qualified applicants.</p>
    </div>
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
  const { data: settings } = usePublicSettings();

  const values = watch();
  const companyName = values.companyName;
  const logoUrl = values.companyLogoUrl;
  const currency = values.salaryCurrency;
  const descriptionLength = values.description?.trim().length ?? 0;
  const validLogo = /^https?:\/\/\S+$/i.test(logoUrl?.trim() ?? '') ? logoUrl.trim() : null;

  // Admin-managed categories, plus the job's current one if it was since removed from the list.
  const categoryOptions = (() => {
    const list = settings?.categories ?? [];
    const current = job?.category?.trim();
    return current && !list.some((c) => c.toLowerCase() === current.toLowerCase()) ? [...list, current] : list;
  })();

  const selectedTags = values.tags ?? [];
  const suggestedSkills = (settings?.skills ?? [])
    .filter((s) => !selectedTags.some((t) => t.toLowerCase() === s.toLowerCase()))
    .slice(0, MAX_SUGGESTIONS);

  const submit = handleSubmit((values) => onSubmit(toPayload(values, mode)));

  return (
    <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <div className="min-w-0 space-y-6">
      {serverError && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />
          <p>{serverError}</p>
        </div>
      )}

      <Section step={1} icon={Briefcase} title="Role" description="The basics candidates see first.">
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

        <FormField
          label="Category"
          error={errors.category?.message}
          hint="Optional. Helps candidates browse by field."
          className="sm:col-span-2"
        >
          {(id) => (
            <Select id={id} {...register('category')} invalid={!!errors.category} className="sm:max-w-xs">
              <option value="">Select a category</option>
              {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
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

      <Section
        step={2}
        icon={Banknote}
        title="Compensation"
        description="Annual base salary. Leave blank if you prefer not to share it."
        bodyClassName="grid grid-cols-1 sm:grid-cols-3 gap-5"
      >
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
        {mode === 'edit' && (
          <p className="sm:col-span-3 -mt-2 text-xs text-slate-500">Clearing a salary field keeps the currently published amount.</p>
        )}
      </Section>

      <Section
        step={3}
        icon={FileText}
        title="Details"
        description="What the job involves and who you are looking for."
        bodyClassName="space-y-5"
      >
          <FormField
            label="Description"
            required
            error={errors.description?.message}
            hint={`${descriptionLength.toLocaleString('en-US')} characters · Separate paragraphs with a blank line.`}
          >
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
      </Section>

      <Section step={4} icon={Tags} title="Skills & tags" description="Help candidates find this job in search." bodyClassName="">
          <Controller
            control={control}
            name="tags"
            render={({ field }) => {
              const current = field.value ?? [];
              const atLimit = current.length >= MAX_TAGS;
              return (
                <div>
                  <SkillsInput value={current} onChange={field.onChange} placeholder="Type a skill and press Enter…" maxSkills={MAX_TAGS} />
                  {suggestedSkills.length > 0 && !atLimit && (
                    <div className="mt-3">
                      <p id="skill-suggestions-label" className="text-xs font-medium text-slate-500">Popular skills</p>
                      <ul aria-labelledby="skill-suggestions-label" className="mt-2 flex flex-wrap gap-1.5">
                        {suggestedSkills.map((skill) => (
                          <li key={skill}>
                            <button
                              type="button"
                              onClick={() => field.onChange([...current, skill])}
                              aria-label={`Add skill ${skill}`}
                              className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                            >
                              <Plus className="h-3 w-3" aria-hidden />
                              {skill}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            }}
          />
      </Section>

      <Section
        step={5}
        icon={ClipboardList}
        title="Application"
        description="Deadline and optional questions for applicants."
        bodyClassName="space-y-6"
      >
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
      </Section>
      </div>

      {/* Side panel: sticky on desktop, stacked after the form on smaller screens. */}
      <aside className="min-w-0 space-y-4 lg:sticky lg:top-24" aria-label="Preview and publish">
        <Card className="p-4 sm:p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</h2>
          <p className="mt-0.5 mb-3 text-xs text-slate-400">How candidates will see this job in search.</p>
          <PreviewCard v={values} />
        </Card>

        <Card className="p-4 sm:p-5">
          <Checklist v={values} />
        </Card>

        <Card className="p-4 sm:p-5">
          {Object.keys(errors).length > 0 && (
            <p className="mb-3 flex items-start gap-2 text-xs text-rose-600" role="alert">
              <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden />
              Please fix the highlighted fields before {mode === 'create' ? 'publishing' : 'saving'}.
            </p>
          )}
          <div className="flex flex-col gap-2">
            <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
              {mode === 'create' ? (isSubmitting ? 'Publishing…' : 'Publish job') : isSubmitting ? 'Saving…' : 'Save changes'}
            </Button>
            <Link href={cancelHref} className={buttonClasses('secondary', 'lg', 'w-full')}>Cancel</Link>
          </div>
          {mode === 'create' && (
            <p className="mt-3 text-center text-xs text-slate-400">The job goes live immediately. You can edit or close it anytime.</p>
          )}
        </Card>
      </aside>
    </form>
  );
}
