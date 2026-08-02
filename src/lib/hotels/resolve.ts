import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Hotel, OpbVersion } from "@/types/database";

type AdminClient = SupabaseClient<Database>;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/**
 * Resolve a hotel by internal UUID or OnePageBooking hotel id/slug.
 */
export async function resolveHotel(
  supabase: AdminClient,
  hotelRef: string,
): Promise<{ hotel: Hotel | null; error: string | null }> {
  const ref = hotelRef.trim();
  if (!ref) {
    return { hotel: null, error: null };
  }

  if (isUuid(ref)) {
    const { data, error } = await supabase
      .from("hotels")
      .select("id, name, opb_version, opb_hotel_id, created_at")
      .eq("id", ref)
      .maybeSingle();

    if (error) return { hotel: null, error: error.message };
    return { hotel: (data as Hotel | null) ?? null, error: null };
  }

  const { data, error } = await supabase
    .from("hotels")
    .select("id, name, opb_version, opb_hotel_id, created_at")
    .eq("opb_hotel_id", ref)
    .maybeSingle();

  if (error) return { hotel: null, error: error.message };
  return { hotel: (data as Hotel | null) ?? null, error: null };
}

export function normalizeOpbHotelId(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidOpbHotelId(raw: string): boolean {
  return /^[a-z0-9][a-z0-9_-]{1,100}$/.test(normalizeOpbHotelId(raw));
}

export function isValidOpbVersion(value: string): value is OpbVersion {
  return value === "v5" || value === "v6";
}
