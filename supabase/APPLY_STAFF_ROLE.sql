-- =============================================================================
-- HGAE — Staff-Rolle (Admin behält Dashboard, auch mit Partner-Testprofil)
-- =============================================================================
-- 1. https://supabase.com/dashboard/project/lkqopssstvtekneycpgh/sql/new
-- 2. Gesamten Inhalt einfügen → Run
-- 3. Am Ende: DEINE Admin-E-Mail eintragen und den markierten Block ausführen
-- =============================================================================

create table if not exists public.staff_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.staff_profiles is
  'Hotel-group admin users. Staff keeps full dashboard access.';

alter table public.staff_profiles enable row level security;

create or replace function public.is_staff_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  -- Explizites Staff-Profil ODER (legacy) eingeloggt ohne Partner-Profil
  select
    auth.uid() is not null
    and (
      exists (
        select 1 from public.staff_profiles where user_id = auth.uid()
      )
      or not exists (
        select 1 from public.partner_profiles where user_id = auth.uid()
      )
    );
$$;

revoke all on function public.is_staff_user() from public;
grant execute on function public.is_staff_user() to authenticated;

-- Einmalige Übernahme alter Staff-User (kein Partner-Profil).
-- ACHTUNG: Bei erneutem Ausführen würden ALLE Auth-User ohne Partner-Profil
-- wieder zu Staff. Für neue Admins gezielt einfügen, z. B.:
--   insert into public.staff_profiles (user_id)
--   select id from auth.users where email = 'admin@example.com'
--   on conflict (user_id) do nothing;
insert into public.staff_profiles (user_id)
select u.id
from auth.users u
where not exists (
  select 1 from public.partner_profiles pp where pp.user_id = u.id
)
on conflict (user_id) do nothing;

drop policy if exists "Staff can read own staff profile" on public.staff_profiles;
create policy "Staff can read own staff profile"
  on public.staff_profiles
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_staff_user());

grant select on table public.staff_profiles to authenticated;
grant all on table public.staff_profiles to service_role;

-- Staff-Policies: explizit is_staff_user() statt "kein Partner"
drop policy if exists "Staff can read hotels" on public.hotels;
drop policy if exists "Staff can insert hotels" on public.hotels;
drop policy if exists "Staff can update hotels" on public.hotels;
drop policy if exists "Staff can read channels" on public.channels;
drop policy if exists "Staff can insert channels" on public.channels;
drop policy if exists "Staff can update channels" on public.channels;
drop policy if exists "Staff can read touchpoints" on public.touchpoints;
drop policy if exists "Staff can read bookings" on public.bookings;
drop policy if exists "Staff can update bookings" on public.bookings;
drop policy if exists "Staff can read partner profiles" on public.partner_profiles;
drop policy if exists "Staff can insert partner profiles" on public.partner_profiles;
drop policy if exists "Staff can update partner profiles" on public.partner_profiles;
drop policy if exists "Staff can read app settings" on public.app_settings;
drop policy if exists "Staff can update app settings" on public.app_settings;

create policy "Staff can read hotels"
  on public.hotels for select to authenticated
  using (public.is_staff_user());

create policy "Staff can insert hotels"
  on public.hotels for insert to authenticated
  with check (public.is_staff_user());

create policy "Staff can update hotels"
  on public.hotels for update to authenticated
  using (public.is_staff_user())
  with check (public.is_staff_user());

create policy "Staff can read channels"
  on public.channels for select to authenticated
  using (public.is_staff_user());

create policy "Staff can insert channels"
  on public.channels for insert to authenticated
  with check (public.is_staff_user());

create policy "Staff can update channels"
  on public.channels for update to authenticated
  using (public.is_staff_user())
  with check (public.is_staff_user());

create policy "Staff can read touchpoints"
  on public.touchpoints for select to authenticated
  using (public.is_staff_user());

create policy "Staff can read bookings"
  on public.bookings for select to authenticated
  using (public.is_staff_user());

create policy "Staff can update bookings"
  on public.bookings for update to authenticated
  using (public.is_staff_user())
  with check (public.is_staff_user());

create policy "Staff can read partner profiles"
  on public.partner_profiles for select to authenticated
  using (public.is_staff_user());

create policy "Staff can insert partner profiles"
  on public.partner_profiles for insert to authenticated
  with check (public.is_staff_user());

create policy "Staff can update partner profiles"
  on public.partner_profiles for update to authenticated
  using (public.is_staff_user())
  with check (public.is_staff_user());

create policy "Staff can read app settings"
  on public.app_settings for select to authenticated
  using (public.is_staff_user());

create policy "Staff can update app settings"
  on public.app_settings for update to authenticated
  using (public.is_staff_user())
  with check (public.is_staff_user());

-- =============================================================================
-- WICHTIG: Deine Admin-E-Mail hier eintragen und diesen Block mit ausführen
-- (nötig, wenn der Admin-Account versehentlich ein Partner-Profil hat)
-- =============================================================================
insert into public.staff_profiles (user_id)
select id
from auth.users
where lower(email) = lower('HIER-ADMIN-EMAIL@eintragen.de')
on conflict (user_id) do nothing;
