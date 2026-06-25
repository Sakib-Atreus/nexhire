'use client';

import { useAuthStore } from '@/store/authStore';
import { useMyApplications, useRecruiterApplications } from '@/hooks/useApplications';
import { useAllUsers } from '@/hooks/useUsers';
import { useMyJobs } from '@/hooks/useJobs';
import { useUnreadCount } from '@/hooks/useNotifications';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import {
  Briefcase, FileText, Bell, Plus, ChevronRight, Clock, CheckCircle2,
  Users, TrendingUp, Eye, ShieldCheck,
} from 'lucide-react';
import type { ApplicationStatus } from '@/types';

// ─── Status helpers ───────────────────────────────────────────────
const STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING: 'Pending',
  REVIEWING: 'Under Review',
  SHORTLISTED: 'Shortlisted',
  INTERVIEWED: 'Interviewed',
  OFFERED: 'Offered',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  REVIEWING: 'bg-blue-50 text-blue-700 border-blue-200',
  SHORTLISTED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  INTERVIEWED: 'bg-purple-50 text-purple-700 border-purple-200',
  OFFERED: 'bg-green-50 text-green-700 border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  WITHDRAWN: 'bg-slate-50 text-slate-500 border-slate-200',
};

const STATUS_BAR_COLORS: Record<ApplicationStatus, string> = {
  PENDING: '#facc15',
  REVIEWING: '#3b82f6',
  SHORTLISTED: '#6366f1',
  INTERVIEWED: '#a855f7',
  OFFERED: '#22c55e',
  REJECTED: '#ef4444',
  WITHDRAWN: '#94a3b8',
};

