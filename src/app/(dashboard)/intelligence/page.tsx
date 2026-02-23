"use client";

import { Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { useIntelligence } from "./_components/use-intelligence";
import { IntelligenceLoading } from "./_components/intelligence-loading";
import { NotConfigured } from "./_components/not-configured-view";
import dynamic from "next/dynamic";
import { StatsCards } from "./_components/stats-cards";
import { SourceAttribution } from "./_components/source-attribution";

const AwardsTimeline = dynamic(
  () => import("./_components/awards-timeline").then((m) => m.AwardsTimeline),
  { ssr: false },
);
const CompetitionChart = dynamic(
  () => import("./_components/competition-chart").then((m) => m.CompetitionChart),
  { ssr: false },
);
const TopAgenciesChart = dynamic(
  () => import("./_components/top-agencies-chart").then((m) => m.TopAgenciesChart),
  { ssr: false },
);
import type { DashboardStatsResponse } from "./_components/types";

export default function IntelligenceDashboard() {
  const router = useRouter();
  const { data, loading, error, configured } = useIntelligence<DashboardStatsResponse>(
    "/api/v1/awards/stats",
  );

  if (loading) {
    return <IntelligenceLoading icon={Globe} label="market intelligence" />;
  }

  if (!configured) {
    return <NotConfigured />;
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--foreground-muted)]">
          {error ?? "Failed to load intelligence data"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[var(--shadow-glow)]">
          <Globe className="h-6 w-6 text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Market Intelligence</h1>
          <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
            Real federal procurement data to inform your proposals
          </p>
        </div>
      </div>

      {/* Stats row */}
      <StatsCards stats={data} />

      {/* Timeline chart */}
      <AwardsTimeline data={data.awards_by_month} />

      {/* Two-column charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CompetitionChart
          data={data.competition_breakdown}
          title="Competition Types"
          subtitle="Award competition breakdown"
        />
        <CompetitionChart
          data={data.set_aside_breakdown}
          title="Set-Aside Types"
          subtitle="Small business set-aside distribution"
        />
      </div>

      {/* Top agencies */}
      <TopAgenciesChart data={data.top_agencies} />

      {/* Top NAICS table */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          Top NAICS Codes
        </h2>
        <div className="divide-y divide-[var(--border)]">
          <div className="grid grid-cols-3 gap-4 py-2 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
            <span>NAICS Code</span>
            <span className="text-right">Awards</span>
            <span className="text-right">Total Value</span>
          </div>
          {data.top_naics.map((item) => (
            <button
              key={item.code}
              onClick={() => router.push(`/intelligence/naics/${item.code}`)}
              className="grid grid-cols-3 gap-4 py-3 text-sm w-full text-left hover:bg-[var(--background-tertiary)] transition-colors rounded-lg px-2 -mx-2"
            >
              <span className="font-mono text-[var(--accent)] hover:underline">{item.code}</span>
              <span className="text-right text-[var(--foreground)]">
                {item.award_count.toLocaleString()}
              </span>
              <span className="text-right text-[var(--foreground-muted)]">
                ${(item.total_amount / 1_000_000).toFixed(1)}M
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Last updated */}
      <p className="text-xs text-[var(--foreground-subtle)] text-right">
        Data as of {new Date(data.last_updated).toLocaleDateString()}
      </p>

      <SourceAttribution />
    </div>
  );
}
