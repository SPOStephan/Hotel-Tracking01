import { createClient } from "@/lib/supabase/server";
import { SETTING_CSV_RECONCILIATION } from "@/types/database";

export async function isCsvReconciliationEnabled(): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("value_bool")
    .eq("key", SETTING_CSV_RECONCILIATION)
    .maybeSingle();

  if (error) {
    // Table missing / RLS — treat as off
    console.error("[settings] csv reconciliation lookup failed", error.message);
    return false;
  }

  return Boolean(data?.value_bool);
}

export async function setCsvReconciliationEnabled(
  enabled: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("app_settings")
    .update({
      value_bool: enabled,
      updated_at: new Date().toISOString(),
    })
    .eq("key", SETTING_CSV_RECONCILIATION);

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