// ─── Shared stat card ─────────────────────────────────────────────
function StatCard({
  label, value, icon: Icon, iconColor, bg, href,
}: {
  label: string; value: number | string;
  icon: React.ElementType; iconColor: string; bg: string; href?: string;
}) {
  const inner = (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow group">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', bg)}>
        <Icon className={cn('w-5 h-5', iconColor)} />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
        {label}
        {href && <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
      </p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ─── Donut chart (pure SVG) ───────────────────────────────────────
function DonutChart({
  segments, size = 140, strokeWidth = 22,
}: {
  segments: { value: number; color: string; label: string }[];
  size?: number;
  strokeWidth?: number;
}) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) {
    return (
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
        <text x="50%" y="50%" textAnchor="middle" dy="0.35em" className="text-xs" fill="#94a3b8" fontSize={13} fontWeight="600">0</text>
      </svg>
    );
  }

  let offset = 0;
  const arcs = segments.filter((s) => s.value > 0).map((seg) => {
    const pct = seg.value / total;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const arc = { ...seg, dash, gap, offset };
    offset += dash;
    return arc;
  });

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      {arcs.map((arc) => (
        <circle
          key={arc.label}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={arc.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arc.dash} ${arc.gap}`}
          strokeDashoffset={-arc.offset}
          strokeLinecap="round"
        />
      ))}
      <text
        x="50%" y="50%"
        textAnchor="middle" dy="0.35em"
        fill="#0f172a" fontSize={22} fontWeight="700"
        style={{ transform: 'rotate(90deg)', transformOrigin: '50% 50%' }}
      >
        {total}
      </text>
    </svg>
  );
}

// ─── Horizontal bar chart (pure CSS) ─────────────────────────────
function BarChart({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-600 font-medium truncate max-w-[140px]">{item.label}</span>
            <span className="font-bold text-slate-800 ml-2 flex-shrink-0">{item.value}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(item.value / max) * 100}%`, backgroundColor: item.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Vertical bar chart (pure SVG) ────────────────────────────────
function VerticalBarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const chartH = 100;

  return (
    <div className="flex items-end gap-2 h-[130px] pt-2">
      {data.map((item) => {
        const pct = item.value / max;
        const barH = Math.max(pct * chartH, item.value > 0 ? 6 : 0);
        return (
          <div key={item.label} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-slate-700">{item.value > 0 ? item.value : ''}</span>
            <div
              className="w-full rounded-t-lg transition-all duration-500"
              style={{ height: barH, backgroundColor: item.color, minHeight: item.value > 0 ? 4 : 0 }}
            />
            <span className="text-[9px] text-slate-400 text-center leading-tight line-clamp-2">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Candidate dashboard ──────────────────────────────────────────
function CandidateDashboard() {
  const { data: applications, isLoading } = useMyApplications();

  const count = (s: ApplicationStatus) => applications?.content.filter((a) => a.status === s).length ?? 0;
  const total = applications?.totalElements ?? 0;
  const reviewing = count('REVIEWING');
  const shortlisted = count('SHORTLISTED');
  const offered = count('OFFERED');
  const recent = applications?.content.slice(0, 5) ?? [];

  const donutSegments: { value: number; color: string; label: string }[] = [
    { label: 'Pending', value: count('PENDING'), color: STATUS_BAR_COLORS.PENDING },
    { label: 'Reviewing', value: reviewing, color: STATUS_BAR_COLORS.REVIEWING },
    { label: 'Shortlisted', value: shortlisted, color: STATUS_BAR_COLORS.SHORTLISTED },
    { label: 'Interviewed', value: count('INTERVIEWED'), color: STATUS_BAR_COLORS.INTERVIEWED },
    { label: 'Offered', value: offered, color: STATUS_BAR_COLORS.OFFERED },
    { label: 'Rejected', value: count('REJECTED'), color: STATUS_BAR_COLORS.REJECTED },
  ].filter((s) => s.value > 0);

  const pipelineBars = [
    { label: 'Pending', value: count('PENDING'), color: STATUS_BAR_COLORS.PENDING },
    { label: 'Under Review', value: reviewing, color: STATUS_BAR_COLORS.REVIEWING },
    { label: 'Shortlisted', value: shortlisted, color: STATUS_BAR_COLORS.SHORTLISTED },
    { label: 'Interviewed', value: count('INTERVIEWED'), color: STATUS_BAR_COLORS.INTERVIEWED },
    { label: 'Offered', value: offered, color: STATUS_BAR_COLORS.OFFERED },
    { label: 'Rejected', value: count('REJECTED'), color: STATUS_BAR_COLORS.REJECTED },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Applied" value={total} icon={FileText} iconColor="text-blue-600" bg="bg-blue-50" href="/applications" />
        <StatCard label="Under Review" value={reviewing} icon={Eye} iconColor="text-indigo-600" bg="bg-indigo-50" />
        <StatCard label="Shortlisted" value={shortlisted} icon={TrendingUp} iconColor="text-purple-600" bg="bg-purple-50" />
        <StatCard label="Offers" value={offered} icon={CheckCircle2} iconColor="text-green-600" bg="bg-green-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent applications */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Recent Applications</h2>
            <Link href="/applications" className="text-xs text-primary-600 hover:underline font-medium flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {isLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />)}
            </div>
          ) : recent.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No applications yet.</p>
              <Link href="/jobs" className="text-xs text-primary-600 hover:underline mt-1 inline-block">Browse jobs →</Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {recent.map((app) => (
                <li key={app.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <Link href={`/jobs/${app.jobId}`} className="text-sm font-medium text-slate-800 hover:text-primary-600 transition-colors">
                      {app.jobTitle}
                    </Link>
                    <p className="text-xs text-slate-400 mt-0.5">{app.companyName} · {new Date(app.appliedAt).toLocaleDateString()}</p>
                  </div>
                  <span className={cn('text-xs px-2.5 py-1 rounded-full border font-medium flex-shrink-0', STATUS_COLORS[app.status])}>
                    {STATUS_LABELS[app.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-5 text-white">
            <h3 className="font-semibold mb-1">Find your next role</h3>
            <p className="text-primary-100 text-sm mb-4">Thousands of openings updated daily.</p>
            <Link href="/jobs" className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-primary-700 rounded-lg text-sm font-semibold hover:bg-primary-50 transition-colors">
              Browse Jobs <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Donut chart */}
          {total > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-semibold text-slate-800 text-sm mb-4">Application Breakdown</h3>
              <div className="flex items-center gap-4">
                <DonutChart segments={donutSegments} />
                <div className="flex-1 space-y-1.5 min-w-0">
                  {donutSegments.map((seg) => (
                    <div key={seg.label} className="flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                      <span className="text-slate-600 truncate">{seg.label}</span>
                      <span className="ml-auto font-semibold text-slate-800 flex-shrink-0">{seg.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pipeline bar chart */}
      {total > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-5">Application Pipeline</h3>
          <BarChart data={pipelineBars} />
        </div>
      )}
    </div>
  );
}

// ─── Recruiter dashboard ──────────────────────────────────────────
function RecruiterDashboard() {
  const { data: jobs, isLoading: jobsLoading } = useMyJobs();
  const { data: allApplications, isLoading: appsLoading } = useRecruiterApplications();
  const { data: unread } = useUnreadCount();

  const activeJobs = jobs?.content.filter((j) => j.status === 'OPEN').length ?? 0;
  const totalApplicants = allApplications?.totalElements ?? 0;
  const pending = allApplications?.content.filter((a) => a.status === 'PENDING').length ?? 0;
  const recentApplications = allApplications?.content.slice(0, 5) ?? [];
  const recentJobs = jobs?.content.slice(0, 4) ?? [];

  // Applicants per job for bar chart (top 6 jobs by applicant count)
  const jobApplicantCounts = recentJobs.map((job) => ({
    label: job.title.length > 18 ? job.title.slice(0, 18) + '…' : job.title,
    value: allApplications?.content.filter((a) => a.jobId === job.id).length ?? 0,
    color: '#3b82f6',
  }));

  // Status breakdown for the recruiter
  const statusBreakdown = (['PENDING', 'REVIEWING', 'SHORTLISTED', 'INTERVIEWED', 'OFFERED', 'REJECTED'] as ApplicationStatus[]).map(
    (s) => ({
      label: STATUS_LABELS[s],
      value: allApplications?.content.filter((a) => a.status === s).length ?? 0,
      color: STATUS_BAR_COLORS[s],
    })
  ).filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Jobs" value={activeJobs} icon={Briefcase} iconColor="text-primary-600" bg="bg-primary-50" href="/jobs/my" />
        <StatCard label="Total Applicants" value={totalApplicants} icon={Users} iconColor="text-indigo-600" bg="bg-indigo-50" />
        <StatCard label="Pending Review" value={pending} icon={Clock} iconColor="text-yellow-600" bg="bg-yellow-50" />
        <StatCard label="Notifications" value={unread ?? 0} icon={Bell} iconColor="text-rose-600" bg="bg-rose-50" href="/notifications" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent applicants */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Recent Applicants</h2>
          </div>
          {appsLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />)}
            </div>
          ) : recentApplications.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No applicants yet. Post a job to get started.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {recentApplications.map((app) => (
                <li key={app.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{app.candidateName}</p>
                    <Link href={`/jobs/${app.jobId}`} className="text-xs text-slate-400 hover:text-primary-600 mt-0.5 block">
                      {app.jobTitle} · {new Date(app.appliedAt).toLocaleDateString()}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn('text-xs px-2.5 py-1 rounded-full border font-medium', STATUS_COLORS[app.status])}>
                      {STATUS_LABELS[app.status]}
                    </span>
                    <Link href={`/jobs/${app.jobId}/applicants`} className="p-1.5 rounded-lg hover:bg-primary-50 text-slate-400 hover:text-primary-600 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-5 text-white">
            <h3 className="font-semibold mb-1">Post a new job</h3>
            <p className="text-primary-100 text-sm mb-4">Reach qualified candidates quickly.</p>
            <Link href="/jobs/create" className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-primary-700 rounded-lg text-sm font-semibold hover:bg-primary-50 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Post Job
            </Link>
          </div>

          {/* My jobs mini list */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3.5 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 text-sm">My Jobs</h3>
              <Link href="/jobs/my" className="text-xs text-primary-600 hover:underline">View all</Link>
            </div>
            {jobsLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />)}
              </div>
            ) : recentJobs.length === 0 ? (
              <p className="text-xs text-slate-400 p-4 text-center">No jobs posted yet.</p>
            ) : (
              <ul className="divide-y divide-slate-50">
                {recentJobs.map((job) => (
                  <li key={job.id}>
                    <Link href={`/jobs/${job.id}/applicants`} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{job.title}</p>
                        <p className="text-xs text-slate-400">{job.status}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Charts row */}
      {totalApplicants > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Applicants per job — vertical bar chart */}
          {jobApplicantCounts.some((d) => d.value > 0) && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-semibold text-slate-800 mb-2">Applicants per Job</h3>
              <p className="text-xs text-slate-400 mb-4">Your most recent job listings</p>
              <VerticalBarChart data={jobApplicantCounts} />
            </div>
          )}

          {/* Application status breakdown — horizontal bars */}
          {statusBreakdown.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-semibold text-slate-800 mb-2">Applicant Status Breakdown</h3>
              <p className="text-xs text-slate-400 mb-4">Across all your job postings</p>
              <BarChart data={statusBreakdown} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Admin dashboard ──────────────────────────────────────────────
function AdminDashboard() {
  const { data: usersData } = useAllUsers(0, 1);
  const { data: unread } = useUnreadCount();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={usersData?.totalElements ?? 0} icon={Users} iconColor="text-blue-600" bg="bg-blue-50" href="/admin/users" />
        <StatCard label="Notifications" value={unread ?? 0} icon={Bell} iconColor="text-rose-600" bg="bg-rose-50" href="/notifications" />
        <StatCard label="Admin Panel" value="Active" icon={ShieldCheck} iconColor="text-green-600" bg="bg-green-50" href="/admin" />
        <StatCard label="Analytics" value="View" icon={FileText} iconColor="text-indigo-600" bg="bg-indigo-50" href="/admin/analytics" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin" className="px-4 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors">
            Manage Users
          </Link>
          <Link href="/jobs" className="px-4 py-2 bg-slate-50 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors">
            All Jobs
          </Link>
          <Link href="/jobs/create" className="px-4 py-2 bg-slate-50 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors">
            Post Job
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Page entry point ─────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuthStore();

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const subtitle: Record<string, string> = {
    CANDIDATE: 'Track your job applications and explore new opportunities.',
    RECRUITER: 'Manage your job posts and review incoming applications.',
    ADMIN: 'Monitor platform activity and manage users.',
  };

  return (
    <div className="pb-20 lg:pb-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          {greeting}, {user?.firstName}!
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          {subtitle[user?.role ?? 'CANDIDATE']}
        </p>
      </div>

      {user?.role === 'CANDIDATE' && <CandidateDashboard />}
      {user?.role === 'RECRUITER' && <RecruiterDashboard />}
      {user?.role === 'ADMIN' && <AdminDashboard />}
    </div>
  );
}
