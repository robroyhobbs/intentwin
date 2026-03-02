"use client";

import type { CreatePhase } from "./create-types";
import { useCreateFlow } from "./create-provider";

const PHASES: { key: CreatePhase; label: string }[] = [
  { key: "intake", label: "Intake" },
  { key: "strategy", label: "Strategy" },
  { key: "draft", label: "Draft" },
  { key: "finalize", label: "Finalize" },
];

interface PhaseStripProps {
  currentPhase: CreatePhase;
  completedPhases: Set<CreatePhase>;
}

function isPhaseReachable(
  key: CreatePhase,
  current: CreatePhase,
  completed: Set<CreatePhase>,
): boolean {
  if (key === current || completed.has(key)) return true;
  // Allow clicking the next phase after the last completed one
  const idx = PHASES.findIndex((p) => p.key === key);
  if (idx === 0) return true;
  return completed.has(PHASES[idx - 1].key);
}

export function PhaseStrip({ currentPhase, completedPhases }: PhaseStripProps) {
  const { dispatch } = useCreateFlow();

  return (
    <div className="flex items-center gap-1 px-4 sm:px-8 py-3 sm:py-4 border-b border-border bg-background overflow-x-auto">
      {PHASES.map(({ key, label }, i) => {
        const isActive = currentPhase === key;
        const isCompleted = completedPhases.has(key);
        const reachable = isPhaseReachable(key, currentPhase, completedPhases);

        return (
          <div key={key} className="flex items-center shrink-0">
            {i > 0 && (
              <div
                className={`w-4 sm:w-8 h-px mx-0.5 sm:mx-1 ${
                  isCompleted || isActive ? "bg-primary" : "bg-border"
                }`}
              />
            )}
            <button
              onClick={() =>
                reachable && dispatch({ type: "SET_PHASE", phase: key })
              }
              disabled={!reachable}
              className={`
                px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all
                ${isActive ? "bg-primary text-primary-foreground shadow-sm" : ""}
                ${isCompleted && !isActive ? "bg-primary/10 text-primary cursor-pointer" : ""}
                ${!isActive && !isCompleted && reachable ? "text-muted-foreground hover:text-foreground cursor-pointer" : ""}
                ${!reachable ? "text-muted-foreground/50 cursor-not-allowed opacity-50" : ""}
              `}
            >
              {isCompleted && !isActive && (
                <span className="mr-1 sm:mr-1.5">&#10003;</span>
              )}
              {label}
            </button>
          </div>
        );
      })}

      <div className="ml-auto shrink-0">
        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
          {Math.round((completedPhases.size / 4) * 100)}%
        </span>
      </div>
    </div>
  );
}
