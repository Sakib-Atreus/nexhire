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
