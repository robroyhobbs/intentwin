// ── ScoreBar ────────────────────────────────────────────────────────────────
// Horizontal fill bar with label + score number.

function getBarColor(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
}

interface ScoreBarProps {
  label: string;
  score: number;
  maxScore?: number;
}

export function ScoreBar({ label, score, maxScore = 100 }: ScoreBarProps) {
  const pct = Math.min(100, Math.max(0, (score / maxScore) * 100));

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-36 shrink-0 truncate">
        {label}
      </span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          data-testid="score-fill"
          className={`h-full rounded-full transition-all duration-500 ${getBarColor(score)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums w-8 text-right">
        {score}
      </span>
    </div>
  );
}
