-- Demo seed for HGAE (safe to re-run: upserts by fixed IDs / identifier_key)
-- Demo hotel UUID is also exported as DEMO_HOTEL_ID in the app.

insert into public.hotels (id, name, opb_version, opb_hotel_id)
values (
  'a0000000-0000-4000-8000-000000000001',
  'Boutique Hotel Seaside',
  'v6',
  'demo-seaside'
)
on conflict (id) do update
set
  name = excluded.name,
  opb_version = excluded.opb_version,
  opb_hotel_id = excluded.opb_hotel_id;

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

insert into public.channels (
  id,
  hotel_id,
  name,
  type,
  identifier_key,
  is_commissionable,
  commission_type,
  commission_value
)
values
  (
    'b0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'Max Mustermann',
    'influencer',
    'ref=max123',
    true,
    'percentage',
    10.00
  ),
  (
    'b0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001',
    'KI-Chatbot',
    'ai_chat',
    'utm_source=ai_chat',
    false,
    null,
    null
  ),
  (
    'b0000000-0000-4000-8000-000000000003',
    'a0000000-0000-4000-8000-000000000001',
    'Juli Newsletter',
    'newsletter',
    'utm_source=newsletter',
    false,
    null,
    null
  )
on conflict (identifier_key) do update
set
  hotel_id = excluded.hotel_id,
  name = excluded.name,
  type = excluded.type,
  is_commissionable = excluded.is_commissionable,
  commission_type = excluded.commission_type,
  commission_value = excluded.commission_value;
