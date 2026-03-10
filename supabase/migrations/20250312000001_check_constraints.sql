-- Phase 5.2: Database CHECK Constraints
-- Enforce data integrity at the database level

ALTER TABLE ideas ADD CONSTRAINT chk_flylabs_score
  CHECK (flylabs_score IS NULL OR flylabs_score BETWEEN 0 AND 100);

ALTER TABLE ideas ADD CONSTRAINT chk_hormozi_score
  CHECK (hormozi_score IS NULL OR hormozi_score BETWEEN 0 AND 100);

ALTER TABLE ideas ADD CONSTRAINT chk_koe_score
  CHECK (koe_score IS NULL OR koe_score BETWEEN 0 AND 100);

ALTER TABLE ideas ADD CONSTRAINT chk_okamoto_score
  CHECK (okamoto_score IS NULL OR okamoto_score BETWEEN 0 AND 100);

ALTER TABLE ideas ADD CONSTRAINT chk_validation_score
  CHECK (validation_score IS NULL OR validation_score BETWEEN 0 AND 100);

ALTER TABLE ideas ADD CONSTRAINT chk_votes_positive
  CHECK (votes >= 0);

ALTER TABLE ideas ADD CONSTRAINT chk_status
  CHECK (status IN ('open', 'building', 'shipped'));

ALTER TABLE ideas ADD CONSTRAINT chk_source
  CHECK (source IN ('community', 'problemhunt', 'reddit', 'producthunt', 'x', 'hackernews', 'github'));
