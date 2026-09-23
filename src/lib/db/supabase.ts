import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function isDbConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

let client: SupabaseClient | undefined;

/**
 * Server-side client with the service_role key. RLS is enabled without
 * policies, so every read and write must go through this client.
 */
export function getSupabase(): SupabaseClient {
  if (!isDbConfigured()) {
    throw new Error("Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)");
  }
  client ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return client;
}
