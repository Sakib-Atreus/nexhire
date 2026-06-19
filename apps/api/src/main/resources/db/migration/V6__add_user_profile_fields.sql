-- User profile enhancements
ALTER TABLE users ADD COLUMN IF NOT EXISTS skills TEXT DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS headline VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS portfolio_links TEXT DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences TEXT DEFAULT '{"applicationReceived":true,"statusChanged":true,"general":true}';

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email verification tokens
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
