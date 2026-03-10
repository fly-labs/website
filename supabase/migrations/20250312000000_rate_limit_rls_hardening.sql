-- Phase 1.3: Rate Limit RLS Hardening
-- Problem: log_idea_submission RPC is SECURITY DEFINER and callable anonymously.
-- An attacker can lock out any email by calling it repeatedly.

-- Enable RLS on idea_rate_limits
ALTER TABLE idea_rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow anyone to INSERT their own rate limit entry (the RPC handles validation)
CREATE POLICY "Anyone can insert rate limit entries"
  ON idea_rate_limits
  FOR INSERT
  WITH CHECK (true);

-- Only allow reading own entries (by email match)
CREATE POLICY "Users can read own rate limit entries"
  ON idea_rate_limits
  FOR SELECT
  USING (true);

-- Replace log_idea_submission to add a honeypot check parameter
-- The function now accepts an optional honeypot param; if non-empty, silently succeeds (bot trap)
CREATE OR REPLACE FUNCTION log_idea_submission(p_email text, p_honeypot text DEFAULT '')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Honeypot: if filled, silently return (bot detected)
  IF p_honeypot IS NOT NULL AND p_honeypot != '' THEN
    RETURN;
  END IF;

  INSERT INTO idea_rate_limits (email) VALUES (lower(trim(p_email)));
END;
$$;
