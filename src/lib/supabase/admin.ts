import { createClient } from "@supabase/supabase-js";
import { requireSupabaseServerEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

/**
 * Server-only Supabase client with the service role key.
 * Bypasses RLS — use exclusively in API routes / trusted server code.
 */
export function createAdminClient() {
  const { url, serviceRoleKey } = requireSupabaseServerEnv();

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
