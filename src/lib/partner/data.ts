import { createClient } from "@/lib/supabase/server";
import type { BookingStatus, Channel, CommissionType } from "@/types/database";

export type PartnerHotelLinkOption = {
  id: string;
  name: string;
  website_url: string;
};

export type PartnerPortalData = {
  inactive: boolean;
  channel: Channel;
  hotelName: string | null;
  /** Prefill URL when partner is scoped to one hotel. */
  defaultWebsiteUrl: string | null;
  /** Hotels with website URLs the partner may link to (all-hotels or single). */
  hotelLinkOptions: PartnerHotelLinkOption[];
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

async function loadHotelLinkOptions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  hotelId: string | null,
): Promise<{
  hotelName: string | null;
  defaultWebsiteUrl: string | null;
  hotelLinkOptions: PartnerHotelLinkOption[];
}> {
  if (hotelId) {
    const { data: hotel } = await supabase
      .from("hotels")
      .select("id, name, website_url")
      .eq("id", hotelId)
      .maybeSingle();

    const url = hotel?.website_url?.trim() || null;
    return {
      hotelName: hotel?.name ?? null,
      defaultWebsiteUrl: url,
      hotelLinkOptions:
        hotel && url
          ? [{ id: hotel.id, name: hotel.name, website_url: url }]
          : [],
    };
  }

  const { data: hotels } = await supabase
    .from("hotels")
    .select("id, name, website_url")
    .order("name");

  const hotelLinkOptions = (hotels ?? [])
    .filter((h): h is { id: string; name: string; website_url: string } =>
      Boolean(h.website_url?.trim()),
    )
    .map((h) => ({
      id: h.id,
      name: h.name,
      website_url: h.website_url.trim(),
    }));

  return {
    hotelName: "Alle Hotels",
    defaultWebsiteUrl: hotelLinkOptions[0]?.website_url ?? null,
    hotelLinkOptions,
  };
}

export async function getPartnerPortalData(): Promise<PartnerPortalData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profiles } = await supabase
    .from("partner_profiles")
    .select("channel_id, is_active")
    .eq("user_id", user.id)
    .limit(1);

  const profile = profiles?.[0];
  if (!profile) return null;

  const channelId = profile.channel_id;

  const { data: channel } = await supabase
    .from("channels")
    .select(
      "id, hotel_id, name, type, identifier_key, is_commissionable, commission_type, commission_value, created_at",
    )
    .eq("id", channelId)
    .maybeSingle();

  if (!channel) return null;

  const hotelMeta = await loadHotelLinkOptions(supabase, channel.hotel_id);
  const refParam = extractRef(channel.identifier_key);

  if (!profile.is_active) {
    return {
      inactive: true,
      channel: {
        ...channel,
        commission_type: channel.commission_type as CommissionType | null,
      },
      hotelName: hotelMeta.hotelName,
      defaultWebsiteUrl: hotelMeta.defaultWebsiteUrl,
      hotelLinkOptions: hotelMeta.hotelLinkOptions,
      totals: {
        bookings_count: 0,
        revenue: 0,
        commission: 0,
        touchpoints_count: 0,
      },
      bookings: [],
      refParam,
    };
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
    inactive: false,
    channel: {
      ...channel,
      commission_type: channel.commission_type as CommissionType | null,
    },
    hotelName: hotelMeta.hotelName,
    defaultWebsiteUrl: hotelMeta.defaultWebsiteUrl,
    hotelLinkOptions: hotelMeta.hotelLinkOptions,
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
    refParam,
  };
}
