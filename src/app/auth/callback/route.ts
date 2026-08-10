import { createServerClient } from "@supabase/ssr";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Handles Supabase Auth redirects (invite, recovery, magic link).
 * Exchanges ?code= or ?token_hash=&type= for a session cookie, then
 * sends the user to set a password (invite/recovery) or into the app.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const nextRaw = searchParams.get("next");

  const next =
    nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//")
      ? nextRaw
      : "/auth/set-password";

  const isPasswordFlow =
    type === "invite" ||
    type === "recovery" ||
    next.startsWith("/auth/set-password");

  const destination = isPasswordFlow ? "/auth/set-password" : next;
  const redirectUrl = new URL(destination, origin);
  if (type === "invite" || type === "recovery") {
    redirectUrl.searchParams.set("reason", type);
  }

  const response = NextResponse.redirect(redirectUrl);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Auth nicht konfiguriert")}`,
    );
  }

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(
          `Einladungs-Link ungültig oder abgelaufen: ${error.message}`,
        )}`,
      );
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });
    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(
          `Einladungs-Link ungültig oder abgelaufen: ${error.message}`,
        )}`,
      );
    }
  } else {
    // No server-side token — may still arrive as URL hash (handled client-side).
    return NextResponse.redirect(
      `${origin}/auth/set-password?reason=${encodeURIComponent(type || "invite")}`,
    );
  }

  return response;
}
