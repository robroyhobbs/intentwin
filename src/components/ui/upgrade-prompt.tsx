"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PRICING_TIERS } from "@/lib/stripe/client";
import type { PricingTier } from "@/lib/stripe/client";

export interface UpgradePromptProps {
  /** Human-readable feature name, e.g. "AI Proposal Generation" */
  feature: string;
  /** The minimum tier required to access this feature */
  requiredTier: PricingTier;
  /** Short description of what the feature does */
  description?: string;
  /** Render a compact inline chip instead of a full card */
  compact?: boolean;
  className?: string;
}

/**
 * Shown when a user attempts to access a gated feature they haven't unlocked.
 * Supports two visual variants:
 *
 * - **Full card** (default): standalone card with icon, copy, and CTA
 * - **Compact** (`compact={true}`): inline chip suitable for embedding in forms or toolbars
 */
export function UpgradePrompt({
  feature,
  requiredTier,
  description,
  compact = false,
  className,
}: UpgradePromptProps) {
  const tier = PRICING_TIERS[requiredTier];
  const tierLabel = tier.name;
  const price = tier.monthlyPrice;

  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1",
          "bg-[var(--background-tertiary)] border border-[var(--border)]",
          "text-xs text-[var(--foreground-muted)]",
          className,
        )}
      >
        <Lock className="h-3 w-3 shrink-0 text-[var(--accent)]" aria-hidden />
        <span>
          {feature} &mdash; available on{" "}
          <Link
            href="/pricing"
            className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
          >
            {tierLabel}
          </Link>
        </span>
      </span>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border)] bg-[var(--card-bg)]",
        "p-6 flex flex-col items-center text-center gap-4",
        className,
      )}
    >
      {/* Lock icon */}
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--background-tertiary)] border border-[var(--border)]">
        <Lock className="h-5 w-5 text-[var(--accent)]" aria-hidden />
      </div>

      {/* Copy */}
      <div className="space-y-1.5">
        <p className="text-[15px] font-semibold text-[var(--foreground)]">
          {feature}
        </p>

        {description && (
          <p className="text-sm text-[var(--foreground-muted)] max-w-sm">
            {description}
          </p>
        )}

        <p className="text-xs text-[var(--foreground-muted)]">
          Available on{" "}
          <span className="font-medium text-[var(--foreground)]">
            {tierLabel}
          </span>{" "}
          and above
          {price > 0 && (
            <span className="text-[var(--foreground-muted)]">
              {" "}
              &mdash; from ${price}/mo
            </span>
          )}
        </p>
      </div>

      {/* CTA */}
      <Link
        href="/pricing"
        className={cn(
          "inline-flex items-center justify-center rounded-lg px-4 py-2",
          "bg-[var(--accent)] text-[var(--background)] font-medium text-sm",
          "transition-opacity hover:opacity-90 focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2",
        )}
      >
        Upgrade to {tierLabel}
      </Link>
    </div>
  );
}
