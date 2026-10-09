-- Calendar subscription feed and built-in video rooms for interviews.

-- Secret for the personal calendar feed (/calendar/feed/{token}.ics); created on first use, can be reset.
ALTER TABLE users ADD COLUMN IF NOT EXISTS calendar_token VARCHAR(64) UNIQUE;

-- Video room created for an interview (e.g. Daily.co); NULL when the interview uses its own link or isn't video.
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS video_provider VARCHAR(20);
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS video_room_name VARCHAR(128);
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS video_room_url VARCHAR(500);
