CREATE TYPE job_status AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'FILLED');
CREATE TYPE job_type AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'REMOTE');
CREATE TYPE experience_level AS ENUM ('ENTRY', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE');

CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    responsibilities TEXT,
    company_name VARCHAR(255) NOT NULL,
    company_logo_url VARCHAR(500),
    location VARCHAR(255),
    job_type job_type NOT NULL DEFAULT 'FULL_TIME',
    experience_level experience_level NOT NULL DEFAULT 'MID',
    salary_min DECIMAL(12, 2),
    salary_max DECIMAL(12, 2),
    salary_currency VARCHAR(10) DEFAULT 'USD',
    status job_status NOT NULL DEFAULT 'DRAFT',
    tags VARCHAR(500),
    deadline DATE,
    recruiter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jobs_recruiter ON jobs(recruiter_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_type ON jobs(job_type);
CREATE INDEX idx_jobs_created ON jobs(created_at DESC);
