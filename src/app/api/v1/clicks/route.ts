import { corsHeaders, corsOptionsResponse } from "@/lib/api/cors";
import { matchChannel } from "@/lib/channels/match";
import { clickRequestSchema } from "@/lib/clicks/schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return corsOptionsResponse(request);
}

/**
 * POST /api/v1/clicks
 * Logs a traffic touchpoint (pre-conversion) attributed to a channel.
 */
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

  const parsed = clickRequestSchema.safeParse(body);
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

  if (!input.channel_identifier && !input.ref && !input.utm_source) {
    return NextResponse.json(
      {
        ok: false,
        error: "Provide channel_identifier, ref, or utm_source",
      },
      { status: 400, headers },
    );
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (error) {
    console.error("[clicks] supabase config error", error);
    return NextResponse.json(
      { ok: false, error: "Server configuration error" },
      { status: 500, headers },
    );
  }

  const { channel, error: matchError } = await matchChannel(supabase, {
    hotel_id: input.hotel_id,
    channel_identifier: input.channel_identifier,
    ref: input.ref,
    utm_source: input.utm_source,
  });

  if (matchError) {
    console.error("[clicks] channel lookup failed", matchError);
    return NextResponse.json(
      { ok: false, error: "Database error during channel matching" },
      { status: 500, headers },
    );
  }

  if (!channel) {
    return NextResponse.json(
      { ok: false, error: "No matching channel" },
      { status: 404, headers },
    );
  }

  const { data: touchpoint, error: insertError } = await supabase
    .from("touchpoints")
    .insert({
      channel_id: channel.id,
      visitor_id: input.visitor_id,
      utm_source: input.utm_source ?? null,
      utm_medium: input.utm_medium ?? null,
      utm_campaign: input.utm_campaign ?? null,
      landing_page_url: input.landing_page_url ?? null,
    })
    .select("id, channel_id, visitor_id, created_at")
    .single();

  if (insertError) {
    console.error("[clicks] insert failed", insertError);
    return NextResponse.json(
      { ok: false, error: "Failed to store touchpoint" },
      { status: 500, headers },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      touchpoint_id: touchpoint.id,
      channel_id: touchpoint.channel_id,
      channel_identifier: channel.identifier_key,
      visitor_id: touchpoint.visitor_id,
      created_at: touchpoint.created_at,
    },
    { status: 201, headers },
  );
}
