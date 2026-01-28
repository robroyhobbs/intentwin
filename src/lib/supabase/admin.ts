import { createClient } from "@supabase/supabase-js";

// Service-role client for backend operations (bypasses RLS).
// NEVER expose this client or the service role key to the browser.
export function createAdminClient() {
  return createClient(
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
