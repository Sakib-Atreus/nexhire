# NexHire — Complete Developer Manual

> Full-stack Job Portal · Spring Boot 3 · Next.js 15 · PostgreSQL · RabbitMQ · MinIO

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Infrastructure — Docker Services](#3-infrastructure--docker-services)
4. [Starting the Project](#4-starting-the-project)
5. [Backend — How It Works](#5-backend--how-it-works)
6. [API Reference — All Endpoints](#6-api-reference--all-endpoints)
7. [Frontend — Pages & Routes](#7-frontend--pages--routes)
8. [Frontend — Hooks Reference](#8-frontend--hooks-reference)
9. [Step-by-Step Testing Guide](#9-step-by-step-testing-guide)
10. [Roles & Permissions](#10-roles--permissions)
11. [File Upload (MinIO)](#11-file-upload-minio)
12. [Real-Time Notifications (SSE)](#12-real-time-notifications-sse)
13. [Environment Variables](#13-environment-variables)
14. [Database Migrations](#14-database-migrations)
15. [Common Errors & Fixes](#15-common-errors--fixes)

---

## 1. Project Overview

NexHire is a full-stack job portal with three user roles:

| Role | What they can do |
|------|-----------------|
| **CANDIDATE** | Browse jobs, apply, save jobs, manage profile, track applications |
| **RECRUITER** | Post jobs, manage applicants, bulk update status, view stats |
| **ADMIN** | Everything above + manage all users (ban, promote, delete) |

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Spring Boot 3.3.5, Java 21 |
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Database | PostgreSQL 16 |
| Message Queue | RabbitMQ 3.13 |
| File Storage | MinIO (S3-compatible) |
| Auth | JWT (access token 24h, refresh token 7d) |
| State (frontend) | TanStack Query v5 + Zustand v5 |
| API Docs | SpringDoc OpenAPI (Swagger UI) |
| Migrations | Flyway |
| Monorepo | Turborepo |

---

## 3. Infrastructure — Docker Services

All services run via Docker Compose:

```bash
cd docker
docker compose -f docker-compose.dev.yml up -d
```

| Service | Container | Host Port | Purpose |
|---------|-----------|-----------|---------|
| PostgreSQL | nexhire-postgres-dev | **5433** | Main database |
| RabbitMQ | nexhire-rabbitmq-dev | **5672** (AMQP), **15672** (UI) | Message queue |
| MinIO | nexhire-minio-dev | **9000** (API), **9001** (Console) | File storage |

### Service Credentials

**PostgreSQL**
- Database: `nexhire_dev`
- User: `nexhire`
- Password: `root1234`
- Connect: `jdbc:postgresql://localhost:5433/nexhire_dev`

**RabbitMQ**
- User: `nexhire`
- Password: `root1234`
- Management UI: http://localhost:15672

**MinIO**
- Root User: `nexhire-minio`
- Root Password: `minio1234`
- Console UI: http://localhost:9001
- Bucket: `nexhire-files`

---

## 4. Starting the Project

### Step 1 — Start Docker services

```bash
cd docker
docker compose -f docker-compose.dev.yml up -d

# Verify all containers are running
docker ps
```

Expected containers: `nexhire-postgres-dev`, `nexhire-rabbitmq-dev`, `nexhire-minio-dev`

### Step 2 — Start the Backend (Spring Boot)

```bash
# Set Java 21 (required — project does not work with Java 25)
export JAVA_HOME=$(/usr/libexec/java_home -v 21)

cd apps/api
mvn spring-boot:run
```

Wait for this line:
```
Started NexHireApplication in X.XXX seconds
```

Backend is now live at: `http://localhost:8080/api`

### Step 3 — Start the Frontend (Next.js)

Open a new terminal:

```bash
cd apps/web
npm run dev
```

Frontend is now live at: `http://localhost:3000`

### Step 4 — Verify Everything Works

```bash
# Backend health check
curl http://localhost:8080/api/actuator/health
# Expected: {"status":"UP"}

# Swagger UI (all API endpoints)
open http://localhost:8080/api/swagger-ui/index.html

# Frontend
open http://localhost:3000
```

---

## 5. Backend — How It Works

### Request Flow

```
Browser / Frontend
    ↓  HTTP request with Bearer token
JwtAuthenticationFilter      ← extracts JWT, sets SecurityContext
    ↓
RateLimitingFilter           ← 10 req/min/IP on /auth/login and /auth/register
    ↓
SecurityConfig               ← checks if path is permitAll or requires auth
    ↓
Controller (@RestController)
    ↓
Service (@Service)           ← business logic, @Transactional
    ↓
Repository (JPA)             ← PostgreSQL
    ↓
Response JSON
```

### Auth Flow (JWT)

1. User registers or logs in → gets `accessToken` (24h) + `refreshToken` (7d)
2. Frontend stores both in cookies via `js-cookie`
3. Every API request includes `Authorization: Bearer <accessToken>` header
4. When a 401 is received, frontend auto-calls `POST /auth/refresh` with the refresh token
5. On success → new access token stored, original request retried
6. On failure → cookies cleared, redirect to `/login`

### Notification Flow (RabbitMQ + SSE)

```
Action occurs (application submitted, status changed)
    ↓
Service publishes event to RabbitMQ queue
    ↓
NotificationConsumer picks up event, saves Notification to DB
    ↓
SseEmitterService pushes notification to connected user via SSE
    ↓
Frontend EventSource receives it, updates UI in real-time
```

### File Upload Flow

```
User picks file in FileUpload component
    ↓
POST /api/files/upload (multipart/form-data)
    ↓
FileService validates: type must be image/pdf/doc/docx, max 10MB
    ↓
MinIO SDK uploads to "nexhire-files" bucket
    ↓
Returns public URL: http://localhost:9000/nexhire-files/filename.pdf
    ↓
Frontend stores URL (resumeUrl, avatarUrl) in state/DB
```

---

## 6. API Reference — All Endpoints

**Base URL**: `http://localhost:8080/api`

All authenticated endpoints require: `Authorization: Bearer <token>`

---

### Auth Endpoints (`/auth`)

All auth endpoints are **public** (no token required).

#### POST `/auth/register`
Register a new user.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "CANDIDATE"
}
```
`role` must be `CANDIDATE` or `RECRUITER` (ADMIN is assigned manually).

**Response:** `AuthResponse` (access token, refresh token, user info)

---

#### POST `/auth/login`
Login with email and password.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `AuthResponse`

---

#### POST `/auth/refresh`
Get a new access token using a refresh token.

**Body:**
```json
{
  "refreshToken": "<your-refresh-token>"
}
```

**Response:** `AuthResponse` with new access token

---

#### POST `/auth/forgot-password`
Request a password reset. Token is logged to server console (email sending not yet implemented).

**Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `{ "message": "If an account exists..." }`

**Note:** Check Spring Boot console for the reset token.

---

#### POST `/auth/reset-password`
Reset password using the token from the server logs.

**Body:**
```json
{
  "token": "<token-from-logs>",
  "newPassword": "newpassword123"
}
```

---

#### POST `/auth/verify-email`
Verify email address using the token from the server logs.

**Body:**
```json
{
  "token": "<token-from-logs>"
}
```

---

#### POST `/auth/resend-verification`
Resend email verification token. **Requires authentication.**

**Headers:** `Authorization: Bearer <token>`

**Response:** `{ "message": "Verification email has been sent..." }`

---

### User Endpoints (`/users`)

#### GET `/users/me` — Authenticated
Get the currently logged-in user's profile.

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "fullName": "John Doe",
  "role": "CANDIDATE",
  "phone": null,
  "bio": null,
  "avatarUrl": null,
  "emailVerified": false,
  "createdAt": "2024-01-01T00:00:00Z",
  "skills": [],
  "headline": null,
  "portfolioLinks": [],
  "enabled": true
}
```

---

#### PATCH `/users/me` — Authenticated
Update current user's profile.

**Body (all fields optional):**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "bio": "Software developer...",
  "avatarUrl": "http://localhost:9000/nexhire-files/avatar.jpg",
  "skills": ["Java", "Spring Boot", "React"],
  "headline": "Senior Software Engineer",
  "portfolioLinks": ["https://github.com/username"]
}
```

---

#### GET `/users` — ADMIN only
Get all users (paginated).

**Query Params:** `page=0&size=20`

---

#### GET `/users/{id}` — ADMIN only
Get user by ID.

---

#### DELETE `/users/{id}` — ADMIN only
Delete a user.

---

#### PATCH `/users/{id}/status` — ADMIN only
Ban or unban a user.

**Body:**
```json
{ "enabled": false }
```
`false` = banned, `true` = active

---

#### PATCH `/users/{id}/role` — ADMIN only
Change a user's role.

**Body:**
```json
{ "role": "RECRUITER" }
```
`role` must be one of: `CANDIDATE`, `RECRUITER`, `ADMIN`

---

### Job Endpoints (`/jobs`)

#### GET `/jobs` — Public
Search and browse jobs with filters.

**Query Params:**
| Param | Type | Example |
|-------|------|---------|
| `keyword` | string | `Java developer` |
| `location` | string | `New York` |
| `jobType` | string | `FULL_TIME` |
| `experienceLevel` | string | `MID` |
| `salaryMin` | integer | `50000` |
| `salaryMax` | integer | `100000` |
| `page` | integer | `0` |
| `size` | integer | `10` |

Job types: `FULL_TIME`, `PART_TIME`, `CONTRACT`, `REMOTE`, `INTERNSHIP`
Experience levels: `ENTRY`, `MID`, `SENIOR`, `LEAD`, `EXECUTIVE`

---

#### GET `/jobs/saved` — CANDIDATE
Get all jobs the candidate has bookmarked.

---

#### GET `/jobs/my` — RECRUITER
Get all jobs posted by the current recruiter.

---

#### GET `/jobs/{id}` — Public
Get job details. Also increments the view count.

---

#### POST `/jobs` — RECRUITER
Create a new job posting.

**Body:**
```json
{
  "title": "Senior Backend Developer",
  "description": "We are looking for...",
  "requirements": "5+ years of Java...",
  "responsibilities": "Design and develop...",
  "companyName": "TechCorp",
  "location": "New York",
  "jobType": "FULL_TIME",
  "experienceLevel": "SENIOR",
  "salaryMin": 80000,
  "salaryMax": 120000,
  "deadline": "2024-12-31",
  "tags": "java,spring,backend"
}
```

---

#### PATCH `/jobs/{id}` — RECRUITER (owner only)
Update a job posting. Same fields as create, all optional.

---

#### DELETE `/jobs/{id}` — RECRUITER (owner only)
Delete a job posting.

---

#### POST `/jobs/{id}/save` — CANDIDATE
Bookmark a job for later.

---

#### DELETE `/jobs/{id}/save` — CANDIDATE
Remove a bookmarked job.

---

### Application Endpoints (`/applications`)

#### POST `/applications` — CANDIDATE
Apply to a job.

**Body:**
```json
{
  "jobId": "uuid",
  "coverLetter": "I am excited to apply...",
  "resumeUrl": "http://localhost:9000/nexhire-files/resume.pdf"
}
```

**Note:** `coverLetter` and `resumeUrl` are **required** in the frontend form.

---

#### GET `/applications/my` — CANDIDATE
Get all of the candidate's applications with status.

---

#### GET `/applications/job/{jobId}` — RECRUITER
Get all applications for a specific job.

---

#### GET `/applications/recruiter` — RECRUITER
Get all applications across all of the recruiter's jobs.

---

#### GET `/applications/recruiter/stats` — RECRUITER
Get application counts by status.

**Response:**
```json
{
  "total": 45,
  "pending": 20,
  "reviewing": 10,
  "shortlisted": 8,
  "rejected": 5,
  "hired": 2
}
```

---

#### PATCH `/applications/{id}/status` — RECRUITER
Update a single application's status.

**Body:**
```json
{
  "status": "SHORTLISTED",
  "notes": "Strong candidate, schedule interview"
}
```

Status values: `PENDING`, `REVIEWING`, `SHORTLISTED`, `REJECTED`, `HIRED`

---

#### PATCH `/applications/bulk-status` — RECRUITER
Update multiple applications at once.

**Body:**
```json
{
  "applicationIds": ["uuid1", "uuid2", "uuid3"],
  "status": "REJECTED",
  "notes": "Position filled"
}
```

---

### Notification Endpoints (`/notifications`)

#### GET `/notifications` — Authenticated
Get all notifications for the current user (paginated).

---

#### GET `/notifications/unread-count` — Authenticated
Get the number of unread notifications.

**Response:** `{ "count": 5 }`

---

#### PATCH `/notifications/mark-all-read` — Authenticated
Mark all notifications as read.

---

#### PATCH `/notifications/{id}/read` — Authenticated
Mark a single notification as read.

---

#### GET `/notifications/stream` — Authenticated
Open a Server-Sent Events (SSE) stream for real-time notifications.

**Usage:** Frontend uses `EventSource` to connect. The stream sends notification data as JSON events.

```
GET /api/notifications/stream
Authorization: Bearer <token>
```

Or via query param (for EventSource which can't set headers):
```
GET /api/notifications/stream?token=<accessToken>
```

---

#### GET `/notifications/preferences` — Authenticated
Get notification preferences (stored as JSON).

---

#### PATCH `/notifications/preferences` — Authenticated
Update notification preferences.

**Body:**
```json
{
  "applicationUpdates": true,
  "newMessages": false,
  "jobRecommendations": true
}
```

---

### File Upload Endpoint (`/files`)

#### POST `/files/upload` — Authenticated
Upload a file (resume, avatar, etc.) to MinIO.

**Request:** `multipart/form-data` with field `file`

**Constraints:**
- Allowed types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Max size: 10 MB

**Response:**
```json
{
  "url": "http://localhost:9000/nexhire-files/abc123-resume.pdf",
  "fileName": "abc123-resume.pdf",
  "contentType": "application/pdf",
  "size": 204800
}
```

---

## 7. Frontend — Pages & Routes

### Auth Pages (no login required)

| Route | Description |
|-------|-------------|
| `/login` | Login with email + password |
| `/register` | Create account. Add `?role=RECRUITER` for recruiter registration |
| `/forgot-password` | Request password reset |
| `/reset-password?token=<token>` | Set a new password |
| `/verify-email?token=<token>` | Verify email address |

### Dashboard Pages (login required)

| Route | Role | Description |
|-------|------|-------------|
| `/dashboard` | ALL | Role-specific dashboard (stats, quick actions) |
| `/profile` | ALL | Edit profile: name, bio, skills, avatar, portfolio links |
| `/applications` | CANDIDATE | View all submitted applications and their statuses |
| `/notifications` | ALL | View notifications with real-time SSE updates |
| `/notifications/preferences` | ALL | Configure which notifications to receive |

### Job Pages

| Route | Role | Description |
|-------|------|-------------|
| `/jobs` | ALL | Browse all open jobs with search + salary filters |
| `/jobs/[id]` | ALL | Job details, apply button (CANDIDATE) or manage button (RECRUITER) |
| `/jobs/saved` | CANDIDATE | All bookmarked jobs |
| `/jobs/create` | RECRUITER | Post a new job |
| `/jobs/my` | RECRUITER | All jobs posted by recruiter |
| `/jobs/[id]/edit` | RECRUITER | Edit an existing job posting |
| `/jobs/[id]/applicants` | RECRUITER | View and manage all applicants for a job |

### Admin Pages

| Route | Role | Description |
|-------|------|-------------|
| `/admin/users` | ADMIN | View all users, ban/unban, change roles |
| `/admin/analytics` | ADMIN | Platform-wide analytics |

---

## 8. Frontend — Hooks Reference

All hooks use TanStack Query. They handle loading, error, and caching automatically.

### Auth (`useAuth.ts`)

```ts
const { mutate: login, isPending } = useLogin();
login({ email, password });

const { mutate: register } = useRegister();
register({ email, password, firstName, lastName, role });

const logout = useLogout();
logout(); // clears cookies, redirects to /login

const { mutate: forgotPassword } = useForgotPassword();
const { mutate: resetPassword } = useResetPassword();
const { mutate: verifyEmail } = useVerifyEmail();
const { mutate: resendVerification } = useResendVerification();
```

### Jobs (`useJobs.ts`)

```ts
const { data, isLoading } = useJobs({ keyword: 'java', page: 0, size: 10 });
const { data: job } = useJob(id);
const { data: myJobs } = useMyJobs();
const { data: savedJobs } = useSavedJobs();

const { mutate: createJob } = useCreateJob();
const { mutate: updateJob } = useUpdateJob(id);
const { mutate: deleteJob } = useDeleteJob();
const { mutate: saveJob } = useSaveJob();
const { mutate: unsaveJob } = useUnsaveJob();
```

### Applications (`useApplications.ts`)

```ts
const { data } = useMyApplications();
const { data } = useJobApplications(jobId);
const { data } = useRecruiterApplications();
const { data: stats } = useRecruiterStats();
const { applied, application } = useCheckApplied(jobId);

const { mutate: apply } = useApply();
apply({ jobId, coverLetter, resumeUrl });

const { mutate: updateStatus } = useUpdateApplicationStatus();
updateStatus({ id, status: 'SHORTLISTED', notes: '...' });

const { mutate: bulkUpdate } = useBulkUpdateStatus();
bulkUpdate({ applicationIds: ['uuid1', 'uuid2'], status: 'REJECTED' });
```

### Profile (`useProfile.ts`)

```ts
const { data: me } = useMe();

const { mutate: updateProfile } = useUpdateProfile();
updateProfile({ firstName, bio, skills: ['React', 'Node.js'], headline: '...' });
```

### Users — Admin (`useUsers.ts`)

```ts
const { data } = useAllUsers(page, size);

const { mutate: banUser } = useBanUser();
banUser({ id: userId, enabled: false }); // false = ban, true = unban

const { mutate: promoteUser } = usePromoteUser();
promoteUser({ id: userId, role: 'RECRUITER' });

const { mutate: deleteUser } = useDeleteUser();
```

### Notifications (`useNotifications.ts`)

```ts
const { data: notifications } = useNotifications();
const { data: unread } = useUnreadCount(); // auto-refetches every 30s
const { mutate: markAllRead } = useMarkAllRead();

useNotificationStream(); // opens SSE connection, call in a page component

const { data: prefs } = useNotificationPreferences();
const { mutate: updatePrefs } = useUpdatePreferences();
```

### File Upload (`useFileUpload.ts`)

```ts
const { mutate: upload, isPending } = useFileUpload();
upload(file, {
  onSuccess: (data) => setResumeUrl(data.url),
});
```

---

## 9. Step-by-Step Testing Guide

Follow these steps in order to test the complete application flow.

### Step 1 — Register Accounts

Open http://localhost:3000/register

Register three accounts:

| Account | Email | Role |
|---------|-------|------|
| Candidate | candidate@test.com | CANDIDATE |
| Recruiter | recruiter@test.com | RECRUITER |
| Admin | admin@test.com | ADMIN* |

*Admin: Register as CANDIDATE, then promote via API or DB.

**To create admin via Swagger:**
1. Login as any user, copy the access token
2. Go to http://localhost:8080/api/swagger-ui/index.html
3. Authorize with the token
4. Use `PATCH /users/{id}/role` with body `{ "role": "ADMIN" }`

---

### Step 2 — Test Recruiter Flow

Login as the recruiter at http://localhost:3000/login

**Post a Job:**
1. Go to `/jobs/create`
2. Fill in all fields (title, company, description, type, level, salary)
3. Submit → you are redirected to the job listing

**View your jobs:**
- Go to `/jobs/my` — the posted job appears

**Check dashboard:**
- Go to `/dashboard` — shows your job count and application stats

---

### Step 3 — Test Candidate Flow

Login as the candidate.

**Browse and apply:**
1. Go to `/jobs` — see the recruiter's job
2. Click the job → Job detail page
3. Click "Apply Now"
4. Fill in **Cover Letter** (required) and upload a **Resume** (required)
5. Submit → success screen

**Save a job:**
- On any job card, click the bookmark icon → job saved
- Go to `/jobs/saved` → saved job appears

**Check applications:**
- Go to `/applications` → see the submitted application with `PENDING` status

---

### Step 4 — Test Recruiter Applicant Management

Login as the recruiter.

1. Go to `/jobs/my` → click your job
2. Click "View Applicants" → see the candidate's application
3. Change status to `SHORTLISTED` using the dropdown
4. Test bulk select: check multiple applicants → use bulk action bar to set all to `REVIEWING`

**Check stats:**
- Go to `/dashboard` → application counts update in real-time

---

### Step 5 — Test Admin Flow

Login as the admin user.

**Manage users:**
1. Go to `/admin/users`
2. Find the candidate account
3. Click "Ban" → user is disabled
4. Login as that candidate → access is denied
5. Go back to admin, click "Unban" → access restored

**Change role:**
1. In `/admin/users`, find the candidate
2. Change role to `RECRUITER` via the dropdown
3. Login as that user → they now see recruiter dashboard

---

### Step 6 — Test File Upload

1. Login as any user
2. Go to `/profile`
3. Upload an avatar image (JPG/PNG, max 10MB)
4. Check MinIO console at http://localhost:9001 (login: nexhire-minio / minio1234)
5. The file appears in the `nexhire-files` bucket

---

### Step 7 — Test Real-Time Notifications

Open two browser windows (or tabs):

**Window 1:** Logged in as candidate → go to `/notifications`
**Window 2:** Logged in as recruiter → go to applicants page

1. In recruiter window: change an application status
2. In candidate window: a new notification should appear **without page refresh**

---

### Step 8 — Test Token Refresh

1. Login as any user
2. Copy the `accessToken` cookie value
3. Wait a moment, then manually delete the `accessToken` cookie (keep `refreshToken`)
4. Perform any action on the frontend
5. The frontend silently refreshes the token and retries → no login prompt

---

### Step 9 — Test Rate Limiting

```bash
# Try to login 11+ times quickly — 11th request returns 429
for i in {1..12}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST http://localhost:8080/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"x@x.com","password":"wrong"}'
done
```

---

### Step 10 — Test Password Reset

1. Go to `/forgot-password`
2. Enter your email
3. Check the Spring Boot console logs for the token:
   ```
   PASSWORD_RESET_TOKEN for user@test.com: <token-here>
   ```
4. Go to `/reset-password?token=<token-from-logs>`
5. Enter new password
6. Login with new password

---

## 10. Roles & Permissions

### What each role can access

| Feature | CANDIDATE | RECRUITER | ADMIN |
|---------|-----------|-----------|-------|
| Browse jobs | ✅ | ✅ | ✅ |
| Apply to jobs | ✅ | ❌ | ❌ |
| Save jobs | ✅ | ❌ | ❌ |
| View own applications | ✅ | ❌ | ❌ |
| Post jobs | ❌ | ✅ | ✅ |
| Edit own jobs | ❌ | ✅ | ✅ |
| View applicants | ❌ | ✅ | ✅ |
| Update application status | ❌ | ✅ | ✅ |
| Bulk update applications | ❌ | ✅ | ✅ |
| View all users | ❌ | ❌ | ✅ |
| Ban/unban users | ❌ | ❌ | ✅ |
| Change user roles | ❌ | ❌ | ✅ |
| Delete users | ❌ | ❌ | ✅ |
| View analytics | ❌ | ❌ | ✅ |

### SecurityConfig Rules

- `POST /auth/**` — public
- `GET /jobs/**` — public (read-only job browsing)
- `GET /v3/api-docs/**`, `GET /swagger-ui/**` — public
- `GET /actuator/health` — public
- **Everything else** — requires valid JWT token

---

## 11. File Upload (MinIO)

### How it works

1. Frontend sends `multipart/form-data` to `POST /api/files/upload`
2. `FileService` validates file type and size
3. File is uploaded to MinIO bucket `nexhire-files` with a UUID prefix
4. A public URL is returned: `http://localhost:9000/nexhire-files/<filename>`
5. Store this URL in the relevant field (resumeUrl, avatarUrl)

### Allowed file types

| Type | MIME |
|------|------|
| PDF | `application/pdf` |
| Word (.doc) | `application/msword` |
| Word (.docx) | `application/vnd.openxmlformats...` |
| JPEG | `image/jpeg` |
| PNG | `image/png` |
| GIF | `image/gif` |
| WebP | `image/webp` |

Max size: **10 MB**

### Browse uploaded files

Go to MinIO Console: http://localhost:9001
- Username: `nexhire-minio`
- Password: `minio1234`
- Click the `nexhire-files` bucket

---

## 12. Real-Time Notifications (SSE)

### How it works

The frontend opens a persistent HTTP connection to `GET /api/notifications/stream`.
The server pushes events whenever something happens (new application, status change, etc.).

### Frontend usage

```ts
// In a React component
useNotificationStream(); // opens EventSource, handles reconnect automatically
```

The hook opens `EventSource` to `/api/notifications/stream?token=<accessToken>`, reconnects every 5 seconds on disconnect, and triggers a refetch of the notifications list on each event.

### Backend event types

| Trigger | Who receives it |
|---------|----------------|
| Candidate applies to job | Recruiter |
| Recruiter updates application status | Candidate |
| Job auto-closed (expired) | Recruiter |

---

## 13. Environment Variables

### Backend (`apps/api/src/main/resources/application.yml`)

| Key | Default | Description |
|-----|---------|-------------|
| `spring.datasource.url` | `jdbc:postgresql://localhost:5433/nexhire_dev` | DB connection |
| `spring.datasource.username` | `nexhire` | DB user |
| `spring.datasource.password` | `root1234` | DB password |
| `spring.rabbitmq.host` | `localhost` | RabbitMQ host |
| `spring.rabbitmq.port` | `5672` | RabbitMQ port |
| `spring.rabbitmq.username` | `nexhire` | RabbitMQ user |
| `spring.rabbitmq.password` | `root1234` | RabbitMQ password |
| `jwt.secret` | (long secret key) | JWT signing secret |
| `jwt.expiration` | `86400000` | Access token TTL (ms) = 24h |
| `jwt.refresh-expiration` | `604800000` | Refresh token TTL (ms) = 7d |
| `minio.endpoint` | `http://localhost:9000` | MinIO server |
| `minio.access-key` | `nexhire-minio` | MinIO credentials |
| `minio.secret-key` | `minio1234` | MinIO credentials |
| `minio.bucket` | `nexhire-files` | MinIO bucket name |

### Frontend (`apps/web/.env.local`)

| Key | Default | Description |
|-----|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080/api` | Backend base URL |

---

## 14. Database Migrations

Flyway runs migrations automatically on startup. Migration files are in:
```
apps/api/src/main/resources/db/migration/
```

| Migration | What it creates |
|-----------|----------------|
| `V1__initial_schema.sql` | users, jobs, applications tables |
| `V2__...` | notifications table |
| `V3__...` | indexes and constraints |
| `V4__...` | enum updates |
| `V5__...` | additional fields |
| `V6__add_user_profile_fields.sql` | skills, headline, portfolio_links on users; password_reset_tokens, email_verification_tokens tables |
| `V7__add_job_enhancements.sql` | view_count, screening_questions on jobs |
| `V8__create_saved_jobs.sql` | saved_jobs table with unique constraint |

---

## 15. Common Errors & Fixes

### `Failed to execute goal... ExceptionInInitializerError: TypeTag::UNKNOWN`
**Cause:** Maven is using Java 25 (from Homebrew) instead of Java 21.
**Fix:**
```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
mvn spring-boot:run
```

### `The goal requires a project... no POM in this directory`
**Cause:** Running `mvn` from the root directory.
**Fix:**
```bash
cd apps/api
mvn spring-boot:run
```

### `Connection refused: localhost:5433`
**Cause:** PostgreSQL Docker container is not running.
**Fix:**
```bash
cd docker
docker compose -f docker-compose.dev.yml up -d postgres
```

### `Connection refused: localhost:5672`
**Cause:** RabbitMQ Docker container is not running.
**Fix:**
```bash
docker compose -f docker-compose.dev.yml up -d rabbitmq
```

### `Error connecting to MinIO`
**Cause:** MinIO Docker container is not running.
**Fix:**
```bash
docker compose -f docker-compose.dev.yml up -d minio
```

### `401 Unauthorized` on authenticated endpoints
**Cause:** Access token is missing or expired.
**Fix:** The frontend auto-refreshes tokens. If you're testing in Swagger/curl, get a fresh token via `POST /auth/login`.

### `403 Forbidden`
**Cause:** Logged-in user's role doesn't have permission for that endpoint.
**Fix:** Check the Roles & Permissions table. Use the correct role account.

### `429 Too Many Requests`
**Cause:** Rate limit exceeded on `/auth/login` or `/auth/register` (10 req/min/IP).
**Fix:** Wait 60 seconds.

### Flyway migration failed
**Cause:** DB schema mismatch or failed previous migration.
**Fix:**
```bash
# Connect to DB and check flyway_schema_history
psql -h localhost -p 5433 -U nexhire -d nexhire_dev
SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;
```

---

*Last updated: June 2026*
