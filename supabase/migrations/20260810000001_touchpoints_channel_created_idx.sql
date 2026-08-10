-- Speeds up click stats filtered by channel + time range.
create index if not exists touchpoints_channel_created_at_idx
  on public.touchpoints (channel_id, created_at desc);
