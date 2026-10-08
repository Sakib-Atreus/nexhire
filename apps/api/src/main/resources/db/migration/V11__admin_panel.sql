-- Admin panel: recruiter verification, job moderation, reports, audit log and site settings.

ALTER TABLE users ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS hidden BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS category VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_featured ON jobs(featured) WHERE featured;

-- ─── Job reports ────────────────────────────────────────────────────────────
CREATE TABLE job_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(30) NOT NULL,
    details TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    resolution_note TEXT,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_job_report_per_user UNIQUE (job_id, reporter_id)
);
CREATE INDEX idx_job_reports_status ON job_reports(status, created_at DESC);

-- ─── Audit log ──────────────────────────────────────────────────────────────
-- actor_email/actor_name are copied so entries stay readable after the actor is deleted.
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_email VARCHAR(255),
    actor_name VARCHAR(255),
    action VARCHAR(50) NOT NULL,
    target_type VARCHAR(30),
    target_id UUID,
    target_label VARCHAR(255),
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_type, target_id);

-- ─── Site settings (JSON values keyed by name) ──────────────────────────────
CREATE TABLE site_settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

INSERT INTO site_settings (key, value) VALUES
('announcement', '{"enabled":false,"message":"","tone":"info","linkUrl":"","linkLabel":""}'),
('categories', '["Software Engineering","Data & Analytics","Product & Design","DevOps & Infrastructure","Quality Assurance","Marketing & Content","Sales & Business","Customer Support","Operations","Finance","Human Resources","Education","Healthcare","Other"]'),
('skills', '["Java","Spring Boot","Python","JavaScript","TypeScript","React","Next.js","Node.js","Go","Kotlin","Flutter","Android","iOS","SQL","PostgreSQL","MongoDB","AWS","GCP","Azure","Docker","Kubernetes","Terraform","CI/CD","Machine Learning","Data Analysis","Power BI","Figma","UX Research","Product Management","Technical Writing","Customer Support","Recruiting","Excel","Communication","Bangla","English"]')
ON CONFLICT (key) DO NOTHING;

-- ─── Categorise the seeded listings ─────────────────────────────────────────
UPDATE jobs SET category = 'Software Engineering' WHERE category IS NULL AND (
    title ILIKE '%Backend Engineer%' OR title ILIKE '%Mobile Engineer%' OR title ILIKE '%Full Stack%'
    OR title ILIKE '%Frontend Engineer%' OR title ILIKE '%Software Engineering Intern%'
    OR title ILIKE '%Machine Learning%' OR title ILIKE '%Engineering Manager%' OR title ILIKE '%Head of Engineering%');
UPDATE jobs SET category = 'Data & Analytics' WHERE category IS NULL AND (
    title ILIKE '%Data Engineer%' OR title ILIKE '%Data Analyst%' OR title ILIKE '%Operations Analyst%');
UPDATE jobs SET category = 'Product & Design' WHERE category IS NULL AND (
    title ILIKE '%Product Manager%' OR title ILIKE '%Product Designer%');
UPDATE jobs SET category = 'DevOps & Infrastructure' WHERE category IS NULL AND (
    title ILIKE '%DevOps%' OR title ILIKE '%Platform Engineer%');
UPDATE jobs SET category = 'Quality Assurance' WHERE category IS NULL AND title ILIKE '%QA%';
UPDATE jobs SET category = 'Marketing & Content' WHERE category IS NULL AND (
    title ILIKE '%Developer Advocate%' OR title ILIKE '%Content Developer%');
UPDATE jobs SET category = 'Customer Support' WHERE category IS NULL AND title ILIKE '%Customer Support%';
UPDATE jobs SET category = 'Human Resources' WHERE category IS NULL AND title ILIKE '%Talent Acquisition%';
