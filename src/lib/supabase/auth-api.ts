import { NextRequest } from "next/server";
import { createClient } from "./server";
import { createAdminClient } from "./admin";
import type { User } from "@supabase/supabase-js";

/**
 * Extract authenticated user from a Route Handler request.
 * Tries cookie-based session first, then falls back to Authorization header.
 */
export async function getAuthUser(
  request?: NextRequest
): Promise<User | null> {
  // 1. Try the server client (cookie-based session)
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) return user;
  } catch (e) {
    console.warn("Server client auth check failed:", e);
  }

  // 2. Fallback: Authorization Bearer token
  if (request) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.slice(7);
        const adminClient = createAdminClient();
        const { data } = await adminClient.auth.getUser(token);
        if (data.user) return data.user;
      } catch (e) {
        console.warn("Bearer token auth check failed:", e);
      }
    }
  }

  return null;
}
