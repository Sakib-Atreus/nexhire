CREATE TYPE application_status AS ENUM ('PENDING', 'REVIEWING', 'SHORTLISTED', 'INTERVIEWED', 'OFFERED', 'REJECTED', 'WITHDRAWN');

CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cover_letter TEXT,
    resume_url VARCHAR(500),
    status application_status NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (job_id, candidate_id)
);

CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_candidate ON applications(candidate_id);
CREATE INDEX idx_applications_status ON applications(status);
