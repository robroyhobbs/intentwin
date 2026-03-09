"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import type { CopilotNotificationResponse } from "@/lib/copilot/notifications";

export function CopilotNotificationLink() {
  const authFetch = useAuthFetch();
  const [hasNotifications, setHasNotifications] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      try {
        const response = await authFetch("/api/copilot/notifications?limit=1");
        if (!response.ok) {
          if (!cancelled) {
            setHasNotifications(false);
          }
          return;
        }

        const payload = (await response.json()) as CopilotNotificationResponse;
        if (!cancelled) {
          setHasNotifications(payload.activeCount > 0);
        }
      } catch {
        if (!cancelled) {
          setHasNotifications(false);
        }
      }
    }

    void loadNotifications();

    return () => {
      cancelled = true;
    };
  }, [authFetch]);

  return (
    <Link
      href="/notifications"
      className="relative rounded-lg p-2 text-[var(--foreground-muted)] transition hover:bg-[var(--background-tertiary)] hover:text-[var(--foreground)]"
      aria-label="Open notifications"
    >
      <Bell className="h-5 w-5" />
      {hasNotifications ? (
        <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
      ) : null}
    </Link>
  );
}
