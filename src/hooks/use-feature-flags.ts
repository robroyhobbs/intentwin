"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import type { FeatureFlag } from "@/lib/stripe/client";

type FeatureFlagsRecord = Record<FeatureFlag, boolean>;

interface UseFeatureFlagsResult {
  flags: FeatureFlagsRecord | null;
  loading: boolean;
  /** Returns true when the given flag is enabled. Always false while loading. */
  hasFeature: (flag: FeatureFlag) => boolean;
}

/**
 * Client hook that fetches `/api/org/feature-flags` and returns the org's
 * feature flags along with a convenience `hasFeature` accessor.
 *
 * The fetch is authenticated via `useAuthFetch` (Bearer token).
 *
 * @example
 * const { hasFeature, loading } = useFeatureFlags();
 * if (!loading && hasFeature("ai_generation")) { ... }
 */
export function useFeatureFlags(): UseFeatureFlagsResult {
  const [flags, setFlags] = useState<FeatureFlagsRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const authFetch = useAuthFetch();

  useEffect(() => {
    let cancelled = false;

    async function fetchFlags() {
      setLoading(true);
      try {
        const res = await authFetch("/api/org/feature-flags");
        if (!res.ok) {
          setFlags(null);
          return;
        }
        const body = (await res.json()) as { flags: FeatureFlagsRecord };
        if (!cancelled) {
          setFlags(body.flags);
        }
      } catch {
        if (!cancelled) {
          setFlags(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchFlags();

    return () => {
      cancelled = true;
    };
  }, [authFetch]);

  const hasFeature = useCallback(
    (flag: FeatureFlag): boolean => {
      if (!flags) return false;
      return flags[flag] === true;
    },
    [flags],
  );

  return { flags, loading, hasFeature };
}
