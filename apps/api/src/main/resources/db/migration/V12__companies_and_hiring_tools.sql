-- Phase 2: company profiles, recruiter teams, hiring pipeline tools and job analytics.

-- ─── Companies ──────────────────────────────────────────────────────────────
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(80) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    logo_url VARCHAR(500),
    website VARCHAR(500),
    size VARCHAR(20),
    industry VARCHAR(100),
    headquarters VARCHAR(255),
    description TEXT,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_companies_name ON companies(LOWER(name));

-- A recruiter belongs to at most one company; jobs point at the company that posted them.
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_jobs_company ON jobs(company_id);

-- Number of people to hire; the job closes as FILLED once that many applicants are hired.
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS openings INTEGER NOT NULL DEFAULT 1 CHECK (openings >= 1);

-- Private 1–5 rating recruiters give an applicant (never shown to the candidate).
ALTER TABLE applications ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating BETWEEN 1 AND 5);

-- Backfill: one company per distinct company name already used on jobs, owned by its first poster.
INSERT INTO companies (slug, name, logo_url, owner_id, created_at)
SELECT DISTINCT ON (LOWER(TRIM(company_name)))
       COALESCE(NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(TRIM(company_name)), '[^a-z0-9]+', '-', 'g')), ''), 'company'),
       TRIM(company_name),
       company_logo_url,
       recruiter_id,
       created_at
FROM jobs
WHERE TRIM(company_name) <> ''
ORDER BY LOWER(TRIM(company_name)), created_at
ON CONFLICT (slug) DO NOTHING;

UPDATE jobs j SET company_id = c.id
FROM companies c
WHERE j.company_id IS NULL AND LOWER(TRIM(j.company_name)) = LOWER(c.name);

-- Each recruiter joins the company of their most recent job.
UPDATE users u SET company_id = (
    SELECT j.company_id FROM jobs j
    WHERE j.recruiter_id = u.id AND j.company_id IS NOT NULL
    ORDER BY j.created_at DESC LIMIT 1)
WHERE u.role = 'RECRUITER' AND u.company_id IS NULL;

-- Profiles for the seeded companies (fictional).
UPDATE companies SET industry = 'Financial services', size = '201-500', headquarters = 'Dhaka, Bangladesh',
    description = 'Corvana Fintech runs a merchant payments and wallet platform used by more than 40,000 small businesses across Bangladesh, processing over two million transactions a day.'
    WHERE slug = 'corvana-fintech';
UPDATE companies SET industry = 'Healthcare technology', size = '51-200', headquarters = 'Singapore',
    description = 'Halvex Health connects patients with licensed doctors through video consultations, e-prescriptions and follow-up care across Southeast Asia.'
    WHERE slug = 'halvex-health';
UPDATE companies SET industry = 'E-commerce', size = '501-1000', headquarters = 'Dhaka, Bangladesh',
    description = 'Lumora Commerce is an online marketplace with more than 3,000 independent sellers and a million monthly shoppers.'
    WHERE slug = 'lumora-commerce';
UPDATE companies SET industry = 'Developer tools', size = '201-500', headquarters = 'Berlin, Germany',
    description = 'Quillstone builds developer tooling used by more than 9,000 engineering teams to review, test and release code.'
    WHERE slug = 'quillstone-software';
UPDATE companies SET industry = 'Logistics', size = '1001+', headquarters = 'Singapore',
    description = 'Driftmark Logistics moves freight for retailers and manufacturers across the Gulf and South Asia, planning more than 60,000 deliveries a day.'
    WHERE slug = 'driftmark-logistics';
UPDATE companies SET industry = 'Renewable energy', size = '51-200', headquarters = 'London, United Kingdom',
    description = 'Verdant Grid Energy helps solar and wind farm operators forecast output and trade energy more profitably, using readings from more than 4,000 sites.'
    WHERE slug = 'verdant-grid-energy';
UPDATE companies SET industry = 'Artificial intelligence', size = '51-200', headquarters = 'Toronto, Canada',
    description = 'Orbitra Labs builds document intelligence software that legal and insurance teams use to review contracts and claims.'
    WHERE slug = 'orbitra-labs';
UPDATE companies SET industry = 'Education', size = '51-200', headquarters = 'Dhaka, Bangladesh',
    description = 'Paxwell Learning helps more than 200,000 secondary school students prepare for SSC and HSC exams through video lessons and practice tests.'
    WHERE slug = 'paxwell-learning';

-- ─── Interviews ─────────────────────────────────────────────────────────────
CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 45 CHECK (duration_minutes BETWEEN 5 AND 480),
    type VARCHAR(20) NOT NULL,
    location VARCHAR(500),
    message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_interviews_application ON interviews(application_id);
CREATE INDEX idx_interviews_scheduled ON interviews(scheduled_at);

-- ─── Private notes (recruiters only) ────────────────────────────────────────
CREATE TABLE application_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(255),
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_application_notes_application ON application_notes(application_id, created_at);

-- ─── Messages between the hiring team and the candidate ─────────────────────
CREATE TABLE application_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sender_name VARCHAR(255),
    from_candidate BOOLEAN NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_application_messages_application ON application_messages(application_id, created_at);

-- ─── Reusable message templates (per recruiter) ─────────────────────────────
CREATE TABLE message_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_message_templates_owner ON message_templates(owner_id);
