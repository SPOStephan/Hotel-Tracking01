-- =============================================================================
-- HGAE — Demo-Hotel „Boutique Hotel Seaside“ (demo-seaside) entfernen
-- =============================================================================
-- 1. https://supabase.com/dashboard/project/lkqopssstvtekneycpgh/sql/new
-- 2. Gesamten Inhalt einfügen → Run
--
-- Löscht das Testhotel inkl. zugehöriger Buchungen.
-- Hotel-gebundene Kanäle (und deren Touchpoints / Partner-Profile) fallen
-- per ON DELETE CASCADE mit weg.
-- =============================================================================

-- Staff darf Hotels löschen (für Admin-UI)
drop policy if exists "Staff can delete hotels" on public.hotels;
create policy "Staff can delete hotels"
  on public.hotels
  for delete
  to authenticated
  using (public.is_staff_user());

grant delete on table public.hotels to authenticated;

-- Buchungen zuerst (FK hotels ← bookings ist ON DELETE RESTRICT)
delete from public.bookings
where hotel_id in (
  select id
  from public.hotels
  where opb_hotel_id = 'demo-seaside'
     or id = 'a0000000-0000-4000-8000-000000000001'
);

-- Hotel selbst
delete from public.hotels
where opb_hotel_id = 'demo-seaside'
   or id = 'a0000000-0000-4000-8000-000000000001';
