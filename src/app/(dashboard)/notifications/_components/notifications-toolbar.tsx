"use client";

import { BellRing, RefreshCw } from "lucide-react";
import type { CopilotNotificationFilter } from "@/lib/copilot/notifications";

const FILTER_OPTIONS: Array<{ label: string; value: CopilotNotificationFilter }> = [
  { label: "Active", value: "active" },
  { label: "Awaiting approval", value: "awaiting_approval" },
  { label: "Open", value: "open" },
  { label: "Resolved", value: "resolved" },
  { label: "All", value: "all" },
];

export function NotificationsToolbar({
  activeCount,
  loading,
  onRefresh,
  onStatusChange,
  status,
}: {
  activeCount: number;
  loading: boolean;
  onRefresh: () => void;
  onStatusChange: (value: CopilotNotificationFilter) => void;
  status: CopilotNotificationFilter;
}) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm">
      <NotificationsHero loading={loading} onRefresh={onRefresh} />
      <NotificationsControls
        activeCount={activeCount}
        onStatusChange={onStatusChange}
        status={status}
      />
    </div>
  );
}

function NotificationsHero({
  loading,
  onRefresh,
}: {
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--accent-subtle)]">
          <BellRing className="size-6 text-[var(--accent)]" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Notifications
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--foreground-muted)]">
            Stay ahead of reliability issues, approvals, and copilot-driven updates across your workspace.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--background-tertiary)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw className="h-4 w-4" />
        Refresh
      </button>
    </div>
  );
}

function NotificationsControls({
  activeCount,
  onStatusChange,
  status,
}: {
  activeCount: number;
  onStatusChange: (value: CopilotNotificationFilter) => void;
  status: CopilotNotificationFilter;
}) {
  return (
    <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-subtle)]">
          Active alerts
        </p>
        <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
          {activeCount}
        </p>
      </div>

      <label className="flex flex-col gap-2 text-sm text-[var(--foreground-muted)]">
        <span>Notification status</span>
        <select
          aria-label="Notification status"
          value={status}
          onChange={(event) =>
            onStatusChange(event.target.value as CopilotNotificationFilter)
          }
          className="min-w-[220px] rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
        >
          {FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
