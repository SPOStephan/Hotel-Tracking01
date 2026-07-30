-- Grants so service_role / authenticated can use the public tables via the API.
-- Safe to re-run.

grant usage on schema public to postgres, anon, authenticated, service_role;

grant select on table public.hotels to authenticated;
grant select on table public.channels to authenticated;
grant select on table public.touchpoints to authenticated;
grant select on table public.bookings to authenticated;

grant all on table public.hotels to service_role;
grant all on table public.channels to service_role;
grant all on table public.touchpoints to service_role;
grant all on table public.bookings to service_role;

grant usage, select on all sequences in schema public to service_role;
