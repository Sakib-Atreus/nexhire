-- Candidates accept an interview, ask for another time, or decline it.
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS response VARCHAR(30) NOT NULL DEFAULT 'AWAITING';
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS response_note TEXT;
-- JSON array of ISO instants the candidate suggested (when response = NEW_TIME_REQUESTED).
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS proposed_times TEXT;
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP WITH TIME ZONE;
-- When the current time was sent to the candidate (creation or last reschedule); drives follow-up reminders.
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
UPDATE interviews SET invited_at = created_at;
