import { corsHeaders, corsOptionsResponse } from "@/lib/api/cors";
import { matchChannel } from "@/lib/channels/match";
import { calculateCommission } from "@/lib/conversions/calculate-commission";
import { conversionRequestSchema } from "@/lib/conversions/schema";
import { resolveHotel } from "@/lib/hotels/resolve";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return corsOptionsResponse(request);
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

  const { hotel, error: hotelError } = await resolveHotel(
    supabase,
    input.hotel_id,
  );

  if (hotelError) {
    console.error("[conversions] hotel lookup failed", hotelError);
    return NextResponse.json(
      { ok: false, error: "Database error during hotel lookup" },
      { status: 500, headers },
    );
  }

  if (!hotel) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unknown hotel_id (use internal UUID or OPB hotel id)",
      },
      { status: 404, headers },
    );
  }

  const { channel, error: matchError } = await matchChannel(supabase, {
    hotel_id: hotel.id,
    channel_identifier: input.channel_identifier,
    ref: input.ref,
    utm_source: input.utm_source,
  });

  if (matchError) {
    console.error("[conversions] channel lookup failed", matchError);
    return NextResponse.json(
      { ok: false, error: "Database error during channel matching" },
      { status: 500, headers },
    );
  }

  const calculatedCommission = calculateCommission(input.booking_value, channel);

  const insertPayload = {
    hotel_id: hotel.id,
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
