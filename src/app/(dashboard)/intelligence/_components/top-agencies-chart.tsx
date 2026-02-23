"use client";

import { Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const ACCENT = "#C084FC";
const MUTED = "#a0a0a0";
const GRID = "#27272a";

interface Props {
  data: { name: string; award_count: number; avg_amount: number | null }[];
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "..." : s;
}

export function TopAgenciesChart({ data }: Props) {
  const router = useRouter();
  const chartData = data.map((d) => ({
    ...d,
    shortName: truncate(d.name, 20),
  }));

  const handleBarClick = (entry: { name?: string }) => {
    if (entry.name) {
      router.push(`/intelligence/agencies?select=${encodeURIComponent(entry.name)}`);
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center">
          <Building2 className="h-5 w-5 text-[var(--accent)]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Top Agencies</h2>
          <p className="text-xs text-[var(--foreground-muted)]">By award count</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" stroke={MUTED} fontSize={11} tickLine={false} axisLine={false} />
          <YAxis
            dataKey="shortName"
            type="category"
            stroke={MUTED}
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={150}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0d1117",
              border: "1px solid #27272a",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#fff",
            }}
            formatter={(value) => [Number(value).toLocaleString(), "Awards"]}
            labelFormatter={(label) => {
              const full = data.find((d) => truncate(d.name, 20) === String(label));
              return full?.name ?? String(label);
            }}
          />
          <Bar dataKey="award_count" fill={ACCENT} radius={[0, 4, 4, 0]} name="Awards" className="cursor-pointer" onClick={handleBarClick} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
