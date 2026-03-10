-- Phase 5.5: ideas.updated_at column with auto-update trigger

ALTER TABLE ideas ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Set existing rows
UPDATE ideas SET updated_at = COALESCE(created_at, now()) WHERE updated_at IS NULL;

-- Create trigger function for auto-update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger
DROP TRIGGER IF EXISTS set_updated_at ON ideas;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
