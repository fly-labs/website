-- Add YC Lens score column (5th expert perspective)
-- Evaluates ideas through YC's product evaluation methodology (6 questions, 0-100)
-- Does NOT affect FL verdict. Display only on detail page.
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS yc_score integer;

-- Index for filtering/sorting by YC score
CREATE INDEX IF NOT EXISTS idx_ideas_yc_score ON ideas (yc_score) WHERE yc_score IS NOT NULL;
