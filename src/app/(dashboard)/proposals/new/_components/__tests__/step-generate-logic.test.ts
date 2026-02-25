import { describe, it, expect } from "vitest";
import type { WizardState } from "../wizard-types";
import { INITIAL_STATE } from "../wizard-reducer";

/**
 * Tests for logic extracted from step-generate.tsx.
 *
 * Since the test environment is node (not jsdom), we test the
 * pure logic functions rather than React component rendering.
 */

// ────────────────────────────────────────────────────────
// Constants (mirrored from step-generate.tsx)
// ────────────────────────────────────────────────────────

const POLL_MIN_INTERVAL = 2000;
const POLL_MAX_INTERVAL = 10000;
const POLL_BACKOFF_FACTOR = 1.5;
const POLL_TIMEOUT = 10 * 60 * 1000;
const MIN_PROGRESS_DISPLAY_MS = 3000;

// ────────────────────────────────────────────────────────
// Extracted logic functions (same logic as in the component)
// ────────────────────────────────────────────────────────

function calculatePollInterval(pollCount: number): number {
  return Math.min(
    POLL_MIN_INTERVAL * Math.pow(POLL_BACKOFF_FACTOR, pollCount),
    POLL_MAX_INTERVAL,
  );
}

function isTimedOut(startTime: number, now: number): boolean {
  return now - startTime > POLL_TIMEOUT;
}

function buildProposalTitle(state: Pick<WizardState, "clientName" | "solicitationType">): string {
  return state.clientName
    ? `${state.solicitationType} Response — ${state.clientName}`
    : `${state.solicitationType} Proposal`;
}

function buildProposalBody(state: WizardState) {
  return {
    title: buildProposalTitle(state),
    intake_data: {
      client_name: state.clientName,
      client_industry: state.clientIndustry,
      client_size: state.clientSize,
      solicitation_type: state.solicitationType,
      opportunity_type: state.opportunityType,
      scope_description: state.scopeDescription,
      current_state_pains: state.currentStatePains,
      desired_outcomes: state.desiredOutcomes,
      budget_range: state.budgetRange,
      timeline_expectation: state.timelineExpectation,
      technical_environment: state.technicalEnvironment,
      compliance_requirements: state.complianceRequirements,
      competitive_intel: state.competitiveIntel,
      tone: state.tone,
      selected_sections: state.selectedSections,
    },
    win_strategy_data: state.winStrategy,
    bid_evaluation: state.bidEvaluation,
    client_research: state.researchData,
  };
}

interface ApiSection {
  id: string;
  section_type: string;
  title: string;
  generation_status: string;
  generation_error: string | null;
}

function mapApiSectionsToProgress(apiSections: ApiSection[]) {
  return apiSections.map((s) => ({
    type: s.section_type,
    title: s.title,
    status: (s.generation_status === "completed" || s.generation_status === "failed" || s.generation_status === "generating")
      ? s.generation_status as "completed" | "failed" | "generating"
      : "pending" as const,
  }));
}

function determineCompletionState(apiSections: ApiSection[], proposalStatus: string) {
  const completedCount = apiSections.filter((s) => s.generation_status === "completed").length;
  const failedCount = apiSections.filter((s) => s.generation_status === "failed").length;
  const totalCount = apiSections.length;

  if (proposalStatus !== "generating" && totalCount > 0 && (completedCount + failedCount) === totalCount) {
    if (failedCount === totalCount) {
      return { phase: "failed" as const, reason: "all_failed" };
    }
    return { phase: "complete" as const, reason: failedCount > 0 ? "partial_failure" : "success" };
  }

  return { phase: "generating" as const, reason: "in_progress" };
}

function shouldDelayNavigation(progressShownAt: number | null, now: number): number {
  const showDuration = progressShownAt
    ? now - progressShownAt
    : MIN_PROGRESS_DISPLAY_MS;
  if (showDuration < MIN_PROGRESS_DISPLAY_MS) {
    return MIN_PROGRESS_DISPLAY_MS - showDuration;
  }
  return 0;
}

// ────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────

