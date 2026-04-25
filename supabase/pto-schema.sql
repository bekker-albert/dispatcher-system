-- First database step for dispatcher-system PTO data.
-- Run this in Supabase SQL Editor before saving PTO data from the app.
--
-- Prototype access model:
-- This keeps browser access open with the public anon key so the app can work
-- without a login screen while admin/users are designed.

create table if not exists public.pto_date_rows (
  table_type text not null check (table_type in ('plan', 'oper', 'survey')),
  row_id text not null,
  area text not null default '',
  location text not null default '',
  structure text not null default '',
  customer_code text not null default '',
  unit text not null default '',
  status text not null default '',
  carryover numeric not null default 0,
  carryovers jsonb not null default '{}'::jsonb,
  carryover_manual_years text[] not null default '{}',
  daily_plans jsonb not null default '{}'::jsonb,
  years text[] not null default '{}',
  sort_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (table_type, row_id)
);

create table if not exists public.pto_settings (
  key text primary key,
  value jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists pto_date_rows_table_sort_idx
on public.pto_date_rows (table_type, sort_index);

create index if not exists pto_date_rows_area_structure_idx
on public.pto_date_rows (table_type, area, structure);

create index if not exists pto_date_rows_years_idx
on public.pto_date_rows using gin (years);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_pto_date_rows_updated_at on public.pto_date_rows;
create trigger set_pto_date_rows_updated_at
before update on public.pto_date_rows
for each row
execute function public.set_updated_at();

drop trigger if exists set_pto_settings_updated_at on public.pto_settings;
create trigger set_pto_settings_updated_at
before update on public.pto_settings
for each row
execute function public.set_updated_at();

alter table public.pto_date_rows enable row level security;
alter table public.pto_settings enable row level security;

drop policy if exists "pto_date_rows anon read" on public.pto_date_rows;
drop policy if exists "pto_date_rows anon write" on public.pto_date_rows;
drop policy if exists "pto_date_rows authenticated read" on public.pto_date_rows;
drop policy if exists "pto_date_rows authenticated write" on public.pto_date_rows;
create policy "pto_date_rows anon read"
on public.pto_date_rows
for select
to anon
using (true);

create policy "pto_date_rows anon write"
on public.pto_date_rows
for all
to anon
using (true)
with check (true);

drop policy if exists "pto_settings anon read" on public.pto_settings;
drop policy if exists "pto_settings anon write" on public.pto_settings;
drop policy if exists "pto_settings authenticated read" on public.pto_settings;
drop policy if exists "pto_settings authenticated write" on public.pto_settings;
create policy "pto_settings anon read"
on public.pto_settings
for select
to anon
using (true);

create policy "pto_settings anon write"
on public.pto_settings
for all
to anon
using (true)
with check (true);
