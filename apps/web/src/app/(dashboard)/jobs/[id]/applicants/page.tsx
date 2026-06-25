'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useJob } from '@/hooks/useJobs';
import { useJobApplications, useUpdateApplicationStatus, useBulkUpdateStatus } from '@/hooks/useApplications';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import {
  ArrowLeft, Users, Mail, Calendar, FileText, Eye,
  ChevronDown, Search, Building2, CheckSquare, X,
} from 'lucide-react';
import type { Application, ApplicationStatus } from '@/types';

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING: 'Pending',
  REVIEWING: 'Reviewing',
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

const STATUS_DOT: Record<ApplicationStatus, string> = {
  PENDING: 'bg-yellow-400',
  REVIEWING: 'bg-blue-500',
  SHORTLISTED: 'bg-indigo-500',
  INTERVIEWED: 'bg-purple-500',
  OFFERED: 'bg-green-500',
  REJECTED: 'bg-red-500',
  WITHDRAWN: 'bg-slate-300',
};

const STATUS_ORDER: ApplicationStatus[] = [
  'PENDING', 'REVIEWING', 'SHORTLISTED', 'INTERVIEWED', 'OFFERED', 'REJECTED', 'WITHDRAWN',
];

const BULK_STATUSES: ApplicationStatus[] = ['REVIEWING', 'SHORTLISTED', 'INTERVIEWED', 'OFFERED', 'REJECTED'];

const ALLOWED_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  PENDING: ['REVIEWING', 'SHORTLISTED', 'REJECTED'],
  REVIEWING: ['SHORTLISTED', 'INTERVIEWED', 'REJECTED'],
  SHORTLISTED: ['INTERVIEWED', 'OFFERED', 'REJECTED'],
  INTERVIEWED: ['OFFERED', 'REJECTED'],
  OFFERED: ['REJECTED'],
  REJECTED: [],
  WITHDRAWN: [],
};

