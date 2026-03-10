-- Add materialized columns for server-side filtering and sorting
-- These are populated by the scoring and enrichment scripts

-- Verdict column: BUILD, VALIDATE_FIRST, or SKIP
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS verdict text;

-- Confidence column: high, medium, or low (from enrichment)
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS confidence text;

-- Composite score: weighted average from scoring frameworks
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS composite_score numeric;

-- Indexes for filtering and sorting
CREATE INDEX IF NOT EXISTS idx_ideas_verdict ON ideas(verdict);
CREATE INDEX IF NOT EXISTS idx_ideas_confidence ON ideas(confidence);
CREATE INDEX IF NOT EXISTS idx_ideas_composite_score ON ideas(composite_score DESC NULLS LAST);

-- Backfill verdict from existing JSONB data
-- Enrichment verdict takes precedence over scoring verdict
UPDATE ideas SET verdict = COALESCE(
  enrichment->'verdict'->>'recommendation',
  score_breakdown->'synthesis'->>'verdict'
) WHERE verdict IS NULL AND (enrichment IS NOT NULL OR score_breakdown IS NOT NULL);

-- Backfill confidence from existing JSONB data
UPDATE ideas SET confidence = enrichment->'validation'->>'confidence'
WHERE confidence IS NULL AND enrichment IS NOT NULL;

-- Backfill composite_score from existing JSONB data
UPDATE ideas SET composite_score = (score_breakdown->'synthesis'->>'composite_score')::numeric
WHERE composite_score IS NULL AND score_breakdown IS NOT NULL;

-- CHECK constraints (from Phase 5.2)
ALTER TABLE ideas ADD CONSTRAINT chk_flylabs_score CHECK (flylabs_score BETWEEN 0 AND 100);
ALTER TABLE ideas ADD CONSTRAINT chk_hormozi_score CHECK (hormozi_score BETWEEN 0 AND 100);
ALTER TABLE ideas ADD CONSTRAINT chk_koe_score CHECK (koe_score BETWEEN 0 AND 100);
ALTER TABLE ideas ADD CONSTRAINT chk_okamoto_score CHECK (okamoto_score BETWEEN 0 AND 100);
ALTER TABLE ideas ADD CONSTRAINT chk_validation_score CHECK (validation_score BETWEEN 0 AND 100);
ALTER TABLE ideas ADD CONSTRAINT chk_votes_positive CHECK (votes >= 0);
ALTER TABLE ideas ADD CONSTRAINT chk_status CHECK (status IN ('open', 'building', 'shipped'));
ALTER TABLE ideas ADD CONSTRAINT chk_source CHECK (source IN ('community', 'problemhunt', 'reddit', 'producthunt', 'x', 'hackernews', 'github'));
ALTER TABLE ideas ADD CONSTRAINT chk_verdict CHECK (verdict IN ('BUILD', 'VALIDATE_FIRST', 'SKIP'));
ALTER TABLE ideas ADD CONSTRAINT chk_confidence CHECK (confidence IN ('high', 'medium', 'low'));

-- Updated_at column with auto-update trigger (from Phase 5.5)
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ideas_updated_at
  BEFORE UPDATE ON ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
