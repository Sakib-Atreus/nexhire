-- Indexes for growth: keyword search, per-user lists, dashboards, and foreign keys that are
-- scanned when a user is deleted. All are IF NOT EXISTS so the migration is safe to re-run by hand.

-- ─── Job search ─────────────────────────────────────────────────────────────
-- "%keyword%" searches on title/description can't use a b-tree; trigram indexes make them index scans.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_jobs_title_trgm ON jobs USING gin (LOWER(title) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_jobs_description_trgm ON jobs USING gin (LOWER(description) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_jobs_location_trgm ON jobs USING gin (LOWER(location) gin_trgm_ops);
-- The public board: open, visible jobs, featured first, newest first.
CREATE INDEX IF NOT EXISTS idx_jobs_board ON jobs (status, hidden, featured DESC, created_at DESC);
-- Hourly auto-close of expired jobs.
CREATE INDEX IF NOT EXISTS idx_jobs_open_deadline ON jobs (deadline) WHERE status = 'OPEN';

-- ─── Per-user / per-job lists ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_applications_candidate_applied ON applications (candidate_id, applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_job_status ON applications (job_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_applied ON applications (applied_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interviews_creator_time ON interviews (created_by, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_job_alerts_user ON job_alerts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_alert_matches_job ON job_alert_matches (job_id);
CREATE INDEX IF NOT EXISTS idx_job_alert_matches_unsent ON job_alert_matches (alert_id, created_at) WHERE NOT sent;
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_saved ON saved_jobs (user_id, saved_at DESC);

-- ─── Foreign keys to users (deleting a user would otherwise scan each table) ─
CREATE INDEX IF NOT EXISTS idx_job_reports_reporter ON job_reports (reporter_id);
CREATE INDEX IF NOT EXISTS idx_job_reports_job ON job_reports (job_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_application_notes_author ON application_notes (author_id);
CREATE INDEX IF NOT EXISTS idx_application_messages_sender ON application_messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user ON email_verification_tokens (user_id);

-- Duplicates of other indexes (users.email is UNIQUE; the new composites cover the single-column ones).
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_notifications_user;
DROP INDEX IF EXISTS idx_saved_jobs_user;
