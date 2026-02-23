"use client";

import { Calendar } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const ACCENT = "#C084FC";
const ACCENT_DIM = "rgba(192, 132, 252, 0.15)";
const MUTED = "#a0a0a0";
const GRID = "#27272a";

interface Props {
  data: { month: string; count: number }[];
}

export function AwardsTimeline({ data }: Props) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center">
          <Calendar className="h-5 w-5 text-[var(--accent)]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Awards Over Time</h2>
          <p className="text-xs text-[var(--foreground-muted)]">Monthly award counts (last 24 months)</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="awardGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={ACCENT} stopOpacity={0.3} />
              <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            stroke={MUTED}
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: string) => {
              const [, m] = v.split("-");
              const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
              return months[parseInt(m, 10) - 1] ?? v;
            }}
          />
          <YAxis stroke={MUTED} fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0d1117",
              border: "1px solid #27272a",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#fff",
            }}
            labelFormatter={(v) => `Month: ${String(v)}`}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke={ACCENT}
            strokeWidth={2}
            fill="url(#awardGrad)"
            name="Awards"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
