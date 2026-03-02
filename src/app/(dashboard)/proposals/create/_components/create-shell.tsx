"use client";

import { useCreateFlow } from "./create-provider";
import { PhaseStrip } from "./phase-strip";

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
          {state.phase === "intake" && (
            <div className="text-muted-foreground text-sm">
              Intake phase -- upload your RFP to get started.
            </div>
          )}
          {state.phase === "strategy" && (
            <div className="text-muted-foreground text-sm">
              Strategy phase -- coming in Task 5
            </div>
          )}
          {state.phase === "draft" && (
            <div className="text-muted-foreground text-sm">
              Draft phase -- coming in Task 6
            </div>
          )}
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
