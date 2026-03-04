"use client";

import { useCallback } from "react";
import type { CreatePhase } from "./create-types";
import { useCreateFlow } from "./create-provider";
import { clearState } from "./create-persistence";
import { PhaseIcon } from "./shared/phase-icon";

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

interface PhaseItemProps {
  phaseKey: CreatePhase;
  label: string;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  reachable: boolean;
  onSelect: (phase: CreatePhase) => void;
}

function PhaseItem(props: PhaseItemProps) {
  const { phaseKey, label, index, isActive, isCompleted, reachable, onSelect } =
    props;
  const iconState = isCompleted
    ? "completed"
    : isActive
      ? "active"
      : "inactive";
  const labelCls = isActive
    ? "text-foreground font-bold"
    : isCompleted
      ? "text-[var(--accent)]"
      : "text-muted-foreground";

  return (
    <div className="flex items-center shrink-0">
      {index > 0 && (
        <div
          className={`w-8 sm:w-12 h-1 rounded-full transition-colors duration-500 ${
            isCompleted || isActive ? "bg-[var(--accent)]" : "bg-border"
          }`}
        />
      )}
      <button
        onClick={() => reachable && onSelect(phaseKey)}
        disabled={!reachable}
        className={`flex items-center gap-2 sm:gap-3 rounded-lg px-2 py-1.5 transition-all ${
          !reachable
            ? "cursor-not-allowed opacity-40"
            : "cursor-pointer hover:bg-[var(--background-tertiary)]"
        } ${isActive ? "bg-accent/30" : ""}`}
      >
        <PhaseIcon phase={phaseKey} state={iconState} size="sm" />
        <span className={`text-sm font-medium transition-colors ${labelCls}`}>
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
        <span className="badge badge-accent">
          {Math.round((completedPhases.size / 4) * 100)}%
        </span>
      </div>
    </div>
  );
}
