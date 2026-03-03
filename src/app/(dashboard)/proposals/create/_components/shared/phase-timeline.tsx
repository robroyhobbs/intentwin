"use client";

import type { CreatePhase } from "../create-types";

const PHASES: { key: CreatePhase; label: string }[] = [
  { key: "intake", label: "Intake" },
  { key: "strategy", label: "Strategy" },
  { key: "draft", label: "Draft" },
  { key: "finalize", label: "Finalize" },
];

interface PhaseTimelineProps {
  current: CreatePhase;
  completed: Set<CreatePhase>;
}

export function PhaseTimeline({ current, completed }: PhaseTimelineProps) {
  return (
    <div className="flex items-center gap-0">
      {PHASES.map((phase, idx) => {
        const isDone = completed.has(phase.key);
        const isCurrent = phase.key === current;

        return (
          <div key={phase.key} className="flex items-center">
            {idx > 0 && (
              <div
                className={`h-1 w-4 rounded-full ${isDone || isCurrent ? "bg-primary" : "bg-muted"}`}
              />
            )}
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                isDone
                  ? "bg-primary text-primary-foreground"
                  : isCurrent
                    ? "border-2 border-primary text-primary"
                    : "border-2 border-muted text-muted-foreground"
              }`}
              title={phase.label}
            >
              {isDone ? (
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                idx + 1
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
