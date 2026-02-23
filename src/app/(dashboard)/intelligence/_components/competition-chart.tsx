"use client";

import { Shield } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = ["#C084FC", "#818CF8", "#34d399", "#ffaa00", "#ff4466", "#0066ff", "#F472B6"];

function formatLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface Props {
  data: Record<string, number>;
  title: string;
  subtitle: string;
}

export function CompetitionChart({ data, title, subtitle }: Props) {
  const entries = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([name, value]) => ({
      name: formatLabel(name),
      value,
    }));

  if (entries.length === 0) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center">
            <Shield className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2>
            <p className="text-xs text-[var(--foreground-muted)]">{subtitle}</p>
          </div>
        </div>
        <p className="text-sm text-[var(--foreground-muted)] text-center py-8">No data available</p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center">
          <Shield className="h-5 w-5 text-[var(--accent)]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2>
          <p className="text-xs text-[var(--foreground-muted)]">{subtitle}</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={entries}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {entries.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#0d1117",
              border: "1px solid #27272a",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#fff",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px", color: "#a0a0a0" }}
            formatter={(value: string) => (
              <span style={{ color: "#a0a0a0" }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
