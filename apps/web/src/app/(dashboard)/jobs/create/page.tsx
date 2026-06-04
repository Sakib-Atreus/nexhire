'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useCreateJob } from '@/hooks/useJobs';

const schema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
  companyName: z.string().min(1),
  location: z.string().optional(),
  jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'REMOTE']),
  experienceLevel: z.enum(['ENTRY', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE']),
  salaryMin: z.coerce.number().optional(),
  salaryMax: z.coerce.number().optional(),
  tags: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CreateJobPage() {
  const router = useRouter();
  const { mutate: createJob, isPending } = useCreateJob();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { jobType: 'FULL_TIME', experienceLevel: 'MID' },
  });

  const onSubmit = (data: FormData) => {
    createJob(data, { onSuccess: (job) => router.push(`/jobs/${job.id}`) });
  };

  const inputClass = 'w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Post a New Job</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className={labelClass}>Job Title *</label>
            <input {...register('title')} placeholder="e.g. Senior React Developer" className={inputClass} />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Company Name *</label>
            <input {...register('companyName')} placeholder="Your company name" className={inputClass} />
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
            <label className={labelClass}>Location</label>
            <input {...register('location')} placeholder="e.g. New York, NY or Remote" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Tags</label>
            <input {...register('tags')} placeholder="React, TypeScript, Node.js" className={inputClass} />
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
            <label className={labelClass}>Description *</label>
            <textarea {...register('description')} rows={5} placeholder="Describe the role..." className={inputClass + ' resize-none'} />
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
          <button type="button" onClick={() => router.back()} className="px-6 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={isPending} className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors">
            {isPending ? 'Posting...' : 'Post Job'}
          </button>
        </div>
      </form>
    </div>
  );
}
