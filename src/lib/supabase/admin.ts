import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Service-role client for backend operations (bypasses RLS).
// NEVER expose this client or the service role key to the browser.
//
// Module-level singleton: the Supabase JS client is stateless (each .from()
// call makes an independent HTTP request), so reusing a single instance
// avoids ~3-5 redundant object allocations per request with zero risk of
// connection leakage or shared state issues.
let _adminClient: SupabaseClient | null = null;

/**
 * Returns a Supabase admin client that uses the service role key to bypass RLS.
 * Uses a module-level singleton to avoid redundant object allocations.
 *
 * **WARNING**: This client bypasses all Row Level Security. Always scope queries
 * with `organization_id` to prevent cross-tenant data leakage.
 *
 * @returns A singleton Supabase admin client with service role privileges
 *
 * @example
 * const admin = createAdminClient();
 * const { data } = await admin.from("organizations").select("id, name").eq("id", orgId);
 */
export function createAdminClient(): SupabaseClient {
  if (!_adminClient) {
    _adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return _adminClient;
}
