import { NextRequest } from "next/server";
import { getUserContext } from "@/lib/supabase/auth-api";
import { createAdminClient } from "@/lib/supabase/admin";
import { ok, unauthorized, serverError } from "@/lib/api/response";
import { logger } from "@/lib/utils/logger";

/** GET — return the user's last_viewed_changelog timestamp */
export async function GET(request: NextRequest) {
  const context = await getUserContext(request);
  if (!context) return unauthorized();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("last_viewed_changelog")
    .eq("id", context.user.id)
    .eq("organization_id", context.organizationId)
    .single();

  if (error) {
    logger.error("[changelog-viewed] GET failed", error);
    return serverError("Failed to fetch changelog state");
  }

  return ok({ last_viewed_changelog: data?.last_viewed_changelog ?? null });
}

/** PATCH — mark changelog as viewed right now */
export async function PATCH(request: NextRequest) {
  const context = await getUserContext(request);
  if (!context) return unauthorized();

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ last_viewed_changelog: new Date().toISOString() })
    .eq("id", context.user.id)
    .eq("organization_id", context.organizationId);

  if (error) {
    logger.error("[changelog-viewed] PATCH failed", error);
    return serverError("Failed to update changelog state");
  }

  return ok({ last_viewed_changelog: new Date().toISOString() });
}