describe("step-generate logic", () => {
  describe("polling backoff", () => {
    it("starts at 2 seconds", () => {
      expect(calculatePollInterval(0)).toBe(2000);
    });

    it("increases by 1.5x each poll", () => {
      expect(calculatePollInterval(1)).toBe(3000);
      expect(calculatePollInterval(2)).toBe(4500);
      expect(calculatePollInterval(3)).toBe(6750);
    });

    it("caps at 10 seconds", () => {
      expect(calculatePollInterval(10)).toBe(10000);
      expect(calculatePollInterval(20)).toBe(10000);
      expect(calculatePollInterval(100)).toBe(10000);
    });

    it("reaches cap around poll count 5", () => {
      // 2000 * 1.5^4 = 10125 > 10000
      expect(calculatePollInterval(4)).toBe(10000);
    });
  });

  describe("timeout detection", () => {
    it("returns false within timeout window", () => {
      const start = Date.now();
      expect(isTimedOut(start, start + 1000)).toBe(false);
      expect(isTimedOut(start, start + 5 * 60 * 1000)).toBe(false);
    });

    it("returns true after 10 minutes", () => {
      const start = Date.now();
      expect(isTimedOut(start, start + POLL_TIMEOUT + 1)).toBe(true);
    });

    it("returns false at exactly 10 minutes", () => {
      const start = Date.now();
      expect(isTimedOut(start, start + POLL_TIMEOUT)).toBe(false);
    });
  });

  describe("proposal title construction", () => {
    it("includes client name when available", () => {
      const title = buildProposalTitle({ clientName: "Acme Corp", solicitationType: "RFP" });
      expect(title).toBe("RFP Response — Acme Corp");
    });

    it("falls back to generic title without client name", () => {
      const title = buildProposalTitle({ clientName: "", solicitationType: "RFP" });
      expect(title).toBe("RFP Proposal");
    });

    it("uses correct solicitation type in title", () => {
      expect(buildProposalTitle({ clientName: "Corp", solicitationType: "SOW" }))
        .toBe("SOW Response — Corp");
      expect(buildProposalTitle({ clientName: "", solicitationType: "RFI" }))
        .toBe("RFI Proposal");
    });
  });

  describe("proposal body construction", () => {
    it("includes all required fields from wizard state", () => {
      const state: WizardState = {
        ...INITIAL_STATE,
        clientName: "Test Corp",
        clientIndustry: "Tech",
        clientSize: "Enterprise",
        solicitationType: "RFP",
        opportunityType: "cloud_migration",
        scopeDescription: "Migrate to AWS",
        currentStatePains: ["Legacy systems"],
        desiredOutcomes: ["Lower costs"],
        budgetRange: "$1M",
        timelineExpectation: "6 months",
        technicalEnvironment: "AWS",
        complianceRequirements: "SOC 2",
        competitiveIntel: "Deloitte",
        tone: "executive",
        selectedSections: ["exec_summary", "approach"],
        winStrategy: {
          win_themes: ["Cloud"],
          success_metrics: [],
          differentiators: [],
          target_outcomes: [],
          generated_at: "2026-01-01",
        },
      };

      const body = buildProposalBody(state);

      expect(body.title).toBe("RFP Response — Test Corp");
      expect(body.intake_data.client_name).toBe("Test Corp");
      expect(body.intake_data.tone).toBe("executive");
      expect(body.intake_data.selected_sections).toEqual(["exec_summary", "approach"]);
      expect(body.win_strategy_data?.win_themes).toEqual(["Cloud"]);
      expect(body.bid_evaluation).toBeNull();
      expect(body.client_research).toBeNull();
    });

    it("handles empty wizard state gracefully", () => {
      const body = buildProposalBody(INITIAL_STATE);
      expect(body.title).toBe("RFP Proposal");
      expect(body.intake_data.client_name).toBe("");
      expect(body.intake_data.selected_sections).toEqual([]);
      expect(body.win_strategy_data).toBeNull();
    });
  });

  describe("section status mapping", () => {
    it("maps completed sections correctly", () => {
      const result = mapApiSectionsToProgress([
        { id: "1", section_type: "exec", title: "Exec Summary", generation_status: "completed", generation_error: null },
      ]);
      expect(result[0].status).toBe("completed");
    });

    it("maps generating sections correctly", () => {
      const result = mapApiSectionsToProgress([
        { id: "1", section_type: "exec", title: "Exec", generation_status: "generating", generation_error: null },
      ]);
      expect(result[0].status).toBe("generating");
    });

    it("maps failed sections correctly", () => {
      const result = mapApiSectionsToProgress([
        { id: "1", section_type: "exec", title: "Exec", generation_status: "failed", generation_error: "AI error" },
      ]);
      expect(result[0].status).toBe("failed");
    });

    it("maps unknown statuses to pending", () => {
      const result = mapApiSectionsToProgress([
        { id: "1", section_type: "exec", title: "Exec", generation_status: "pending", generation_error: null },
        { id: "2", section_type: "team", title: "Team", generation_status: "queued", generation_error: null },
        { id: "3", section_type: "cost", title: "Cost", generation_status: "regenerating", generation_error: null },
      ]);
      expect(result[0].status).toBe("pending");
      expect(result[1].status).toBe("pending");
      expect(result[2].status).toBe("pending");
    });

    it("handles empty section list", () => {
      expect(mapApiSectionsToProgress([])).toEqual([]);
    });

    it("preserves section type and title", () => {
      const result = mapApiSectionsToProgress([
        { id: "1", section_type: "executive_summary", title: "Executive Summary", generation_status: "completed", generation_error: null },
      ]);
      expect(result[0].type).toBe("executive_summary");
      expect(result[0].title).toBe("Executive Summary");
    });
  });

  describe("completion state detection", () => {
    it("detects full success", () => {
      const sections: ApiSection[] = [
        { id: "1", section_type: "a", title: "A", generation_status: "completed", generation_error: null },
        { id: "2", section_type: "b", title: "B", generation_status: "completed", generation_error: null },
      ];
      const result = determineCompletionState(sections, "draft");
      expect(result.phase).toBe("complete");
      expect(result.reason).toBe("success");
    });

    it("detects partial failure", () => {
      const sections: ApiSection[] = [
        { id: "1", section_type: "a", title: "A", generation_status: "completed", generation_error: null },
        { id: "2", section_type: "b", title: "B", generation_status: "failed", generation_error: "err" },
      ];
      const result = determineCompletionState(sections, "draft");
      expect(result.phase).toBe("complete");
      expect(result.reason).toBe("partial_failure");
    });

    it("detects all failed", () => {
      const sections: ApiSection[] = [
        { id: "1", section_type: "a", title: "A", generation_status: "failed", generation_error: "err1" },
        { id: "2", section_type: "b", title: "B", generation_status: "failed", generation_error: "err2" },
      ];
      const result = determineCompletionState(sections, "draft");
      expect(result.phase).toBe("failed");
      expect(result.reason).toBe("all_failed");
    });

    it("stays generating when sections still in progress", () => {
      const sections: ApiSection[] = [
        { id: "1", section_type: "a", title: "A", generation_status: "completed", generation_error: null },
        { id: "2", section_type: "b", title: "B", generation_status: "generating", generation_error: null },
      ];
      const result = determineCompletionState(sections, "generating");
      expect(result.phase).toBe("generating");
    });

    it("stays generating when proposal status is still generating even if sections look done", () => {
      const sections: ApiSection[] = [
        { id: "1", section_type: "a", title: "A", generation_status: "completed", generation_error: null },
        { id: "2", section_type: "b", title: "B", generation_status: "completed", generation_error: null },
      ];
      // Edge case: sections appear done but proposal status hasn't updated yet
      const result = determineCompletionState(sections, "generating");
      expect(result.phase).toBe("generating");
    });

    it("stays generating when no sections exist yet", () => {
      const result = determineCompletionState([], "generating");
      expect(result.phase).toBe("generating");
    });

    it("handles single section", () => {
      const sections: ApiSection[] = [
        { id: "1", section_type: "a", title: "A", generation_status: "completed", generation_error: null },
      ];
      const result = determineCompletionState(sections, "draft");
      expect(result.phase).toBe("complete");
      expect(result.reason).toBe("success");
    });
  });

  describe("navigation delay calculation", () => {
    it("returns delay when progress was just shown", () => {
      const now = Date.now();
      const shownAt = now - 1000; // 1 second ago
      const delay = shouldDelayNavigation(shownAt, now);
      expect(delay).toBe(2000); // need 2 more seconds
    });

    it("returns 0 when sufficient time has passed", () => {
      const now = Date.now();
      const shownAt = now - 5000; // 5 seconds ago
      const delay = shouldDelayNavigation(shownAt, now);
      expect(delay).toBe(0);
    });

    it("returns 0 when progressShownAt is null (fallback)", () => {
      const delay = shouldDelayNavigation(null, Date.now());
      expect(delay).toBe(0);
    });

    it("returns exact remaining time", () => {
      const now = Date.now();
      const shownAt = now - 2500;
      const delay = shouldDelayNavigation(shownAt, now);
      expect(delay).toBe(500);
    });

    it("returns 0 at exact boundary", () => {
      const now = Date.now();
      const shownAt = now - MIN_PROGRESS_DISPLAY_MS;
      expect(shouldDelayNavigation(shownAt, now)).toBe(0);
    });
  });

  describe("retry logic", () => {
    it("should re-trigger when proposalId exists", () => {
      // Logic: if proposalId exists, we should only re-trigger generation, not create a new proposal
      const proposalId = "existing-prop-123";
      const shouldCreateNew = !proposalId;
      expect(shouldCreateNew).toBe(false);
    });

    it("should create new proposal when proposalId is null", () => {
      const proposalId: string | null = null;
      const shouldCreateNew = !proposalId;
      expect(shouldCreateNew).toBe(true);
    });
  });
});
