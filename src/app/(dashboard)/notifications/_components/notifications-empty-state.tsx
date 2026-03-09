"use client";

import { BellRing } from "lucide-react";

export function NotificationsEmptyState() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-8 text-center">
      <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-[var(--background-tertiary)]">
        <BellRing className="h-5 w-5 text-[var(--foreground-muted)]" />
      </div>
      <h2 className="text-base font-semibold text-[var(--foreground)]">
        No active copilot notifications
      </h2>
      <p className="mt-2 text-sm text-[var(--foreground-muted)]">
        New reliability and approval alerts will appear here as IntentBid Copilot detects them.
      </p>
    </div>
  );
}
