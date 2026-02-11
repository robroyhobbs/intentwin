"use client";

import { useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Returns a fetch wrapper that automatically attaches the Supabase
 * access token as an Authorization header, ensuring API routes
 * can authenticate the user.
 *
 * The returned function is memoized to prevent infinite re-render
 * loops when used inside useCallback/useEffect dependency arrays.
 */
export function useAuthFetch() {
  const supabase = createClient();

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      // Try getSession first (reads from storage)
      let accessToken: string | null = null;

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token) {
        accessToken = session.access_token;
      } else {
        // Session not in storage — try refreshing via getUser which forces a network call
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // After getUser, session should now be available
          const { data: refreshed } = await supabase.auth.getSession();
          accessToken = refreshed.session?.access_token ?? null;
        }
      }

      const headers = new Headers(options.headers);
      if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
      }

      return fetch(url, {
        ...options,
        headers,
      });
    },
    [supabase],
  );

  return authFetch;
}
