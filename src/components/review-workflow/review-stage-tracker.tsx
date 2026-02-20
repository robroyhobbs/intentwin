"use client";

import { Check } from "lucide-react";
import { ReviewStageStatus } from "@/lib/constants/statuses";

// ── Types ──────────────────────────────────────────────────────────────────

interface Stage {
  id: string;
  stage: string;
  status: string;
  stage_order: number;
}

interface ReviewStageTrackerProps {
  stages: Stage[];
  activeStageId: string | null;
  onStageClick: (stageId: string) => void;
}

// ── Stage Color Map ────────────────────────────────────────────────────────

const STAGE_COLORS: Record<string, string> = {
  pink: "#ec4899",
  red: "#ef4444",
  gold: "#f59e0b",
  white: "#94a3b8",
};

const STAGE_LABELS: Record<string, string> = {
  pink: "Pink Team",
  red: "Red Team",
  gold: "Gold Team",
  white: "White Glove",
};

function getStageColor(stage: string): string {
  return STAGE_COLORS[stage.toLowerCase()] ?? "#94a3b8";
}

function getStageLabel(stage: string): string {
  return STAGE_LABELS[stage.toLowerCase()] ?? stage;
}

// ── Status Badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    completed: { bg: "rgba(0, 255, 136, 0.1)", text: "var(--success)" },
    active: { bg: "rgba(0, 102, 255, 0.15)", text: "#3b82f6" },
    pending: { bg: "rgba(148, 163, 184, 0.1)", text: "var(--foreground-subtle)" },
  };

  const style = colors[status] ?? colors[ReviewStageStatus.PENDING];

  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {status}
    </span>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export function ReviewStageTracker({
  stages,
  activeStageId,
  onStageClick,
}: ReviewStageTrackerProps) {
  const sorted = [...stages].sort((a, b) => a.stage_order - b.stage_order);

  return (
    <div className="w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-6">
      <div className="flex items-center justify-between relative">
        {/* Connector line behind the dots */}
        {sorted.length > 1 && (
          <div
            className="absolute top-5 h-[2px]"
            style={{
              left: `calc(${100 / sorted.length / 2}%)`,
              right: `calc(${100 / sorted.length / 2}%)`,
              background: `linear-gradient(to right, ${sorted.map((s) => getStageColor(s.stage)).join(", ")})`,
              opacity: 0.3,
            }}
          />
        )}

        {sorted.map((stage, idx) => {
          const color = getStageColor(stage.stage);
          const isActive = stage.id === activeStageId;
          const isCompleted = stage.status === ReviewStageStatus.COMPLETED;
          const isClickable = isCompleted || isActive;

          return (
            <div
              key={stage.id}
              className="flex flex-col items-center gap-2 relative z-10 flex-1"
            >
              {/* Dot / Circle */}
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStageClick(stage.id)}
                className="relative flex items-center justify-center transition-all duration-300"
                style={{
                  width: 40,
                  height: 40,
                  cursor: isClickable ? "pointer" : "default",
                }}
                aria-label={`${getStageLabel(stage.stage)} - ${stage.status}`}
              >
                {/* Background circle */}
                <span
                  className="absolute inset-0 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: isCompleted
                      ? color
                      : isActive
                        ? `${color}20`
                        : "transparent",
                    border: `2px solid ${isCompleted || isActive ? color : `${color}40`}`,
                  }}
                />

                {/* Pulsing ring for active stage */}
                {isActive && (
                  <span
                    className="absolute inset-[-4px] rounded-full animate-pulse"
                    style={{
                      border: `2px solid ${color}60`,
                    }}
                  />
                )}

                {/* Inner content: check or filled dot */}
                {isCompleted ? (
                  <Check
                    className="relative h-4 w-4"
                    style={{ color: "#0a0a0a" }}
                    strokeWidth={3}
                  />
                ) : isActive ? (
                  <span
                    className="relative h-3 w-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ) : null}
              </button>

              {/* Stage name */}
              <span
                className="text-xs font-semibold tracking-wide"
                style={{
                  color: isActive || isCompleted ? color : "var(--foreground-subtle)",
                }}
              >
                {getStageLabel(stage.stage)}
              </span>

              {/* Status badge */}
              <StatusBadge status={stage.status} />

              {/* Connector segment to next dot */}
              {idx < sorted.length - 1 && (
                <span
                  className="absolute top-5 h-[2px] z-[-1]"
                  style={{
                    left: "50%",
                    width: "100%",
                    backgroundColor:
                      isCompleted ? color : `${color}20`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
