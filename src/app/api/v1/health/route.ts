import { checkHealth } from "@/lib/supabase/health";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/health
 * Checks Vercel env wiring + live DB connectivity (service role).
 * Does not expose secret values.
 */
export async function GET() {
  const result = await checkHealth();
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}
