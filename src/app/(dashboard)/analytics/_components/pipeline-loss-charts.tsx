"use client";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Filter, TrendingDown } from "lucide-react";
import {
  COLORS,
  PIPELINE_COLORS,
  LOSS_COLORS,
  PipelineTooltip,
  LossTooltip,
} from "./chart-tooltips";

interface PipelineLossChartsProps {
  pipelineData: Array<{ stage: string; count: number }>;
  lossReasonsData: Array<{ reason: string; value: number }>;
  totalLosses: number;
  axisStyle: object;
}

export function PipelineLossCharts({
  pipelineData,
  lossReasonsData,
  totalLosses,
  axisStyle,
}: PipelineLossChartsProps) {
  return (
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
  );
}
