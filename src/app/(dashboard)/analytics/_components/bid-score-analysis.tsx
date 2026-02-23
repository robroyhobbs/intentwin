"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  Cell,
} from "recharts";
import { Target, TrendingUp, TrendingDown, CheckCircle2 } from "lucide-react";
import { DealOutcome } from "@/lib/constants/statuses";
import { COLORS } from "./chart-tooltips";
import type { AnalyticsData } from "./types";

type BidScoreData = NonNullable<AnalyticsData["bidScoreAnalysis"]>;

const FACTOR_LABELS: Record<string, string> = {
  requirement_match: "Req Match",
  past_performance: "Past Perf",
  capability_alignment: "Capability",
  timeline_feasibility: "Timeline",
  strategic_value: "Strategic",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BidScatterTooltip = ({ active, payload }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  return (
    <div
      style={{
        background: COLORS.backgroundSecondary,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
        padding: "10px 14px",
        maxWidth: 250,
      }}
    >
      <p
        style={{
          color: COLORS.foreground,
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 4,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {item.title}
      </p>
      <p style={{ color: COLORS.foregroundMuted, fontSize: 12 }}>
        Bid Score: {Math.round(item.bidScore)}
      </p>
      <p style={{ color: COLORS.foregroundMuted, fontSize: 12 }}>
        Recommendation: {item.recommendation}
      </p>
      <p style={{ color: COLORS.foregroundMuted, fontSize: 12 }}>
        Value: {item.dealValue != null ? `$${item.dealValue.toLocaleString()}` : "N/A"}
      </p>
      <p
        style={{
          color:
            item.outcome === DealOutcome.WON
              ? COLORS.success
              : item.outcome === DealOutcome.LOST
                ? COLORS.danger
                : COLORS.foregroundMuted,
          fontSize: 12,
          fontWeight: 600,
          textTransform: "capitalize",
        }}
      >
        {item.outcome}
      </p>
    </div>
  );
};

interface BidScoreAnalysisProps {
  data: BidScoreData;
  axisStyle: { fontSize: number; fill: string };
}

export function BidScoreAnalysis({ data, axisStyle }: BidScoreAnalysisProps) {
  if (data.totalScored === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
        <div className="flex items-center gap-3 mb-4">
          <Target className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Bid Score Analysis
          </h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-[var(--foreground-muted)]">
            No proposals with bid evaluations yet. Bid scoring runs during intake.
          </p>
        </div>
      </div>
    );
  }

  // Prepare scatter data
  const scatterWon = data.correlation
    .filter((d) => d.outcome === DealOutcome.WON)
    .map((d) => ({ ...d, x: d.bidScore, y: d.dealValue ?? 0 }));
  const scatterLost = data.correlation
    .filter((d) => d.outcome === DealOutcome.LOST)
    .map((d) => ({ ...d, x: d.bidScore, y: d.dealValue ?? 0 }));
  const scatterPending = data.correlation
    .filter((d) => d.outcome !== DealOutcome.WON && d.outcome !== DealOutcome.LOST)
    .map((d) => ({ ...d, x: d.bidScore, y: d.dealValue ?? 0 }));

  // Prepare factor breakdown bar chart data
  const factorChartData = data.factorBreakdown
    .filter((f) => f.avgWon !== null || f.avgLost !== null)
    .map((f) => ({
      name: FACTOR_LABELS[f.factor] || f.factor,
      Won: f.avgWon ?? 0,
      Lost: f.avgLost ?? 0,
    }));

  return (
    <div className="space-y-6">
      {/* Header + Summary Stats */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
        <div className="flex items-center gap-3 mb-6">
          <Target className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Bid Score Analysis
          </h2>
          <span className="text-xs text-[var(--foreground-muted)] ml-auto">
            {data.totalScored} scored proposal{data.totalScored !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Avg Bid Score — Won */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-[var(--success)]" />
              <span className="text-xs text-[var(--foreground-muted)]">Avg Score (Won)</span>
            </div>
            <p className="text-2xl font-bold text-[var(--success)]">
              {data.avgBidScoreWon !== null ? data.avgBidScoreWon : "--"}
            </p>
          </div>

          {/* Avg Bid Score — Lost */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-3.5 w-3.5 text-[var(--error)]" />
              <span className="text-xs text-[var(--foreground-muted)]">Avg Score (Lost)</span>
            </div>
            <p className="text-2xl font-bold text-[var(--error)]">
              {data.avgBidScoreLost !== null ? data.avgBidScoreLost : "--"}
            </p>
          </div>

          {/* "Bid" Accuracy */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span className="text-xs text-[var(--foreground-muted)]">&quot;Bid&quot; Accuracy</span>
            </div>
            <p className="text-2xl font-bold text-[var(--foreground)]">
              {data.bidAccuracy !== null ? `${data.bidAccuracy}%` : "--"}
            </p>
            <p className="text-[10px] text-[var(--foreground-subtle)]">
              % of &quot;bid&quot; recs that won
            </p>
          </div>

          {/* "Pass" Accuracy */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-[var(--warning)]" />
              <span className="text-xs text-[var(--foreground-muted)]">&quot;Pass&quot; Accuracy</span>
            </div>
            <p className="text-2xl font-bold text-[var(--foreground)]">
              {data.passAccuracy !== null ? `${data.passAccuracy}%` : "--"}
            </p>
            <p className="text-[10px] text-[var(--foreground-subtle)]">
              % of &quot;pass&quot; recs that lost
            </p>
          </div>
        </div>

        {/* Scatter: Bid Score vs Deal Value */}
        {data.correlation.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-[var(--foreground-muted)] mb-3">
              Bid Score vs Deal Value
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Bid Score"
                  domain={[0, 100]}
                  tick={axisStyle}
                  axisLine={{ stroke: COLORS.border }}
                  tickLine={{ stroke: COLORS.border }}
                  label={{ value: "Bid Score", position: "bottom", offset: -5, style: axisStyle }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Deal Value"
                  tick={axisStyle}
                  axisLine={{ stroke: COLORS.border }}
                  tickLine={{ stroke: COLORS.border }}
                  tickFormatter={(v: number) => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`}
                />
                <Tooltip content={<BidScatterTooltip />} />
                {scatterWon.length > 0 && (
                  <Scatter name="Won" data={scatterWon} fill={COLORS.success}>
                    {scatterWon.map((_, i) => (
                      <Cell key={i} fill={COLORS.success} fillOpacity={0.7} />
                    ))}
                  </Scatter>
                )}
                {scatterLost.length > 0 && (
                  <Scatter name="Lost" data={scatterLost} fill={COLORS.danger}>
                    {scatterLost.map((_, i) => (
                      <Cell key={i} fill={COLORS.danger} fillOpacity={0.7} />
                    ))}
                  </Scatter>
                )}
                {scatterPending.length > 0 && (
                  <Scatter name="Pending" data={scatterPending} fill={COLORS.foregroundMuted}>
                    {scatterPending.map((_, i) => (
                      <Cell key={i} fill={COLORS.foregroundMuted} fillOpacity={0.4} />
                    ))}
                  </Scatter>
                )}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Factor Breakdown: Won vs Lost */}
      {factorChartData.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
          <h3 className="text-sm font-medium text-[var(--foreground-muted)] mb-4">
            Factor Scores: Won vs Lost (Average)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={factorChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis
                dataKey="name"
                tick={axisStyle}
                axisLine={{ stroke: COLORS.border }}
                tickLine={{ stroke: COLORS.border }}
              />
              <YAxis
                domain={[0, 100]}
                tick={axisStyle}
                axisLine={{ stroke: COLORS.border }}
                tickLine={{ stroke: COLORS.border }}
              />
              <Tooltip
                contentStyle={{
                  background: COLORS.backgroundSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: COLORS.foreground, fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Won" fill={COLORS.success} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Lost" fill={COLORS.danger} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
