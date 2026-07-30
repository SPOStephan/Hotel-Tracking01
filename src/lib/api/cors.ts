import { NextResponse } from "next/server";

export function corsHeaders(request: Request): HeadersInit {
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

export function corsOptionsResponse(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}
