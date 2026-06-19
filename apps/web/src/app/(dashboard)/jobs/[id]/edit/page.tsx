'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { useJob, useUpdateJob } from '@/hooks/useJobs';
import { useAuthStore } from '@/store/authStore';

const schema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
  companyName: z.string().min(1),
  location: z.string().optional(),
  jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'REMOTE']),
  experienceLevel: z.enum(['ENTRY', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE']),
  status: z.enum(['DRAFT', 'OPEN', 'CLOSED', 'FILLED']),
  salaryMin: z.coerce.number().optional(),
  salaryMax: z.coerce.number().optional(),
  tags: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function EditJobPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: job, isLoading } = useJob(id);
  const { mutate: updateJob, isPending } = useUpdateJob(id);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { jobType: 'FULL_TIME', experienceLevel: 'MID', status: 'OPEN' },
  });

  useEffect(() => {
    if (!job) return;
    if (user && job.recruiterId !== user.id) {
      router.replace('/dashboard');
      return;
    }
    reset({
      title: job.title,
      description: job.description,
      requirements: job.requirements ?? '',
      responsibilities: job.responsibilities ?? '',
      companyName: job.companyName,
      location: job.location ?? '',
      jobType: job.jobType,
      experienceLevel: job.experienceLevel,
      status: job.status,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      tags: job.tags ?? '',
    });
  }, [job, user, reset, router]);

  const onSubmit = (data: FormData) => {
    updateJob(data, { onSuccess: () => router.push('/jobs/my') });
  };

  const inputClass = 'w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-48" />
        <div className="h-96 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (!job) {
    return <div className="text-center py-16 text-slate-500">Job not found</div>;
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Edit Job Posting</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className={labelClass}>Job Title *</label>
            <input {...register('title')} placeholder="e.g. Senior React Developer" className={inputClass} />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Company Name *</label>
            <input {...register('companyName')} placeholder="Your company name" className={inputClass} />
            {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Job Type *</label>
            <select {...register('jobType')} className={inputClass + ' bg-white'}>
              <option value="FULL_TIME">Full-time</option>
              <option value="PART_TIME">Part-time</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERNSHIP">Internship</option>
              <option value="REMOTE">Remote</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Experience Level *</label>
            <select {...register('experienceLevel')} className={inputClass + ' bg-white'}>
              <option value="ENTRY">Entry</option>
              <option value="MID">Mid</option>
              <option value="SENIOR">Senior</option>
              <option value="LEAD">Lead</option>
              <option value="EXECUTIVE">Executive</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Job Status *</label>
            <select {...register('status')} className={inputClass + ' bg-white'}>
              <option value="DRAFT">Draft</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
              <option value="FILLED">Filled</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Location</label>
            <input {...register('location')} placeholder="e.g. New York, NY or Remote" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Min Salary (USD)</label>
            <input {...register('salaryMin')} type="number" placeholder="60000" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Max Salary (USD)</label>
            <input {...register('salaryMax')} type="number" placeholder="100000" className={inputClass} />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Tags</label>
            <input {...register('tags')} placeholder="React, TypeScript, Node.js" className={inputClass} />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Description *</label>
            <textarea {...register('description')} rows={5} placeholder="Describe the role..." className={inputClass + ' resize-none'} />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Responsibilities</label>
            <textarea {...register('responsibilities')} rows={4} placeholder="Key responsibilities..." className={inputClass + ' resize-none'} />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Requirements</label>
            <textarea {...register('requirements')} rows={4} placeholder="Required qualifications..." className={inputClass + ' resize-none'} />
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
