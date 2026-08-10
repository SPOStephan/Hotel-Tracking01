-- Website URL used to pre-fill partner tracking links.
alter table public.hotels
  add column if not exists website_url text;

comment on column public.hotels.website_url is
  'Canonical hotel website URL for partner link generation';
