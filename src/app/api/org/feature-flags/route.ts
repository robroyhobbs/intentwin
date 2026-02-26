import { NextRequest } from "next/server";
import { getUserContext } from "@/lib/supabase/auth-api";
import { getOrgFeatureFlags } from "@/lib/features/check-feature";
import { createAdminClient } from "@/lib/supabase/admin";
import { unauthorized, ok, serverError } from "@/lib/api/response";
import { logger } from "@/lib/utils/logger";

/**
 * GET /api/org/feature-flags
 *
 * Returns the feature flags and plan tier for the authenticated user's org.
 * Used by the `useFeatureFlags` client hook.
 *
 * Response shape:
 * ```json
 * { "flags": { "ai_generation": true, ... }, "plan_tier": "starter" }
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    const context = await getUserContext(request);

    if (!context) {
      return unauthorized();
    }

    const { organizationId } = context;

    // Fetch flags and plan tier in parallel
    const [flags, orgRow] = await Promise.all([
      getOrgFeatureFlags(organizationId),
      createAdminClient()
        .from("organizations")
        .select("plan_tier")
        .eq("id", organizationId)
        .single(),
    ]);

    if (orgRow.error) {
      logger.error(
        "GET /api/org/feature-flags: failed to fetch plan_tier",
        orgRow.error,
        { organizationId },
      );
    }

    const planTier: string = (orgRow.data?.plan_tier as string | null) ?? "free";

    return ok({ flags, plan_tier: planTier });
  } catch (error) {
    return serverError("Failed to fetch feature flags", error);
  }
}
