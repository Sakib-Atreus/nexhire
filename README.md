# NexHire — Job Portal

A full-stack job portal monorepo built with Spring Boot 3, Next.js 15, PostgreSQL, RabbitMQ, and MinIO.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, TanStack Query v5, Zustand v5 |
| Backend | Spring Boot 3.3, Java 21, Maven |
| Database | PostgreSQL 16 |
| Message Broker | RabbitMQ 3.13 |
| File Storage | MinIO (local) / Backblaze B2 (production, S3-compatible) |
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
│   ├── api/          # Spring Boot REST API (port 8080)
│   └── web/          # Next.js frontend (port 3000 dev / 3001 Docker)
├── docker/
│   ├── docker-compose.yml      # Full stack (all services)
│   ├── docker-compose.dev.yml  # Dev infrastructure only (DB + RabbitMQ + MinIO)
│   └── init.sql
├── packages/
│   └── shared/       # Shared TypeScript types
├── .env.example
└── turbo.json
```

---

## Quick Start

### Option A — Full Docker (easiest)

Runs everything in containers. No local Java or Node needed.

```bash
# 1. Clone and enter project
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

---

### Option B — Local Development (hot reload)

Runs infrastructure in Docker, apps locally for fast feedback.

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

**Step 3 — Generate Maven wrapper (first time only)**
```bash
cd apps/api
JAVA_HOME=$(/usr/libexec/java_home -v 21) mvn wrapper:wrapper
cd ../..
```

**Step 4 — Start the API** (new terminal)
```bash
cd apps/api
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/nexhire_dev \
JAVA_HOME=$(/usr/libexec/java_home -v 21) ./mvnw spring-boot:run
```

Wait for: `Started NexHireApplication` — Flyway runs DB migrations automatically on first start.

**Step 5 — Start the frontend** (new terminal)
```bash
npm run dev
```

Frontend available at http://localhost:3000.

---

## Environment Variables

Copy `.env.example` to `.env` and adjust if needed.

```env
# PostgreSQL (local dev uses nexhire_dev; Docker full stack uses nexhire)
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/nexhire_dev
SPRING_DATASOURCE_USERNAME=nexhire
SPRING_DATASOURCE_PASSWORD=root1234

# RabbitMQ (local)
SPRING_RABBITMQ_HOST=localhost
SPRING_RABBITMQ_PORT=5672
SPRING_RABBITMQ_USERNAME=nexhire
SPRING_RABBITMQ_PASSWORD=root1234
SPRING_RABBITMQ_VIRTUAL_HOST=/
SPRING_RABBITMQ_SSL_ENABLED=false
# Production (CloudAMQP) — use a single URL instead of individual vars:
# SPRING_RABBITMQ_ADDRESSES=amqps://user:pass@host/vhost

# JWT
JWT_SECRET=<your-strong-random-secret>
JWT_EXPIRATION=86400000        # 1 day (ms)
JWT_REFRESH_EXPIRATION=604800000  # 7 days (ms)

# MinIO (local) / Backblaze B2 (production, S3-compatible)
MINIO_ENDPOINT=http://localhost:9000
MINIO_PUBLIC_URL=http://localhost:9000/nexhire-files
MINIO_ACCESS_KEY=nexhire-minio
MINIO_SECRET_KEY=minio1234
MINIO_BUCKET=nexhire-files

# CORS (comma-separated, add your frontend URL in production)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

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

### Frontend (inside apps/web/)

```bash
npm run dev           # Start with Turbopack (hot reload)
npm run build         # Production build
npm run start         # Start production server
npm run lint          # Run ESLint
npm run type-check    # TypeScript validation
```

---

## API Endpoints

### Authentication (public)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create a new account |
| POST | `/api/auth/login` | Login and get JWT token |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/forgot-password` | Request password reset email |
| POST | `/api/auth/reset-password` | Reset password with token |
| POST | `/api/auth/verify-email` | Verify email with token |
| POST | `/api/auth/resend-verification` | Resend verification email |

### Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/users/me` | Any | Get your own profile |
| PATCH | `/api/users/me` | Any | Update your own profile (name, bio, avatar, skills, etc.) |
| GET | `/api/users` | ADMIN | List all users |
| GET | `/api/users/{id}` | ADMIN | Get a user by ID |
| DELETE | `/api/users/{id}` | ADMIN | Delete a user |
| PATCH | `/api/users/{id}/status` | ADMIN | Ban / unban a user |
| PATCH | `/api/users/{id}/role` | ADMIN | Change a user's role |

### Jobs

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/jobs` | No | Browse open jobs (params: `keyword`, `location`, `jobType`, `experienceLevel`, `companyName`, `page`, `size`) |
| GET | `/api/jobs/{id}` | No | Get job details |
| GET | `/api/jobs/saved` | CANDIDATE | Get your saved jobs |
| GET | `/api/jobs/my` | RECRUITER/ADMIN | Get your own job postings (includes applicant count) |
| POST | `/api/jobs` | RECRUITER/ADMIN | Create a job posting |
| PATCH | `/api/jobs/{id}` | RECRUITER/ADMIN | Update a job posting |
| DELETE | `/api/jobs/{id}` | RECRUITER/ADMIN | Delete a job posting |

### Applications

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/applications` | CANDIDATE | Apply to a job (resume URL or file upload) |
| GET | `/api/applications/my` | CANDIDATE | View your own applications |
| GET | `/api/applications/job/{jobId}` | RECRUITER/ADMIN | View all applications for a job |
| GET | `/api/applications/recruiter` | RECRUITER/ADMIN | View all applications across your jobs |
| GET | `/api/applications/recruiter/stats` | RECRUITER/ADMIN | Aggregated application statistics |
| PATCH | `/api/applications/{id}/status` | RECRUITER/ADMIN | Update application status |
| PATCH | `/api/applications/bulk-status` | RECRUITER/ADMIN | Bulk update application statuses |

### Files

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/files/upload` | Any | Upload a file (PDF/JPEG/PNG/GIF/WEBP, max 10 MB). Returns `{ url, fileName, contentType, size }` |
| GET | `/api/files/{objectName}` | No | Proxy-stream a stored file (used for private buckets like Backblaze B2) |

### Notifications

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | Any | Get your notifications |
| GET | `/api/notifications/unread-count` | Any | Get unread notification count |
| GET | `/api/notifications/stream` | Any | SSE stream for real-time notifications (pass JWT via `?token=` or `Authorization: Bearer`) |
| PATCH | `/api/notifications/{id}/read` | Any | Mark a notification as read |
| PATCH | `/api/notifications/mark-all-read` | Any | Mark all notifications as read |
| GET | `/api/notifications/preferences` | Any | Get notification preferences |
| PATCH | `/api/notifications/preferences` | Any | Update notification preferences |

### Other

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/actuator/health` | No | API health check |
| GET | `/api/swagger-ui.html` | No | Interactive API docs |

---

## User Roles

| Role | Capabilities |
|---|---|
| `CANDIDATE` | Browse/search/save jobs, apply (PDF or URL resume), view own applications, manage profile (avatar, skills, open-to-work toggle), get real-time notifications |
| `RECRUITER` | All of CANDIDATE + create/edit/delete own jobs, view applicants with status management, see application counts |
| `ADMIN` | Full access — all of RECRUITER + user management (ban, promote, delete) |

---

## First-Time Setup: Create a User

**Register:**
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

**Login:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "recruiter@example.com",
    "password": "password123"
  }'
```

Copy the `accessToken` from the response and use it as a Bearer token:

```bash
curl http://localhost:8080/api/jobs/my \
  -H 'Authorization: Bearer <your-access-token>'
```

---

## Database

Flyway manages all schema migrations automatically on API startup.

| Migration | Description |
|---|---|
| V1 | Users table |
| V2 | Jobs table |
| V3 | Applications table |
| V4 | Notifications table |
| V5 | Convert enum columns to VARCHAR |
| V6 | User profile fields (bio, avatar, skills, headline, portfolio links) |
| V7 | Job enhancements (salary, benefits, remote flag, saved jobs) |
| V8 | Saved jobs table |
| V9 | `open_to_work` column on users |

**Connect to the database directly:**
```bash
# Full Docker stack (nexhire DB)
psql -h localhost -p 5433 -U nexhire -d nexhire
# Password: root1234

