import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CreateAction, CreateFlowState } from "../create-types";
import { resumeDraftFlow, runDraftFlow } from "./draft-helpers";

const { orchestrateGenerationMock } = vi.hoisted(() => ({
  orchestrateGenerationMock: vi.fn(),
}));

vi.mock("@/lib/ai/pipeline/client-orchestrate", () => ({
  orchestrateGeneration: orchestrateGenerationMock,
}));

function createBaseState(): CreateFlowState {
  return {
    phase: "draft",
    buyerGoal: "",
    extractedData: {
      input_type: "formal_rfp",
      input_summary: "Test RFP",
      extracted: {
        client_name: { value: "Test Client", confidence: 0.9, source: "RFP" },
        client_industry: { value: "Technology", confidence: 0.8, source: "RFP" },
        client_size: { value: "enterprise", confidence: 0.8, source: "RFP" },
        opportunity_type: {
          value: "cloud_migration",
          confidence: 0.8,
          source: "RFP",
        },
        scope_description: {
          value: "Cloud migration services",
          confidence: 0.8,
          source: "RFP",
        },
        key_requirements: {
          value: ["Migrate workloads"],
          confidence: 0.8,
          source: "RFP",
        },
        budget_range: { value: "$1M", confidence: 0.7, source: "RFP" },
        timeline: { value: "6 months", confidence: 0.7, source: "RFP" },
        decision_criteria: {
          value: ["Experience"],
          confidence: 0.7,
          source: "RFP",
        },
        technical_environment: {
          value: "AWS",
          confidence: 0.7,
          source: "RFP",
        },
        compliance_requirements: {
          value: ["FedRAMP"],
          confidence: 0.7,
          source: "RFP",
        },
        current_state_pains: {
          value: ["Legacy systems"],
          confidence: 0.7,
          source: "RFP",
        },
        desired_outcomes: {
          value: ["Lower costs"],
          confidence: 0.7,
          source: "RFP",
        },
        solicitation_type: { value: "RFP", confidence: 0.9, source: "RFP" },
      },
    },
    bidEvaluation: null,
    winThemes: [{ id: "theme-1", label: "Faster delivery", confirmed: true }],
    proposalId: "prop-existing",
    sections: [],
    generationStatus: "failed",
    generationError: null,
    researchData: null,
    importedDocs: [],
  };
}

describe("runDraftFlow", () => {
  beforeEach(() => {
    orchestrateGenerationMock.mockReset();
    orchestrateGenerationMock.mockResolvedValue(undefined);
  });

  it("reuses an existing proposal instead of creating a duplicate on retry", async () => {
    const state = createBaseState();
    const dispatch = vi.fn<(action: CreateAction) => void>();
    const mountedRef = { current: true };
    let proposalPolls = 0;
    const fetchFn = vi.fn<
      (url: string, options?: RequestInit) => Promise<Response>
    >(async (url) => {
      if (url === "/api/proposals") {
        return new Response(JSON.stringify({ proposal: { id: "new-proposal" } }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url === "/api/proposals/prop-existing/generate/setup") {
        return new Response(
          JSON.stringify({
            sections: [
              {
                id: "sec-1",
                sectionType: "executive_summary",
                title: "Executive Summary",
              },
            ],
            sectionCount: 1,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (url === "/api/proposals/prop-existing/generate/section") {
        return new Response(
          JSON.stringify({
            status: "completed",
            content: "Executive summary content",
            chunkCount: 1,
            differentiators: ["Differentiator A"],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (url === "/api/proposals/prop-existing") {
        proposalPolls += 1;
        const proposalStatus = proposalPolls === 1 ? "generating" : "review";
        const sectionStatus = proposalPolls === 1 ? "generating" : "completed";

        return new Response(
          JSON.stringify({
            proposal: { id: "prop-existing", status: proposalStatus },
            sections: [
              {
                id: "sec-1",
                section_type: "executive_summary",
                title: "Executive Summary",
                section_order: 0,
                generation_status: sectionStatus,
                generation_error: null,
                generated_content:
                  sectionStatus === "completed"
                    ? "Executive summary content"
                    : "",
              },
            ],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (url === "/api/proposals/prop-existing/generate/finalize") {
        return new Response(JSON.stringify({ status: "review" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    await runDraftFlow(state, dispatch, mountedRef, fetchFn);

    expect(fetchFn).not.toHaveBeenCalledWith(
      "/api/proposals",
      expect.anything(),
    );
    expect(fetchFn).toHaveBeenCalledWith(
      "/api/proposals/prop-existing/generate/setup",
      expect.anything(),
    );
    expect(orchestrateGenerationMock).toHaveBeenCalledWith(
      "prop-existing",
      [
        {
          id: "sec-1",
          sectionType: "executive_summary",
          title: "Executive Summary",
        },
      ],
      fetchFn,
    );
    expect(fetchFn).not.toHaveBeenCalledWith(
      "/api/proposals/prop-existing/generate/finalize",
      expect.anything(),
    );
    expect(dispatch).toHaveBeenCalledWith({
      type: "GENERATION_COMPLETE",
    });
  });

  it("resumes an interrupted generation by reusing setup plus proposal polling", async () => {
    const dispatch = vi.fn<(action: CreateAction) => void>();
    const mountedRef = { current: true };
    let proposalPolls = 0;
    const fetchFn = vi.fn<
      (url: string, options?: RequestInit) => Promise<Response>
    >(async (url) => {
      if (url === "/api/proposals/prop-existing/generate/setup") {
        return new Response(
          JSON.stringify({
            sections: [
              {
                id: "sec-1",
                sectionType: "executive_summary",
                title: "Executive Summary",
              },
              {
                id: "sec-2",
                sectionType: "technical_approach",
                title: "Technical Approach",
              },
            ],
            sectionCount: 2,
            resumed: true,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (url === "/api/proposals/prop-existing") {
        proposalPolls += 1;
        const firstPoll = proposalPolls === 1;

        return new Response(
          JSON.stringify({
            proposal: {
              id: "prop-existing",
              status: firstPoll ? "generating" : "review",
            },
            sections: [
              {
                id: "sec-1",
                section_type: "executive_summary",
                title: "Executive Summary",
                section_order: 0,
                generation_status: "completed",
                generation_error: null,
                generated_content: "Executive summary content",
              },
              {
                id: "sec-2",
                section_type: "technical_approach",
                title: "Technical Approach",
                section_order: 1,
                generation_status: firstPoll ? "generating" : "completed",
                generation_error: null,
                generated_content: firstPoll ? "" : "Approach content",
              },
            ],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    await resumeDraftFlow("prop-existing", dispatch, mountedRef, fetchFn);

    expect(orchestrateGenerationMock).toHaveBeenCalledWith(
      "prop-existing",
      [
        {
          id: "sec-1",
          sectionType: "executive_summary",
          title: "Executive Summary",
        },
        {
          id: "sec-2",
          sectionType: "technical_approach",
          title: "Technical Approach",
        },
      ],
      fetchFn,
    );
    expect(dispatch).toHaveBeenCalledWith({
      type: "SET_PROPOSAL_ID",
      id: "prop-existing",
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: "GENERATION_COMPLETE",
    });
  });
});
