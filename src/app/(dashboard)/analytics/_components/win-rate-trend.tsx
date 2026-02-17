"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Activity } from "lucide-react";
import { COLORS, CustomTooltip } from "./chart-tooltips";

interface WinRateTrendProps {
  monthlyTrends: Array<{
    month: string;
    proposalsCreated: number;
    won: number;
    lost: number;
    winRate: number;
    totalValue: number;
    monthLabel: string;
  }>;
  axisStyle: object;
}

export function WinRateTrend({ monthlyTrends, axisStyle }: WinRateTrendProps) {
  if (monthlyTrends.length === 0) return null;

  return (
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
  );
}
