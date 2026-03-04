"use client";

import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils/cn";

// ── Elapsed time display ────────────────────────────────────────────────────

function ElapsedTime() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const label = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  return (
    <span
      className="text-xs text-muted-foreground tabular-nums"
      aria-live="polite"
      aria-atomic="true"
    >
      {label}
    </span>
  );
}

// ── Status counts ───────────────────────────────────────────────────────────

function StatusCounts({
  completed,
  remaining,
  failed,
}: {
  completed: number;
  remaining: number;
  failed: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-300 tabular-nums">
        {completed} complete
      </span>
      <span className="rounded-full border border-border bg-background/60 px-2 py-0.5 text-muted-foreground tabular-nums">
        {remaining} remaining
      </span>
      {failed > 0 && (
        <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-destructive tabular-nums">
          {failed} failed
        </span>
      )}
    </div>
  );
}

// ── Progress summary card ───────────────────────────────────────────────────

interface ProgressSummaryProps {
  total: number;
  completed: number;
  failed: number;
  isGenerating: boolean;
}

export function DraftProgressSummary({
  total,
  completed,
  failed,
  isGenerating,
}: ProgressSummaryProps) {
  const pct = useMemo(
    () => (total > 0 ? Math.round((completed / total) * 100) : 0),
    [total, completed],
  );
  const remaining = Math.max(0, total - completed - failed);

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Generation Progress</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {completed}/{total} sections completed
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold tabular-nums">{pct}%</p>
          {isGenerating && <ElapsedTime />}
        </div>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full bg-primary transition-all duration-500",
            isGenerating
              ? "motion-safe:animate-pulse motion-reduce:animate-none"
              : "",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <StatusCounts
        completed={completed}
        remaining={remaining}
        failed={failed}
      />
    </div>
  );
}
