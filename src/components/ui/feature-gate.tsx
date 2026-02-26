"use client";

import { useFeatureFlags } from "@/hooks/use-feature-flags";
import { UpgradePrompt } from "@/components/ui/upgrade-prompt";
import type { FeatureFlag, PricingTier } from "@/lib/stripe/client";

export interface FeatureGateProps {
  /** The feature flag key to check */
  flag: FeatureFlag;
  /** The minimum tier that unlocks this feature (shown in the upgrade prompt) */
  requiredTier: PricingTier;
  /** Human-readable label shown in the upgrade prompt */
  featureName: string;
  /** Optional description of what the feature does */
  description?: string;
  /** Render the compact inline upgrade prompt variant */
  compact?: boolean;
  /** Content to render when the feature is enabled */
  children: React.ReactNode;
  /**
   * Custom fallback to render instead of the default `<UpgradePrompt>`.
   * Pass `null` to render nothing when the feature is locked.
   */
  fallback?: React.ReactNode;
}

/**
 * Wraps content behind a feature flag check.
 *
 * - While the flags are loading, renders nothing to avoid layout flicker.
 * - When the flag is enabled, renders `children`.
 * - When the flag is disabled, renders `fallback` if provided, otherwise
 *   renders a themed `<UpgradePrompt>`.
 *
 * @example
 * <FeatureGate flag="ai_generation" requiredTier="starter" featureName="AI Generation">
 *   <GenerateButton />
 * </FeatureGate>
 *
 * @example compact inline gate
 * <FeatureGate flag="bulk_import" requiredTier="pro" featureName="Bulk Import" compact>
 *   <BulkImportButton />
 * </FeatureGate>
 */
export function FeatureGate({
  flag,
  requiredTier,
  featureName,
  description,
  compact = false,
  children,
  fallback,
}: FeatureGateProps) {
  const { hasFeature, loading } = useFeatureFlags();

  // Render nothing while flags are in flight to prevent layout flicker.
  if (loading) return null;

  if (hasFeature(flag)) {
    return <>{children}</>;
  }

  // Explicit fallback provided (including null to render nothing).
  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  // Default: show the themed upgrade prompt.
  return (
    <UpgradePrompt
      feature={featureName}
      requiredTier={requiredTier}
      description={description}
      compact={compact}
    />
  );
}
