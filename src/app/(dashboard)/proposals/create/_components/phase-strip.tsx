"use client";

import { useCallback } from "react";
import type { CreatePhase } from "./create-types";
import { useCreateFlow } from "./create-provider";
import { clearState } from "./create-persistence";

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
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function PhaseItem({
  phaseKey,
  label,
  index,
  isActive,
  isCompleted,
  reachable,
  onSelect,
}: {
  phaseKey: CreatePhase;
  label: string;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  reachable: boolean;
  onSelect: (phase: CreatePhase) => void;
}) {
  return (
    <div className="flex items-center shrink-0">
      {index > 0 && (
        <div
          className={`w-6 sm:w-10 h-0.5 ${isCompleted || isActive ? "bg-primary" : "bg-border"}`}
        />
      )}
      <button
        onClick={() => reachable && onSelect(phaseKey)}
        disabled={!reachable}
        className={`flex items-center gap-2 sm:gap-2.5 transition-all ${!reachable ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
      >
        <div
          className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs font-bold transition-all shrink-0 ${isCompleted ? "bg-primary text-primary-foreground" : ""} ${isActive && !isCompleted ? "border-2 border-primary text-primary bg-primary/5" : ""} ${!isActive && !isCompleted ? "border-2 border-muted text-muted-foreground" : ""}`}
        >
          {isCompleted ? <CheckIcon /> : index + 1}
        </div>
        <span
          className={`text-xs sm:text-sm font-medium transition-colors ${isActive ? "text-foreground" : ""} ${isCompleted && !isActive ? "text-primary" : ""} ${!isActive && !isCompleted ? "text-muted-foreground" : ""}`}
        >
          {label}
        </span>
      </button>
    </div>
  );
}

export function PhaseStrip({ currentPhase, completedPhases }: PhaseStripProps) {
  const { dispatch } = useCreateFlow();
  const hasProgress = completedPhases.size > 0;

  const handleStartOver = useCallback(() => {
    if (!confirm("Start over? This will clear all progress on this proposal."))
      return;
    clearState();
    dispatch({ type: "RESET" });
  }, [dispatch]);

  const handleSelect = useCallback(
    (phase: CreatePhase) => dispatch({ type: "SET_PHASE", phase }),
    [dispatch],
  );

  return (
    <div className="flex items-center gap-0 px-4 sm:px-8 py-4 sm:py-5 border-b border-border bg-background overflow-x-auto">
      {PHASES.map(({ key, label }, i) => (
        <PhaseItem
          key={key}
          phaseKey={key}
          label={label}
          index={i}
          isActive={currentPhase === key}
          isCompleted={completedPhases.has(key)}
          reachable={isPhaseReachable(key, currentPhase, completedPhases)}
          onSelect={handleSelect}
        />
      ))}

      <div className="ml-auto flex items-center gap-2 shrink-0">
        {hasProgress && (
          <button
            onClick={handleStartOver}
            className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors px-2 py-1"
          >
            Start over
          </button>
        )}
        <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
          {Math.round((completedPhases.size / 4) * 100)}%
        </span>
      </div>
    </div>
  );
}
