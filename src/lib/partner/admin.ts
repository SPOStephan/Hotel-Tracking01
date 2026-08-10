import {
  startOfDayBerlin,
  startOfMonthBerlin,
} from "@/lib/clicks/periods";
import { createClient } from "@/lib/supabase/server";
import type { BookingStatus } from "@/types/database";

function money(value: number | string | null | undefined): number {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export type AdminPartnerListItem = {
  id: string;
  user_id: string;
  channel_id: string;
  email: string | null;
  display_name: string | null;
  is_active: boolean;
  created_at: string;
  website: string | null;
  social_profiles: string | null;
  notes: string | null;
  iban: string | null;
  account_holder: string | null;
  channel_name: string;
  identifier_key: string;
  hotel_id: string | null;
  hotel_name: string | null;
  all_hotels: boolean;
  commission_percent: number | null;
  commission_label: string;
  bookings_count: number;
  revenue: number;
  commission_total: number;
  clicks_count: number;
  clicks_today: number;
  clicks_month: number;
};

const PROFILE_SELECT =
  "id, user_id, channel_id, email, display_name, is_active, created_at, website, social_profiles, notes, iban, account_holder, channels(id, name, identifier_key, hotel_id, is_commissionable, commission_type, commission_value, hotels(name))";

export async function listPartnersWithStats(): Promise<AdminPartnerListItem[]> {
  const supabase = await createClient();

  const { data: profiles, error } = await supabase
    .from("partner_profiles")
    .select(PROFILE_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const items: AdminPartnerListItem[] = [];

  for (const profile of profiles ?? []) {
    const channel = profile.channels as unknown as {
      id: string;
      name: string;
      identifier_key: string;
      hotel_id: string | null;
      is_commissionable: boolean;
      commission_type: string | null;
      commission_value: number | null;
      hotels: { name: string } | null;
    } | null;

    const { data: bookings } = await supabase
      .from("bookings")
      .select("booking_value, calculated_commission, status")
      .eq("channel_id", profile.channel_id)
      .neq("status", "cancelled");

    let revenue = 0;
    let commissionTotal = 0;
    for (const row of bookings ?? []) {
      revenue += money(row.booking_value);
      commissionTotal += money(row.calculated_commission);
    }

    const todayIso = startOfDayBerlin(new Date()).toISOString();
    const monthIso = startOfMonthBerlin(new Date()).toISOString();

    const [{ count: clicksCount }, { count: clicksToday }, { count: clicksMonth }] =
      await Promise.all([
        supabase
          .from("touchpoints")
          .select("id", { count: "exact", head: true })
          .eq("channel_id", profile.channel_id),
        supabase
          .from("touchpoints")
          .select("id", { count: "exact", head: true })
          .eq("channel_id", profile.channel_id)
          .gte("created_at", todayIso),
        supabase
          .from("touchpoints")
          .select("id", { count: "exact", head: true })
          .eq("channel_id", profile.channel_id)
          .gte("created_at", monthIso),
      ]);

    let commissionLabel = "keine";
    let commissionPercent: number | null = null;
    if (channel?.is_commissionable) {
      if (channel.commission_type === "percentage") {
        commissionPercent = money(channel.commission_value);
        commissionLabel = `${channel.commission_value}\u00A0%`;
      } else {
        commissionLabel = `${channel.commission_value}\u00A0€`;
      }
    }

    const allHotels = !channel?.hotel_id;

    items.push({
      id: profile.id,
      user_id: profile.user_id,
      channel_id: profile.channel_id,
      email: profile.email,
      display_name: profile.display_name,
      is_active: profile.is_active,
      created_at: profile.created_at,
      website: profile.website,
      social_profiles: profile.social_profiles,
      notes: profile.notes,
      iban: profile.iban,
      account_holder: profile.account_holder,
      channel_name: channel?.name ?? "—",
      identifier_key: channel?.identifier_key ?? "—",
      hotel_id: channel?.hotel_id ?? null,
      hotel_name: allHotels
        ? "Alle Hotels"
        : (channel?.hotels?.name ?? null),
      all_hotels: allHotels,
      commission_percent: commissionPercent,
      commission_label: commissionLabel,
      bookings_count: (bookings ?? []).length,
      revenue,
      commission_total: commissionTotal,
      clicks_count: clicksCount ?? 0,
      clicks_today: clicksToday ?? 0,
      clicks_month: clicksMonth ?? 0,
    });
  }

  return items;
}

export type AdminPartnerDetail = AdminPartnerListItem & {
  bookings: Array<{
    id: string;
    transaction_id: string;
    booking_value: number;
    calculated_commission: number | null;
    status: BookingStatus;
    created_at: string;
  }>;
};

export async function getPartnerAdminDetail(
  partnerProfileId: string,
): Promise<AdminPartnerDetail | null> {
  const list = await listPartnersWithStats();
  const item = list.find((p) => p.id === partnerProfileId);
  if (!item) return null;

  const supabase = await createClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, transaction_id, booking_value, calculated_commission, status, created_at",
    )
    .eq("channel_id", item.channel_id)
    .order("created_at", { ascending: false })
    .limit(100);

  return {
    ...item,
    bookings: (bookings ?? []).map((row) => ({
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
  };
}
