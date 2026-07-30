-- Hotel Group Attribution Engine (HGAE) — initial schema
-- hotels → channels → touchpoints / bookings

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- A. hotels
-- ---------------------------------------------------------------------------
create table public.hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  opb_version text not null check (opb_version in ('v5', 'v6')),
  created_at timestamptz not null default now()
);

comment on table public.hotels is 'Hotel properties tracked by the attribution engine';
comment on column public.hotels.opb_version is 'OnePageBooking version: v5 | v6';

-- ---------------------------------------------------------------------------
-- B. channels (sources & partners)
-- ---------------------------------------------------------------------------
create table public.channels (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid references public.hotels (id) on delete cascade,
  name text not null,
  type text not null check (
    type in ('influencer', 'ai_chat', 'newsletter', 'paid_ad', 'organic')
  ),
  identifier_key text not null,
  is_commissionable boolean not null default false,
  commission_type text check (commission_type in ('percentage', 'fixed')),
  commission_value numeric(12, 2),
  created_at timestamptz not null default now(),
  constraint channels_commission_consistency check (
    (
      is_commissionable = false
      and commission_type is null
      and commission_value is null
    )
    or (
      is_commissionable = true
      and commission_type is not null
      and commission_value is not null
      and commission_value >= 0
    )
  )
);

create unique index channels_identifier_key_uidx
  on public.channels (identifier_key);

create index channels_hotel_id_idx on public.channels (hotel_id);
create index channels_type_idx on public.channels (type);

comment on table public.channels is 'Attribution sources: influencers, AI chat, newsletter, ads, organic';
comment on column public.channels.hotel_id is 'Null = global channel usable across hotels';
comment on column public.channels.identifier_key is 'Matching key, e.g. ref=max123 or utm_source=ai_chat';

-- ---------------------------------------------------------------------------
-- C. touchpoints (clicks & pre-conversion)
-- ---------------------------------------------------------------------------
create table public.touchpoints (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels (id) on delete cascade,
  visitor_id text not null,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  landing_page_url text,
  created_at timestamptz not null default now()
);

create index touchpoints_channel_id_idx on public.touchpoints (channel_id);
create index touchpoints_visitor_id_idx on public.touchpoints (visitor_id);
create index touchpoints_created_at_idx on public.touchpoints (created_at desc);

comment on table public.touchpoints is 'Click / landing events attributed to a channel';

-- ---------------------------------------------------------------------------
-- D. bookings (conversions)
-- ---------------------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete restrict,
  channel_id uuid references public.channels (id) on delete set null,
  visitor_id text,
  transaction_id text not null,
  booking_value numeric(12, 2) not null check (booking_value >= 0),
  currency text not null default 'EUR',
  arrival_date date,
  departure_date date,
  rooms_count integer check (rooms_count is null or rooms_count >= 0),
  nights_count integer check (nights_count is null or nights_count >= 0),
  calculated_commission numeric(12, 2) check (
    calculated_commission is null or calculated_commission >= 0
  ),
  status text not null default 'pending' check (
    status in ('pending', 'verified', 'cancelled', 'paid')
  ),
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index bookings_transaction_id_uidx
  on public.bookings (transaction_id);

create index bookings_hotel_id_idx on public.bookings (hotel_id);
create index bookings_channel_id_idx on public.bookings (channel_id);
create index bookings_visitor_id_idx on public.bookings (visitor_id);
create index bookings_status_idx on public.bookings (status);
create index bookings_created_at_idx on public.bookings (created_at desc);

comment on table public.bookings is 'Completed OPB conversions with optional commission';
comment on column public.bookings.transaction_id is 'OPB booking number — unique to prevent double-counting on reload';
comment on column public.bookings.raw_payload is 'Full dataLayer / tracker payload for audit';

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.hotels enable row level security;
alter table public.channels enable row level security;
alter table public.touchpoints enable row level security;
alter table public.bookings enable row level security;

-- Service role (API routes) bypasses RLS by default.
-- Authenticated dashboard users: read hotels & channels; read bookings for their scope later.
-- Policies below are a safe baseline — tighten when Auth roles (admin / influencer) exist.

create policy "Authenticated users can read hotels"
  on public.hotels
  for select
  to authenticated
  using (true);

create policy "Authenticated users can read channels"
  on public.channels
  for select
  to authenticated
  using (true);

create policy "Authenticated users can read touchpoints"
  on public.touchpoints
  for select
  to authenticated
  using (true);

create policy "Authenticated users can read bookings"
  on public.bookings
  for select
  to authenticated
  using (true);

-- No public anon insert/select: ingestion goes through Next.js API + service role.
