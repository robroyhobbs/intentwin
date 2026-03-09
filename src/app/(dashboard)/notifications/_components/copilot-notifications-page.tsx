"use client";

import { NotificationsContent } from "./notifications-content";
import { NotificationsToolbar } from "./notifications-toolbar";
import { useCopilotNotifications } from "./use-copilot-notifications";

export function CopilotNotificationsPage() {
  const { loadError, loadNotifications, loading, response, setStatus, status } =
    useCopilotNotifications();

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <NotificationsToolbar
        activeCount={response?.activeCount ?? 0}
        loading={loading}
        onRefresh={() => void loadNotifications()}
        onStatusChange={setStatus}
        status={status}
      />

      <div className="mt-6">
        <NotificationsContent
          loadError={loadError}
          loading={loading}
          response={response}
        />
      </div>
    </div>
  );
}
