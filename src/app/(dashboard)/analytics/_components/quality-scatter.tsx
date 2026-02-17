"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Sparkles } from "lucide-react";
import { COLORS, ScatterTooltip } from "./chart-tooltips";

interface ScatterDataItem {
  id: string;
  title: string;
  qualityScore: number;
  outcome: string;
  dealValue: number | null;
  x: number;
  y: number;
}

interface QualityScatterProps {
  scatterWon: ScatterDataItem[];
  scatterLost: ScatterDataItem[];
  scatterPending: ScatterDataItem[];
  axisStyle: object;
}

export function QualityScatter({
  scatterWon,
  scatterLost,
  scatterPending,
  axisStyle,
}: QualityScatterProps) {
  if (scatterWon.length === 0 && scatterLost.length === 0 && scatterPending.length === 0) {
    return null;
  }

  return (
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
  );
}
