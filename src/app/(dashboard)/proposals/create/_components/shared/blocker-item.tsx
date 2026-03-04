"use client";

import type { Blocker, CreatePhase } from "../create-types";
import { useCreateFlow } from "../create-provider";

// ── Phase badge colors ──────────────────────────────────────────────────────

const PHASE_STYLES: Record<CreatePhase, string> = {
  intake: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  strategy:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  draft: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  finalize:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

// ── Icons ───────────────────────────────────────────────────────────────────

function CheckboxEmpty() {
  return (
    <svg
      className="h-5 w-5 text-muted-foreground shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <rect x="3" y="3" width="18" height="18" rx="4" />
    </svg>
  );
}

function CheckboxChecked() {
  return (
    <svg
      className="h-5 w-5 text-emerald-500 shrink-0"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M7 3a4 4 0 00-4 4v10a4 4 0 004 4h10a4 4 0 004-4V7a4 4 0 00-4-4H7zm9.707 6.707a1 1 0 00-1.414-1.414L10 13.586l-2.293-2.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l6-6z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ── Phase badge ─────────────────────────────────────────────────────────────

function PhaseBadge({
  phase,
  onClick,
}: {
  phase: CreatePhase;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize cursor-pointer hover:opacity-80 transition-opacity ${PHASE_STYLES[phase]}`}
    >
      {phase}
    </button>
  );
}

// ── BlockerItem ─────────────────────────────────────────────────────────────

export interface BlockerItemProps {
  blocker: Blocker;
  onResolve?: () => void;
}

export function BlockerItem({ blocker, onResolve }: BlockerItemProps) {
  const { dispatch } = useCreateFlow();
  const canToggle = typeof onResolve === "function";

  const navigateToPhase = () => {
    dispatch({ type: "SET_PHASE", phase: blocker.phase });
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-accent/30">
      <button
        type="button"
        onClick={onResolve}
        disabled={!canToggle}
        className={`shrink-0 ${canToggle ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
        aria-label={blocker.resolved ? "Mark unresolved" : "Mark resolved"}
      >
        {blocker.resolved ? <CheckboxChecked /> : <CheckboxEmpty />}
      </button>

      <span
        className={`flex-1 text-sm ${blocker.resolved ? "line-through text-muted-foreground" : "text-foreground"}`}
      >
        {blocker.label}
      </span>

      <PhaseBadge phase={blocker.phase} onClick={navigateToPhase} />
    </div>
  );
}
