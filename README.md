# NexHire — Job Portal

**NexHire** is a full-stack job portal where job seekers find and apply for jobs, and companies run their whole hiring process — from posting a role to scheduling interviews and making a hire. Job seekers search and save jobs, apply with a resume, respond to interview invitations and message the hiring team. Recruiters work in company teams with a drag-and-drop hiring pipeline, private notes and ratings, message templates, interview scheduling and per-job analytics. Administrators moderate users, jobs and companies from a dedicated admin panel.

The platform is a **monorepo** with a Spring Boot REST API and a Next.js frontend. It runs locally with one Docker Compose command and is designed to deploy for free on **Vercel + Render**, with **Neon** (PostgreSQL), **CloudAMQP** (RabbitMQ) and **Backblaze B2** (file storage) as managed services.

---

## Features

### For job seekers
- **Job search** — keyword, location, category, job type and experience level filters; featured jobs first; save jobs for later
- **Recommended jobs** — open roles ranked by how well they match your skills, headline and location, with the matching skills shown
- **Job alerts** — save a search and get notified (in-app and by email) when a matching job is posted, instantly or as a daily digest; one-click unsubscribe
- **Full profile** — work experience, education, location, a saved resume, and an optional public profile page (`/p/your-name`) to share
- **Quick apply** — apply in one click with your saved resume
- **Company profiles** — browse the company directory and each company's open roles; "Verified employer" badges
- **One place for every application** — progress tracker (Applied → Review → Shortlist → Interview → Offer → Hired), a timeline of every update with messages from the hiring team, withdraw, cover letter and screening questions
- **Interview invitations** — accept, request another time (suggest up to 3 times) or decline; warnings when an invitation overlaps your other interviews; add confirmed interviews to your calendar (.ics)
- **Messages** — two-way conversation with the hiring team on each application
- **Profile** — avatar, headline, bio, skills, portfolio links and an "Open to work" toggle

### For recruiters and hiring teams
- **Company teams** — create a company profile, add teammates by email; everyone on the team shares the company's jobs and applicants
- **Job posting** — publish or save as draft, duplicate a job, set the number of openings (the job closes as *Filled* automatically once that many people are hired), screening questions, salary in any currency
- **Hiring pipeline board** — drag applicants between stages (works with mouse, touch and keyboard), or use list view with bulk actions
- **Applicant panel** — the candidate's full profile (experience, education, resume), private 1–5 ratings and notes (never visible to candidates), an activity timeline, messages with reusable templates and placeholders such as `{{firstName}}`, and an optional message to the candidate with each stage change
- **Interview scheduling** — video, phone or on-site; warns about clashes with *your own* interviews; the candidate confirms or proposes another time, and one click accepts their suggestion; unanswered invitations are flagged after 48 hours with a one-click reminder
- **Analytics** — per-job funnel (views → applications → interviewed → offered → hired), daily applications and status breakdown

### For administrators
- **Overview dashboard** — users by role, 30-day sign-up and application trends, top companies and a "needs attention" list
- **Moderation** — search and manage users, verify recruiters and companies, hide or feature jobs, review job reports
- **Audit log** — every admin action with who, what, when and why
- **Site settings** — site-wide announcement banner, job categories and suggested skills

