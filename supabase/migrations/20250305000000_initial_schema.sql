-- FlyLabs initial schema
-- Run with: supabase db push (or apply manually in Supabase SQL Editor)
-- See README.md and docs/SUPABASE.md for setup instructions

-- profiles: user profiles synced with auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  phone text,
  country text,
  city text,
  age int,
  gender text,
  bio text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ideas: community idea submissions with voting
create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text,
  email text not null,
  idea_title text not null,
  idea_description text not null,
  category text not null default 'Tool',
  approved boolean default false,
  votes int default 0
);

-- prompt_votes: upvotes on prompts (prompt_id references lib/data/prompts.js ids)
create table if not exists public.prompt_votes (
  prompt_id int not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (prompt_id, user_id)
);

-- prompt_comments: comments on prompts
create table if not exists public.prompt_comments (
  id uuid primary key default gen_random_uuid(),
  prompt_id int not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- waitlist: email capture for micro tools
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'micro-tools',
  created_at timestamptz default now(),
  unique (email, source)
);

-- RPC: atomic vote increment for ideas
create or replace function public.increment_vote(idea_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ideas set votes = coalesce(votes, 0) + 1 where id = idea_id;
end;
$$;

-- RPC: toggle prompt vote, returns new count
create or replace function public.toggle_prompt_vote(p_prompt_id int)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_exists boolean;
  v_count int;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select exists(select 1 from public.prompt_votes where prompt_id = p_prompt_id and user_id = v_user_id) into v_exists;

  if v_exists then
    delete from public.prompt_votes where prompt_id = p_prompt_id and user_id = v_user_id;
  else
    insert into public.prompt_votes (prompt_id, user_id) values (p_prompt_id, v_user_id);
  end if;

  select count(*)::int from public.prompt_votes where prompt_id = p_prompt_id into v_count;
  return json_build_object('count', v_count);
end;
$$;

-- Trigger: create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RPC: get waitlist count by source (no email exposure)
create or replace function public.get_waitlist_count(p_source text default 'micro-tools')
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  select count(*)::int from public.waitlist where source = p_source into v_count;
  return v_count;
end;
$$;
