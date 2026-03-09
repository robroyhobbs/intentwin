"use client";

import Link from "next/link";
import type { CopilotNotification } from "@/lib/copilot/notifications";
import { NotificationStatusBadge } from "./notification-status-badge";

export function NotificationCard({
  canManageInterventions,
  notification,
}: {
  canManageInterventions: boolean;
  notification: CopilotNotification;
}) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              {notification.title}
            </h2>
            <NotificationStatusBadge status={notification.status} />
          </div>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            {notification.message}
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--foreground-subtle)]">
            <span className="capitalize">
              Agent {notification.assignedAgent.replaceAll("-", " ")}
            </span>
            <span className="capitalize">
              Mode {notification.actionMode.replaceAll("_", " ")}
            </span>
            <span>{formatTimestamp(notification.createdAt)}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={notification.href}
            className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110"
          >
            {notification.hrefLabel}
          </Link>
          {canManageInterventions ? (
            <Link
              href="/copilot-console"
              className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--background-tertiary)]"
            >
              Manage in console
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
