import type { ApplicationStatus, AuditAction, ExperienceLevel, JobStatus, JobType, ReportReason, ReportStatus, Role } from '@/types';

// Human-readable labels and badge styles for every enum the API returns.
// Never render a raw enum value (e.g. "FULL_TIME") in the UI — use these maps.

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  REMOTE: 'Remote',
};

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  ENTRY: 'Entry level',
  MID: 'Mid level',
  SENIOR: 'Senior',
  LEAD: 'Lead',
  EXECUTIVE: 'Executive',
};

export const EXPERIENCE_STYLES: Record<ExperienceLevel, string> = {
  ENTRY: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  MID: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  SENIOR: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  LEAD: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  EXECUTIVE: 'bg-rose-50 text-rose-700 ring-rose-600/20',
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  OPEN: 'Open',
  DRAFT: 'Draft',
  CLOSED: 'Closed',
  FILLED: 'Filled',
};

export const JOB_STATUS_STYLES: Record<JobStatus, string> = {
  OPEN: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  DRAFT: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  CLOSED: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  FILLED: 'bg-violet-50 text-violet-700 ring-violet-600/20',
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING: 'Applied',
  REVIEWING: 'Under review',
  SHORTLISTED: 'Shortlisted',
  INTERVIEWED: 'Interviewed',
  OFFERED: 'Offer extended',
  REJECTED: 'Not selected',
  WITHDRAWN: 'Withdrawn',
};

export const APPLICATION_STATUS_STYLES: Record<ApplicationStatus, string> = {
  PENDING: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  REVIEWING: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  SHORTLISTED: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  INTERVIEWED: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  OFFERED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  REJECTED: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  WITHDRAWN: 'bg-slate-50 text-slate-500 ring-slate-400/20',
};

/** Solid colors for charts / progress bars, same hue family as the badges. */
export const APPLICATION_STATUS_BAR: Record<ApplicationStatus, string> = {
  PENDING: 'bg-slate-400',
  REVIEWING: 'bg-sky-500',
  SHORTLISTED: 'bg-indigo-500',
  INTERVIEWED: 'bg-amber-500',
  OFFERED: 'bg-emerald-500',
  REJECTED: 'bg-rose-500',
  WITHDRAWN: 'bg-slate-300',
};

/** Pipeline order used for stats and filters. */
export const APPLICATION_STATUS_ORDER: ApplicationStatus[] = [
  'PENDING', 'REVIEWING', 'SHORTLISTED', 'INTERVIEWED', 'OFFERED', 'REJECTED', 'WITHDRAWN',
];

/** Status changes a recruiter may make from each state. */
export const ALLOWED_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  PENDING: ['REVIEWING', 'SHORTLISTED', 'REJECTED'],
  REVIEWING: ['SHORTLISTED', 'INTERVIEWED', 'REJECTED'],
  SHORTLISTED: ['INTERVIEWED', 'OFFERED', 'REJECTED'],
  INTERVIEWED: ['OFFERED', 'REJECTED'],
  OFFERED: ['REJECTED'],
  REJECTED: [],
  WITHDRAWN: [],
};

export const ROLE_LABELS: Record<Role, string> = {
  CANDIDATE: 'Job seeker',
  RECRUITER: 'Recruiter',
  ADMIN: 'Administrator',
};

export const ROLE_STYLES: Record<Role, string> = {
  CANDIDATE: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  RECRUITER: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  ADMIN: 'bg-rose-50 text-rose-700 ring-rose-600/20',
};

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'BDT', 'INR', 'SGD', 'AED', 'CAD', 'AUD'] as const;

export const JOB_TYPE_OPTIONS = (Object.keys(JOB_TYPE_LABELS) as JobType[]).map((v) => ({
  value: v,
  label: JOB_TYPE_LABELS[v],
}));

export const EXPERIENCE_OPTIONS = (Object.keys(EXPERIENCE_LABELS) as ExperienceLevel[]).map((v) => ({
  value: v,
  label: EXPERIENCE_LABELS[v],
}));

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  SPAM: 'Spam or advertising',
  SCAM: 'Scam or asks for payment',
  MISLEADING: 'Misleading or false information',
  OFFENSIVE: 'Offensive or discriminatory',
  DUPLICATE: 'Duplicate posting',
  OTHER: 'Something else',
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  OPEN: 'Open',
  RESOLVED: 'Resolved',
  DISMISSED: 'Dismissed',
};

export const REPORT_STATUS_STYLES: Record<ReportStatus, string> = {
  OPEN: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  RESOLVED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  DISMISSED: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  USER_SUSPENDED: 'Suspended user',
  USER_RESTORED: 'Restored user',
  USER_ROLE_CHANGED: 'Changed role',
  USER_DELETED: 'Deleted user',
  USER_VERIFIED: 'Verified recruiter',
  USER_UNVERIFIED: 'Removed verification',
  JOB_HIDDEN: 'Hid job',
  JOB_UNHIDDEN: 'Unhid job',
  JOB_FEATURED: 'Featured job',
  JOB_UNFEATURED: 'Unfeatured job',
  JOB_STATUS_CHANGED: 'Changed job status',
  JOB_DELETED: 'Deleted job',
  REPORT_RESOLVED: 'Resolved report',
  REPORT_DISMISSED: 'Dismissed report',
  SETTINGS_UPDATED: 'Updated settings',
};

/** Tone per action family for audit badges: destructive red, positive green, neutral slate. */
export const AUDIT_ACTION_STYLES: Record<AuditAction, string> = {
  USER_SUSPENDED: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  USER_DELETED: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  JOB_DELETED: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  JOB_HIDDEN: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  USER_UNVERIFIED: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  JOB_UNFEATURED: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  USER_RESTORED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  USER_VERIFIED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  JOB_UNHIDDEN: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  JOB_FEATURED: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  USER_ROLE_CHANGED: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  JOB_STATUS_CHANGED: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  REPORT_RESOLVED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  REPORT_DISMISSED: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  SETTINGS_UPDATED: 'bg-violet-50 text-violet-700 ring-violet-600/20',
};
