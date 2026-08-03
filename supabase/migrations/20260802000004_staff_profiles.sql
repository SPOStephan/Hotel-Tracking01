-- Explicit staff role so hotel-group admins keep dashboard access
-- even if they also have a partner_profiles row (e.g. from testing).

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

-- Bootstrap: every auth user without a partner profile becomes staff
insert into public.staff_profiles (user_id)
select u.id
from auth.users u
where not exists (
  select 1 from public.partner_profiles pp where pp.user_id = u.id
)
on conflict (user_id) do nothing;

-- Staff can read own staff row (optional; mostly used via is_staff_user)
drop policy if exists "Staff can read own staff profile" on public.staff_profiles;
create policy "Staff can read own staff profile"
  on public.staff_profiles
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_staff_user());

grant select on table public.staff_profiles to authenticated;
grant all on table public.staff_profiles to service_role;

-- Replace staff RLS checks: was "not partner" → now explicit staff
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
