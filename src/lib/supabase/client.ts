import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for use in browser-side React components.
 * Uses the public anon key and respects Row Level Security policies.
 *
 * @returns A Supabase browser client instance
 *
 * @example
 * const supabase = createClient();
 * const { data: { user } } = await supabase.auth.getUser();
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
