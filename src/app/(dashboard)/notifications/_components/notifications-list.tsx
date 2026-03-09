"use client";

import type { CopilotNotification } from "@/lib/copilot/notifications";
import { NotificationCard } from "./notification-card";
import { NotificationsEmptyState } from "./notifications-empty-state";

export function NotificationsList({
  canManageInterventions,
  notifications,
}: {
  canManageInterventions: boolean;
  notifications: CopilotNotification[];
}) {
  if (notifications.length === 0) {
    return <NotificationsEmptyState />;
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          canManageInterventions={canManageInterventions}
          notification={notification}
        />
      ))}
    </div>
  );
}
