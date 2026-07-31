import { createClient } from "@/lib/supabase/server";
import type { BookingStatus, Channel, CommissionType } from "@/types/database";

export type PartnerPortalData = {
  channel: Channel;
  hotelName: string | null;
  totals: {
    bookings_count: number;
    revenue: number;
    commission: number;
    touchpoints_count: number;
  };
  bookings: Array<{
    id: string;
    transaction_id: string;
    booking_value: number;
    calculated_commission: number | null;
    status: BookingStatus;
    created_at: string;
  }>;
  refParam: string | null;
};

function money(value: number | string | null | undefined): number {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function extractRef(identifierKey: string): string | null {
  if (identifierKey.startsWith("ref=")) {
    return identifierKey.slice(4);
  }
  return null;
}

export async function getPartnerPortalData(): Promise<PartnerPortalData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profiles } = await supabase
    .from("partner_profiles")
    .select("channel_id")
    .eq("user_id", user.id)
    .limit(1);

  const channelId = profiles?.[0]?.channel_id;
  if (!channelId) return null;

  const { data: channel } = await supabase
    .from("channels")
    .select(
      "id, hotel_id, name, type, identifier_key, is_commissionable, commission_type, commission_value, created_at",
    )
    .eq("id", channelId)
    .maybeSingle();

  if (!channel) return null;

  let hotelName: string | null = null;
  if (channel.hotel_id) {
    const { data: hotel } = await supabase
      .from("hotels")
      .select("name")
      .eq("id", channel.hotel_id)
      .maybeSingle();
    hotelName = hotel?.name ?? null;
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, transaction_id, booking_value, calculated_commission, status, created_at",
    )
    .eq("channel_id", channelId)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(50);

  const { count: touchpointsCount } = await supabase
    .from("touchpoints")
    .select("id", { count: "exact", head: true })
    .eq("channel_id", channelId);

  const rows = bookings ?? [];
  let revenue = 0;
  let commission = 0;
  for (const row of rows) {
    revenue += money(row.booking_value);
    commission += money(row.calculated_commission);
  }

  return {
    channel: {
      ...channel,
      commission_type: channel.commission_type as CommissionType | null,
    },
    hotelName,
    totals: {
      bookings_count: rows.length,
      revenue,
      commission,
      touchpoints_count: touchpointsCount ?? 0,
    },
    bookings: rows.map((row) => ({
      id: row.id,
      transaction_id: row.transaction_id,
      booking_value: money(row.booking_value),
      calculated_commission:
        row.calculated_commission == null
          ? null
          : money(row.calculated_commission),
      status: row.status,
      created_at: row.created_at,
    })),
    refParam: extractRef(channel.identifier_key),
  };
}
