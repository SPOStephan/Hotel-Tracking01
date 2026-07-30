/**
 * Central env access for Supabase.
 * Secrets stay in Vercel / .env.local — never commit real keys.
 */

export type SupabasePublicEnv = {
  url: string;
  anonKey: string;
};

export type SupabaseServerEnv = SupabasePublicEnv & {
  serviceRoleKey: string;
};

export function getSupabasePublicEnv(): SupabasePublicEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function getSupabaseServerEnv(): SupabaseServerEnv | null {
  const pub = getSupabasePublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!pub || !serviceRoleKey) return null;
  return { ...pub, serviceRoleKey };
}

export function requireSupabaseServerEnv(): SupabaseServerEnv {
  const env = getSupabaseServerEnv();
  if (!env) {
    throw new Error(
      "Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return env;
}

/** e.g. lkqopssstvtekneycpgh from https://lkqopssstvtekneycpgh.supabase.co */
export function getSupabaseProjectRef(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    const ref = host.split(".")[0];
    return ref || null;
  } catch {
    return null;
  }
}
