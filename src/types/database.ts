export type OpbVersion = "v5" | "v6";

export type ChannelType =
  | "influencer"
  | "ai_chat"
  | "newsletter"
  | "paid_ad"
  | "organic";

export type CommissionType = "percentage" | "fixed";

export type BookingStatus = "pending" | "verified" | "cancelled" | "paid";

export type Hotel = {
  id: string;
  name: string;
  opb_version: OpbVersion;
  created_at: string;
};

export type Channel = {
  id: string;
  hotel_id: string | null;
  name: string;
  type: ChannelType;
  identifier_key: string;
  is_commissionable: boolean;
  commission_type: CommissionType | null;
  commission_value: number | null;
  created_at: string;
};

export type Touchpoint = {
  id: string;
  channel_id: string;
  visitor_id: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  landing_page_url: string | null;
  created_at: string;
};

export type Booking = {
  id: string;
  hotel_id: string;
  channel_id: string | null;
  visitor_id: string | null;
  transaction_id: string;
  booking_value: number;
  currency: string;
  arrival_date: string | null;
  departure_date: string | null;
  rooms_count: number | null;
  nights_count: number | null;
  calculated_commission: number | null;
  status: BookingStatus;
  raw_payload: Record<string, unknown>;
  created_at: string;
};
