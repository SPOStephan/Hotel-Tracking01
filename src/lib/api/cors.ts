import { NextResponse } from "next/server";

/**
 * CORS for tracker POSTs from hotel websites.
 * Cross-origin sendBeacon uses credentials mode "include"; browsers then require
 * Access-Control-Allow-Credentials: true and a concrete Allow-Origin (not *).
 */
export function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("origin");
  const allowed = process.env.HGAE_CORS_ORIGINS ?? "*";
  const allowList = allowed
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let allowOrigin: string;
  if (!origin) {
    allowOrigin = "*";
  } else if (allowed === "*" || allowList.includes(origin)) {
    allowOrigin = origin;
  } else {
    allowOrigin = allowList[0] || "*";
  }

  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };

  // Only valid together with a specific origin (never with *)
  if (allowOrigin !== "*") {
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return headers;
}

export function corsOptionsResponse(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}
