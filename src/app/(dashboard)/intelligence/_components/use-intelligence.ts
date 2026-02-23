"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthFetch } from "@/hooks/use-auth-fetch";

interface UseIntelligenceResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  configured: boolean;
  refetch: () => void;
}

/**
 * Hook to fetch data from the intelligence service proxy.
 *
 * @param path - Intelligence API path (e.g., "/api/v1/awards/stats")
 * @param params - Query parameters to forward
 */
export function useIntelligence<T>(
  path: string,
  params?: Record<string, string>,
): UseIntelligenceResult<T> {
  const authFetch = useAuthFetch();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);

  // Stable serialized key for params
  const paramKey = params ? JSON.stringify(params) : "";

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams({ path });
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          if (value) searchParams.set(key, value);
        }
      }

      const res = await authFetch(`/api/intelligence?${searchParams.toString()}`);

      if (res.status === 503) {
        setConfigured(false);
        setData(null);
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `Request failed (${res.status})`);
        return;
      }

      const result = await res.json();
      setData(result as T);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authFetch, path, paramKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, configured, refetch: fetchData };
}
