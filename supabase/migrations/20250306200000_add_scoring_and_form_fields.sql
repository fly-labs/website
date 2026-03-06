-- Multi-step form fields
ALTER TABLE public.ideas
  ADD COLUMN IF NOT EXISTS frequency text,
  ADD COLUMN IF NOT EXISTS existing_solutions text;

-- Hormozi Score (0-100) + Dan Koe Score (0-100) + breakdown JSON
ALTER TABLE public.ideas
  ADD COLUMN IF NOT EXISTS hormozi_score integer,
  ADD COLUMN IF NOT EXISTS koe_score integer,
  ADD COLUMN IF NOT EXISTS score_breakdown jsonb;

CREATE INDEX IF NOT EXISTS idx_ideas_hormozi_score ON public.ideas (hormozi_score);
CREATE INDEX IF NOT EXISTS idx_ideas_koe_score ON public.ideas (koe_score);

-- Rate limiting for idea submissions (abuse protection)
CREATE TABLE IF NOT EXISTS public.idea_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_email_time
  ON public.idea_rate_limits (email, created_at);

-- RLS: anyone can insert (to log submissions), only service role reads
ALTER TABLE public.idea_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert rate limit entry"
  ON public.idea_rate_limits FOR INSERT WITH CHECK (true);

-- RPC to check rate limit (returns count of submissions in last 24h)
CREATE OR REPLACE FUNCTION public.check_idea_rate_limit(p_email text)
RETURNS integer AS $$
  SELECT COUNT(*)::integer FROM public.idea_rate_limits
  WHERE email = p_email AND created_at > now() - interval '24 hours';
$$ LANGUAGE sql SECURITY DEFINER;

-- RPC to log a submission for rate limiting
CREATE OR REPLACE FUNCTION public.log_idea_submission(p_email text)
RETURNS void AS $$
  INSERT INTO public.idea_rate_limits (email) VALUES (p_email);
$$ LANGUAGE sql SECURITY DEFINER;
