-- RPC: atomic vote decrement for ideas (toggle unvote)
create or replace function public.decrement_vote(idea_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ideas set votes = greatest(coalesce(votes, 0) - 1, 0) where id = idea_id;
  if not found then
    raise exception 'Idea not found: %', idea_id;
  end if;
end;
$$;
