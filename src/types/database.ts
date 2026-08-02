export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
  raw_payload: Json;
  created_at: string;
};

export type PartnerProfile = {
  id: string;
  user_id: string;
  channel_id: string;
  created_at: string;
};

export type AppSetting = {
  key: string;
  value_bool: boolean;
  updated_at: string;
};

export const SETTING_CSV_RECONCILIATION = "csv_reconciliation_enabled";

/** Supabase generated-style Database typing used by all clients. */
export type Database = {
  public: {
    Tables: {
      hotels: {
        Row: Hotel;
        Insert: {
          id?: string;
          name: string;
          opb_version: OpbVersion;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          opb_version?: OpbVersion;
          created_at?: string;
        };
        Relationships: [];
      };
      channels: {
        Row: Channel;
        Insert: {
          id?: string;
          hotel_id?: string | null;
          name: string;
          type: ChannelType;
          identifier_key: string;
          is_commissionable?: boolean;
          commission_type?: CommissionType | null;
          commission_value?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          hotel_id?: string | null;
          name?: string;
          type?: ChannelType;
          identifier_key?: string;
          is_commissionable?: boolean;
          commission_type?: CommissionType | null;
          commission_value?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "channels_hotel_id_fkey";
            columns: ["hotel_id"];
            isOneToOne: false;
            referencedRelation: "hotels";
            referencedColumns: ["id"];
          },
        ];
      };
      partner_profiles: {
        Row: PartnerProfile;
        Insert: {
          id?: string;
          user_id: string;
          channel_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          channel_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "partner_profiles_channel_id_fkey";
            columns: ["channel_id"];
            isOneToOne: false;
            referencedRelation: "channels";
            referencedColumns: ["id"];
          },
        ];
      };
      app_settings: {
        Row: AppSetting;
        Insert: {
          key: string;
          value_bool?: boolean;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value_bool?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      touchpoints: {
        Row: Touchpoint;
        Insert: {
          id?: string;
          channel_id: string;
          visitor_id: string;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          landing_page_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          channel_id?: string;
          visitor_id?: string;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          landing_page_url?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "touchpoints_channel_id_fkey";
            columns: ["channel_id"];
            isOneToOne: false;
            referencedRelation: "channels";
            referencedColumns: ["id"];
          },
        ];
      };
      bookings: {
        Row: Booking;
        Insert: {
          id?: string;
          hotel_id: string;
          channel_id?: string | null;
          visitor_id?: string | null;
          transaction_id: string;
          booking_value: number;
          currency?: string;
          arrival_date?: string | null;
          departure_date?: string | null;
          rooms_count?: number | null;
          nights_count?: number | null;
          calculated_commission?: number | null;
          status?: BookingStatus;
          raw_payload?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          hotel_id?: string;
          channel_id?: string | null;
          visitor_id?: string | null;
          transaction_id?: string;
          booking_value?: number;
          currency?: string;
          arrival_date?: string | null;
          departure_date?: string | null;
          rooms_count?: number | null;
          nights_count?: number | null;
          calculated_commission?: number | null;
          status?: BookingStatus;
          raw_payload?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_hotel_id_fkey";
            columns: ["hotel_id"];
            isOneToOne: false;
            referencedRelation: "hotels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_channel_id_fkey";
            columns: ["channel_id"];
            isOneToOne: false;
            referencedRelation: "channels";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

/** Stable demo IDs (see supabase/seed.sql) — safe for docs & tracker tests. */
export const DEMO_HOTEL_ID = "a0000000-0000-4000-8000-000000000001";
export const DEMO_INFLUENCER_CHANNEL_ID =
  "b0000000-0000-4000-8000-000000000001";
