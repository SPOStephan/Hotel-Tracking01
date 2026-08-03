import { createClient } from "@/lib/supabase/server";

export async function getPartnerChannelIds(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("partner_profiles")
    .select("channel_id")
    .eq("user_id", user.id);

  return (data ?? []).map((row) => row.channel_id);
}

export async function isPartnerUser(): Promise<boolean> {
  const ids = await getPartnerChannelIds();
  return ids.length > 0;
}

/**
 * Hotel-group admin. Explicit staff_profiles row wins; legacy fallback is
 * "authenticated without partner profile" until staff_profiles is populated.
 */
export async function isStaffUser(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: staffRows, error } = await supabase
    .from("staff_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .limit(1);

  if (!error && (staffRows?.length ?? 0) > 0) {
    return true;
  }

  // Legacy / pre-migration: no partner profile ⇒ staff
  if (error) {
    return !(await isPartnerUser());
  }

  return !(await isPartnerUser());
}

export async function resolvePostLoginPath(
  preferredNext?: string | null,
): Promise<string> {
  const staff = await isStaffUser();
  const partner = await isPartnerUser();

  if (staff) {
    if (
      preferredNext?.startsWith("/partner") &&
      partner
    ) {
      return preferredNext;
    }
    if (preferredNext?.startsWith("/dashboard")) {
      return preferredNext;
    }
    return "/dashboard";
  }

  if (partner) {
    if (preferredNext?.startsWith("/partner")) return preferredNext;
    return "/partner";
  }

  if (preferredNext?.startsWith("/")) return preferredNext;
  return "/dashboard";
}