### Platform
- **Role-based access** — Job seeker, Recruiter and Administrator roles; sign-up is limited to job seekers and recruiters, and the first administrator is created from environment variables
- **Real-time notifications** — Server-Sent Events push updates instantly; RabbitMQ delivers them, with a direct fallback so nothing is lost if the broker is down
- **Email** — password reset, email verification and job alerts via any SMTP provider (Brevo, Resend, SendGrid, …); without SMTP settings emails are logged instead
- **Event-driven job alerts** — publishing a job emits a RabbitMQ event that is matched against saved searches
- **JWT authentication** — access + refresh tokens, email verification and password reset
- **File storage** — resumes and avatars in S3-compatible storage (MinIO locally, Backblaze B2 in production)
- **Light and dark mode** — Light / Dark / System theme from the user menu (and a toggle on the home and sign-in pages); remembered per browser, applied before the page paints so there's no flash
- **Swagger UI** — interactive API docs at `/api/swagger-ui.html`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, TanStack Query v5, Zustand v5, react-hook-form + zod, dnd-kit |
| Backend | Spring Boot 3.3, Java 21, Spring Security (JWT), Spring Data JPA, Flyway, Maven |
| Database | PostgreSQL 16 |
| Message broker | RabbitMQ 3.13 |
| File storage | MinIO (local) / Backblaze B2 (production, S3-compatible) |
| Monorepo | Turborepo, npm workspaces |

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | >= 20.0.0 |
| npm | >= 10.0.0 |
| Java | 21 |
| Maven | 3.9+ |
| Docker + Docker Compose | Latest |

> **macOS note:** If your system Maven uses a different Java version (check with `mvn -version`), prefix all `mvn`/`./mvnw` commands with `JAVA_HOME=$(/usr/libexec/java_home -v 21)`.

---

## Project Structure

```
nexhire/
├── apps/
│   ├── api/                      # Spring Boot REST API (port 8080, base path /api)
│   │   └── src/main/java/com/nexhire/api/modules/
│   │       ├── auth/             # Register, login, tokens, password reset
│   │       ├── users/            # Profiles, first-admin bootstrap
│   │       ├── jobs/             # Jobs, search, saved jobs, team access rules
│   │       ├── companies/        # Company profiles and recruiter teams
│   │       ├── applications/     # Applying and the hiring pipeline
│   │       ├── hiring/           # Interviews, notes, ratings, messages, templates, analytics
│   │       ├── notifications/    # SSE stream, RabbitMQ producer/consumer
│   │       ├── admin/            # Admin panel, reports, audit log, site settings
│   │       └── files/            # Uploads to MinIO / Backblaze B2
│   └── web/                      # Next.js frontend (port 3000 dev / 3001 Docker)
│       └── src/
│           ├── app/              # Pages (App Router)
│           ├── components/       # UI kit (components/ui) and feature components
│           ├── hooks/            # Data hooks (TanStack Query)
│           └── lib/              # Formatters, labels and constants
├── docker/
│   ├── docker-compose.yml        # Full stack (all services)
│   ├── docker-compose.dev.yml    # Dev infrastructure only (DB + RabbitMQ + MinIO)
│   └── init.sql
├── packages/
│   └── shared/                   # Shared TypeScript types
├── .env.example
└── turbo.json
```

---

## Quick Start

### Option A — Full Docker (easiest)

Runs everything in containers. No local Java or Node needed.

```bash
# 1. Clone and enter the project
cd nexhire

# 2. Start all services (builds images on first run)
npm run docker:up
```

**Access:**
- Web app → http://localhost:3001
- API → http://localhost:8080/api
- Swagger UI → http://localhost:8080/api/swagger-ui.html
- RabbitMQ → http://localhost:15672 (nexhire / root1234)
- MinIO Console → http://localhost:9001 (nexhire-minio / minio1234)

```bash
# Stop everything
npm run docker:down

# Rebuild images after code changes
docker compose -f docker/docker-compose.yml up --build -d
```

