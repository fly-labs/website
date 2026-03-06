-- Source tracking columns for ProblemHunt integration
ALTER TABLE public.ideas
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'community',
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS tags text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS industry text;

-- Allow NULL email and description for imported ideas
ALTER TABLE public.ideas ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.ideas ALTER COLUMN idea_description DROP NOT NULL;

-- Deduplication index
CREATE UNIQUE INDEX IF NOT EXISTS idx_ideas_external_id
  ON public.ideas (external_id) WHERE external_id IS NOT NULL;

-- Source and industry indexes
CREATE INDEX IF NOT EXISTS idx_ideas_source ON public.ideas (source);
CREATE INDEX IF NOT EXISTS idx_ideas_industry ON public.ideas (industry);