// Click-based dropdown so it works on touch devices and is accessible
function StatusDropdown({ app }: { app: Application }) {
  const { mutate: update, isPending } = useUpdateApplicationStatus();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const transitions = ALLOWED_TRANSITIONS[app.status];
  if (transitions.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        disabled={isPending}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
      >
        Update <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden z-20">
          {transitions.map((s) => (
            <button
              key={s}
              onClick={() => {
                update({ id: app.id, status: s });
                setOpen(false);
              }}
              disabled={isPending}
              className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <span className={cn('w-2 h-2 rounded-full flex-shrink-0', STATUS_DOT[s])} />
              <span className={STATUS_COLORS[s].split(' ')[1]}>{STATUS_LABELS[s]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicantCard({
  app,
  selected,
  onToggle,
}: {
  app: Application;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  const { mutate: update, isPending } = useUpdateApplicationStatus();
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState(app.notes ?? '');

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border shadow-sm overflow-hidden transition-colors',
        selected ? 'border-primary-400 ring-2 ring-primary-100' : 'border-slate-100',
      )}
    >
      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Checkbox + Avatar + info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Checkbox */}
            <label className="flex items-center mt-0.5 cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggle(app.id)}
                className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
              />
            </label>

            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0">
              {app.candidateName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>

            <div className="min-w-0">
              <p className="font-semibold text-slate-900">{app.candidateName}</p>
              <a
                href={`mailto:${app.candidateEmail}`}
                className="text-sm text-slate-500 hover:text-primary-600 flex items-center gap-1 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" /> {app.candidateEmail}
              </a>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Applied {new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Status + update dropdown */}
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            <span className={cn('text-xs px-2.5 py-1.5 rounded-full border font-semibold', STATUS_COLORS[app.status])}>
              {STATUS_LABELS[app.status]}
            </span>
            <StatusDropdown app={app} />
          </div>
        </div>

        {/* Cover letter */}
        {app.coverLetter && (
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Cover Letter
            </p>
            <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{app.coverLetter}</p>
          </div>
        )}

        {/* Resume URL */}
        {app.resumeUrl && (
          <a
            href={app.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary-600 hover:underline font-medium"
          >
            <Eye className="w-3.5 h-3.5" /> View Resume
          </a>
        )}

        {/* Notes section */}
        <div className="mt-4 border-t border-slate-50 pt-3">
          <button
            onClick={() => setNotesOpen((o) => !o)}
            className="text-xs font-medium text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
          >
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', notesOpen && 'rotate-180')} />
            {app.notes ? 'Edit notes' : 'Add notes'}
          </button>
          {notesOpen && (
            <div className="mt-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Internal notes about this candidate..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-700"
              />
              <button
                onClick={() => update({ id: app.id, status: app.status, notes }, { onSuccess: () => setNotesOpen(false) })}
                disabled={isPending}
                className="mt-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                Save Notes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ApplicantsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading: jobLoading } = useJob(id);
  const { data: applications, isLoading: appsLoading } = useJobApplications(id);
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<ApplicationStatus>('REVIEWING');
  const { mutate: bulkUpdate, isPending: isBulkPending } = useBulkUpdateStatus();

  const isLoading = jobLoading || appsLoading;
  const router = useRouter();
  const canView = user?.role === 'RECRUITER' || user?.role === 'ADMIN';

  useEffect(() => {
    if (user && !canView) router.replace('/dashboard');
  }, [user, canView, router]);

  if (!canView) return null;

  const apps = applications?.content ?? [];

  const filtered = apps.filter((a) => {
    const matchSearch =
      !search ||
      a.candidateName.toLowerCase().includes(search.toLowerCase()) ||
      a.candidateEmail.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const countByStatus = (s: string) => apps.filter((a) => a.status === s).length;

  const allVisibleSelected = filtered.length > 0 && filtered.every((a) => selectedIds.has(a.id));
  const someVisibleSelected = filtered.some((a) => selectedIds.has(a.id));

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allVisibleSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((a) => next.delete(a.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((a) => next.add(a.id));
        return next;
      });
    }
  }

  function handleBulkApply() {
    bulkUpdate(
      { applicationIds: Array.from(selectedIds), status: bulkStatus },
      { onSuccess: () => setSelectedIds(new Set()) },
    );
  }

  return (
    <div className="pb-28 lg:pb-8">
      {/* Back */}
      <Link href="/jobs/my" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to My Jobs
      </Link>

      {/* Job header */}
      {job && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-slate-900">{job.title}</h1>
              <p className="text-slate-500 text-sm">{job.companyName} · {job.location}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-bold text-slate-900">{apps.length}</p>
              <p className="text-xs text-slate-400">Total applicants</p>
            </div>
          </div>
        </div>
      )}

      {/* Status tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button
          onClick={() => setStatusFilter('')}
          className={cn(
            'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors border',
            !statusFilter
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          )}
        >
          All ({apps.length})
        </button>
        {STATUS_ORDER.filter((s) => countByStatus(s) > 0).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors border',
              statusFilter === s
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            )}
          >
            {STATUS_LABELS[s]} ({countByStatus(s)})
          </button>
        ))}
      </div>

      {/* Search + Select All row */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>

        {filtered.length > 0 && (
          <label className="flex items-center gap-2 cursor-pointer select-none flex-shrink-0 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              ref={(el) => { if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected; }}
              onChange={toggleAll}
              className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
            />
            <CheckSquare className="w-4 h-4 text-slate-400" />
            <span className="font-medium">Select all</span>
          </label>
        )}
      </div>

      {/* Applicant cards */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 bg-white rounded-2xl border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 font-medium">
            {apps.length === 0 ? 'No applications yet' : 'No applicants match your filter'}
          </p>
          {apps.length === 0 && (
            <p className="text-sm text-slate-400 mt-1">Share the job link to attract candidates.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => (
            <ApplicantCard
              key={app.id}
              app={app}
              selected={selectedIds.has(app.id)}
              onToggle={toggleOne}
            />
          ))}
        </div>
      )}

      {/* Bulk action bar — fixed at bottom when items are selected */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center pointer-events-none">
          <div className="pointer-events-auto w-full max-w-2xl mx-4 mb-4 bg-slate-900 text-white rounded-2xl shadow-2xl px-4 py-3 flex flex-wrap items-center gap-3">
            {/* Count */}
            <span className="text-sm font-semibold text-slate-100 flex-shrink-0">
              {selectedIds.size} selected
            </span>

            <div className="flex-1" />

            {/* Status dropdown */}
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as ApplicationStatus)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              {BULK_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>

            {/* Apply button */}
            <button
              onClick={handleBulkApply}
              disabled={isBulkPending}
              className="px-4 py-1.5 bg-primary-500 hover:bg-primary-400 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {isBulkPending ? 'Applying...' : 'Apply'}
            </button>

            {/* Clear button */}
            <button
              onClick={() => setSelectedIds(new Set())}
              disabled={isBulkPending}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-50"
              aria-label="Clear selection"
            >
              <X className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
