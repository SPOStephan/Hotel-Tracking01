-- =============================================================================
-- HGAE — Partner-Stammdaten & Auszahlung (optional)
-- =============================================================================
-- 1. https://supabase.com/dashboard/project/lkqopssstvtekneycpgh/sql/new
-- 2. Gesamten Inhalt einfügen → Run
-- =============================================================================

alter table public.partner_profiles
  add column if not exists website text;

alter table public.partner_profiles
  add column if not exists social_profiles text;

alter table public.partner_profiles
  add column if not exists notes text;

alter table public.partner_profiles
  add column if not exists iban text;

alter table public.partner_profiles
  add column if not exists account_holder text;

comment on column public.partner_profiles.website is 'Optional partner website URL';
comment on column public.partner_profiles.social_profiles is 'Optional social profile URLs/handles (free text)';
comment on column public.partner_profiles.notes is 'Optional free-text notes for hotel-group admins';
comment on column public.partner_profiles.iban is 'Optional payout IBAN';
comment on column public.partner_profiles.account_holder is 'Optional payout account holder name';
