-- FlyLabs Row Level Security policies
-- Enable RLS on all tables and define access policies

-- profiles: users can read and update their own profile
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- profiles: allow insert on signup (auth trigger or app)
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ideas: public read approved only; anyone can insert
alter table public.ideas enable row level security;

create policy "Public can view approved ideas"
  on public.ideas for select
  using (approved = true);

create policy "Anyone can submit ideas"
  on public.ideas for insert
  with check (true);

-- ideas: no update/delete from client (admin only via dashboard)

-- prompt_votes: authenticated users can select (for counts), insert, delete
-- RPC toggle_prompt_vote uses security definer, bypasses RLS
alter table public.prompt_votes enable row level security;

create policy "Authenticated can view all votes"
  on public.prompt_votes for select
  using (auth.uid() is not null);

create policy "Authenticated can insert own vote"
  on public.prompt_votes for insert
  with check (auth.uid() = user_id);

create policy "Authenticated can delete own vote"
  on public.prompt_votes for delete
  using (auth.uid() = user_id);

-- prompt_comments: authenticated read all, insert own, delete own
alter table public.prompt_comments enable row level security;

create policy "Authenticated can view comments"
  on public.prompt_comments for select
  using (auth.uid() is not null);

create policy "Authenticated can insert own comment"
  on public.prompt_comments for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own comments"
  on public.prompt_comments for delete
  using (auth.uid() = user_id);

-- waitlist: anyone can insert; no public select (admin via service role)
alter table public.waitlist enable row level security;

create policy "Anyone can join waitlist"
  on public.waitlist for insert
  with check (true);

-- No select policy: only service role can read (for admin dashboard)
