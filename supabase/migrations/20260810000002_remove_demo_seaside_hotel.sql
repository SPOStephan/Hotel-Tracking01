-- Allow staff to delete hotels from the admin UI.
drop policy if exists "Staff can delete hotels" on public.hotels;
create policy "Staff can delete hotels"
  on public.hotels
  for delete
  to authenticated
  using (public.is_staff_user());

grant delete on table public.hotels to authenticated;

-- Remove seed demo hotel if still present (safe on fresh DBs / re-runs).
delete from public.bookings
where hotel_id in (
  select id
  from public.hotels
  where opb_hotel_id = 'demo-seaside'
     or id = 'a0000000-0000-4000-8000-000000000001'
);

delete from public.hotels
where opb_hotel_id = 'demo-seaside'
   or id = 'a0000000-0000-4000-8000-000000000001';
