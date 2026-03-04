"use client";

import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { JudgeInfoData } from "./types";

// ============================================================
// Constants
// ============================================================

export const DIMENSION_LABELS: Record<string, string> = {
  content_quality: "Content Quality",
  client_fit: "Client Fit",
  evidence: "Evidence",
  brand_voice: "Brand Voice",
  grounding: "Grounding",
};

export const JUDGE_ICONS: Record<string, string> = {
  "gpt-4o": "\u{1F916}",
  "llama-3.3-70b": "\u{1F999}",
  "mistral-small": "\u{1F300}",
};

// ============================================================
// Utility functions
// ============================================================

export function formatSectionType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function scoreColor(score: number): string {
  if (score >= 9) return "var(--success)";
  if (score >= 8) return "var(--warning, #f59e0b)";
  return "var(--danger)";
}

// ============================================================
// Helper components
// ============================================================

export function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = (score / max) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-[var(--background-tertiary)]">
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: scoreColor(score) }}
        />
      </div>
      <span className="text-xs font-mono w-6 text-right">{score}</span>
    </div>
  );
}

export function ConsensusIndicator({
  consensus,
  judgeCount,
  totalJudges,
}: {
  consensus: string;
  judgeCount: number;
  totalJudges: number;
}) {
  const config: Record<string, { color: string; label: string }> = {
    unanimous: { color: "var(--success)", label: "Unanimous" },
    majority: { color: "var(--warning, #f59e0b)", label: "Majority" },
    split: { color: "var(--danger)", label: "Split" },
  };
  const c = config[consensus] || config.split;

  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{ backgroundColor: c.color }}
      />
      <span className="text-xs font-medium" style={{ color: c.color }}>
        {c.label}
      </span>
      <span className="text-xs text-[var(--foreground-muted)]">
        {judgeCount}/{totalJudges} judges
      </span>
    </div>
  );
}

export function JudgeCard({
  judge,
}: {
  judge: JudgeInfoData & { score?: number; pass?: boolean };
}) {
  const icon = JUDGE_ICONS[judge.judge_id] || "\u{1F916}";
  const isFailed = judge.status === "failed" || judge.status === "timeout";

  if (isFailed) {
    return (
      <div className="flex-1 min-w-[120px] border border-[var(--border)] rounded-lg p-3 bg-[var(--background-secondary)] opacity-70">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-sm">{icon}</span>
          <span className="text-xs font-medium text-[var(--foreground)] truncate">
            {judge.judge_name}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
          <AlertTriangle className="h-3 w-3 text-[var(--warning, #f59e0b)]" />
          <span>Unavailable</span>
        </div>
        {judge.error && (
          <p className="text-[10px] text-[var(--foreground-muted)] mt-1 truncate">
            {judge.error}
          </p>
        )}
      </div>
    );
  }

  const passColor = judge.pass ? "var(--success)" : "var(--warning, #f59e0b)";

  return (
    <div className="flex-1 min-w-[120px] border border-[var(--border)] rounded-lg p-3 bg-[var(--card-bg)]">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-xs font-medium text-[var(--foreground)] truncate">
          {judge.judge_name}
        </span>
      </div>
      <div
        className="text-lg font-bold font-mono"
        style={{ color: scoreColor(judge.score ?? 0) }}
      >
        {judge.score?.toFixed(1) ?? "\u2013"}
      </div>
      <div className="flex items-center gap-1 text-xs mt-0.5">
        {judge.pass ? (
          <CheckCircle2 className="h-3 w-3 text-[var(--success)]" />
        ) : (
          <XCircle className="h-3 w-3 text-[var(--warning, #f59e0b)]" />
        )}
        <span style={{ color: passColor }}>
          {judge.pass ? "Pass" : "Needs work"}
        </span>
      </div>
    </div>
  );
}
