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
  | 'HIRED'
  | 'REJECTED'
  | 'WITHDRAWN';

export type NotificationType =
  | 'APPLICATION_RECEIVED'
  | 'APPLICATION_STATUS_CHANGED'
  | 'JOB_POSTED'
  | 'JOB_CLOSED'
  | 'GENERAL'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEW_UPDATED'
  | 'MESSAGE_RECEIVED'
  | 'INTERVIEW_RESPONSE'
  | 'JOB_ALERT';

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
  location?: string | null;
  /** Saved resume used for quick apply. */
  resumeUrl?: string | null;
  resumeFileName?: string | null;
  resumeUpdatedAt?: string | null;
  /** Opt-in public profile at /p/{profileSlug}. */
  publicProfile?: boolean;
  profileSlug?: string | null;
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
  companyId?: string | null;
  /** Public company page: /companies/{companySlug}. */
  companySlug?: string | null;
  companyVerified?: boolean;
  /** People to hire; the job closes as FILLED once this many applicants are hired. */
  openings?: number;
  /** Job detail only: the viewer is on this job's hiring team (poster, company teammate or admin). */
  canManage?: boolean;
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
  candidateAvatarUrl?: string | null;
  candidateHeadline?: string | null;
  /** Next scheduled interview (ISO), if any. */
  nextInterviewAt?: string | null;
  /** The candidate's response to that next interview. */
  nextInterviewResponse?: InterviewResponse | null;
  /** Hiring team only; null/absent for candidates. */
  rating?: number | null;
  /** Hiring team only; null/absent for candidates. */
  noteCount?: number | null;
  messageCount?: number;
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
export interface ApplicationStats { pending: number; reviewing: number; shortlisted: number; interviewed: number; offered: number; hired: number; rejected: number; withdrawn: number; total: number; }
export interface NotificationPreferences { applicationReceived: boolean; statusChanged: boolean; general: boolean; }

// ─── Admin panel ─────────────────────────────────────────────────────────────

export type ReportReason = 'SPAM' | 'SCAM' | 'MISLEADING' | 'OFFENSIVE' | 'DUPLICATE' | 'OTHER';
export type ReportStatus = 'OPEN' | 'RESOLVED' | 'DISMISSED';
export type AnnouncementTone = 'info' | 'success' | 'warning';

export type AuditAction =
  | 'USER_SUSPENDED' | 'USER_RESTORED' | 'USER_ROLE_CHANGED' | 'USER_DELETED' | 'USER_VERIFIED' | 'USER_UNVERIFIED'
  | 'JOB_HIDDEN' | 'JOB_UNHIDDEN' | 'JOB_FEATURED' | 'JOB_UNFEATURED' | 'JOB_STATUS_CHANGED' | 'JOB_DELETED'
  | 'REPORT_RESOLVED' | 'REPORT_DISMISSED' | 'SETTINGS_UPDATED' | 'COMPANY_VERIFIED' | 'COMPANY_UNVERIFIED';

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
  targetType?: 'USER' | 'JOB' | 'REPORT' | 'SETTINGS' | 'COMPANY' | null;
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
  /** Built-in video rooms are available for video interviews. */
  videoEnabled: boolean;
}

// ─── Companies & hiring tools ────────────────────────────────────────────────

export interface Company {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string | null;
  website?: string | null;
  /** Headcount band, one of CompanySize. */
  size?: string | null;
  industry?: string | null;
  headquarters?: string | null;
  description?: string | null;
  verified: boolean;
  openJobs: number;
  members: number;
  createdAt: string;
}

export interface CompanyMember {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  headline?: string | null;
  owner: boolean;
  joinedAt: string;
}

export interface MyCompany {
  company: Company;
  members: CompanyMember[];
  isOwner: boolean;
}

export interface CompanyProfile {
  company: Company;
  openJobs: Job[];
}

export interface CompanyInput {
  name: string;
  logoUrl?: string;
  website?: string;
  size?: string;
  industry?: string;
  headquarters?: string;
  description?: string;
}

export type InterviewType = 'VIDEO' | 'PHONE' | 'ONSITE';
export type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
/** The candidate's answer to the current invitation (resets to AWAITING whenever the recruiter picks a new time). */
export type InterviewResponse = 'AWAITING' | 'ACCEPTED' | 'NEW_TIME_REQUESTED' | 'DECLINED';

export interface Interview {
  id: string;
  applicationId: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  candidateId: string;
  candidateName: string;
  /** ISO instant (UTC). Display in the viewer's local time. */
  scheduledAt: string;
  durationMinutes: number;
  type: InterviewType;
  /** Video link, phone number or address. */
  location?: string | null;
  /** Shown to the candidate. */
  message?: string | null;
  status: InterviewStatus;
  createdAt: string;
  response: InterviewResponse;
  /** Candidate's note with their response (reason for declining, or context for new times). */
  responseNote?: string | null;
  /** ISO instants the candidate suggested (when response = NEW_TIME_REQUESTED). */
  proposedTimes: string[];
  respondedAt?: string | null;
  /** When the current time was sent to the candidate. */
  invitedAt: string;
  /** Scheduled, unanswered 48h after the invite, and still upcoming: the recruiter should follow up. */
  needsFollowUp: boolean;
  /** Has a built-in NexHire video room (join from 15 minutes before the start). */
  hasVideoRoom: boolean;
}

