import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes Supabase Auth session and protects /dashboard + /partner.
 * Staff (staff_profiles) may access /dashboard even if they also have a
 * partner profile. Pure partners are kept on /partner.
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

  if ((isDashboard || isPartner) && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", path);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && (isDashboard || isPartner || isLogin)) {
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
    const hasStaffRow = !staffError && (staffRows?.length ?? 0) > 0;
    // Explicit staff row, or legacy: no partner profile ⇒ staff
    const isStaffUser = hasStaffRow || !isPartnerUser;

    if (isLogin) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = isStaffUser
        ? "/dashboard"
        : isPartnerUser
          ? "/partner"
          : "/dashboard";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    if (isDashboard && !isStaffUser) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/partner";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    if (isPartner && !isPartnerUser) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}
