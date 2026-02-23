"use client";

import type { LucideIcon } from "lucide-react";

export function IntelligenceLoading({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-4">
        <Icon className="h-8 w-8 text-[var(--accent)] animate-pulse" />
        <p className="text-sm text-[var(--foreground-muted)]">
          Loading {label}...
        </p>
      </div>
    </div>
  );
}
