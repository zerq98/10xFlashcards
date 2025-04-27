-- migration: create initial schema
-- date: 2025-04-27 12:00:00 UTC
-- description: create profiles, topics, flashcards, ai_generation_logs tables, enum type, triggers, indexes, and rls policies

-- enable pgcrypto for gen_random_uuid
create extension if not exists pgcrypto;

-- create enum for ai generation status
drop type if exists public.ai_generation_status;
create type public.ai_generation_status as enum (
  'success',
  'error'
);

-- create profiles table
drop table if exists public.profiles cascade;
create table public.profiles (
  user_id uuid primary key references auth.users(id),
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- profiles rls policies
create policy "select profiles" on public.profiles
  for select using (user_id = auth.uid());
create policy "insert profiles" on public.profiles
  for insert with check (user_id = auth.uid());
create policy "update profiles" on public.profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete profiles" on public.profiles
  for delete using (user_id = auth.uid());

-- trigger function to update updated_at timestamp
drop function if exists public.trigger_set_timestamp cascade;
create or replace function public.trigger_set_timestamp() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- attach profile trigger
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.trigger_set_timestamp();

-- create topics table
drop table if exists public.topics cascade;
create table public.topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id),
  name varchar(255) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, name)
);
alter table public.topics enable row level security;

-- topics rls policies
create policy "select topics" on public.topics
  for select using (
    user_id = auth.uid() and exists (
      select 1 from public.profiles where profiles.user_id = auth.uid() and profiles.is_deleted = false
    )
  );
create policy "insert topics" on public.topics
  for insert with check (user_id = auth.uid());
create policy "update topics" on public.topics
  for update using (
    user_id = auth.uid() and exists (
      select 1 from public.profiles where profiles.user_id = auth.uid() and profiles.is_deleted = false
    )
  ) with check (user_id = auth.uid());
create policy "delete topics" on public.topics
  for delete using (
    user_id = auth.uid() and exists (
      select 1 from public.profiles where profiles.user_id = auth.uid() and profiles.is_deleted = false
    )
  );

-- attach topics trigger
create trigger set_topics_updated_at
  before update on public.topics
  for each row execute function public.trigger_set_timestamp();

-- create ai_generation_logs table
drop table if exists public.ai_generation_logs cascade;
create table public.ai_generation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id),
  topic_id uuid references public.topics(id) on delete set null,
  requested_count integer not null,
  generated_count integer not null,
  saved_count integer not null,
  input_text_hash bytea not null,
  status public.ai_generation_status not null,
  error_info text,
  created_at timestamptz not null default now()
);
alter table public.ai_generation_logs enable row level security;

-- ai_generation_logs rls policies
create policy "select ai_generation_logs" on public.ai_generation_logs
  for select using (user_id = auth.uid());
create policy "insert ai_generation_logs" on public.ai_generation_logs
  for insert with check (user_id = auth.uid());

-- create flashcards table
drop table if exists public.flashcards cascade;
create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id),
  topic_id uuid not null references public.topics(id) on delete cascade,
  front varchar(500) not null check (length(front) > 0),
  back varchar(500) not null check (length(back) > 0),
  is_ai_generated boolean not null default false,
  was_edited_before_save boolean not null default false,
  sr_state jsonb,
  ai_generation_log_id uuid references public.ai_generation_logs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.flashcards enable row level security;

-- flashcards rls policies
create policy "select flashcards" on public.flashcards
  for select using (
    user_id = auth.uid() and exists (
      select 1 from public.profiles where profiles.user_id = auth.uid() and profiles.is_deleted = false
    )
  );
create policy "insert flashcards" on public.flashcards
  for insert with check (user_id = auth.uid());
create policy "update flashcards" on public.flashcards
  for update using (
    user_id = auth.uid() and exists (
      select 1 from public.profiles where profiles.user_id = auth.uid() and profiles.is_deleted = false
    )
  ) with check (user_id = auth.uid());
create policy "delete flashcards" on public.flashcards
  for delete using (
    user_id = auth.uid() and exists (
      select 1 from public.profiles where profiles.user_id = auth.uid() and profiles.is_deleted = false
    )
  );

-- attach flashcards trigger
create trigger set_flashcards_updated_at
  before update on public.flashcards
  for each row execute function public.trigger_set_timestamp();

-- create indexes
create index idx_topics_user_id on public.topics(user_id);
create index idx_flashcards_user_id on public.flashcards(user_id);
create index idx_flashcards_topic_id on public.flashcards(topic_id);
create index idx_flashcards_ai_generation_log_id on public.flashcards(ai_generation_log_id);
create index idx_ai_generation_logs_user_id on public.ai_generation_logs(user_id);
create index idx_ai_generation_logs_topic_id on public.ai_generation_logs(topic_id);
create index idx_ai_generation_logs_created_at on public.ai_generation_logs(created_at);
create index idx_flashcards_sr_state on public.flashcards using gin(sr_state);
