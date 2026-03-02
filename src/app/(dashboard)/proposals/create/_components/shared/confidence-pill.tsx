"use client";

// ── Confidence Pill ─────────────────────────────────────────────────────────
// Color-coded badge showing confidence score.
// Red (< 40) / Amber (40-69) / Green (70+)

interface ConfidencePillProps {
  score: number;
}

function getScoreStyle(score: number): string {
  if (score < 40) {
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  }
  if (score < 70) {
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
  }
  return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
}

export function ConfidencePill({ score }: ConfidencePillProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const style = getScoreStyle(clamped);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${style}`}
    >
      {clamped}%
    </span>
  );
}
