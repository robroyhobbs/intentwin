"use client";

import type { BidIntelligenceContext } from "@/lib/ai/bid-scoring";

interface IntelStatsProps {
  intelligence: BidIntelligenceContext;
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 min-w-0 text-center">
      <div className="text-lg font-bold text-foreground">{value}</div>
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mt-0.5">
        {label}
      </div>
    </div>
  );
}

function formatCurrency(amount: number | null): string {
  if (amount === null) return "\u2014";
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

export function IntelStats({ intelligence }: IntelStatsProps) {
  const hasData =
    intelligence.agency_avg_offers !== null ||
    intelligence.agency_avg_amount !== null ||
    intelligence.win_probability !== null;

  if (!hasData) return null;

  const stats: { value: string; label: string }[] = [];

  if (intelligence.agency_avg_offers !== null) {
    stats.push({
      value: String(intelligence.agency_avg_offers),
      label: "Avg Offers",
    });
  }
  if (intelligence.agency_avg_amount !== null) {
    stats.push({
      value: formatCurrency(intelligence.agency_avg_amount),
      label: "Avg Award",
    });
  }
  if (intelligence.win_probability !== null) {
    const pct = Math.round(intelligence.win_probability.probability * 100);
    stats.push({ value: `${pct}%`, label: "Win Rate" });
  }
  if (intelligence.agency_total_awards !== null && stats.length < 4) {
    stats.push({
      value: String(intelligence.agency_total_awards),
      label: "Awards Tracked",
    });
  }

  return (
    <div
      data-testid="intel-stats"
      className="rounded-lg border border-border bg-card p-3"
    >
      <div className="flex items-center divide-x divide-border">
        {stats.map((s) => (
          <StatItem key={s.label} value={s.value} label={s.label} />
        ))}
      </div>
    </div>
  );
}
