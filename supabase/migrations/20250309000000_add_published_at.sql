-- Add published_at column for original publication dates (vs sync time in created_at)
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- Backfill from created_at
UPDATE public.ideas SET published_at = created_at WHERE published_at IS NULL;

-- Index for sort queries
CREATE INDEX IF NOT EXISTS idx_ideas_published_at ON public.ideas (published_at);
