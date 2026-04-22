-- Multi-user storage for dispatcher-system.
-- Run this in Supabase SQL Editor after the basic project env variables are set.
--
-- Important:
-- The anon policies below are still a prototype access model. They make the
-- deployed app usable without login while the admin/user roles are being built.
-- Before production, replace them with authenticated role-based policies.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.vehicles (
  vehicle_id bigint primary key,
  sort_index integer not null default 0,
  visible boolean not null default true,
  category text not null default '',
  equipment_type text not null default '',
  brand text not null default '',
  model text not null default '',
  plate_number text not null default '',
  garage_number text not null default '',
  owner text not null default '',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vehicles_sort_idx
on public.vehicles (sort_index, vehicle_id);

create index if not exists vehicles_lookup_idx
on public.vehicles (category, equipment_type, brand, model, owner);

drop trigger if exists set_vehicles_updated_at on public.vehicles;
create trigger set_vehicles_updated_at
before update on public.vehicles
for each row
execute function public.set_updated_at();

create table if not exists public.pto_rows (
  table_type text not null check (table_type in ('plan', 'oper', 'survey')),
  row_id text not null,
  area text not null default '',
  location text not null default '',
  structure text not null default '',
  unit text not null default '',
  coefficient numeric not null default 0,
  status text not null default '',
  carryover numeric not null default 0,
  carryovers jsonb not null default '{}'::jsonb,
  carryover_manual_years text[] not null default '{}',
  years text[] not null default '{}',
  sort_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (table_type, row_id)
);

create table if not exists public.pto_day_values (
  table_type text not null check (table_type in ('plan', 'oper', 'survey')),
  row_id text not null,
  work_date date not null,
  value numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (table_type, row_id, work_date),
  foreign key (table_type, row_id)
    references public.pto_rows (table_type, row_id)
    on delete cascade
);

create index if not exists pto_rows_table_sort_idx
on public.pto_rows (table_type, sort_index);

create index if not exists pto_rows_area_structure_idx
on public.pto_rows (table_type, area, structure);

create index if not exists pto_rows_years_idx
on public.pto_rows using gin (years);

create index if not exists pto_day_values_date_idx
on public.pto_day_values (work_date, table_type);

drop trigger if exists set_pto_rows_updated_at on public.pto_rows;
create trigger set_pto_rows_updated_at
before update on public.pto_rows
for each row
execute function public.set_updated_at();

drop trigger if exists set_pto_day_values_updated_at on public.pto_day_values;
create trigger set_pto_day_values_updated_at
before update on public.pto_day_values
for each row
execute function public.set_updated_at();

create table if not exists public.pto_bucket_rows (
  row_key text primary key,
  area text not null default '',
  structure text not null default '',
  source text not null default 'manual',
  sort_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pto_bucket_values (
  row_key text not null references public.pto_bucket_rows (row_key) on delete cascade,
  equipment_key text not null,
  value numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (row_key, equipment_key)
);

create index if not exists pto_bucket_rows_sort_idx
on public.pto_bucket_rows (sort_index, row_key);

drop trigger if exists set_pto_bucket_rows_updated_at on public.pto_bucket_rows;
create trigger set_pto_bucket_rows_updated_at
before update on public.pto_bucket_rows
for each row
execute function public.set_updated_at();

drop trigger if exists set_pto_bucket_values_updated_at on public.pto_bucket_values;
create trigger set_pto_bucket_values_updated_at
before update on public.pto_bucket_values
for each row
execute function public.set_updated_at();

create table if not exists public.pto_settings (
  key text primary key,
  value jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_pto_settings_updated_at on public.pto_settings;
create trigger set_pto_settings_updated_at
before update on public.pto_settings
for each row
execute function public.set_updated_at();

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_app_settings_updated_at on public.app_settings;
create trigger set_app_settings_updated_at
before update on public.app_settings
for each row
execute function public.set_updated_at();

create table if not exists public.audit_logs (
  log_id bigserial primary key,
  happened_at timestamptz not null default now(),
  user_label text not null default '',
  section text not null default '',
  action text not null default '',
  details text not null default '',
  payload jsonb not null default '{}'::jsonb
);

-- One-time migration from the first prototype PTO table, if it exists.
do $$
begin
  if to_regclass('public.pto_date_rows') is not null then
    insert into public.pto_rows (
      table_type,
      row_id,
      area,
      location,
      structure,
      unit,
      coefficient,
      status,
      carryover,
      carryovers,
      carryover_manual_years,
      years,
      sort_index,
      created_at,
      updated_at
    )
    select
      table_type,
      row_id,
      area,
      location,
      structure,
      unit,
      coefficient,
      status,
      carryover,
      carryovers,
      carryover_manual_years,
      years,
      sort_index,
      created_at,
      updated_at
    from public.pto_date_rows
    on conflict (table_type, row_id) do nothing;

    insert into public.pto_day_values (table_type, row_id, work_date, value)
    select
      rows.table_type,
      rows.row_id,
      day_value.key::date,
      day_value.value::numeric
    from public.pto_date_rows rows
    cross join lateral jsonb_each_text(rows.daily_plans) as day_value(key, value)
    where day_value.key ~ '^\d{4}-\d{2}-\d{2}$'
    on conflict (table_type, row_id, work_date) do nothing;
  end if;
end $$;

alter table public.vehicles enable row level security;
alter table public.pto_rows enable row level security;
alter table public.pto_day_values enable row level security;
alter table public.pto_bucket_rows enable row level security;
alter table public.pto_bucket_values enable row level security;
alter table public.pto_settings enable row level security;
alter table public.app_settings enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "vehicles anon read" on public.vehicles;
drop policy if exists "vehicles anon write" on public.vehicles;
create policy "vehicles anon read" on public.vehicles for select to anon using (true);
create policy "vehicles anon write" on public.vehicles for all to anon using (true) with check (true);

drop policy if exists "pto_rows anon read" on public.pto_rows;
drop policy if exists "pto_rows anon write" on public.pto_rows;
create policy "pto_rows anon read" on public.pto_rows for select to anon using (true);
create policy "pto_rows anon write" on public.pto_rows for all to anon using (true) with check (true);

drop policy if exists "pto_day_values anon read" on public.pto_day_values;
drop policy if exists "pto_day_values anon write" on public.pto_day_values;
create policy "pto_day_values anon read" on public.pto_day_values for select to anon using (true);
create policy "pto_day_values anon write" on public.pto_day_values for all to anon using (true) with check (true);

drop policy if exists "pto_bucket_rows anon read" on public.pto_bucket_rows;
drop policy if exists "pto_bucket_rows anon write" on public.pto_bucket_rows;
create policy "pto_bucket_rows anon read" on public.pto_bucket_rows for select to anon using (true);
create policy "pto_bucket_rows anon write" on public.pto_bucket_rows for all to anon using (true) with check (true);

drop policy if exists "pto_bucket_values anon read" on public.pto_bucket_values;
drop policy if exists "pto_bucket_values anon write" on public.pto_bucket_values;
create policy "pto_bucket_values anon read" on public.pto_bucket_values for select to anon using (true);
create policy "pto_bucket_values anon write" on public.pto_bucket_values for all to anon using (true) with check (true);

drop policy if exists "pto_settings anon read" on public.pto_settings;
drop policy if exists "pto_settings anon write" on public.pto_settings;
create policy "pto_settings anon read" on public.pto_settings for select to anon using (true);
create policy "pto_settings anon write" on public.pto_settings for all to anon using (true) with check (true);

drop policy if exists "app_settings anon read" on public.app_settings;
drop policy if exists "app_settings anon write" on public.app_settings;
create policy "app_settings anon read" on public.app_settings for select to anon using (true);
create policy "app_settings anon write" on public.app_settings for all to anon using (true) with check (true);

drop policy if exists "audit_logs anon read" on public.audit_logs;
drop policy if exists "audit_logs anon write" on public.audit_logs;
create policy "audit_logs anon read" on public.audit_logs for select to anon using (true);
create policy "audit_logs anon write" on public.audit_logs for insert to anon with check (true);