> To get an administrator account in the Docker stack, add `ADMIN_EMAIL` and `ADMIN_PASSWORD` to the `api` service environment in `docker/docker-compose.yml` (see [Create the first administrator](#create-the-first-administrator)).

---

### Option B — Local Development (hot reload)

Runs infrastructure in Docker and the apps locally for fast feedback.

**Step 1 — Install dependencies**
```bash
npm install
```

**Step 2 — Start infrastructure (PostgreSQL + RabbitMQ + MinIO)**
```bash
npm run docker:dev
```

> PostgreSQL runs on port **5433** (not 5432) to avoid conflicts with any local PostgreSQL.
> MinIO runs on port **9000** (API) and **9001** (console).

**Step 3 — Generate the Maven wrapper (first time only)**
```bash
cd apps/api
JAVA_HOME=$(/usr/libexec/java_home -v 21) mvn wrapper:wrapper
cd ../..
```

**Step 4 — Start the API** (new terminal)
```bash
cd apps/api
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/nexhire_dev \
ADMIN_EMAIL=admin@nexhire.local ADMIN_PASSWORD='ChangeMe-123' \
JAVA_HOME=$(/usr/libexec/java_home -v 21) ./mvnw spring-boot:run
```

Wait for `Started NexHireApplication`. Flyway runs the database migrations automatically, including 20 sample job listings from fictional companies so the job board isn't empty.

> Locally the API runs with the `dev` profile, which supplies the credentials of the Docker dev services from `application-dev.yml`. Production uses the `prod` profile (set in the Dockerfile), where secrets **must** come from environment variables.

**Step 5 — Start the frontend** (new terminal)
```bash
npm run dev
```

Frontend available at http://localhost:3000.

---

## Environment Variables

Copy `.env.example` to `.env` for reference. The API reads these from the environment.

### Required in production

| Variable | Example | Notes |
|---|---|---|
| `JWT_SECRET` | output of `openssl rand -hex 48` | At least 32 characters. **The API refuses to start without it.** Changing it signs everyone out. |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<host>/<db>?sslmode=require` | For Neon, copy the host and database from *Connection details* and add `jdbc:` |
| `SPRING_DATASOURCE_USERNAME` | | **Required** — the API refuses to start without it |
| `SPRING_DATASOURCE_PASSWORD` | | **Required** — the API refuses to start without it |
| `CORS_ALLOWED_ORIGINS` | `https://your-app.vercel.app` | Comma-separated frontend origins, no trailing `/` |
| `NEXT_PUBLIC_API_URL` | `https://your-api.onrender.com/api` | Set on the **frontend**; built into the bundle, so redeploy after changing it |

### Recommended

| Variable | Notes |
|---|---|
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Creates the first administrator on startup — only while no admin exists (password ≥ 8 characters). Safe to remove afterwards. |
| `SPRING_RABBITMQ_HOST`, `SPRING_RABBITMQ_PORT`, `SPRING_RABBITMQ_USERNAME`, `SPRING_RABBITMQ_PASSWORD`, `SPRING_RABBITMQ_VIRTUAL_HOST`, `SPRING_RABBITMQ_SSL_ENABLED` | Message broker. For CloudAMQP use port `5671` and SSL `true`. If unset or wrong, the API still runs and delivers notifications directly. |
| `SPRING_RABBITMQ_ADDRESSES` | Alternative to the separate RabbitMQ variables: `amqps://user:pass@host/vhost`. **Takes priority** over host/port/username/password when set — remove it if it points to an old broker. |
| `MINIO_ENDPOINT`, `MINIO_PUBLIC_URL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET` | File storage (Backblaze B2 in production). If the keys are missing the API still runs, but uploads are disabled. |
| `SPRING_MAIL_HOST`, `SPRING_MAIL_PORT`, `SPRING_MAIL_USERNAME`, `SPRING_MAIL_PASSWORD` | SMTP for emails (e.g. Brevo: `smtp-relay.brevo.com`, port `587`). Without `SPRING_MAIL_HOST`, emails are only written to the log. |
| `MAIL_FROM` | Sender, e.g. `NexHire <no-reply@yourdomain.com>` (must be a sender your SMTP provider allows) |
| `APP_BASE_URL` | Frontend URL used in email links, e.g. `https://your-app.vercel.app` |

### Optional

| Variable | Default |
|---|---|
| `JWT_EXPIRATION` | `86400000` (1 day, ms) |
| `JWT_REFRESH_EXPIRATION` | `604800000` (7 days, ms) |
| `SPRING_PROFILES_ACTIVE` | `prod` in the Docker image, `dev` otherwise. Don't set it to `dev` in production. |

---

## Deployment (Render + Vercel)

**Backend — Render (Docker)**
1. Create a web service from this repository with **Root Directory** `apps/api` (the Dockerfile is detected automatically).
2. Add the environment variables above (at minimum the required ones, plus `ADMIN_EMAIL`/`ADMIN_PASSWORD` the first time).
3. Deploy. In the logs, look for `The following 1 profile is active: "prod"` and `Started NexHireApplication`. Migrations run automatically.
4. Check `https://<your-service>.onrender.com/api/actuator/health` returns `{"status":"UP"}`.

**Frontend — Vercel**
1. Import the repository with **Root Directory** `apps/web`.
2. Set `NEXT_PUBLIC_API_URL` to `https://<your-service>.onrender.com/api`.
3. Add the Vercel URL to `CORS_ALLOWED_ORIGINS` on Render.

**Notes**
- Deploy the **backend first** when both changed, then the frontend.
- For automatic deploys on push, connect the repository through the Render and Vercel **GitHub apps** (Render: *Settings → Build & Deploy → Auto-Deploy: On Commit*; Vercel: *Settings → Git*). Otherwise use *Manual Deploy* on Render and *Create Deployment* on Vercel.
- Render's free tier sleeps after 15 minutes without traffic; the first request then takes 30–60 seconds. A ping to `/api/actuator/health` every ~14 minutes (e.g. with cron-job.org) keeps one service awake within the 750 free hours per month.
- The Docker image caps the Java heap for small containers (Render free tier, 512 MB); see `JAVA_TOOL_OPTIONS` in `apps/api/Dockerfile`.

---

## All Commands

### Root (monorepo)

```bash
npm install           # Install all dependencies
npm run dev           # Run all apps in dev mode (via Turbo)
npm run build         # Build all apps
npm run lint          # Lint all apps
npm run test          # Run all tests
npm run type-check    # TypeScript check all apps
npm run format        # Format code with Prettier
```

### Docker

```bash
npm run docker:up     # Start full stack (builds images on first run)
npm run docker:down   # Stop all services
npm run docker:dev    # Start infrastructure only (DB + RabbitMQ + MinIO)
```

### API (inside apps/api/)

```bash
# Run in dev mode
JAVA_HOME=$(/usr/libexec/java_home -v 21) ./mvnw spring-boot:run

# Build JAR
JAVA_HOME=$(/usr/libexec/java_home -v 21) ./mvnw clean package

# Run tests
JAVA_HOME=$(/usr/libexec/java_home -v 21) ./mvnw test

# Skip tests during build
JAVA_HOME=$(/usr/libexec/java_home -v 21) ./mvnw clean package -DskipTests

# Generate Maven wrapper (first time)
JAVA_HOME=$(/usr/libexec/java_home -v 21) mvn wrapper:wrapper
```

### Theming (frontend)

Colors come from semantic tokens defined as CSS variables in `apps/web/src/app/globals.css` (light values in `:root`, dark values in `.dark`) and exposed in `tailwind.config.ts`. Use them instead of white/slate classes so new UI supports both themes automatically:

| Use | Class |
|---|---|
| Cards, panels, inputs | `bg-surface` |
| Page background | `bg-canvas` |
| Subtle fills / stronger fills / skeletons | `bg-muted` / `bg-subtle` / `bg-emphasis` |
| Text: primary → faint | `text-fg`, `text-fg-soft`, `text-fg-secondary`, `text-fg-tertiary`, `text-fg-muted`, `text-fg-subtle`, `text-fg-faint` |
| Borders and dividers | `border-line-subtle`, `border-line`, `border-line-strong` |

Colored tints (e.g. `bg-emerald-50`, `text-rose-700`, `border-amber-200`, `ring-primary-200`) switch to dark variants automatically; solid shades such as `bg-primary-600` stay the same. Status/role badge styles live in `apps/web/src/lib/constants.ts`.

### Frontend (inside apps/web/)

```bash
npm run dev           # Start with Turbopack (hot reload)
npm run build         # Production build
npm run start         # Start production server
npm run lint          # Run ESLint
npm run type-check    # TypeScript validation
```

---

## How Hiring Works

**Pipeline stages:** Applied → Review → Shortlist → Interview → Offer → Hired (or Not selected). Candidates can withdraw at any time; withdrawn applications become read-only. Every stage change notifies the candidate. When the number of hires reaches the job's openings, the job closes as **Filled**.

**Interview invitations:**
1. A recruiter schedules an interview. Only the **recruiter's own calendar** is checked for clashes (they can still schedule anyway, e.g. for a panel). The candidate's other commitments are never shown to recruiters.
2. The candidate sees the invitation as *Awaiting response* and can **accept**, **request another time** (up to 3 suggestions and a note) or **decline**. They are warned if it overlaps one of their own interviews.
3. The recruiter is notified. Choosing one of the candidate's suggested times confirms the interview immediately; any other new time goes back to the candidate to confirm.
4. Invitations with no answer 48 hours after being sent are flagged so the recruiter can send a reminder.

**Job alerts:** when a job becomes open and visible (published, a draft published, reopened or un-hidden), the API publishes a `job.published` event to RabbitMQ (after the database commit). A consumer matches it against active alerts: *instant* alerts notify immediately, *daily* alerts are collected and sent as one digest at 08:00 UTC. Each job is sent to each alert at most once. If RabbitMQ is unavailable, matching runs directly.

**Recommendations:** each open job gets a 0–100 score — 60% skills (profile skills found in the job's tags), 20% headline words in the title, 10% location or remote, 10% recency. Jobs already applied to are excluded, and only jobs with a skill or title match are shown.

**Company teams:** recruiters on the same company team share all of the company's jobs, applicants, interviews and analytics. Jobs are always posted under the company's name and logo. The owner manages the team; ownership can be transferred.

---

## API Endpoints

All endpoints are under `/api`. "Team" means the job's recruiter, recruiters on the same company team, or an administrator.

### Authentication (public)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create an account (role `CANDIDATE` or `RECRUITER`) |
| POST | `/auth/login` | Log in and get access + refresh tokens |
| POST | `/auth/refresh` | Refresh the access token |
| POST | `/auth/forgot-password` | Request a password reset |
| POST | `/auth/reset-password` | Reset password with token |
| POST | `/auth/verify-email` | Verify email with token |
| POST | `/auth/resend-verification` | Resend the verification token |

### Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/users/me` | Any | Your profile |
| PATCH | `/users/me` | Any | Update your profile (name, bio, avatar, skills, …) |
| GET | `/users` | ADMIN | List users |
| GET | `/users/{id}` | ADMIN | Get a user |
| DELETE | `/users/{id}` | ADMIN | Delete a user (not yourself) |
| PATCH | `/users/{id}/status` | ADMIN | Suspend / restore (not yourself) |
| PATCH | `/users/{id}/role` | ADMIN | Change role (not your own) |

### Jobs

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/jobs` | No | Search open jobs (`keyword`, `location`, `companyName`, `jobType`, `experienceLevel`, `category`, `featured`, `page`, `size`, `sort`); featured first |
| GET | `/jobs/{id}` | No | Job details (drafts and hidden jobs: team only) |
| GET | `/jobs/my` | RECRUITER/ADMIN | Your jobs plus your company team's jobs, with applicant counts |
| GET | `/jobs/saved` | CANDIDATE | Your saved jobs |
| POST | `/jobs` | RECRUITER/ADMIN | Create a job (`status`: `OPEN` or `DRAFT`, `openings`, `category`, `screeningQuestions`, …) |
| PATCH | `/jobs/{id}` | Team | Update a job |
| DELETE | `/jobs/{id}` | Team | Delete a job |
| POST | `/jobs/{id}/duplicate` | Team | Copy a job as a new draft |
| POST / DELETE | `/jobs/{id}/save` | CANDIDATE | Save / unsave a job |
| GET | `/jobs/{id}/analytics` | Team | Funnel, daily applications and status breakdown |
| POST | `/jobs/{id}/report` | Any | Report a job to the moderators |

### Companies

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/companies` | No | Company directory (`q`, `page`, `size`) |
| GET | `/companies/{slug}` | No | Public company profile with open jobs |
| GET | `/companies/sizes` | No | Allowed company size bands |
| GET | `/company` | RECRUITER | Your company and team (204 if none) |
| POST | `/company` | RECRUITER | Create a company (you become the owner) |
| PUT | `/company` | RECRUITER | Update the company profile (any team member) |
| POST | `/company/members` | RECRUITER | Add a recruiter by email (owner) |
| DELETE | `/company/members/{memberId}` | RECRUITER | Remove a team member (owner) |
| POST | `/company/owner/{memberId}` | RECRUITER | Transfer ownership (owner) |
| POST | `/company/leave` | RECRUITER | Leave the company (not the owner) |

### Applications

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/applications` | CANDIDATE | Apply to a job |
| GET | `/applications/my` | CANDIDATE | Your applications |
| GET | `/applications/my/job/{jobId}` | CANDIDATE | Your application for one job (204 if none) |
| GET | `/applications/job/{jobId}` | Team | Applicants for a job |
| GET | `/applications/recruiter` | RECRUITER/ADMIN | Applicants across all jobs you manage |
| GET | `/applications/recruiter/stats` | RECRUITER/ADMIN | Pipeline counts (platform-wide for admins) |
| PATCH | `/applications/{id}/status` | Team / candidate | Move to a stage (candidates may only withdraw) |
| PATCH | `/applications/bulk-status` | Team | Move several applicants at once |
| PATCH | `/applications/{id}/rating` | Team | Private 1–5 rating (`null` clears) |
| GET / POST | `/applications/{id}/notes` | Team | Private notes |
| DELETE | `/applications/notes/{noteId}` | Author/ADMIN | Delete a note |
| GET / POST | `/applications/{id}/messages` | Team / candidate | Conversation; the team may use `{{firstName}}`, `{{candidateName}}`, `{{jobTitle}}`, `{{companyName}}`, `{{recruiterName}}` |

### Profiles, recommendations and job alerts

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET / PUT | `/users/me/experience` | Any | Your work experience (PUT replaces the ordered list, max 30) |
| GET / PUT | `/users/me/education` | Any | Your education (PUT replaces the ordered list, max 30) |
| GET | `/profiles/{slug}` | No | Public candidate profile (only if made public; no contact details or resume) |
| GET | `/applications/{id}/candidate-profile` | Team | Applicant's full profile incl. contact details and resume |
| GET | `/applications/{id}/timeline` | Team / candidate | Application history: stage changes (with the team's message), interviews, responses |
| GET | `/jobs/recommended` | CANDIDATE | Open jobs ranked by profile match (`size`) |
| GET / POST | `/job-alerts` | CANDIDATE | Your job alerts (max 10; `INSTANT` or `DAILY`) |
| PUT / DELETE | `/job-alerts/{id}` | CANDIDATE | Edit / delete an alert |
| POST | `/job-alerts/unsubscribe` | No | One-click unsubscribe with the token from an alert email |

`PATCH /users/me` also accepts `location`, `resumeUrl` + `resumeFileName` (saved resume; `""` removes it) and `publicProfile`.

### Interviews and templates

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/applications/{id}/interviews` | Team / candidate | Interviews for an application |
| POST | `/applications/{id}/interviews` | Team | Schedule (returns 409 with clashes unless `allowConflicts: true`) |
| GET | `/applications/{id}/interviews/conflicts` | Team | Your own interviews that would clash (`start`, `durationMinutes`, `excludeInterviewId`) |
| PATCH | `/interviews/{id}` | Team | Reschedule, complete or cancel |
| POST | `/interviews/{id}/respond` | Candidate | `ACCEPTED`, `DECLINED` or `NEW_TIME_REQUESTED` with `proposedTimes` (1–3) |
| GET | `/interviews/upcoming` | Any | Your upcoming interviews (recruiters: across jobs you manage) |
| GET / POST | `/message-templates` | RECRUITER/ADMIN | Your message templates |
| PUT / DELETE | `/message-templates/{id}` | Owner | Edit / delete a template |

### Administration

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/admin/overview` | ADMIN | Platform statistics |
| GET | `/admin/users` | ADMIN | Search users (`q`, `role`, `status`, `verified`) |
| GET | `/admin/users/{id}` | ADMIN | User with activity and admin history |
| PATCH | `/admin/users/{id}/verified` | ADMIN | Verify a recruiter |
| GET | `/admin/jobs` | ADMIN | All jobs incl. hidden/closed (`q`, `status`, `hidden`, `featured`, `category`, `recruiterId`) |
| PATCH | `/admin/jobs/{id}` | ADMIN | Hide, feature or change status (with reason) |
| GET | `/admin/companies` | ADMIN | Companies (`q`, `verified`) |
| PATCH | `/admin/companies/{id}/verified` | ADMIN | Verify a company |
| GET | `/admin/reports` | ADMIN | Job reports (`status`) |
| PATCH | `/admin/reports/{id}` | ADMIN | Resolve / dismiss, optionally hiding the job |
| GET | `/admin/audit` | ADMIN | Audit log (`action`, `actor`, `targetType`, `targetId`) |
| PUT | `/admin/settings/announcement` | ADMIN | Site-wide banner |
| PUT | `/admin/settings/{categories\|skills}` | ADMIN | Job categories / suggested skills |
| GET | `/settings/public` | No | Banner, categories and skills |

### Files, notifications and health

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/files/upload` | Any | Upload a file (PDF/JPEG/PNG/GIF/WEBP, max 10 MB) |
| GET | `/files/{objectName}` | No | Stream a stored file |
| GET | `/notifications` | Any | Your notifications |
| GET | `/notifications/unread-count` | Any | Unread count |
| GET | `/notifications/stream` | Any | SSE stream (JWT via `?token=` or `Authorization: Bearer`) |
| PATCH | `/notifications/{id}/read` | Any | Mark one as read |
| PATCH | `/notifications/mark-all-read` | Any | Mark all as read |
| GET / PATCH | `/notifications/preferences` | Any | Notification preferences |
| GET | `/actuator/health` | No | Health check |
| GET | `/swagger-ui.html` | No | Interactive API docs |

---

## User Roles

| Role | Shown as | Capabilities |
|---|---|---|
| `CANDIDATE` | Job seeker | Search, save and apply for jobs; track applications; respond to interview invitations; message hiring teams; manage profile; report jobs |
| `RECRUITER` | Recruiter | Create or join a company team; post, draft, duplicate and manage jobs; run the hiring pipeline (ratings, notes, messages, templates, interviews); view analytics |
| `ADMIN` | Administrator | Admin panel: users, job moderation, company verification, reports, audit log, site settings; can manage any job |

---

## First-Time Setup

### Create the first administrator

Sign-up only allows job seekers and recruiters. Set these on the API (Render environment, or your local shell) and start it once:

```bash
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD='a-strong-password'
```

On startup, if no administrator exists yet, the API creates one with these credentials — or promotes an existing account with that email and sets its password. Once an admin exists the variables are ignored and can be removed. Further admins can be promoted from the admin panel.

### Create users

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "recruiter@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "RECRUITER"
  }'
```

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{ "email": "recruiter@example.com", "password": "password123" }'
```

Use the returned `accessToken` as a Bearer token:

```bash
curl http://localhost:8080/api/jobs/my -H 'Authorization: Bearer <your-access-token>'
```

---

## Database

Flyway runs all migrations automatically on API startup.

| Migration | Description |
|---|---|
| V1 | Users table |
| V2 | Jobs table |
| V3 | Applications table |
| V4 | Notifications table |
| V5 | Convert enum columns to VARCHAR |
| V6 | Profile fields (skills, headline, portfolio links, notification preferences), password reset and email verification tokens |
| V7 | Job view count and screening questions |
| V8 | Saved jobs |
| V9 | `open_to_work` on users |
| V10 | 20 sample job listings from 8 fictional companies (recruiter accounts on `.example` emails with unusable passwords) |
| V11 | Admin panel: verified recruiters, featured/hidden jobs, categories, job reports, audit log, site settings |
| V12 | Companies and teams (created from existing jobs), job openings, applicant ratings, interviews, private notes, messages, message templates |
| V13 | Interview responses (accept / new time / decline) and follow-up tracking |
| V14 | Candidate profiles (location, saved resume, public profile, experience, education), job alerts, application timeline (history backfilled for existing applications) |

**Connect to the database directly:**
```bash
# Full Docker stack (nexhire DB)
psql -h localhost -p 5433 -U nexhire -d nexhire

# Local dev infrastructure (nexhire_dev DB)
psql -h localhost -p 5433 -U nexhire -d nexhire_dev
```

---

## Troubleshooting

### The API won't start: `Could not resolve placeholder 'JWT_SECRET'`
In production (`prod` profile) secrets have no defaults. Set the variable named in the error (`JWT_SECRET`, `SPRING_DATASOURCE_USERNAME` or `SPRING_DATASOURCE_PASSWORD`) and redeploy.

### The website says "We could not reach the server"
The browser got no usable response from the API:
- **API down, sleeping or still deploying** — open `/api/actuator/health`; on Render check *Events* and *Logs*.
- **CORS** — `CORS_ALLOWED_ORIGINS` must contain the exact frontend URL.
- **Wrong API URL** — `NEXT_PUBLIC_API_URL` on Vercel must point at the Render API; redeploy the frontend after changing it.

### RabbitMQ login errors (`ACCESS_REFUSED`)
The API keeps running and delivers notifications directly, retrying the broker every 30 seconds. Check the RabbitMQ variables — and remove `SPRING_RABBITMQ_ADDRESSES` if it points to an old instance, because it overrides the others.

### Port 5432 already in use
PostgreSQL is already running locally. Both Docker setups use port **5433** to avoid this conflict.

### Maven uses the wrong Java version
Check with `mvn -version`. If it shows a version other than 21, prefix commands:
```bash
JAVA_HOME=$(/usr/libexec/java_home -v 21) ./mvnw spring-boot:run
```

### `./mvnw` not found
```bash
cd apps/api
JAVA_HOME=$(/usr/libexec/java_home -v 21) mvn wrapper:wrapper
```

### `npm install` fails with a peer dependency error
Make sure you're on Node >= 20 and npm >= 10 (`node -v`, `npm -v`).

### Profile image / file upload fails
- MinIO must be running locally — check with `docker ps | grep minio`.
- In production, set the `MINIO_*` variables; without keys, uploads are disabled.
- Files are served through the API at `/api/files/<filename>`.

### A job isn't visible on the job board
The public board shows only **open**, **non-hidden** jobs. Drafts, closed or filled jobs, and jobs hidden by a moderator are visible to the hiring team (and admins) only.

---

## Known Limitations

- **Email needs an SMTP provider.** Set the `SPRING_MAIL_*`, `MAIL_FROM` and `APP_BASE_URL` variables; until then, password-reset, verification and job-alert emails are only written to the API log. Messages and interview invitations are in-app notifications.
- **No CI pipeline yet** — run `./mvnw test` and `npm run type-check` before pushing.
- **Interview clash checks** cover the recruiter who schedules the interview, not every teammate attending.

---

## Contributing

Contributions are welcome! Please read the [CONTRIBUTING.md](CONTRIBUTING.md) guide before opening a pull request.


## License

This project is licensed under the [MIT License](LICENSE).


## Contact

**Sakib Mia**

- GitHub: [@Sakib-Atreus](https://github.com/Sakib-Atreus)
- Email: [sakibmia0718@gmail.com](mailto:sakibmia0718@gmail.com)

Feel free to open an [issue](https://github.com/Sakib-Atreus/nexhire/issues) for bugs or feature requests.
