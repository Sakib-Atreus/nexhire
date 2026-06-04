'use client';

import { useAuthStore } from '@/store/authStore';
import { useMyApplications } from '@/hooks/useApplications';
import { useMyJobs } from '@/hooks/useJobs';
import { useNotifications } from '@/hooks/useNotifications';
import Link from 'next/link';
import { Briefcase, FileText, Bell, Plus } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const isCandidate = user?.role === 'CANDIDATE';
  const isRecruiter = user?.role === 'RECRUITER';

  const { data: applications } = useMyApplications();
  const { data: jobs } = useMyJobs();
  const { data: notifications } = useNotifications();

  const stats = isCandidate
    ? [
        { label: 'Applications', value: applications?.totalElements ?? 0, icon: FileText, href: '/applications' },
        { label: 'Notifications', value: notifications?.totalElements ?? 0, icon: Bell, href: '/notifications' },
      ]
    : [
        { label: 'My Job Posts', value: jobs?.totalElements ?? 0, icon: Briefcase, href: '/jobs/my' },
        { label: 'Notifications', value: notifications?.totalElements ?? 0, icon: Bell, href: '/notifications' },
      ];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.firstName}!</h1>
          <p className="text-slate-500 mt-1">
            {isCandidate ? 'Track your job applications' : 'Manage your job postings'}
          </p>
        </div>
        {isRecruiter && (
          <Link
            href="/jobs/create"
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Post Job
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="bg-white rounded-xl p-6 border border-slate-200 hover:border-primary-300 transition-colors shadow-sm">
            <stat.icon className="w-6 h-6 text-primary-500 mb-3" />
            <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-slate-500 text-sm mt-1">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/jobs" className="px-4 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors">
            Browse Jobs
          </Link>
          {isCandidate && (
            <Link href="/applications" className="px-4 py-2 bg-slate-50 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors">
              My Applications
            </Link>
          )}
          {isRecruiter && (
            <Link href="/jobs/create" className="px-4 py-2 bg-slate-50 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors">
              Post a Job
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
