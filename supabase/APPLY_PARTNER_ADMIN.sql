-- =============================================================================
-- HGAE — Partner-Admin (Freischalten + Staff darf Partner/Channels schreiben)
-- =============================================================================
-- 1. https://supabase.com/dashboard/project/lkqopssstvtekneycpgh/sql/new
-- 2. Gesamten Inhalt einfügen → Run
-- =============================================================================

alter table public.partner_profiles
  add column if not exists is_active boolean not null default true;

alter table public.partner_profiles
  add column if not exists email text;

alter table public.partner_profiles
  add column if not exists display_name text;

create index if not exists partner_profiles_email_idx
  on public.partner_profiles (email);

drop policy if exists "Staff can insert partner profiles" on public.partner_profiles;
drop policy if exists "Staff can update partner profiles" on public.partner_profiles;
drop policy if exists "Staff can insert channels" on public.channels;
drop policy if exists "Staff can update channels" on public.channels;
drop policy if exists "Partners can read own profiles" on public.partner_profiles;

create policy "Staff can insert partner profiles"
  on public.partner_profiles
  for insert
  to authenticated
  with check (not public.is_partner_user());

create policy "Staff can update partner profiles"
  on public.partner_profiles
  for update
  to authenticated
  using (not public.is_partner_user())
  with check (not public.is_partner_user());

create policy "Staff can insert channels"
  on public.channels
  for insert
  to authenticated
  with check (not public.is_partner_user());

create policy "Staff can update channels"
  on public.channels
  for update
  to authenticated
  using (not public.is_partner_user())
  with check (not public.is_partner_user());

create policy "Partners can read own profiles"
  on public.partner_profiles
  for select
  to authenticated
  using (user_id = auth.uid());

grant insert, update on table public.partner_profiles to authenticated;
grant insert, update on table public.channels to authenticated;
