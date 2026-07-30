import {
  buildChannelLookupKeys,
  conversionRequestSchema,
} from "@/lib/conversions/schema";
import { calculateCommission } from "@/lib/conversions/calculate-commission";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Channel } from "@/types/database";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("origin") ?? "*";
  const allowed = process.env.HGAE_CORS_ORIGINS ?? "*";
  const allowOrigin =
    allowed === "*" || allowed.split(",").map((s) => s.trim()).includes(origin)
      ? allowed === "*"
        ? origin === "null"
          ? "*"
          : origin
        : origin
      : allowed.split(",")[0]?.trim() || "*";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

export async function POST(request: Request) {
  const headers = corsHeaders(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400, headers },
    );
  }

  const parsed = conversionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Validation failed",
        details: parsed.error.flatten(),
      },
      { status: 400, headers },
    );
  }

  const input = parsed.data;

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (error) {
    console.error("[conversions] supabase config error", error);
    return NextResponse.json(
      { ok: false, error: "Server configuration error" },
      { status: 500, headers },
    );
  }

  // Deduplicate: transaction_id must be unique
  const { data: existing, error: existingError } = await supabase
    .from("bookings")
    .select("id, transaction_id, status")
    .eq("transaction_id", input.transaction_id)
    .maybeSingle();

  if (existingError) {
    console.error("[conversions] dedupe lookup failed", existingError);
    return NextResponse.json(
      { ok: false, error: "Database error during deduplication" },
      { status: 500, headers },
    );
  }

  if (existing) {
    return NextResponse.json(
      {
        ok: true,
        duplicate: true,
        booking_id: existing.id,
        transaction_id: existing.transaction_id,
        status: existing.status,
      },
      { status: 200, headers },
    );
  }

  // Ensure hotel exists
  const { data: hotel, error: hotelError } = await supabase
    .from("hotels")
    .select("id")
    .eq("id", input.hotel_id)
    .maybeSingle();

  if (hotelError) {
    console.error("[conversions] hotel lookup failed", hotelError);
    return NextResponse.json(
      { ok: false, error: "Database error during hotel lookup" },
      { status: 500, headers },
    );
  }

  if (!hotel) {
    return NextResponse.json(
      { ok: false, error: "Unknown hotel_id" },
      { status: 404, headers },
    );
  }

  const lookupKeys = buildChannelLookupKeys({
    channel_identifier: input.channel_identifier,
    ref: input.ref,
    utm_source: input.utm_source,
  });

  let channel: Channel | null = null;

  if (lookupKeys.length > 0) {
    const { data: channels, error: channelError } = await supabase
      .from("channels")
      .select(
        "id, hotel_id, name, type, identifier_key, is_commissionable, commission_type, commission_value, created_at",
      )
      .in("identifier_key", lookupKeys);

    if (channelError) {
      console.error("[conversions] channel lookup failed", channelError);
      return NextResponse.json(
        { ok: false, error: "Database error during channel matching" },
        { status: 500, headers },
      );
    }

    const ranked = (channels ?? [])
      .filter(
        (row) => row.hotel_id === null || row.hotel_id === input.hotel_id,
      )
      .sort((a, b) => {
        const ai = lookupKeys.indexOf(a.identifier_key);
        const bi = lookupKeys.indexOf(b.identifier_key);
        if (ai !== bi) return ai - bi;
        // Prefer hotel-specific over global
        if (a.hotel_id && !b.hotel_id) return -1;
        if (!a.hotel_id && b.hotel_id) return 1;
        return 0;
      });

    channel = (ranked[0] as Channel | undefined) ?? null;
  }

  const calculatedCommission = calculateCommission(input.booking_value, channel);

  const insertPayload = {
    hotel_id: input.hotel_id,
    channel_id: channel?.id ?? null,
    visitor_id: input.visitor_id ?? null,
    transaction_id: input.transaction_id,
    booking_value: input.booking_value,
    currency: input.currency,
    arrival_date: input.arrival_date,
    departure_date: input.departure_date,
    rooms_count: input.rooms_count,
    nights_count: input.nights_count,
    calculated_commission: calculatedCommission,
    status: "pending" as const,
    raw_payload: {
      ...input.raw_payload,
      received_at: new Date().toISOString(),
      matched_identifier_key: channel?.identifier_key ?? null,
      request: {
        channel_identifier: input.channel_identifier,
        ref: input.ref,
        utm_source: input.utm_source,
        utm_medium: input.utm_medium,
        utm_campaign: input.utm_campaign,
      },
    },
  };

  const { data: booking, error: insertError } = await supabase
    .from("bookings")
    .insert(insertPayload)
    .select("id, transaction_id, channel_id, calculated_commission, status")
    .single();

  if (insertError) {
    // Race on unique transaction_id → treat as duplicate
    if (insertError.code === "23505") {
      const { data: raced } = await supabase
        .from("bookings")
        .select("id, transaction_id, status")
        .eq("transaction_id", input.transaction_id)
        .maybeSingle();

      return NextResponse.json(
        {
          ok: true,
          duplicate: true,
          booking_id: raced?.id ?? null,
          transaction_id: input.transaction_id,
          status: raced?.status ?? "pending",
        },
        { status: 200, headers },
      );
    }

    console.error("[conversions] insert failed", insertError);
    return NextResponse.json(
      { ok: false, error: "Failed to store booking" },
      { status: 500, headers },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      duplicate: false,
      booking_id: booking.id,
      transaction_id: booking.transaction_id,
      channel_id: booking.channel_id,
      calculated_commission: booking.calculated_commission,
      status: booking.status,
    },
    { status: 201, headers },
  );
}
