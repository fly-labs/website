-- Performance indexes for common query patterns

-- Ideas: filter by approved status
create index if not exists idx_ideas_approved
  on public.ideas (approved);

-- Ideas: approved sorted by votes (IdeaSubmissionPage default sort)
create index if not exists idx_ideas_approved_votes
  on public.ideas (approved, votes desc);

-- Prompt votes: lookup by prompt_id for count aggregation
create index if not exists idx_prompt_votes_prompt_id
  on public.prompt_votes (prompt_id);

-- Prompt comments: lookup by prompt_id for loading comments
create index if not exists idx_prompt_comments_prompt_id
  on public.prompt_comments (prompt_id);

-- Waitlist: lookup by source for count RPC
create index if not exists idx_waitlist_source
  on public.waitlist (source);

-- Improve increment_vote: raise error if idea not found
create or replace function public.increment_vote(idea_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ideas set votes = coalesce(votes, 0) + 1 where id = idea_id;
  if not found then
    raise exception 'Idea not found: %', idea_id;
  end if;
end;
$$;
