export type Role = 'ADMIN' | 'RECRUITER' | 'CANDIDATE';

export type JobStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'FILLED';
export type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'REMOTE';
export type ExperienceLevel = 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE';

export type ApplicationStatus =
  | 'PENDING'
  | 'REVIEWING'
  | 'SHORTLISTED'
  | 'INTERVIEWED'
  | 'OFFERED'
  | 'REJECTED'
  | 'WITHDRAWN';

export type NotificationType =
  | 'APPLICATION_RECEIVED'
  | 'APPLICATION_STATUS_CHANGED'
  | 'JOB_POSTED'
  | 'JOB_CLOSED'
  | 'GENERAL';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: Role;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  createdAt: string;
  skills?: string[];
  headline?: string;
  portfolioLinks?: string[];
  enabled?: boolean;
  openToWork?: boolean;
  /** Recruiter verified by an admin. */
  verified?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  companyName: string;
  companyLogoUrl?: string;
  location?: string;
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  status: JobStatus;
  tags?: string;
  deadline?: string;
  recruiterId: string;
  recruiterName: string;
  createdAt: string;
  updatedAt: string;
  viewCount?: number;
  screeningQuestions?: string[];
  isSaved?: boolean;
  applicationCount?: number;
  category?: string | null;
  /** Promoted by an admin: shown first in search and on the home page. */
  featured?: boolean;
  /** Hidden by moderation; only the owner and admins can see it. */
  hidden?: boolean;
  recruiterVerified?: boolean;
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  coverLetter?: string;
  resumeUrl?: string;
  status: ApplicationStatus;
  notes?: string;
  appliedAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  referenceId?: string;
  referenceType?: string;
  createdAt: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface ApiError {
  status: number;
  message: string;
  path: string;
  timestamp: string;
  fieldErrors?: Record<string, string>;
}

export interface SavedJob { id: string; jobId: string; savedAt: string; job: Job; }
export interface FileUploadResponse { url: string; fileName: string; contentType: string; size: number; }
export interface ApplicationStats { pending: number; reviewing: number; shortlisted: number; interviewed: number; offered: number; rejected: number; withdrawn: number; total: number; }
export interface NotificationPreferences { applicationReceived: boolean; statusChanged: boolean; general: boolean; }

// ─── Admin panel ─────────────────────────────────────────────────────────────

export type ReportReason = 'SPAM' | 'SCAM' | 'MISLEADING' | 'OFFENSIVE' | 'DUPLICATE' | 'OTHER';
export type ReportStatus = 'OPEN' | 'RESOLVED' | 'DISMISSED';
export type AnnouncementTone = 'info' | 'success' | 'warning';

export type AuditAction =
  | 'USER_SUSPENDED' | 'USER_RESTORED' | 'USER_ROLE_CHANGED' | 'USER_DELETED' | 'USER_VERIFIED' | 'USER_UNVERIFIED'
  | 'JOB_HIDDEN' | 'JOB_UNHIDDEN' | 'JOB_FEATURED' | 'JOB_UNFEATURED' | 'JOB_STATUS_CHANGED' | 'JOB_DELETED'
  | 'REPORT_RESOLVED' | 'REPORT_DISMISSED' | 'SETTINGS_UPDATED';

export interface DailyCount { date: string; count: number; }
export interface CompanyStat { companyName: string; openJobs: number; applications: number; }

export interface AdminOverview {
  totalUsers: number;
  candidates: number;
  recruiters: number;
  admins: number;
  suspendedUsers: number;
  unverifiedRecruiters: number;
  newUsersLast30Days: number;
  totalJobs: number;
  openJobs: number;
  hiddenJobs: number;
  featuredJobs: number;
  totalApplications: number;
  applicationsLast30Days: number;
  openReports: number;
  /** Last 30 days, oldest first, no gaps (dates are YYYY-MM-DD, UTC). */
  signupsPerDay: DailyCount[];
  applicationsPerDay: DailyCount[];
  topCompanies: CompanyStat[];
}

export interface AuditLogEntry {
  id: string;
  actorId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  action: AuditAction;
  targetType?: 'USER' | 'JOB' | 'REPORT' | 'SETTINGS' | null;
  targetId?: string | null;
  targetLabel?: string | null;
  details?: string | null;
  createdAt: string;
}

export interface AdminUserDetail {
  user: User;
  jobsPosted: number;
  applicationsSubmitted: number;
  reportsFiled: number;
  recentJobs: Job[];
  recentApplications: Application[];
  /** Admin actions taken on this user, newest first (max 10). */
  history: AuditLogEntry[];
}

export interface JobReport {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  jobHidden: boolean;
  /** Open reports for the same job, including this one. */
  openReportsForJob: number;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  reason: ReportReason;
  details?: string | null;
  status: ReportStatus;
  resolutionNote?: string | null;
  resolvedByName?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface Announcement {
  enabled: boolean;
  message: string;
  tone: AnnouncementTone;
  linkUrl: string;
  linkLabel: string;
}

export interface PublicSettings {
  announcement: Announcement;
  categories: string[];
  skills: string[];
}
