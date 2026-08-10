-- Optional performance index for click statistics (day / week / month).
-- Paste into Supabase SQL Editor and Run.

create index if not exists touchpoints_channel_created_at_idx
  on public.touchpoints (channel_id, created_at desc);
