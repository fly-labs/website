-- Replace partial unique index with a proper unique constraint for PostgREST upsert support
DROP INDEX IF EXISTS idx_ideas_external_id;
ALTER TABLE public.ideas ADD CONSTRAINT ideas_external_id_unique UNIQUE (external_id);
