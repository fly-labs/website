ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS okamoto_score integer;
CREATE INDEX IF NOT EXISTS idx_ideas_okamoto_score ON public.ideas (okamoto_score);
