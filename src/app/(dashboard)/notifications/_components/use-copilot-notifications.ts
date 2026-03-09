"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import type {
  CopilotNotificationFilter,
  CopilotNotificationResponse,
} from "@/lib/copilot/notifications";

const LIMIT = 20;

export function useCopilotNotifications() {
  const authFetch = useAuthFetch();
  const [response, setResponse] = useState<CopilotNotificationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<CopilotNotificationFilter>("active");

  const requestUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (status !== "active") {
      params.set("status", status);
    }
    params.set("limit", String(LIMIT));

    return `/api/copilot/notifications?${params.toString()}`;
  }, [status]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const result = await authFetch(requestUrl);
      const payload = (await result.json()) as
        | CopilotNotificationResponse
        | { error?: string }
        | null;

      if (!result.ok) {
        throw new Error(payload && "error" in payload ? payload.error : undefined);
      }

      setResponse(payload as CopilotNotificationResponse);
    } catch (error) {
      setResponse(null);
      setLoadError(
        error instanceof Error && error.message
          ? error.message
          : "Failed to load notifications",
      );
    } finally {
      setLoading(false);
    }
  }, [authFetch, requestUrl]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  return { loadError, loadNotifications, loading, response, setStatus, status };
}
