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

export async function resolvePostLoginPath(
  preferredNext?: string | null,
): Promise<string> {
  const partner = await isPartnerUser();
  const fallback = partner ? "/partner" : "/dashboard";
  if (!preferredNext || !preferredNext.startsWith("/")) return fallback;
  if (partner && preferredNext.startsWith("/dashboard")) return "/partner";
  if (!partner && preferredNext.startsWith("/partner")) return "/dashboard";
  return preferredNext;
}
