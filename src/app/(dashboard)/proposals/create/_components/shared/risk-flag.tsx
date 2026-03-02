"use client";

// ── Risk Flag Chip ──────────────────────────────────────────────────────────
// Severity-tagged chip: colored dot + label text.

interface RiskFlagProps {
  severity: "low" | "medium" | "high";
  label: string;
}

const DOT_COLORS: Record<RiskFlagProps["severity"], string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
};

const CHIP_COLORS: Record<RiskFlagProps["severity"], string> = {
  high: "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  medium: "bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
  low: "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
};

export function RiskFlagChip({ severity, label }: RiskFlagProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${CHIP_COLORS[severity]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${DOT_COLORS[severity]}`}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
