import {
  getSupabaseProjectRef,
  getSupabaseServerEnv,
} from "@/lib/supabase/env";
import { createAdminClient } from "@/lib/supabase/admin";

export type HealthResult = {
  ok: boolean;
  configured: boolean;
  database: "ok" | "unreachable" | "schema_missing" | "error";
  project_ref: string | null;
  hotels_count?: number;
  missing?: string[];
  hint?: string;
  error?: string;
};

export async function checkHealth(): Promise<HealthResult> {
  const env = getSupabaseServerEnv();
  const projectRef = getSupabaseProjectRef();

  if (!env) {
    return {
      ok: false,
      configured: false,
      database: "unreachable",
      project_ref: projectRef,
      missing: [
        !process.env.NEXT_PUBLIC_SUPABASE_URL && "NEXT_PUBLIC_SUPABASE_URL",
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
          "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        !process.env.SUPABASE_SERVICE_ROLE_KEY && "SUPABASE_SERVICE_ROLE_KEY",
      ].filter((v): v is string => Boolean(v)),
      hint: "Set the three Supabase env vars in Vercel → Settings → Environment Variables, then redeploy.",
    };
  }

  try {
    const supabase = createAdminClient();
    const { count, error } = await supabase
      .from("hotels")
      .select("id", { count: "exact", head: true });

    if (error) {
      const schemaMissing =
        error.code === "42P01" ||
        /relation .* does not exist/i.test(error.message) ||
        /could not find the table/i.test(error.message);

      return {
        ok: false,
        configured: true,
        database: schemaMissing ? "schema_missing" : "error",
        project_ref: projectRef,
        error: error.message,
        hint: schemaMissing
          ? "Run supabase/APPLY_IN_DASHBOARD.sql once in the Supabase SQL Editor."
          : "Check SUPABASE_SERVICE_ROLE_KEY and table grants.",
      };
    }

    return {
      ok: true,
      configured: true,
      database: "ok",
      project_ref: projectRef,
      hotels_count: count ?? 0,
    };
  } catch (error) {
    return {
      ok: false,
      configured: true,
      database: "error",
      project_ref: projectRef,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
