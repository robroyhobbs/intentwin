"use client";

import { useCreateFlow } from "./create-provider";
import { PhaseStrip } from "./phase-strip";
import { IntakePhase } from "./phases/intake-phase";
import { StrategyPhase } from "./phases/strategy-phase";
import { DraftPhase } from "./phases/draft-phase";

export function CreateShell() {
  const { state } = useCreateFlow();

  return (
    <div className="flex h-full gap-0 -m-6">
      {/* Main workspace */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <PhaseStrip
          currentPhase={state.phase}
          completedPhases={state.completedPhases}
        />
        <div className="flex-1 overflow-auto p-8">
          {/* Phase content -- wired in Tasks 4-6 */}
          {state.phase === "intake" && <IntakePhase />}
          {state.phase === "strategy" && <StrategyPhase />}
          {state.phase === "draft" && <DraftPhase />}
          {state.phase === "finalize" && (
            <div className="text-muted-foreground text-sm">
              Finalize phase -- coming in Task 8
            </div>
          )}
        </div>
      </div>

      {/* Decision Coach panel */}
      <aside className="w-[340px] border-l border-border bg-card overflow-auto p-6 shrink-0 hidden lg:block">
        <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Decision Coach
        </div>
        <div className="text-sm text-muted-foreground">
          Contextual guidance will appear here.
        </div>
      </aside>
    </div>
  );
}
