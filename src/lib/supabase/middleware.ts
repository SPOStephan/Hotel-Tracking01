import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes Supabase Auth session and protects /dashboard + /partner.
 * Staff = explicit staff_profiles row only (not “any Auth user”).
 * Staff may access /dashboard even with a partner profile; pure partners
 * stay on /partner.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isDashboard = path.startsWith("/dashboard");
  const isPartner = path.startsWith("/partner");
  const isLogin = path.startsWith("/login");
  const isSetPassword = path.startsWith("/auth/set-password");
  const isAuthPublic =
    path.startsWith("/auth/callback") ||
    path.startsWith("/auth/forgot-password") ||
    isSetPassword;

  if ((isDashboard || isPartner) && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", path);
    return NextResponse.redirect(redirectUrl);
  }

  // Invite/recovery: stay on set-password even when already signed in.
  if (user && isSetPassword) {
    return supabaseResponse;
  }

  if (user && (isDashboard || isPartner || isLogin) && !isAuthPublic) {
    const [{ data: partnerRows }, { data: staffRows, error: staffError }] =
      await Promise.all([
        supabase
          .from("partner_profiles")
          .select("id")
          .eq("user_id", user.id)
          .limit(1),
        supabase
          .from("staff_profiles")
          .select("user_id")
          .eq("user_id", user.id)
          .limit(1),
      ]);

    const isPartnerUser = (partnerRows?.length ?? 0) > 0;
    const isStaffUser = !staffError && (staffRows?.length ?? 0) > 0;

    if (isLogin) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = isStaffUser
        ? "/dashboard"
        : isPartnerUser
          ? "/partner"
          : "/auth/no-access";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    if (isDashboard && !isStaffUser) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = isPartnerUser ? "/partner" : "/auth/no-access";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    if (isPartner && !isPartnerUser) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = isStaffUser ? "/dashboard" : "/auth/no-access";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}
