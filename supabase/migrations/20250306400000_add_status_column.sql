-- Add status column for idea lifecycle tracking
-- Values: open (default), building, shipped
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS status text DEFAULT 'open';
