"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingDown,
  Trophy,
  XCircle,
  Clock,
  BarChart3,
  Target,
  Zap,
  ArrowUpRight,
  Building2,
  Briefcase,
  Activity,
  Filter,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface AnalyticsData {
  summary: {
    total: number;
    won: number;
    lost: number;
    pending: number;
    noDecision: number;
    winRate: number;
    totalWonValue: number;
  };
  byIndustry: Record<string, { won: number; lost: number; total: number }>;
  byOpportunityType: Record<string, { won: number; lost: number; total: number }>;
  lossReasons: Record<string, number>;
  recentOutcomes: Array<{
    id: string;
    title: string;
    outcome: string;
    value?: number;
    industry?: string;
    date: string;
  }>;
  proposals: Array<{
    id: string;
    title: string;
    status: string;
    dealOutcome: string;
    dealValue?: number;
    industry?: string;
    opportunityType?: string;
    clientName?: string;
    createdAt: string;
  }>;
  monthlyTrends?: Array<{
    month: string;
    proposalsCreated: number;
    won: number;
    lost: number;
    winRate: number;
    totalValue: number;
  }>;
  pipelineFunnel?: {
    draft: number;
    intake: number;
    generating: number;
    review: number;
    final: number;
    exported: number;
  };
  qualityCorrelation?: Array<{
    id: string;
    title: string;
    qualityScore: number;
    outcome: string;
    dealValue: number | null;
  }>;
  avgDaysToClose?: number;
}

// Theme-matched hex colors
const COLORS = {
  accent: "#00FF88",
  accentDim: "#00cc6a",
  success: "#00FF88",
  danger: "#FF4466",
  warning: "#FFAA00",
  info: "#0066FF",
  purple: "#8b5cf6",
  cyan: "#12ABDB",
  foreground: "#ffffff",
  foregroundMuted: "#a0a0a0",
  foregroundSubtle: "#666666",
  background: "#0a0a0a",
  backgroundSecondary: "#111111",
  backgroundTertiary: "#1a1a1a",
  border: "#2a2a2a",
  cardBg: "#111111",
};

const PIPELINE_COLORS = [
  COLORS.foregroundMuted,
  COLORS.info,
  COLORS.purple,
  COLORS.warning,
  COLORS.cyan,
  COLORS.accent,
];

