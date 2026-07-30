import { buildChannelLookupKeys } from "@/lib/conversions/schema";
import type { Channel } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type AdminClient = SupabaseClient<Database>;

/**
 * Match a channel by identifier_key candidates.
 * Prefers hotel-specific channels over global; respects lookup key order.
 */
export async function matchChannel(
  supabase: AdminClient,
  input: {
    hotel_id?: string | null;
    channel_identifier?: string | null;
    ref?: string | null;
    utm_source?: string | null;
  },
): Promise<{ channel: Channel | null; error: string | null }> {
  const lookupKeys = buildChannelLookupKeys({
    channel_identifier: input.channel_identifier,
    ref: input.ref,
    utm_source: input.utm_source,
  });

  if (lookupKeys.length === 0) {
    return { channel: null, error: null };
  }

  const { data: channels, error } = await supabase
    .from("channels")
    .select(
      "id, hotel_id, name, type, identifier_key, is_commissionable, commission_type, commission_value, created_at",
    )
    .in("identifier_key", lookupKeys);

  if (error) {
    return { channel: null, error: error.message };
  }

  const ranked = (channels ?? [])
    .filter(
      (row) =>
        row.hotel_id === null ||
        !input.hotel_id ||
        row.hotel_id === input.hotel_id,
    )
    .sort((a, b) => {
      const ai = lookupKeys.indexOf(a.identifier_key);
      const bi = lookupKeys.indexOf(b.identifier_key);
      if (ai !== bi) return ai - bi;
      if (a.hotel_id && !b.hotel_id) return -1;
      if (!a.hotel_id && b.hotel_id) return 1;
      return 0;
    });

  return { channel: (ranked[0] as Channel | undefined) ?? null, error: null };
}
