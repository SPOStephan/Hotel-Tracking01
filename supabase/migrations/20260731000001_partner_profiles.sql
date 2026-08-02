-- Partner portal: map auth users → channels (influencers / affiliates)

create table public.partner_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  channel_id uuid not null references public.channels (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint partner_profiles_user_channel_uidx unique (user_id, channel_id)
);

create index partner_profiles_user_id_idx on public.partner_profiles (user_id);
create index partner_profiles_channel_id_idx on public.partner_profiles (channel_id);

comment on table public.partner_profiles is 'Links Supabase Auth users to influencer/affiliate channels';

alter table public.partner_profiles enable row level security;

create or replace function public.is_partner_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.partner_profiles where user_id = auth.uid()
  );
$$;

revoke all on function public.is_partner_user() from public;
grant execute on function public.is_partner_user() to authenticated;

-- ---------------------------------------------------------------------------
-- Replace broad authenticated read policies with staff vs partner scopes.
-- Staff = authenticated user WITHOUT a partner_profiles row.
-- Partner = only their linked channel(s).
-- ---------------------------------------------------------------------------

drop policy if exists "Authenticated users can read hotels" on public.hotels;
drop policy if exists "Authenticated users can read channels" on public.channels;
drop policy if exists "Authenticated users can read touchpoints" on public.touchpoints;
drop policy if exists "Authenticated users can read bookings" on public.bookings;

create policy "Staff can read hotels"
  on public.hotels
  for select
  to authenticated
  using (not public.is_partner_user());

create policy "Partners can read linked hotels"
  on public.hotels
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.partner_profiles pp
      join public.channels c on c.id = pp.channel_id
      where pp.user_id = auth.uid()
        and (c.hotel_id = hotels.id or c.hotel_id is null)
    )
  );

create policy "Staff can read channels"
  on public.channels
  for select
  to authenticated
  using (not public.is_partner_user());

create policy "Partners can read own channels"
  on public.channels
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.partner_profiles pp
      where pp.user_id = auth.uid()
        and pp.channel_id = channels.id
    )
  );

create policy "Staff can read touchpoints"
  on public.touchpoints
  for select
  to authenticated
  using (not public.is_partner_user());

create policy "Partners can read own touchpoints"
  on public.touchpoints
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.partner_profiles pp
      where pp.user_id = auth.uid()
        and pp.channel_id = touchpoints.channel_id
    )
  );

create policy "Staff can read bookings"
  on public.bookings
  for select
  to authenticated
  using (not public.is_partner_user());

create policy "Partners can read own bookings"
  on public.bookings
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.partner_profiles pp
      where pp.user_id = auth.uid()
        and pp.channel_id = bookings.channel_id
    )
  );

create policy "Partners can read own profiles"
  on public.partner_profiles
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Staff can read partner profiles"
  on public.partner_profiles
  for select
  to authenticated
  using (not public.is_partner_user());

grant select on table public.partner_profiles to authenticated;
grant all on table public.partner_profiles to service_role;
