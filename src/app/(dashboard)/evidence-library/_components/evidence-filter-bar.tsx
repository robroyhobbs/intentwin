"use client";

import { Filter } from "lucide-react";
import { EVIDENCE_TYPES } from "./types";

interface EvidenceFilterBarProps {
  filterType: string;
  setFilterType: (value: string) => void;
  filterIndustry: string;
  setFilterIndustry: (value: string) => void;
  filterServiceLine: string;
  setFilterServiceLine: (value: string) => void;
  filterVerified: string;
  setFilterVerified: (value: string) => void;
}

export function EvidenceFilterBar({
  filterType,
  setFilterType,
  filterIndustry,
  setFilterIndustry,
  filterServiceLine,
  setFilterServiceLine,
  filterVerified,
  setFilterVerified,
}: EvidenceFilterBarProps) {
  return (
    <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)]">
      <Filter className="h-4 w-4 text-[var(--foreground-muted)]" />
      <select
        value={filterType}
        onChange={(e) => setFilterType(e.target.value)}
        className="rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-1.5 text-sm text-[var(--foreground)]"
      >
        <option value="">All Types</option>
        {EVIDENCE_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Industry..."
        value={filterIndustry}
        onChange={(e) => setFilterIndustry(e.target.value)}
        className="rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-1.5 text-sm text-[var(--foreground)] w-36"
      />
      <input
        type="text"
        placeholder="Service Line..."
        value={filterServiceLine}
        onChange={(e) => setFilterServiceLine(e.target.value)}
        className="rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-1.5 text-sm text-[var(--foreground)] w-36"
      />
      <select
        value={filterVerified}
        onChange={(e) => setFilterVerified(e.target.value)}
        className="rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-1.5 text-sm text-[var(--foreground)]"
      >
        <option value="">All Status</option>
        <option value="true">Verified</option>
        <option value="false">Unverified</option>
      </select>
    </div>
  );
}
