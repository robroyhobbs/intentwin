"use client";

import type { OpportunityRecord } from "../../_components/types";

interface Props {
  opportunity: OpportunityRecord;
  onClick: () => void;
}

export function OpportunityRow({ opportunity, onClick }: Props) {
  const formatValue = (v: number | null) => {
    if (v == null) return "-";
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v.toLocaleString()}`;
  };

  const formatDeadline = (v: string | null) => {
    if (!v) return "-";
    const d = new Date(v);
    const now = new Date();
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (diffDays < 0) return dateStr;
    if (diffDays <= 7) return `${dateStr} (${diffDays}d)`;
    return dateStr;
  };

  const statusColor: Record<string, string> = {
    open: "text-green-500",
    closed: "text-[var(--foreground-subtle)]",
    awarded: "text-blue-500",
    cancelled: "text-[var(--danger)]",
  };

  return (
    <button
      onClick={onClick}
      className="grid grid-cols-12 gap-2 px-5 py-3 text-sm hover:bg-[var(--background-tertiary)] transition-colors w-full text-left cursor-pointer"
    >
      <span
        className="col-span-3 text-[var(--foreground)] truncate"
        title={opportunity.title}
      >
        {opportunity.title}
      </span>
      <span
        className="col-span-2 text-[var(--foreground-muted)] truncate"
        title={opportunity.agency}
      >
        {opportunity.agency}
      </span>
      <span className="col-span-1 text-[var(--foreground-muted)] truncate">
        {opportunity.city ?? "-"}
      </span>
      <span className="col-span-1 text-[var(--foreground-muted)]">
        {opportunity.state ?? "-"}
      </span>
      <span className="col-span-1 text-right font-mono text-[var(--accent)]">
        {formatValue(opportunity.estimated_value)}
      </span>
      <span className="col-span-1 font-mono text-xs text-[var(--foreground-subtle)]">
        {opportunity.naics_code ?? "-"}
      </span>
      <span className={`col-span-1 text-xs capitalize ${statusColor[opportunity.status] ?? ""}`}>
        {opportunity.status}
      </span>
      <span className="col-span-2 text-right text-[var(--foreground-muted)]">
        {formatDeadline(opportunity.response_deadline)}
      </span>
    </button>
  );
}
