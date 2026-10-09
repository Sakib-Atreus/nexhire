-- Phase 3: full candidate profiles, saved resume, public profiles, job alerts and application timelines.

-- ─── Profile additions ──────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS resume_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS resume_file_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS resume_updated_at TIMESTAMP WITH TIME ZONE;
-- Public profile at /p/{profile_slug}; off by default (opt-in).
ALTER TABLE users ADD COLUMN IF NOT EXISTS public_profile BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_slug VARCHAR(80) UNIQUE;

CREATE TABLE work_experiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    company VARCHAR(150) NOT NULL,
    location VARCHAR(150),
    start_date DATE NOT NULL,
    end_date DATE,                    -- NULL = current role
    description TEXT,
    position INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_work_experiences_user ON work_experiences(user_id, position);

CREATE TABLE educations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school VARCHAR(150) NOT NULL,
    degree VARCHAR(150),
    field_of_study VARCHAR(150),
    start_year INTEGER,
    end_year INTEGER,
    description TEXT,
    position INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_educations_user ON educations(user_id, position);

-- ─── Job alerts ─────────────────────────────────────────────────────────────
CREATE TABLE job_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    keyword VARCHAR(100),
    location VARCHAR(100),
    category VARCHAR(50),
    job_type VARCHAR(20),
    experience_level VARCHAR(20),
    frequency VARCHAR(10) NOT NULL DEFAULT 'DAILY',   -- INSTANT | DAILY
    active BOOLEAN NOT NULL DEFAULT TRUE,
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    -- Secret for the one-click unsubscribe link in alert emails.
    unsubscribe_token VARCHAR(64) NOT NULL UNIQUE,
    last_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_job_alerts_active ON job_alerts(active);

-- One row per (alert, job): prevents duplicate alerts and queues daily digests.
CREATE TABLE job_alert_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID NOT NULL REFERENCES job_alerts(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    sent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_alert_job UNIQUE (alert_id, job_id)
);
CREATE INDEX idx_job_alert_matches_pending ON job_alert_matches(sent, alert_id);

-- ─── Application timeline ───────────────────────────────────────────────────
CREATE TABLE application_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    type VARCHAR(40) NOT NULL,
    from_status VARCHAR(30),
    to_status VARCHAR(30),
    -- Message from the hiring team shown to the candidate (status updates), or other context.
    note TEXT,
    actor_name VARCHAR(255),
    visible_to_candidate BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_application_events_app ON application_events(application_id, created_at);

-- Backfill: every existing application gets its "Applied" event, plus its current stage if it moved on.
INSERT INTO application_events (application_id, type, to_status, created_at)
SELECT id, 'APPLIED', 'PENDING', applied_at FROM applications;

INSERT INTO application_events (application_id, type, from_status, to_status, created_at)
SELECT id, CASE WHEN status = 'WITHDRAWN' THEN 'WITHDRAWN' ELSE 'STATUS_CHANGED' END, 'PENDING', status, updated_at
FROM applications WHERE status <> 'PENDING';
