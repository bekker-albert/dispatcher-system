-- Shared application state for dispatcher-system.
-- Run this in Supabase SQL Editor after pto-schema.sql.
--
-- This is the synchronization layer that lets different computers see the same
-- entered data while the app is being split into fully normalized tables.

create table if not exists public.app_state (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_app_state_updated_at on public.app_state;
create trigger set_app_state_updated_at
before update on public.app_state
for each row
execute function public.set_updated_at();

alter table public.app_state enable row level security;

drop policy if exists "app_state anon read" on public.app_state;
drop policy if exists "app_state anon write" on public.app_state;
drop policy if exists "app_state authenticated read" on public.app_state;
drop policy if exists "app_state authenticated write" on public.app_state;

create policy "app_state anon read"
on public.app_state
for select
to anon
using (true);

create policy "app_state anon write"
on public.app_state
for all
to anon
using (true)
with check (true);
