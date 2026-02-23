"use client";

import {
  Award,
  DollarSign,
  Building2,
  Hash,
} from "lucide-react";
import type { DashboardStatsResponse } from "./types";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

const cards = [
  {
    key: "total_awards" as const,
    label: "Federal Awards",
    icon: Award,
    format: formatNumber,
  },
  {
    key: "total_labor_rates" as const,
    label: "Labor Rates",
    icon: DollarSign,
    format: formatNumber,
  },
  {
    key: "total_agency_profiles" as const,
    label: "Agency Profiles",
    icon: Building2,
    format: formatNumber,
  },
  {
    key: "unique_naics_codes" as const,
    label: "NAICS Codes",
    icon: Hash,
    format: formatNumber,
  },
];

export function StatsCards({ stats }: { stats: DashboardStatsResponse }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div
          key={card.key}
          className={`group flex items-center gap-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] px-5 py-4 transition-all hover:border-[var(--accent)] hover:shadow-[var(--shadow-glow)] animate-fade-in-up stagger-${i + 1}`}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent-muted)]">
            <card.icon className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--foreground)]">
              {card.format(stats[card.key])}
            </p>
            <p className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">
              {card.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
