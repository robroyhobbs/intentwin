"use client";

import { useEffect } from "react";
import { useCreateFlow } from "./create-provider";
import { PhaseStrip } from "./phase-strip";
import { IntakePhase } from "./phases/intake-phase";
import { StrategyPhase } from "./phases/strategy-phase";
import { DraftPhase } from "./phases/draft-phase";
import { FinalizePhase } from "./phases/finalize-phase";
import { DecisionCoach } from "./decision-coach";

function useNavigationGuard() {
  const { state } = useCreateFlow();
  const hasProgress =
    state.completedPhases.size > 0 ||
    state.generationStatus === "generating" ||
    state.sections.length > 0;

  useEffect(() => {
    if (!hasProgress) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasProgress]);
}

export function CreateShell() {
  const { state } = useCreateFlow();
  useNavigationGuard();

  return (
    <div className="-m-6 flex h-full flex-col bg-muted/20 lg:flex-row">
      {/* Main workspace */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
        <PhaseStrip
          currentPhase={state.phase}
          completedPhases={state.completedPhases}
        />
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {state.phase === "intake" && <IntakePhase />}
          {state.phase === "strategy" && <StrategyPhase />}
          {state.phase === "draft" && <DraftPhase />}
          {state.phase === "finalize" && <FinalizePhase />}
        </div>
      </div>

      {/* Decision Coach panel */}
      <aside className="max-h-[45dvh] w-full shrink-0 overflow-auto border-t border-border bg-card/95 p-4 lg:max-h-none lg:w-[360px] lg:border-l lg:border-t-0 lg:p-6">
        <DecisionCoach />
      </aside>
    </div>
  );
}
