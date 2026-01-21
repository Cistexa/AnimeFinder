-- Table to store the results of the latest cron job run
-- This table is designed to be cleared and repopulated every 6 hours
CREATE TABLE IF NOT EXISTS new_releases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- 'anime' or 'manga'
    release_info TEXT, -- e.g. "Episode 5", "Chapter 10"
    url TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast retrieval
CREATE INDEX IF NOT EXISTS idx_new_releases_created_at ON new_releases(created_at);
