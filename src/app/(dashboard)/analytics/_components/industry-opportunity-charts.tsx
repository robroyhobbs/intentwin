"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Building2, Briefcase } from "lucide-react";
import { COLORS, CustomTooltip } from "./chart-tooltips";

interface IndustryOpportunityChartsProps {
  industryChartData: Array<{ name: string; Won: number; Lost: number }>;
  opportunityChartData: Array<{ name: string; Won: number; Lost: number }>;
  axisStyle: object;
}

export function IndustryOpportunityCharts({
  industryChartData,
  opportunityChartData,
  axisStyle,
}: IndustryOpportunityChartsProps) {
  return (
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
  );
}
