import type { Blocker, CreateFlowState } from "../create-types";

const AUTO_RESOLVED_BLOCKERS = new Set([
  "no-extraction",
  "no-bid",
  "no-strategy",
  "no-themes",
  "no-sections",
  "sections-failed",
  "sections-incomplete",
]);

export function isAutoResolvedBlocker(blockerId: string): boolean {
  return AUTO_RESOLVED_BLOCKERS.has(blockerId);
}

export interface SectionGateState {
  failedCount: number;
  incompleteCount: number;
  hasBlockingSectionIssues: boolean;
  message: string | null;
}

export function getSectionGateState(state: CreateFlowState): SectionGateState {
  const failedCount = state.sections.filter(
    (s) => s.generationStatus === "failed",
  ).length;
  const incompleteCount = state.sections.filter(
    (s) => s.generationStatus === "pending" || s.generationStatus === "generating",
  ).length;

  if (state.sections.length === 0) {
    return {
      failedCount,
      incompleteCount,
      hasBlockingSectionIssues: true,
      message: "Generate your draft before approving or exporting.",
    };
  }

  if (failedCount > 0) {
    return {
      failedCount,
      incompleteCount,
      hasBlockingSectionIssues: true,
      message: `${failedCount} section(s) failed. Regenerate them in Draft before approving.`,
    };
  }

  if (incompleteCount > 0) {
    return {
      failedCount,
      incompleteCount,
      hasBlockingSectionIssues: true,
      message: `${incompleteCount} section(s) are still generating. Wait for completion before approving.`,
    };
  }

  return {
    failedCount,
    incompleteCount,
    hasBlockingSectionIssues: false,
    message: null,
  };
}

export function computeFinalizeBlockers(state: CreateFlowState): Blocker[] {
  const blockers: Blocker[] = [];

  if (!state.extractedData) {
    blockers.push({
      id: "no-extraction",
      label: "Run intake analysis first",
      resolved: false,
      phase: "intake",
    });
  }

  if (!state.bidDecision) {
    blockers.push({
      id: "no-bid",
      label: "Choose whether to pursue this opportunity",
      resolved: false,
      phase: "strategy",
    });
  }

  if (!state.strategyConfirmed) {
    blockers.push({
      id: "no-strategy",
      label: "Confirm your strategy and win themes",
      resolved: false,
      phase: "strategy",
    });
  }

  if (state.winThemes.filter((t) => t.confirmed).length === 0) {
    blockers.push({
      id: "no-themes",
      label: "Select at least one win theme",
      resolved: false,
      phase: "strategy",
    });
  }

  if (state.sections.length === 0) {
    blockers.push({
      id: "no-sections",
      label: "No draft sections generated yet",
      resolved: false,
      phase: "draft",
    });
  }

  const failed = state.sections.filter((s) => s.generationStatus === "failed");
  if (failed.length > 0) {
    blockers.push({
      id: "sections-failed",
      label: `${failed.length} section(s) failed and must be regenerated`,
      resolved: false,
      phase: "draft",
    });
  }

  const incomplete = state.sections.filter(
    (s) => s.generationStatus === "pending" || s.generationStatus === "generating",
  );
  if (incomplete.length > 0) {
    blockers.push({
      id: "sections-incomplete",
      label: `${incomplete.length} section(s) are still generating`,
      resolved: false,
      phase: "draft",
    });
  }

  const unreviewed = state.sections.filter(
    (s) => !s.reviewed && s.generationStatus === "complete",
  );
  if (unreviewed.length > 0) {
    blockers.push({
      id: "unreviewed",
      label: `${unreviewed.length} section(s) need review`,
      resolved: false,
      phase: "draft",
    });
  }

  return blockers;
}
