-- Optional CSV reconciliation feature flag + staff booking updates

create table public.app_settings (
  key text primary key,
  value_bool boolean not null default false,
  updated_at timestamptz not null default now()
);

comment on table public.app_settings is 'Global feature flags / admin settings';

insert into public.app_settings (key, value_bool)
values ('csv_reconciliation_enabled', false)
on conflict (key) do nothing;

alter table public.app_settings enable row level security;

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

-- Staff may update booking status during CSV reconciliation
create policy "Staff can update bookings"
  on public.bookings
  for update
  to authenticated
  using (not public.is_partner_user())
  with check (not public.is_partner_user());

grant select, update on table public.app_settings to authenticated;
grant all on table public.app_settings to service_role;
