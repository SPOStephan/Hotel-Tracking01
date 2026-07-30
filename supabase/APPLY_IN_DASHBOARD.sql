-- =============================================================================
-- HGAE — einmaliges Schema + Demo-Daten für dein Supabase-Projekt
-- =============================================================================
-- So anwenden:
-- 1. https://supabase.com/dashboard/project/lkqopssstvtekneycpgh/sql/new
-- 2. Gesamten Inhalt dieser Datei einfügen
-- 3. Run / Ausführen
--
-- Idempotent genug für einen ersten Apply. Bei Neuaufbau: Projekt-Reset
-- oder Tabellen manuell droppen, dann erneut ausführen.
-- =============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  opb_version text not null check (opb_version in ('v5', 'v6')),
  created_at timestamptz not null default now()
);

create table if not exists public.channels (
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

create unique index if not exists channels_identifier_key_uidx
  on public.channels (identifier_key);

create index if not exists channels_hotel_id_idx on public.channels (hotel_id);
create index if not exists channels_type_idx on public.channels (type);

create table if not exists public.touchpoints (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels (id) on delete cascade,
  visitor_id text not null,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  landing_page_url text,
  created_at timestamptz not null default now()
);

create index if not exists touchpoints_channel_id_idx on public.touchpoints (channel_id);
create index if not exists touchpoints_visitor_id_idx on public.touchpoints (visitor_id);
create index if not exists touchpoints_created_at_idx on public.touchpoints (created_at desc);

create table if not exists public.bookings (
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

create unique index if not exists bookings_transaction_id_uidx
  on public.bookings (transaction_id);

create index if not exists bookings_hotel_id_idx on public.bookings (hotel_id);
create index if not exists bookings_channel_id_idx on public.bookings (channel_id);
create index if not exists bookings_visitor_id_idx on public.bookings (visitor_id);
create index if not exists bookings_status_idx on public.bookings (status);
create index if not exists bookings_created_at_idx on public.bookings (created_at desc);

alter table public.hotels enable row level security;
alter table public.channels enable row level security;
alter table public.touchpoints enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "Authenticated users can read hotels" on public.hotels;
create policy "Authenticated users can read hotels"
  on public.hotels for select to authenticated using (true);

drop policy if exists "Authenticated users can read channels" on public.channels;
create policy "Authenticated users can read channels"
  on public.channels for select to authenticated using (true);

drop policy if exists "Authenticated users can read touchpoints" on public.touchpoints;
create policy "Authenticated users can read touchpoints"
  on public.touchpoints for select to authenticated using (true);

drop policy if exists "Authenticated users can read bookings" on public.bookings;
create policy "Authenticated users can read bookings"
  on public.bookings for select to authenticated using (true);

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

-- Demo data -----------------------------------------------------------------

insert into public.hotels (id, name, opb_version)
values (
  'a0000000-0000-4000-8000-000000000001',
  'Boutique Hotel Seaside',
  'v6'
)
on conflict (id) do update
set name = excluded.name, opb_version = excluded.opb_version;

insert into public.channels (
  id, hotel_id, name, type, identifier_key,
  is_commissionable, commission_type, commission_value
)
values
  (
    'b0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'Max Mustermann', 'influencer', 'ref=max123',
    true, 'percentage', 10.00
  ),
  (
    'b0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001',
    'KI-Chatbot', 'ai_chat', 'utm_source=ai_chat',
    false, null, null
  ),
  (
    'b0000000-0000-4000-8000-000000000003',
    'a0000000-0000-4000-8000-000000000001',
    'Juli Newsletter', 'newsletter', 'utm_source=newsletter',
    false, null, null
  )
on conflict (identifier_key) do update
set
  hotel_id = excluded.hotel_id,
  name = excluded.name,
  type = excluded.type,
  is_commissionable = excluded.is_commissionable,
  commission_type = excluded.commission_type,
  commission_value = excluded.commission_value;
