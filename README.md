# NexHire

**A full-stack job portal and hiring platform.** Job seekers find jobs, apply and track every application. Companies run the whole hiring process, from posting a job to scheduling interviews and making a hire. Administrators moderate everything from one panel.

**Live:** [job-portal-web-beta.vercel.app](https://job-portal-web-beta.vercel.app)

---

## Features

**Job seekers**
- Job search with filters, saved jobs and personalised recommendations
- Job alerts (instant or daily digest, in-app and email)
- Full profile with experience, education, saved resume and an optional public page
- One-click apply and an application tracker with a full activity timeline
- Interview invitations: accept, suggest another time or decline
- Calendar, Google/Outlook/Apple calendar sync, and in-browser video interviews

**Recruiters and hiring teams**
- Company teams that share jobs, applicants and interviews
- Job posting with drafts, openings and screening questions
- Drag-and-drop hiring pipeline with private ratings and notes
- Messages with reusable templates
- Interview scheduling with clash warnings, a team calendar and built-in video rooms
- Per-job analytics

**Administrators**
- Overview dashboard, user and job moderation, company verification
- Job reports, audit log and site settings (announcements, categories, skills)

**Platform**
- Role-based access with JWT authentication
- Real-time notifications (SSE + RabbitMQ)
- Email via any SMTP provider, S3-compatible file storage
- Light and dark mode, fully responsive

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, TanStack Query, Zustand |
| Backend | Spring Boot 3.3, Java 21, Spring Security (JWT), JPA, Flyway |
| Data | PostgreSQL 16, RabbitMQ, MinIO / Backblaze B2 |
| Integrations | Daily.co (video), FullCalendar, SMTP |
| Tooling | Turborepo, npm workspaces, Docker |

---

## Getting Started

**Requirements:** Node.js 20+, Java 21, Docker.

### Option A — Docker (everything in containers)

```bash
npm run docker:up
```

| Service | URL |
|---|---|
| Web app | http://localhost:3001 |
| API | http://localhost:8080/api |
| API docs (Swagger) | http://localhost:8080/api/swagger-ui.html |

### Option B — Local development (hot reload)

```bash
npm install
npm run docker:dev                      # PostgreSQL, RabbitMQ and MinIO

cd apps/api && ./mvnw spring-boot:run   # API on :8080 (terminal 1)
npm run dev                             # Web on :3000 (terminal 2, from the repo root)
```

Database migrations run automatically on startup, including sample jobs so the board isn't empty. To create the first administrator, start the API once with `ADMIN_EMAIL` and `ADMIN_PASSWORD` set.

---

## Configuration

Set these on the API in production (see `.env.example` for the full list):

| Variable | Required | Purpose |
|---|---|---|
| `SPRING_DATASOURCE_URL`, `_USERNAME`, `_PASSWORD` | Yes | PostgreSQL connection |
| `JWT_SECRET` | Yes | Token signing key (`openssl rand -hex 48`) |
| `CORS_ALLOWED_ORIGINS` | Yes | Frontend URL(s) |
| `APP_BASE_URL` | Recommended | Frontend URL used in email and calendar links |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | First run | Creates the first administrator |
| `SPRING_RABBITMQ_*` | Optional | Message broker (the app still works without it) |
| `MINIO_*` | Optional | File storage (uploads are disabled without it) |
| `SPRING_MAIL_*`, `MAIL_FROM` | Optional | Email (logged instead of sent without it) |
| `DAILY_API_KEY` | Optional | Built-in video rooms (otherwise meeting links are pasted) |

On the frontend, set `NEXT_PUBLIC_API_URL` to the API URL (e.g. `https://your-api.onrender.com/api`).

---

## Deployment

| Part | Platform | Setup |
|---|---|---|
| API | Render (Docker) | Root directory `apps/api`, add the variables above |
| Web | Vercel | Root directory `apps/web`, set `NEXT_PUBLIC_API_URL` |
| Database | Neon | PostgreSQL |
| Broker / Storage | CloudAMQP / Backblaze B2 | Optional |

Deploy the API first, then the web app. Check the API is healthy at `/api/actuator/health`.

---

## Project Structure

```
nexhire/
├── apps/
│   ├── api/        # Spring Boot REST API
│   └── web/        # Next.js frontend
├── packages/
│   └── shared/     # Shared TypeScript types
└── docker/         # Docker Compose files
```

## Useful Commands

```bash
npm run dev            # Run the web app in dev mode
npm run build          # Build all apps
npm run type-check     # TypeScript checks
cd apps/api && ./mvnw test   # API tests
```

**More details:** the [Full Guide](docs/FULL_GUIDE.md) covers every API endpoint, environment variable, database migration and troubleshooting tip. Live API docs are in Swagger at `/api/swagger-ui.html`.

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

This project is open source under the [MIT License](LICENSE) © 2026 Md. Sakib Mia. You are free to use, modify and distribute it, as long as the original copyright notice is kept.

## Contact

**Sakib Mia** — [GitHub @Sakib-Atreus](https://github.com/Sakib-Atreus) · [sakibmia0718@gmail.com](mailto:sakibmia0718@gmail.com)

Found a bug or have an idea? [Open an issue](https://github.com/Sakib-Atreus/nexhire/issues).
