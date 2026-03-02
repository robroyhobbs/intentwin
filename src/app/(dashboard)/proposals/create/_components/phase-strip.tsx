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
  const idx = PHASES.findIndex((p) => p.key === key);
  if (idx === 0) return true;
  return completed.has(PHASES[idx - 1].key);
}

function CheckIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
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
  );
}

export function PhaseStrip({
  currentPhase,
  completedPhases,
}: PhaseStripProps) {
  const { dispatch } = useCreateFlow();

  return (
    <div className="flex items-center gap-0 px-4 sm:px-8 py-4 sm:py-5 border-b border-border bg-background overflow-x-auto">
      {PHASES.map(({ key, label }, i) => {
        const isActive = currentPhase === key;
        const isCompleted = completedPhases.has(key);
        const reachable = isPhaseReachable(key, currentPhase, completedPhases);

        return (
          <div key={key} className="flex items-center shrink-0">
            {i > 0 && (
              <div
                className={`w-6 sm:w-10 h-0.5 ${
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
                flex items-center gap-2 sm:gap-2.5 transition-all
                ${!reachable ? "cursor-not-allowed opacity-40" : "cursor-pointer"}
              `}
            >
              {/* Step circle */}
              <div
                className={`
                  flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full
                  text-xs font-bold transition-all shrink-0
                  ${isCompleted ? "bg-primary text-primary-foreground" : ""}
                  ${isActive && !isCompleted ? "border-2 border-primary text-primary bg-primary/5" : ""}
                  ${!isActive && !isCompleted ? "border-2 border-muted text-muted-foreground" : ""}
                `}
              >
                {isCompleted ? <CheckIcon /> : i + 1}
              </div>
              {/* Label */}
              <span
                className={`
                  text-xs sm:text-sm font-medium transition-colors
                  ${isActive ? "text-foreground" : ""}
                  ${isCompleted && !isActive ? "text-primary" : ""}
                  ${!isActive && !isCompleted ? "text-muted-foreground" : ""}
                `}
              >
                {label}
              </span>
            </button>
          </div>
        );
      })}

      <div className="ml-auto shrink-0">
        <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
          {Math.round((completedPhases.size / 4) * 100)}%
        </span>
      </div>
    </div>
  );
}