# Local dev infrastructure (nexhire_dev DB)
psql -h localhost -p 5433 -U nexhire -d nexhire_dev
# Password: root1234
```

---

## Troubleshooting

### Port 5432 already in use
PostgreSQL is already running locally. Both Docker setups use port **5433** to avoid this conflict.

### Maven uses wrong Java version
Check with `mvn -version`. If it shows Java 24/25 instead of 21, prefix commands:
```bash
JAVA_HOME=$(/usr/libexec/java_home -v 21) ./mvnw spring-boot:run
```

### `./mvnw` not found
Generate the Maven wrapper:
```bash
cd apps/api
JAVA_HOME=$(/usr/libexec/java_home -v 21) mvn wrapper:wrapper
```

### `npm install` fails with peer dependency error
Make sure you're on Node >= 20 and npm >= 10:
```bash
node -v
npm -v
```

### API returns 500 on startup
Check Spring Boot logs. Common causes:
- Docker infrastructure not running → run `npm run docker:dev`
- Wrong DB name → verify datasource URL matches the database created by your compose file
- Flyway migration failed → check logs for migration errors

### Profile image / file upload fails
- MinIO must be running — check with `docker ps | grep minio`
- On startup the API checks the bucket exists and creates it if not
- Uploaded files are served through the API proxy at `/api/files/<filename>` (locally: `http://localhost:8080/api/files/<filename>`)

### Jobs not showing on the frontend
Jobs are only visible in the browse list when their status is `OPEN`. Newly created jobs default to `OPEN`.

---

## Production Deployment (Free Tier)

| Service | Purpose | Free Plan |
|---|---|---|
| [Neon](https://neon.tech) | PostgreSQL database | 0.5 GB storage |
| [CloudAMQP](https://cloudamqp.com) | RabbitMQ (Little Lemur plan) | 1M messages/month |
| [Backblaze B2](https://backblaze.com/b2) | File storage (private bucket) | 10 GB free |
| [Render](https://render.com) | Spring Boot API (Docker) | 750 hrs/month |
| [Vercel](https://vercel.com) | Next.js frontend | Unlimited |

### API (Render)

1. Create a new **Web Service** → select **Docker** runtime
2. Set **Root Directory** to `apps/api`
3. Add all environment variables (Neon DB URL, CloudAMQP AMQP URL, Backblaze B2 keys, JWT secret, `CORS_ALLOWED_ORIGINS`)

Key env vars for production:
```env
SPRING_DATASOURCE_URL=jdbc:postgresql://<neon-host>/neondb?sslmode=require
SPRING_DATASOURCE_USERNAME=neondb_owner
SPRING_DATASOURCE_PASSWORD=<neon-password>
SPRING_RABBITMQ_ADDRESSES=amqps://<user>:<pass>@<host>/<vhost>
JWT_SECRET=<strong-random-secret>
MINIO_ENDPOINT=https://s3.<region>.backblazeb2.com
MINIO_PUBLIC_URL=https://<your-render-url>/api/files
MINIO_ACCESS_KEY=<b2-key-id>
MINIO_SECRET_KEY=<b2-app-key>
MINIO_BUCKET=nexhire-files
CORS_ALLOWED_ORIGINS=https://<your-vercel-url>.vercel.app
```

### Frontend (Vercel)

1. Import the GitHub repo → set **Root Directory** to `apps/web`
2. Add one environment variable:
```env
NEXT_PUBLIC_API_URL=https://<your-render-url>/api
```


---

## Contributing

Contributions are welcome! Please read the [CONTRIBUTING.md](CONTRIBUTING.md) guide before opening a pull request.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Contact

**Sakib Mia**

- GitHub: [@Sakib-Atreus](https://github.com/Sakib-Atreus)
- Email: [sakibamia0718@gmail.com](mailto:sakibmia0718@gmail.com)

Feel free to open an [issue](https://github.com/Sakib-Atreus/nexhire/issues) for bugs or feature requests.