/** Personal join details for an interview's NexHire video room. */
export interface VideoJoin {
  interviewId: string;
  roomUrl: string;
  token: string;
  /** Hiring team members join as room owners (can mute or remove participants). */
  owner: boolean;
  userName: string;
  jobTitle: string;
  companyName: string;
  candidateName: string;
  scheduledAt: string;
  durationMinutes: number;
}

export interface InterviewInput {
  scheduledAt?: string;
  durationMinutes?: number;
  type?: InterviewType;
  location?: string;
  message?: string;
  status?: InterviewStatus;
  /** Save even though it overlaps other interviews (after showing the clash warning). */
  allowConflicts?: boolean;
  /** VIDEO interviews: create a built-in NexHire video room instead of pasting a link. */
  createVideoRoom?: boolean;
}

/**
 * One of YOUR interviews overlapping a proposed time. The candidate's schedule is never checked here
 * (they see their own clashes when responding). Label is "Another interview" with null ids for jobs you
 * can no longer manage.
 */
export interface InterviewConflict {
  who: 'YOU';
  interviewId: string | null;
  applicationId: string | null;
  scheduledAt: string;
  durationMinutes: number;
  label: string;
}

export interface ApplicationNote {
  id: string;
  applicationId: string;
  authorId?: string | null;
  authorName?: string | null;
  body: string;
  createdAt: string;
}

export interface ApplicationMessage {
  id: string;
  applicationId: string;
  senderId?: string | null;
  senderName?: string | null;
  fromCandidate: boolean;
  body: string;
  createdAt: string;
}

/** Placeholders the server fills in: {{candidateName}} {{firstName}} {{jobTitle}} {{companyName}} {{recruiterName}}. */
export interface MessageTemplate {
  id: string;
  name: string;
  body: string;
  updatedAt: string;
}

export interface JobAnalytics {
  views: number;
  applications: number;
  /** Reached at least the Interview stage (or had an interview booked). */
  interviewed: number;
  /** Reached at least Offer (includes hired). */
  offered: number;
  hired: number;
  openings: number;
  byStatus: Record<ApplicationStatus, number>;
  /** Percentages, null when the base is 0. */
  viewToApplyRate: number | null;
  applyToHireRate: number | null;
  averageRating: number | null;
  daysOpen: number;
  applicationsPerDay: DailyCount[];
}

// ─── Candidate experience (Phase 3) ──────────────────────────────────────────

/** A role on the profile. Dates are YYYY-MM-DD (day is ignored in the UI); endDate null = current role. */
export interface WorkExperience {
  id?: string;
  title: string;
  company: string;
  location?: string | null;
  startDate: string;
  endDate?: string | null;
  description?: string | null;
}

export interface Education {
  id?: string;
  school: string;
  degree?: string | null;
  fieldOfStudy?: string | null;
  startYear?: number | null;
  endYear?: number | null;
  description?: string | null;
}

/**
 * A candidate's profile: public (/p/{slug}) or for a hiring team they applied to.
 * email, phone and resumeUrl are only present for the hiring team.
 */
export interface CandidateProfile {
  id: string;
  fullName: string;
  headline?: string | null;
  location?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  skills: string[];
  portfolioLinks: string[];
  openToWork: boolean;
  experience: WorkExperience[];
  education: Education[];
  memberSince: string;
  email?: string | null;
  phone?: string | null;
  resumeUrl?: string | null;
  /** Set when the profile is public. */
  profileSlug?: string | null;
}

export type AlertFrequency = 'INSTANT' | 'DAILY';

export interface JobAlert {
  id: string;
  name: string;
  keyword?: string | null;
  location?: string | null;
  category?: string | null;
  jobType?: JobType | null;
  experienceLevel?: ExperienceLevel | null;
  frequency: AlertFrequency;
  active: boolean;
  emailEnabled: boolean;
  /** Open jobs matching right now. */
  currentMatches: number;
  lastSentAt?: string | null;
  createdAt: string;
}

/** Create/update body. At least one of keyword, location, category, jobType, experienceLevel is required. */
export interface JobAlertInput {
  name?: string;
  keyword?: string;
  location?: string;
  category?: string;
  jobType?: JobType | null;
  experienceLevel?: ExperienceLevel | null;
  frequency?: AlertFrequency;
  active?: boolean;
  emailEnabled?: boolean;
}

export interface RecommendedJob {
  job: Job;
  /** 0–100 */
  matchScore: number;
  /** Profile skills found in the job's tags (as written on the profile). */
  matchedSkills: string[];
}

export type ApplicationEventType =
  | 'APPLIED' | 'STATUS_CHANGED' | 'WITHDRAWN'
  | 'INTERVIEW_SCHEDULED' | 'INTERVIEW_RESCHEDULED' | 'INTERVIEW_CANCELLED' | 'INTERVIEW_COMPLETED'
  | 'INTERVIEW_ACCEPTED' | 'INTERVIEW_NEW_TIME_REQUESTED' | 'INTERVIEW_DECLINED';

export interface ApplicationEvent {
  id: string;
  type: ApplicationEventType;
  fromStatus?: ApplicationStatus | null;
  toStatus?: ApplicationStatus | null;
  /** For STATUS_CHANGED: the hiring team's message to the candidate. Otherwise context (e.g. interview type). */
  note?: string | null;
  actorName?: string | null;
  createdAt: string;
}
