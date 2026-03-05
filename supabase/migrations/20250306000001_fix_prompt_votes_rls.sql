-- Fix prompt_votes RLS: users should only see their own votes
-- Vote counts are exposed via get_prompt_vote_counts() RPC instead

-- Drop the overly permissive policy that lets any authenticated user see all votes
drop policy if exists "Authenticated can view all votes" on public.prompt_votes;

-- Users can only view their own votes (for checking if they voted)
create policy "Users can view own votes"
  on public.prompt_votes for select
  using (auth.uid() = user_id);

-- RPC: get aggregated vote counts per prompt (no user info exposed)
create or replace function public.get_prompt_vote_counts()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result json;
begin
  select coalesce(
    json_object_agg(prompt_id, cnt),
    '{}'::json
  ) into v_result
  from (
    select prompt_id, count(*)::int as cnt
    from public.prompt_votes
    group by prompt_id
  ) sub;
  return v_result;
end;
$$;
