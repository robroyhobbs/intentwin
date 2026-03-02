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

export function PhaseStrip({ currentPhase, completedPhases }: PhaseStripProps) {
  const { dispatch } = useCreateFlow();

  return (
    <div className="flex items-center gap-1 px-8 py-4 border-b border-border bg-background">
      {PHASES.map(({ key, label }, i) => {
        const isActive = currentPhase === key;
        const isCompleted = completedPhases.has(key);

        return (
          <div key={key} className="flex items-center">
            {i > 0 && (
              <div
                className={`w-8 h-px mx-1 ${
                  isCompleted || isActive ? "bg-primary" : "bg-border"
                }`}
              />
            )}
            <button
              onClick={() =>
                dispatch({ type: "SET_PHASE", phase: key })
              }
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all
                ${isActive ? "bg-primary text-primary-foreground shadow-sm" : ""}
                ${isCompleted && !isActive ? "bg-primary/10 text-primary" : ""}
                ${!isActive && !isCompleted ? "text-muted-foreground hover:text-foreground" : ""}
              `}
            >
              {isCompleted && !isActive && (
                <span className="mr-1.5">&#10003;</span>
              )}
              {label}
            </button>
          </div>
        );
      })}

      <div className="ml-auto">
        <span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
          {Math.round((completedPhases.size / 4) * 100)}% Complete
        </span>
      </div>
    </div>
  );
}
