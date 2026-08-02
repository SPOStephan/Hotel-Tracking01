-- Hotels: OPB hotel identifier + staff write access

alter table public.hotels
  add column if not exists opb_hotel_id text;

-- Normalize existing rows may be null; unique among non-null
create unique index if not exists hotels_opb_hotel_id_uidx
  on public.hotels (opb_hotel_id)
  where opb_hotel_id is not null;

comment on column public.hotels.opb_hotel_id is 'OnePageBooking hotel key/slug, e.g. lohbeckambassador';

-- Demo hotel: keep UUID, attach a demo OPB id if empty
update public.hotels
set opb_hotel_id = 'demo-seaside'
where id = 'a0000000-0000-4000-8000-000000000001'
  and opb_hotel_id is null;

-- Real first hotel (idempotent)
insert into public.hotels (id, name, opb_version, opb_hotel_id)
values (
  'a0000000-0000-4000-8000-000000000002',
  'Lohbeck Ambassador',
  'v6',
  'lohbeckambassador'
)
on conflict (id) do update
set
  name = excluded.name,
  opb_version = excluded.opb_version,
  opb_hotel_id = excluded.opb_hotel_id;

-- Staff can create/update hotels in the dashboard
drop policy if exists "Staff can insert hotels" on public.hotels;
drop policy if exists "Staff can update hotels" on public.hotels;

create policy "Staff can insert hotels"
  on public.hotels
  for insert
  to authenticated
  with check (not public.is_partner_user());

create policy "Staff can update hotels"
  on public.hotels
  for update
  to authenticated
  using (not public.is_partner_user())
  with check (not public.is_partner_user());

grant insert, update on table public.hotels to authenticated;