const LOSS_COLORS = [
  COLORS.danger,
  "#cc3355",
  "#ff6688",
  "#ff8899",
  "#ee5577",
  "#dd4466",
  "#bb2244",
  "#ff7799",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      style={{
        background: COLORS.backgroundSecondary,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
        padding: "10px 14px",
      }}
    >
      <p
        style={{
          color: COLORS.foreground,
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        {label}
      </p>
      {payload.map(
        (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          entry: any,
          index: number
        ) => (
          <p key={index} style={{ color: entry.color, fontSize: 12, margin: "2px 0" }}>
            {entry.name}: {entry.value}
            {entry.name === "Win Rate" ? "%" : ""}
          </p>
        )
      )}
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PipelineTooltip = ({ active, payload }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  return (
    <div
      style={{
        background: COLORS.backgroundSecondary,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
        padding: "10px 14px",
      }}
    >
      <p style={{ color: COLORS.foreground, fontSize: 12, fontWeight: 600 }}>
        {item.payload.stage}
      </p>
      <p style={{ color: item.color || COLORS.accent, fontSize: 12, marginTop: 4 }}>
        Count: {item.value}
      </p>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LossTooltip = ({ active, payload }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  return (
    <div
      style={{
        background: COLORS.backgroundSecondary,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
        padding: "10px 14px",
      }}
    >
      <p style={{ color: COLORS.foreground, fontSize: 12, fontWeight: 600 }}>
        {item.payload.reason}
      </p>
      <p style={{ color: COLORS.danger, fontSize: 12, marginTop: 4 }}>
        Count: {item.value}
      </p>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ScatterTooltip = ({ active, payload }: any) => {
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
        Quality: {item.qualityScore}
      </p>
      <p style={{ color: COLORS.foregroundMuted, fontSize: 12 }}>
        Value: {item.dealValue != null ? `$${item.dealValue.toLocaleString()}` : "N/A"}
      </p>
      <p
        style={{
          color:
            item.outcome === "won"
              ? COLORS.success
              : item.outcome === "lost"
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

  const scatterWon = scatterData.filter((d) => d.outcome === "won");
  const scatterLost = scatterData.filter((d) => d.outcome === "lost");
  const scatterPending = scatterData.filter(
    (d) => d.outcome !== "won" && d.outcome !== "lost"
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
      <div className="grid grid-cols-6 gap-4">
        <div className="group flex flex-col rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-5 transition-all hover:border-[var(--accent)] hover:shadow-[var(--shadow-glow)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">
              Win Rate
            </span>
            <div className="h-9 w-9 rounded-lg bg-[var(--accent-subtle)] flex items-center justify-center">
              <Target className="h-5 w-5 text-[var(--accent)]" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-[var(--accent)]">
            {data.summary.winRate}%
          </p>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">
            {data.summary.won} won / {data.summary.won + data.summary.lost} decided
          </p>
        </div>

        <div className="group flex flex-col rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-5 transition-all hover:border-[var(--success)] hover:shadow-[0_0_20px_rgba(0,255,136,0.15)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">
              Won
            </span>
            <div className="h-9 w-9 rounded-lg bg-[var(--success-subtle)] flex items-center justify-center">
              <Trophy className="h-5 w-5 text-[var(--success)]" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-[var(--success)]">
            {data.summary.won}
          </p>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">
            {formatCurrency(data.summary.totalWonValue)} total value
          </p>
        </div>

        <div className="group flex flex-col rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-5 transition-all hover:border-[var(--danger)] hover:shadow-[0_0_20px_rgba(255,68,102,0.15)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">
              Lost
            </span>
            <div className="h-9 w-9 rounded-lg bg-[var(--danger-subtle)] flex items-center justify-center">
              <XCircle className="h-5 w-5 text-[var(--danger)]" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-[var(--danger)]">
            {data.summary.lost}
          </p>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">opportunities lost</p>
        </div>

        <div className="group flex flex-col rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-5 transition-all hover:border-[var(--warning)] hover:shadow-[0_0_20px_rgba(255,170,0,0.15)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">
              Pending
            </span>
            <div className="h-9 w-9 rounded-lg bg-[var(--warning-subtle)] flex items-center justify-center">
              <Clock className="h-5 w-5 text-[var(--warning)]" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-[var(--warning)]">
            {data.summary.pending}
          </p>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">awaiting outcome</p>
        </div>

        <div className="group flex flex-col rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-5 transition-all hover:border-[var(--info)] hover:shadow-[0_0_20px_rgba(0,102,255,0.15)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">
              Total
            </span>
            <div className="h-9 w-9 rounded-lg bg-[var(--info-subtle)] flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-[var(--info)]" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-[var(--foreground)]">
            {data.summary.total}
          </p>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">total proposals</p>
        </div>

        <div className="group flex flex-col rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-5 transition-all hover:border-[var(--purple)] hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">
              Avg Days to Close
            </span>
            <div className="h-9 w-9 rounded-lg bg-[rgba(139,92,246,0.1)] flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-[#8b5cf6]" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-[#8b5cf6]">
            {data.avgDaysToClose != null ? data.avgDaysToClose : "--"}
          </p>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">
            average closing time
          </p>
        </div>
      </div>

      {/* Win Rate Trend (full width) */}
      {monthlyTrends.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center">
              <Activity className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Win Rate Trend
              </h2>
              <p className="text-xs text-[var(--foreground-muted)]">
                Monthly win rate and proposal volume
              </p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={monthlyTrends}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="winRateGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.accent} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={COLORS.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis
                dataKey="monthLabel"
                tick={axisStyle}
                axisLine={{ stroke: COLORS.border }}
                tickLine={{ stroke: COLORS.border }}
              />
              <YAxis
                yAxisId="left"
                tick={axisStyle}
                axisLine={{ stroke: COLORS.border }}
                tickLine={{ stroke: COLORS.border }}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={axisStyle}
                axisLine={{ stroke: COLORS.border }}
                tickLine={{ stroke: COLORS.border }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, color: COLORS.foregroundMuted }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="winRate"
                name="Win Rate"
                stroke={COLORS.accent}
                strokeWidth={2}
                fill="url(#winRateGradient)"
                dot={{ fill: COLORS.accent, strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: COLORS.accent, strokeWidth: 0 }}
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="proposalsCreated"
                name="Proposals Created"
                stroke={COLORS.foregroundMuted}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="transparent"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Pipeline & Loss Analysis (2 columns) */}
      <div className="grid grid-cols-2 gap-6">
        {/* Pipeline Funnel */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-[var(--info-subtle)] flex items-center justify-center">
              <Filter className="h-5 w-5 text-[var(--info)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Pipeline Funnel
              </h2>
              <p className="text-xs text-[var(--foreground-muted)]">
                Proposals by stage
              </p>
            </div>
          </div>

          {pipelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={pipelineData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={COLORS.border}
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={axisStyle}
                  axisLine={{ stroke: COLORS.border }}
                  tickLine={{ stroke: COLORS.border }}
                />
                <YAxis
                  type="category"
                  dataKey="stage"
                  tick={axisStyle}
                  axisLine={{ stroke: COLORS.border }}
                  tickLine={{ stroke: COLORS.border }}
                  width={80}
                />
                <Tooltip content={<PipelineTooltip />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                  {pipelineData.map((_, index) => (
                    <Cell
                      key={`pipeline-cell-${index}`}
                      fill={PIPELINE_COLORS[index % PIPELINE_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-sm text-[var(--foreground-muted)]">
                Pipeline data not yet available
              </p>
            </div>
          )}
        </div>

        {/* Loss Reasons - Donut Pie Chart */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-[var(--danger-subtle)] flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-[var(--danger)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Loss Reasons
              </h2>
              <p className="text-xs text-[var(--foreground-muted)]">
                Why deals were lost
              </p>
            </div>
          </div>

          {lossReasonsData.length === 0 ? (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-sm text-[var(--foreground-muted)]">
                No loss reasons recorded yet
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={lossReasonsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="reason"
                  stroke={COLORS.backgroundSecondary}
                  strokeWidth={2}
                >
                  {lossReasonsData.map((_, index) => (
                    <Cell
                      key={`loss-cell-${index}`}
                      fill={LOSS_COLORS[index % LOSS_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<LossTooltip />} />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: COLORS.foregroundMuted, fontSize: 11 }}>
                      {value}
                    </span>
                  )}
                  wrapperStyle={{ fontSize: 11 }}
                />
                {/* Center text */}
                <text
                  x="50%"
                  y="46%"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={COLORS.danger}
                  fontSize={24}
                  fontWeight={700}
                >
                  {totalLosses}
                </text>
                <text
                  x="50%"
                  y="56%"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={COLORS.foregroundMuted}
                  fontSize={11}
                >
                  Total Losses
                </text>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Industry & Opportunity (2 columns) */}
      <div className="grid grid-cols-2 gap-6">
        {/* By Industry */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center">
              <Building2 className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                By Industry
              </h2>
              <p className="text-xs text-[var(--foreground-muted)]">
                Win/loss across client industries
              </p>
            </div>
          </div>

          {industryChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={industryChartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={COLORS.border}
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={axisStyle}
                  axisLine={{ stroke: COLORS.border }}
                  tickLine={{ stroke: COLORS.border }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  height={60}
                />
                <YAxis
                  tick={axisStyle}
                  axisLine={{ stroke: COLORS.border }}
                  tickLine={{ stroke: COLORS.border }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: COLORS.foregroundMuted }}
                />
                <Bar
                  dataKey="Won"
                  stackId="a"
                  fill={COLORS.success}
                  radius={[0, 0, 0, 0]}
                  barSize={28}
                />
                <Bar
                  dataKey="Lost"
                  stackId="a"
                  fill={COLORS.danger}
                  radius={[4, 4, 0, 0]}
                  barSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-sm text-[var(--foreground-muted)]">
                No industry data available
              </p>
            </div>
          )}
        </div>

        {/* By Opportunity Type */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                By Opportunity Type
              </h2>
              <p className="text-xs text-[var(--foreground-muted)]">
                Win/loss by engagement type
              </p>
            </div>
          </div>

          {opportunityChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={opportunityChartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={COLORS.border}
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={axisStyle}
                  axisLine={{ stroke: COLORS.border }}
                  tickLine={{ stroke: COLORS.border }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  height={60}
                />
                <YAxis
                  tick={axisStyle}
                  axisLine={{ stroke: COLORS.border }}
                  tickLine={{ stroke: COLORS.border }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: COLORS.foregroundMuted }}
                />
                <Bar
                  dataKey="Won"
                  stackId="a"
                  fill={COLORS.success}
                  radius={[0, 0, 0, 0]}
                  barSize={28}
                />
                <Bar
                  dataKey="Lost"
                  stackId="a"
                  fill={COLORS.danger}
                  radius={[4, 4, 0, 0]}
                  barSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-sm text-[var(--foreground-muted)]">
                No opportunity type data available
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quality vs Outcome (full width) */}
      {scatterData.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-[rgba(139,92,246,0.1)] flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-[#8b5cf6]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Quality vs Outcome
              </h2>
              <p className="text-xs text-[var(--foreground-muted)]">
                Proposal quality score correlated with deal value and outcome
              </p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis
                type="number"
                dataKey="x"
                name="Quality Score"
                domain={[0, 100]}
                tick={axisStyle}
                axisLine={{ stroke: COLORS.border }}
                tickLine={{ stroke: COLORS.border }}
                label={{
                  value: "Quality Score",
                  position: "insideBottom",
                  offset: -5,
                  style: { fill: COLORS.foregroundMuted, fontSize: 11 },
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Deal Value"
                tick={axisStyle}
                axisLine={{ stroke: COLORS.border }}
                tickLine={{ stroke: COLORS.border }}
                tickFormatter={(v) => {
                  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
                  if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
                  return `$${v}`;
                }}
                label={{
                  value: "Deal Value",
                  angle: -90,
                  position: "insideLeft",
                  offset: 0,
                  style: { fill: COLORS.foregroundMuted, fontSize: 11 },
                }}
              />
              <Tooltip content={<ScatterTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, color: COLORS.foregroundMuted }}
              />
              {scatterWon.length > 0 && (
                <Scatter
                  name="Won"
                  data={scatterWon}
                  fill={COLORS.success}
                  opacity={0.8}
                />
              )}
              {scatterLost.length > 0 && (
                <Scatter
                  name="Lost"
                  data={scatterLost}
                  fill={COLORS.danger}
                  opacity={0.8}
                />
              )}
              {scatterPending.length > 0 && (
                <Scatter
                  name="Pending"
                  data={scatterPending}
                  fill={COLORS.foregroundMuted}
                  opacity={0.6}
                />
              )}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Outcomes */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center">
            <Clock className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Recent Outcomes
            </h2>
            <p className="text-xs text-[var(--foreground-muted)]">
              Latest proposal results
            </p>
          </div>
        </div>

        {data.recentOutcomes.length === 0 ? (
          <p className="text-sm text-[var(--foreground-muted)] text-center py-8">
            No outcomes recorded yet
          </p>
        ) : (
          <div className="space-y-3">
            {data.recentOutcomes.map((outcome) => (
              <Link
                key={outcome.id}
                href={`/proposals/${outcome.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-[var(--background-tertiary)] hover:bg-[var(--background-elevated)] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      outcome.outcome === "won"
                        ? "bg-[var(--success-subtle)]"
                        : "bg-[var(--danger-subtle)]"
                    }`}
                  >
                    {outcome.outcome === "won" ? (
                      <Trophy className="h-4 w-4 text-[var(--success)]" />
                    ) : (
                      <XCircle className="h-4 w-4 text-[var(--danger)]" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)] truncate max-w-[200px]">
                      {outcome.title}
                    </p>
                    <p className="text-xs text-[var(--foreground-muted)] capitalize">
                      {outcome.industry?.replace(/_/g, " ") || "Unknown industry"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {outcome.value && (
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {formatCurrency(outcome.value)}
                    </span>
                  )}
                  <ArrowUpRight className="h-4 w-4 text-[var(--foreground-subtle)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Proposals List */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            All Proposals
          </h2>
          <p className="text-xs text-[var(--foreground-muted)]">
            Click to update outcome
          </p>
        </div>

        <div className="divide-y divide-[var(--border-subtle)]">
          {data.proposals.map((proposal) => (
            <Link
              key={proposal.id}
              href={`/proposals/${proposal.id}`}
              className="flex items-center justify-between p-4 hover:bg-[var(--background-tertiary)] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    proposal.dealOutcome === "won"
                      ? "bg-[var(--success-subtle)]"
                      : proposal.dealOutcome === "lost"
                      ? "bg-[var(--danger-subtle)]"
                      : "bg-[var(--warning-subtle)]"
                  }`}
                >
                  {proposal.dealOutcome === "won" ? (
                    <Trophy className="h-5 w-5 text-[var(--success)]" />
                  ) : proposal.dealOutcome === "lost" ? (
                    <XCircle className="h-5 w-5 text-[var(--danger)]" />
                  ) : (
                    <Clock className="h-5 w-5 text-[var(--warning)]" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {proposal.title}
                  </p>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    {proposal.clientName || "Unknown client"} &bull;{" "}
                    {formatLabel(proposal.opportunityType || "unknown")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {proposal.dealValue && (
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {formatCurrency(proposal.dealValue)}
                  </span>
                )}
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                    proposal.dealOutcome === "won"
                      ? "bg-[var(--success-subtle)] text-[var(--success)]"
                      : proposal.dealOutcome === "lost"
                      ? "bg-[var(--danger-subtle)] text-[var(--danger)]"
                      : "bg-[var(--warning-subtle)] text-[var(--warning)]"
                  }`}
                >
                  {proposal.dealOutcome || "pending"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
