import { createClient } from "@/lib/supabase/server";
import type { BookingStatus, ChannelType } from "@/types/database";

export type DashboardHotel = {
  id: string;
  name: string;
  opb_hotel_id: string | null;
};

export type ChannelBreakdownRow = {
  channel_id: string | null;
  channel_name: string;
  channel_type: ChannelType | "unassigned";
  bookings_count: number;
  revenue: number;
  commission: number;
};

export type RecentBookingRow = {
  id: string;
  transaction_id: string;
  booking_value: number;
  calculated_commission: number | null;
  status: BookingStatus;
  created_at: string;
  channel_name: string;
  hotel_name: string;
};

export type DashboardMetrics = {
  hotels: DashboardHotel[];
  selectedHotelId: string | null;
  totals: {
    bookings_count: number;
    revenue: number;
    commission: number;
    touchpoints_count: number;
  };
  byChannel: ChannelBreakdownRow[];
  recentBookings: RecentBookingRow[];
};

function money(value: number | string | null | undefined): number {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export async function getDashboardMetrics(
  hotelId: string | null,
): Promise<DashboardMetrics> {
  const supabase = await createClient();

  const { data: hotels } = await supabase
    .from("hotels")
    .select("id, name, opb_hotel_id")
    .order("name");

  let bookingsQuery = supabase
    .from("bookings")
    .select(
      "id, hotel_id, channel_id, transaction_id, booking_value, calculated_commission, status, created_at, channels(name, type), hotels(name)",
    )
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  if (hotelId) {
    bookingsQuery = bookingsQuery.eq("hotel_id", hotelId);
  }

  const { data: bookings, error: bookingsError } = await bookingsQuery;
  if (bookingsError) {
    throw new Error(bookingsError.message);
  }

  const channelIds = [
    ...new Set(
      (bookings ?? [])
        .map((b) => b.channel_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  let touchpointsCount = 0;
  if (channelIds.length > 0) {
    let tpQuery = supabase
      .from("touchpoints")
      .select("id", { count: "exact", head: true })
      .in("channel_id", channelIds);
    // Touchpoints are channel-scoped; hotel filter already limited channels via bookings.
    // For hotel-specific touchpoint counts when hotel selected but no bookings yet,
    // also count via hotel channels:
    if (hotelId) {
      const { data: hotelChannels } = await supabase
        .from("channels")
        .select("id")
        .or(`hotel_id.eq.${hotelId},hotel_id.is.null`);
      const ids = (hotelChannels ?? []).map((c) => c.id);
      if (ids.length > 0) {
        tpQuery = supabase
          .from("touchpoints")
          .select("id", { count: "exact", head: true })
          .in("channel_id", ids);
      }
    }
    const { count } = await tpQuery;
    touchpointsCount = count ?? 0;
  } else if (hotelId) {
    const { data: hotelChannels } = await supabase
      .from("channels")
      .select("id")
      .or(`hotel_id.eq.${hotelId},hotel_id.is.null`);
    const ids = (hotelChannels ?? []).map((c) => c.id);
    if (ids.length > 0) {
      const { count } = await supabase
        .from("touchpoints")
        .select("id", { count: "exact", head: true })
        .in("channel_id", ids);
      touchpointsCount = count ?? 0;
    }
  } else {
    const { count } = await supabase
      .from("touchpoints")
      .select("id", { count: "exact", head: true });
    touchpointsCount = count ?? 0;
  }

  type BookingJoin = {
    id: string;
    hotel_id: string;
    channel_id: string | null;
    transaction_id: string;
    booking_value: number | string;
    calculated_commission: number | string | null;
    status: BookingStatus;
    created_at: string;
    channels: { name: string; type: ChannelType } | null;
    hotels: { name: string } | null;
  };

  const rows = (bookings ?? []) as unknown as BookingJoin[];

  const byChannelMap = new Map<string, ChannelBreakdownRow>();
  let revenue = 0;
  let commission = 0;

  for (const row of rows) {
    const value = money(row.booking_value);
    const comm = money(row.calculated_commission);
    revenue += value;
    commission += comm;

    const key = row.channel_id ?? "unassigned";
    const existing = byChannelMap.get(key);
    if (existing) {
      existing.bookings_count += 1;
      existing.revenue += value;
      existing.commission += comm;
    } else {
      byChannelMap.set(key, {
        channel_id: row.channel_id,
        channel_name: row.channels?.name ?? "Nicht zugeordnet",
        channel_type: row.channels?.type ?? "unassigned",
        bookings_count: 1,
        revenue: value,
        commission: comm,
      });
    }
  }

  const byChannel = [...byChannelMap.values()].sort(
    (a, b) => b.revenue - a.revenue,
  );

  const recentBookings: RecentBookingRow[] = rows.slice(0, 15).map((row) => ({
    id: row.id,
    transaction_id: row.transaction_id,
    booking_value: money(row.booking_value),
    calculated_commission:
      row.calculated_commission == null
        ? null
        : money(row.calculated_commission),
    status: row.status,
    created_at: row.created_at,
    channel_name: row.channels?.name ?? "—",
    hotel_name: row.hotels?.name ?? "—",
  }));

  return {
    hotels: hotels ?? [],
    selectedHotelId: hotelId,
    totals: {
      bookings_count: rows.length,
      revenue,
      commission,
      touchpoints_count: touchpointsCount,
    },
    byChannel,
    recentBookings,
  };
}
