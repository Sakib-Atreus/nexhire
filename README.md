# NexHire — Job Portal

A full-stack job portal monorepo built with Spring Boot 3, Next.js 15, PostgreSQL, and RabbitMQ.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, TanStack Query |
| Backend | Spring Boot 3.3, Java 21, Maven |
| Database | PostgreSQL 16 |
| Message Broker | RabbitMQ 3.13 |
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
│   └── web/          # Next.js frontend (port 3000)
├── packages/
│   └── shared/       # Shared TypeScript types
├── deploy/
│   ├── docker-compose.yml      # Production (all services)
│   └── docker-compose.dev.yml  # Dev infrastructure only
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

# 2. Copy environment file
cp .env.example .env

# 3. Start all services (DB + RabbitMQ + API + Web)
npm run docker:up
```

**Access:**
- Web app → http://localhost:3000
- API → http://localhost:8080/api
- Swagger UI → http://localhost:8080/api/swagger-ui.html
- RabbitMQ → http://localhost:15672 (nexhire / root1234)

```bash
# Stop everything
npm run docker:down
```

---

### Option B — Local Development (hot reload)

Runs infrastructure in Docker, apps locally for fast feedback.

**Step 1 — Install dependencies**
```bash
npm install
```

**Step 2 — Copy environment file**
```bash
cp .env.example .env
```

**Step 3 — Start infrastructure (PostgreSQL + RabbitMQ)**
```bash
npm run docker:dev
```

> PostgreSQL runs on port **5433** (not 5432) to avoid conflicts with any local PostgreSQL installation.

**Step 4 — Generate Maven wrapper (first time only)**
```bash
cd apps/api
JAVA_HOME=$(/usr/libexec/java_home -v 21) mvn wrapper:wrapper
cd ../..
```

**Step 5 — Start the API** (new terminal)
```bash
cd apps/api
JAVA_HOME=$(/usr/libexec/java_home -v 21) ./mvnw spring-boot:run
```

Wait for: `Started NexhireApiApplication` — Flyway runs DB migrations automatically on first start.

**Step 6 — Start the frontend** (new terminal)
```bash
npm run dev
```

---

## Environment Variables

Copy `.env.example` to `.env` and adjust if needed.

```env
# PostgreSQL
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/nexhire_dev
SPRING_DATASOURCE_USERNAME=nexhire
SPRING_DATASOURCE_PASSWORD=root1234

# RabbitMQ
SPRING_RABBITMQ_HOST=localhost
SPRING_RABBITMQ_USERNAME=nexhire
SPRING_RABBITMQ_PASSWORD=root1234

# JWT
JWT_SECRET=lQffSG11g0obJA99ttgylKZuxHHgTnuUH0V1cDRstsK_algorithm
JWT_EXPIRATION=86400000        # 1 day (ms)
JWT_REFRESH_EXPIRATION=604800000  # 7 days (ms)

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
npm run docker:up     # Start all services (production build)
npm run docker:down   # Stop all services
npm run docker:dev    # Start infrastructure only (DB + RabbitMQ)
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

### Jobs

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/jobs` | No | Browse open jobs (supports `keyword`, `location`, `jobType`, `experienceLevel`, `page`, `size`) |
| GET | `/api/jobs/{id}` | No | Get job details |
| GET | `/api/jobs/my` | RECRUITER/ADMIN | Get your own job postings |
| POST | `/api/jobs` | RECRUITER/ADMIN | Create a job posting |
| PATCH | `/api/jobs/{id}` | RECRUITER/ADMIN | Update a job posting |
| DELETE | `/api/jobs/{id}` | RECRUITER/ADMIN | Delete a job posting |

### Applications

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/applications` | CANDIDATE | Apply to a job |
| GET | `/api/applications/my` | CANDIDATE | View your applications |
| GET | `/api/applications/job/{jobId}` | RECRUITER/ADMIN | View applications for a job |
| PATCH | `/api/applications/{id}/status` | RECRUITER/ADMIN | Update application status |

### Notifications

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | Any | Get your notifications |
| PATCH | `/api/notifications/{id}/read` | Any | Mark as read |

### Other

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/actuator/health` | No | API health check |
| GET | `/api/swagger-ui.html` | No | Interactive API docs |

---

## User Roles

| Role | Capabilities |
|---|---|
| `CANDIDATE` | Browse jobs, apply, view own applications, get notifications |
| `RECRUITER` | All of CANDIDATE + create/edit/delete own jobs, view applicants |
| `ADMIN` | Full access to all resources |

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

Copy the `accessToken` from the response and use it as a Bearer token for authenticated requests:

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

**Connect to the dev database directly:**
```bash
psql -h localhost -p 5433 -U nexhire -d nexhire_dev
# Password: root1234
```

---

## Troubleshooting

### Port 5432 already in use
PostgreSQL is already running locally. The dev Docker setup uses port **5433** to avoid this conflict.

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
Check Spring Boot logs in the terminal. Common causes:
- Docker infrastructure not running → run `npm run docker:dev`
- Wrong DB port → verify `.env` has `5433` not `5432`
- Flyway migration failed → check logs for migration errors

### Jobs not showing on the frontend
Jobs are only visible in the browse list when their status is `OPEN`. Newly created jobs default to `OPEN`. If you have old `DRAFT` jobs from previous runs, create a new job after starting the fixed API.
