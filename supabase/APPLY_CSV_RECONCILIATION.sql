-- =============================================================================
-- HGAE — Optionaler CSV-Abgleich (Settings + Staff Booking Update)
-- =============================================================================
-- 1. https://supabase.com/dashboard/project/lkqopssstvtekneycpgh/sql/new
-- 2. Gesamten Inhalt einfügen → Run
-- =============================================================================

create table if not exists public.app_settings (
  key text primary key,
  value_bool boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value_bool)
values ('csv_reconciliation_enabled', false)
on conflict (key) do nothing;

alter table public.app_settings enable row level security;

drop policy if exists "Staff can read app settings" on public.app_settings;
drop policy if exists "Staff can update app settings" on public.app_settings;
drop policy if exists "Staff can update bookings" on public.bookings;

create policy "Staff can read app settings"
  on public.app_settings
  for select
  to authenticated
  using (not public.is_partner_user());

create policy "Staff can update app settings"
  on public.app_settings
  for update
  to authenticated
  using (not public.is_partner_user())
  with check (not public.is_partner_user());

create policy "Staff can update bookings"
  on public.bookings
  for update
  to authenticated
  using (not public.is_partner_user())
  with check (not public.is_partner_user());

grant select, update on table public.app_settings to authenticated;
grant all on table public.app_settings to service_role;
