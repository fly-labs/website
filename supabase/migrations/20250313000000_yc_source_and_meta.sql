-- Add 'yc' to source CHECK constraint and add meta JSONB column for source context

-- Drop existing constraint and recreate with 'yc' included
ALTER TABLE ideas DROP CONSTRAINT IF EXISTS chk_source;
ALTER TABLE ideas ADD CONSTRAINT chk_source
  CHECK (source IN ('community', 'problemhunt', 'reddit', 'producthunt', 'x', 'hackernews', 'github', 'yc'));

-- Add meta JSONB column for source-specific context (e.g., YC failure analysis)
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT NULL;

-- Comment for documentation
COMMENT ON COLUMN ideas.meta IS 'Source-specific context. For YC ideas: failure_analysis with company_name, batch, team_size, failure_reason, what_changed, rebuild_angle, original_one_liner.';
