-- Fix: name column should be nullable (matches original schema)
-- Community submissions and prompt suggestions may not have a name
ALTER TABLE public.ideas ALTER COLUMN name DROP NOT NULL;
