"use client";

import {
  ConsoleContent,
  ConsoleFilters,
  ConsoleHeader,
} from "./copilot-console-sections";
import { useCopilotConsole } from "./use-copilot-console";

export function CopilotConsolePage() {
  const consoleState = useCopilotConsole();

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <ConsoleHeader
        counts={consoleState.counts}
        loading={consoleState.loading}
        onRefresh={consoleState.refreshInterventions}
      />
      <div className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
        <ConsoleFilters
          assignedAgent={consoleState.assignedAgent}
          status={consoleState.status}
          onAssignedAgentChange={consoleState.setAssignedAgent}
          onStatusChange={consoleState.setStatus}
        />
        <div className="mt-6">
          <ConsoleContent
            actionError={consoleState.actionError}
            interventions={consoleState.interventions}
            loadError={consoleState.loadError}
            loading={consoleState.loading}
            onResetFilters={consoleState.resetFilters}
            pendingAction={consoleState.pendingAction}
            onResolve={consoleState.resolveIntervention}
          />
        </div>
      </div>
    </div>
  );
}
