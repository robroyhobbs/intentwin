"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import type { OpportunityMatchAlertsResponse } from "@/lib/intelligence";

export function useMatchAlerts() {
  const authFetch = useAuthFetch();
  const [response, setResponse] = useState<OpportunityMatchAlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const result = await authFetch("/api/intelligence/matches/alerts");

      if (result.status === 503) {
        setResponse(null);
        return;
      }

      const payload = (await result.json()) as
        | OpportunityMatchAlertsResponse
        | { error?: string }
        | null;

      if (!result.ok) {
        throw new Error(payload && "error" in payload ? payload.error : undefined);
      }

      setResponse(payload as OpportunityMatchAlertsResponse);
    } catch (error) {
      setResponse(null);
      setLoadError(
        error instanceof Error && error.message
          ? error.message
          : "Failed to load match alerts",
      );
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  return {
    attentionCount: response?.summary.total_attention_count ?? 0,
    loadAlerts,
    loadError,
    loading,
    response,
  };
}
