"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  Zap,
} from "lucide-react";
import { DealOutcome } from "@/lib/constants/statuses";
import type { AnalyticsData } from "./_components/types";
import { COLORS } from "./_components/chart-tooltips";
import { SummaryStats } from "./_components/summary-stats";
import { WinRateTrend } from "./_components/win-rate-trend";
import { PipelineLossCharts } from "./_components/pipeline-loss-charts";
import { IndustryOpportunityCharts } from "./_components/industry-opportunity-charts";
import { QualityScatter } from "./_components/quality-scatter";
import { RecentOutcomes } from "./_components/recent-outcomes";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const response = await fetch("/api/analytics/outcomes");
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error("Failed to load analytics:", error);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <BarChart3 className="h-8 w-8 text-[var(--accent)] animate-pulse" />
          <p className="text-sm text-[var(--foreground-muted)]">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--foreground-muted)]">Failed to load analytics</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  const formatLabel = (key: string) => {
    return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Prepare monthly trends data
  const monthlyTrends = (data.monthlyTrends ?? []).map((item) => ({
    ...item,
    monthLabel: item.month,
  }));

  // Prepare pipeline funnel data
  const pipelineData = data.pipelineFunnel
    ? [
        { stage: "Draft", count: data.pipelineFunnel.draft },
        { stage: "Intake", count: data.pipelineFunnel.intake },
        { stage: "Generating", count: data.pipelineFunnel.generating },
        { stage: "Review", count: data.pipelineFunnel.review },
        { stage: "Final", count: data.pipelineFunnel.final },
        { stage: "Exported", count: data.pipelineFunnel.exported },
      ]
    : [];

  // Prepare loss reasons for pie chart
  const lossReasonsData = Object.entries(data.lossReasons)
    .sort((a, b) => b[1] - a[1])
    .map(([reason, count]) => ({
      reason: formatLabel(reason),
      value: count,
    }));

  const totalLosses = lossReasonsData.reduce((sum, d) => sum + d.value, 0);

  // Prepare industry data for bar chart
  const industryChartData = Object.entries(data.byIndustry)
    .filter(([, stats]) => stats.total > 0)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 8)
    .map(([industry, stats]) => ({
      name: formatLabel(industry),
      Won: stats.won,
      Lost: stats.lost,
    }));

  // Prepare opportunity type data for bar chart
  const opportunityChartData = Object.entries(data.byOpportunityType)
    .filter(([, stats]) => stats.total > 0)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([type, stats]) => ({
      name: formatLabel(type),
      Won: stats.won,
      Lost: stats.lost,
    }));

  // Prepare scatter data
  const scatterData = (data.qualityCorrelation ?? []).map((item) => ({
    ...item,
    x: item.qualityScore,
    y: item.dealValue ?? 0,
  }));

  const scatterWon = scatterData.filter((d) => d.outcome === DealOutcome.WON);
  const scatterLost = scatterData.filter((d) => d.outcome === DealOutcome.LOST);
  const scatterPending = scatterData.filter(
    (d) => d.outcome !== DealOutcome.WON && d.outcome !== DealOutcome.LOST
  );

  const axisStyle = {
    fontSize: 11,
    fill: COLORS.foregroundMuted,
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[var(--shadow-glow)]">
            <BarChart3 className="h-6 w-6 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              Win/Loss Analytics
            </h1>
            <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
              Track outcomes and learn from every proposal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--accent-muted)] bg-[var(--accent-subtle)]">
          <Zap className="h-4 w-4 text-[var(--accent)]" />
          <span className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wide">
            Compounding Loop
          </span>
        </div>
      </div>

      {/* Summary Stats */}
      <SummaryStats
        summary={data.summary}
        avgDaysToClose={data.avgDaysToClose}
        formatCurrency={formatCurrency}
      />

      {/* Win Rate Trend (full width) */}
      <WinRateTrend monthlyTrends={monthlyTrends} axisStyle={axisStyle} />

      {/* Pipeline & Loss Analysis (2 columns) */}
      <PipelineLossCharts
        pipelineData={pipelineData}
        lossReasonsData={lossReasonsData}
        totalLosses={totalLosses}
        axisStyle={axisStyle}
      />

      {/* Industry & Opportunity (2 columns) */}
      <IndustryOpportunityCharts
        industryChartData={industryChartData}
        opportunityChartData={opportunityChartData}
        axisStyle={axisStyle}
      />

      {/* Quality vs Outcome (full width) */}
      <QualityScatter
        scatterWon={scatterWon}
        scatterLost={scatterLost}
        scatterPending={scatterPending}
        axisStyle={axisStyle}
      />

      {/* Recent Outcomes & Proposals List */}
      <RecentOutcomes
        recentOutcomes={data.recentOutcomes}
        proposals={data.proposals}
        formatCurrency={formatCurrency}
        formatLabel={formatLabel}
      />
    </div>
  );
}
