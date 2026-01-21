-- Add columns to track progress of anime/manga
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS last_chapter INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_episode INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT,
ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ DEFAULT NOW();

-- Index for performance when querying items to check
CREATE INDEX IF NOT EXISTS idx_items_last_checked ON items(last_checked_at);
