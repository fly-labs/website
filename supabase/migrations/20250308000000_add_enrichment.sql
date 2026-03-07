ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS enrichment jsonb;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS validation_score integer;
CREATE INDEX IF NOT EXISTS idx_ideas_validation_score ON public.ideas (validation_score);
