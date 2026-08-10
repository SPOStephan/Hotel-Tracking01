-- =============================================================================
-- HGAE — Website-URL pro Hotel (für vorausgefüllte Partner-Links)
-- =============================================================================
-- 1. https://supabase.com/dashboard/project/lkqopssstvtekneycpgh/sql/new
-- 2. Gesamten Inhalt einfügen → Run
-- 3. Danach unter /dashboard/hotels die URL je Hotel eintragen
-- =============================================================================

alter table public.hotels
  add column if not exists website_url text;

comment on column public.hotels.website_url is
  'Canonical hotel website URL for partner link generation';
