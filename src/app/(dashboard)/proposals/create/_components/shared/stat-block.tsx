// ── StatBlock ───────────────────────────────────────────────────────────────
// Dashboard-style stat display: large accent number + small uppercase label.

type StatColor = "accent" | "success" | "warning" | "danger" | "muted";

const COLOR_MAP: Record<StatColor, string> = {
  accent: "text-[var(--accent)]",
  success: "text-emerald-400",
  warning: "text-amber-400",
  danger: "text-red-400",
  muted: "text-foreground",
};

interface StatBlockProps {
  label: string;
  value: string;
  color?: StatColor;
}

export function StatBlock({ label, value, color = "accent" }: StatBlockProps) {
  return (
    <div>
      <p className={`text-2xl font-bold ${COLOR_MAP[color]}`}>{value}</p>
      <p className="stat-label">{label}</p>
    </div>
  );
}
