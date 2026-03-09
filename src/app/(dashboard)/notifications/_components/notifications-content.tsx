"use client";

import { Loader2 } from "lucide-react";
import type { CopilotNotificationResponse } from "@/lib/copilot/notifications";
import { NotificationsList } from "./notifications-list";

export function NotificationsContent({
  loadError,
  loading,
  response,
}: {
  loadError: string | null;
  loading: boolean;
  response: CopilotNotificationResponse | null;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-6 text-sm text-[var(--foreground-muted)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading notifications…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-800/30 bg-red-900/10 px-4 py-6">
        <p className="text-sm font-medium text-red-300">{loadError}</p>
        <p className="mt-1 text-sm text-red-200/80">
          Try refreshing, or open the copilot console if you need deeper triage details.
        </p>
      </div>
    );
  }

  return (
    <NotificationsList
      canManageInterventions={response?.canManageInterventions ?? false}
      notifications={response?.notifications ?? []}
    />
  );
}
