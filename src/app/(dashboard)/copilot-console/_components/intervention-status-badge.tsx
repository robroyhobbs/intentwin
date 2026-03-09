"use client";

import { AlertCircle, CheckCircle2, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { InterventionStatus } from "./types";

const STATUS_STYLES: Record<
  InterventionStatus,
  { label: string; className: string; icon: typeof Clock3 }
> = {
  open: {
    label: "Open",
    className:
      "border-amber-800/30 bg-amber-900/20 text-amber-400",
    icon: AlertCircle,
  },
  awaiting_approval: {
    label: "Awaiting approval",
    className:
      "border-[var(--accent-muted)] bg-[var(--accent-subtle)] text-[var(--accent)]",
    icon: Clock3,
  },
  resolved: {
    label: "Resolved",
    className:
      "border-emerald-800/30 bg-emerald-900/20 text-emerald-400",
    icon: CheckCircle2,
  },
};

interface Props {
  status: InterventionStatus;
  className?: string;
}

export function InterventionStatusBadge({ status, className }: Props) {
  const config = STATUS_STYLES[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium",
        config.className,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
