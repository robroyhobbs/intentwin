/**
 * Server-side feature flag utilities.
 *
 * Reads the `feature_flags` JSONB column from the `organizations` table.
 * Falls back to the free tier flags when an org is not found or has no flags set.
 *
 * @module lib/features/check-feature
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { PRICING_TIERS } from "@/lib/stripe/client";
import { logger } from "@/lib/utils/logger";
import type { FeatureFlag } from "@/lib/stripe/client";

/** Shape of the feature_flags JSONB column */
type FeatureFlagsRecord = Record<FeatureFlag, boolean>;

/**
 * Fetch the raw `feature_flags` JSONB object for an organization.
 * Returns null when the org is not found or the column is unset.
 */
async function fetchOrgFlags(
  organizationId: string,
): Promise<FeatureFlagsRecord | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organizations")
    .select("feature_flags")
    .eq("id", organizationId)
    .single();

  if (error) {
    logger.error("checkFeature: failed to fetch org feature_flags", error, {
      organizationId,
    });
    return null;
  }

  const flags = data?.feature_flags as FeatureFlagsRecord | null;
  return flags ?? null;
}

/**
 * Check whether a single feature flag is enabled for an organization.
 *
 * Returns `false` if the org is not found, the column is unset, or the
 * specific flag is absent from the stored object.
 *
 * @example
 * const canGenerate = await checkFeature(orgId, "ai_generation");
 */
export async function checkFeature(
  organizationId: string,
  flag: FeatureFlag,
): Promise<boolean> {
  const flags = await fetchOrgFlags(organizationId);
  if (!flags) return false;
  return flags[flag] === true;
}

/**
 * Return the full feature flags object for an organization.
 *
 * Falls back to `PRICING_TIERS.free.featureFlags` when the org is not
 * found or has no `feature_flags` stored — ensuring callers always receive
 * a complete, well-typed record.
 *
 * @example
 * const flags = await getOrgFeatureFlags(orgId);
 * if (flags.intelligence_suite) { ... }
 */
export async function getOrgFeatureFlags(
  organizationId: string,
): Promise<FeatureFlagsRecord> {
  const flags = await fetchOrgFlags(organizationId);
  if (!flags) {
    return { ...PRICING_TIERS.free.featureFlags } as FeatureFlagsRecord;
  }

  // Merge against free-tier defaults so any new flags added to the type
  // always have a value rather than being undefined.
  return {
    ...(PRICING_TIERS.free.featureFlags as FeatureFlagsRecord),
    ...flags,
  };
}
