-- Add Fly Labs Method score column
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS flylabs_score integer;
CREATE INDEX IF NOT EXISTS idx_ideas_flylabs_score ON ideas(flylabs_score DESC NULLS LAST);
