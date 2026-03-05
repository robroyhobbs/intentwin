import type { Dispatch } from "react";
import type {
  CreateAction,
  CreateFlowState,
  SectionDraft,
} from "../create-types";
import { logger } from "@/lib/utils/logger";

type FetchFn = (url: string, options?: RequestInit) => Promise<Response>;

// ── API response types ──────────────────────────────────────────────────────

interface CreateProposalResponse {
  proposal: { id: string };
}

interface SetupSection {
  id: string;
  sectionType: string;
  title: string;
}

interface SetupResponse {
  sections: SetupSection[];
  sectionCount: number;
}

interface SectionResult {
  status: "completed" | "failed";
  content?: string;
  error?: string;
  differentiators?: string[];
}

// ── Build payload ───────────────────────────────────────────────────────────

export function buildProposalPayload(state: CreateFlowState): {
  title: string;
  intake_data: Record<string, unknown>;
  win_strategy_data: { win_themes: string[]; differentiators: string[] };
  bid_evaluation: Record<string, unknown> | null;
} {
  const ext = state.extractedData?.extracted;
  const clientName = ext?.client_name?.value ?? "Unknown Client";

  const intakeData: Record<string, unknown> = {
    client_name: ext?.client_name?.value ?? "",
    client_industry: ext?.client_industry?.value ?? "",
    client_size: ext?.client_size?.value ?? "",
    opportunity_type: ext?.opportunity_type?.value ?? "",
    scope_description: ext?.scope_description?.value ?? "",
    key_requirements: ext?.key_requirements?.value ?? [],
    budget_range: ext?.budget_range?.value ?? "",
    timeline: ext?.timeline?.value ?? "",
    decision_criteria: ext?.decision_criteria?.value ?? [],
    technical_environment: ext?.technical_environment?.value ?? "",
    compliance_requirements: ext?.compliance_requirements?.value ?? [],
    current_state_pains: ext?.current_state_pains?.value ?? [],
    desired_outcomes: ext?.desired_outcomes?.value ?? [],
    solicitation_type: ext?.solicitation_type?.value ?? "",
    buyer_goal: state.buyerGoal,
  };

  const confirmedThemes = state.winThemes
    .filter((t) => t.confirmed)
    .map((t) => t.label);

  return {
    title: `Proposal for ${clientName}`,
    intake_data: intakeData,
    win_strategy_data: {
      win_themes: confirmedThemes,
      differentiators: confirmedThemes,
    },
    bid_evaluation: state.bidEvaluation
      ? (state.bidEvaluation as unknown as Record<string, unknown>)
      : null,
  };
}

// ── Create proposal ─────────────────────────────────────────────────────────

export async function createProposal(
  state: CreateFlowState,
  dispatch: Dispatch<CreateAction>,
  fetchFn: FetchFn,
): Promise<string> {
  const payload = buildProposalPayload(state);

  const res = await fetchFn("/api/proposals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (body as Record<string, string>).message ?? res.statusText;
    throw new Error(`Failed to create proposal: ${msg}`);
  }

  const data = (await res.json()) as CreateProposalResponse;
  dispatch({ type: "SET_PROPOSAL_ID", id: data.proposal.id });

  logger.info("Proposal created", { proposalId: data.proposal.id });
  return data.proposal.id;
}

// ── Regenerate a single section ─────────────────────────────────────────────

export async function regenerateSection(
  proposalId: string,
  sectionId: string,
  dispatch: Dispatch<CreateAction>,
  fetchFn: FetchFn,
  sections?: SectionDraft[],
): Promise<void> {
  // Guard: skip if any section is currently generating
  if (sections?.some((s) => s.generationStatus === "generating")) {
    logger.info("Regeneration skipped — a section is already generating", {
      proposalId,
      sectionId,
    });
    return;
  }

  dispatch({
    type: "UPDATE_SECTION",
    sectionId,
    updates: { generationStatus: "generating", content: "" },
  });

  try {
    const res = await fetchFn(
      `/api/proposals/${proposalId}/sections/${sectionId}/regenerate`,
      { method: "POST" },
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        (body as Record<string, string>).error ??
          `Regenerate failed (${res.status})`,
      );
    }

    logger.info("Regeneration triggered, polling for completion", {
      proposalId,
      sectionId,
    });

    // API returns immediately; poll DB for completion via section endpoint
    await pollSectionStatus(proposalId, sectionId, dispatch, fetchFn);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Regeneration failed";
    logger.error("Section regeneration error", err, { sectionId });
    dispatch({
      type: "UPDATE_SECTION",
      sectionId,
      updates: { generationStatus: "failed" },
    });
    throw new Error(msg);
  }
}

// ── Extract error message from response ─────────────────────────────────────

async function extractError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return (
      (body as Record<string, string>).error ??
      (body as Record<string, string>).message ??
      res.statusText
    );
  } catch {
    return res.statusText;
  }
}

// ── Map setup section to SectionDraft ───────────────────────────────────────

function mapSetupSection(s: SetupSection): SectionDraft {
  return {
    id: s.id,
    sectionType: s.sectionType,
    title: s.title,
    content: "",
    generationStatus: "pending",
    reviewed: false,
    order: 0,
  };
}

// ── Orchestrate full draft flow (client-orchestrated) ───────────────────────

export async function runDraftFlow(
  state: CreateFlowState,
  dispatch: Dispatch<CreateAction>,
  mountedRef: { current: boolean },
  fetchFn: FetchFn,
): Promise<void> {
  dispatch({ type: "GENERATION_START" });

  try {
    // Step 1: Create proposal
    const proposalId = await createProposal(state, dispatch, fetchFn);
    if (!mountedRef.current) return;

    // Step 2: Setup — build context + create sections
    const setupRes = await fetchFn(
      `/api/proposals/${proposalId}/generate/setup`,
      { method: "POST" },
    );
    if (!setupRes.ok) throw new Error(await extractError(setupRes));
    const { sections } = (await setupRes.json()) as SetupResponse;
    if (!mountedRef.current) return;

    // Dispatch initial section list (all pending)
    dispatch({ type: "SET_SECTIONS", sections: sections.map(mapSetupSection) });

    // Step 3: Generate sections sequentially
    const { orderedSections, execIndex } = orderSections(sections);
    let differentiators: string[] = [];

    for (let i = 0; i < orderedSections.length; i++) {
      if (!mountedRef.current) return;
      const section = orderedSections[i];

      dispatch({
        type: "UPDATE_SECTION",
        sectionId: section.id,
        updates: { generationStatus: "generating" },
      });

      const result = await generateOneSection(
        proposalId,
        section,
        differentiators,
        fetchFn,
      );

      dispatch({
        type: "UPDATE_SECTION",
        sectionId: section.id,
        updates: {
          generationStatus:
            result.status === "completed" ? "complete" : "failed",
          content: result.content ?? "",
          generationError: result.error,
        },
      });

      // Extract differentiators from exec summary for subsequent sections
      if (i === execIndex && result.differentiators) {
        differentiators = result.differentiators;
      }
    }

    // Step 4: Finalize
    if (!mountedRef.current) return;
    await fetchFn(`/api/proposals/${proposalId}/generate/finalize`, {
      method: "POST",
    });

    dispatch({ type: "GENERATION_COMPLETE" });

    logger.info("Draft flow complete", {
      proposalId,
      sectionCount: sections.length,
    });
  } catch (err) {
    if (!mountedRef.current) return;
    const message =
      err instanceof Error ? err.message : "Draft generation failed";
    logger.error("Draft flow error", err, { message });
    dispatch({ type: "GENERATION_FAIL" });
  }
}

// ── Resume after browser refresh ─────────────────────────────────────────────

/**
 * Resume a generation that was interrupted (e.g., browser refresh).
 * Calls setup (which returns existing sections if already generating),
 * then re-runs all sections. Already-completed sections return instantly
 * via server-side idempotency (cached content, no re-generation).
 */
export async function resumeDraftFlow(
  proposalId: string,
  dispatch: Dispatch<CreateAction>,
  mountedRef: { current: boolean },
  fetchFn: FetchFn,
): Promise<void> {
  dispatch({ type: "SET_PROPOSAL_ID", id: proposalId });
  dispatch({ type: "GENERATION_START" });

  try {
    // Setup returns existing sections if proposal is already generating
    const setupRes = await fetchFn(
      `/api/proposals/${proposalId}/generate/setup`,
      { method: "POST" },
    );
    if (!setupRes.ok) throw new Error(await extractError(setupRes));
    const setupData = (await setupRes.json()) as SetupResponse;
    if (!mountedRef.current) return;

    dispatch({
      type: "SET_SECTIONS",
      sections: setupData.sections.map(mapSetupSection),
    });

    // Re-run all sections — server-side idempotency returns cached results
    // for already-completed sections (no wasted Gemini calls)
    const { orderedSections, execIndex } = orderSections(setupData.sections);
    let differentiators: string[] = [];

    for (let i = 0; i < orderedSections.length; i++) {
      if (!mountedRef.current) return;
      const section = orderedSections[i];

      dispatch({
        type: "UPDATE_SECTION",
        sectionId: section.id,
        updates: { generationStatus: "generating" },
      });

      const result = await generateOneSection(
        proposalId,
        section,
        differentiators,
        fetchFn,
      );

      dispatch({
        type: "UPDATE_SECTION",
        sectionId: section.id,
        updates: {
          generationStatus:
            result.status === "completed" ? "complete" : "failed",
          content: result.content ?? "",
          generationError: result.error,
        },
      });

      if (i === execIndex && result.differentiators) {
        differentiators = result.differentiators;
      }
    }

    if (!mountedRef.current) return;
    await fetchFn(`/api/proposals/${proposalId}/generate/finalize`, {
      method: "POST",
    });

    dispatch({ type: "GENERATION_COMPLETE" });
    logger.info("Resume draft flow complete", { proposalId });
  } catch (err) {
    if (!mountedRef.current) return;
    logger.error("Resume draft flow error", err);
    dispatch({ type: "GENERATION_FAIL" });
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function orderSections(sections: SetupSection[]) {
  const execSection = sections.find(
    (s) => s.sectionType === "executive_summary",
  );
  const otherSections = sections.filter(
    (s) => s.sectionType !== "executive_summary",
  );

  const orderedSections = execSection
    ? [execSection, ...otherSections]
    : otherSections;
  const execIndex = execSection ? 0 : -1;

  return { orderedSections, execIndex };
}

const POLL_INTERVAL_MS = 3_000;
const MAX_POLL_ATTEMPTS = 25; // ~75s max wait

async function pollSectionStatus(
  proposalId: string,
  sectionId: string,
  dispatch: Dispatch<CreateAction>,
  fetchFn: FetchFn,
): Promise<void> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    try {
      const res = await fetchFn(`/api/proposals/${proposalId}`);
      if (!res.ok) continue;
      const data = await res.json();
      const sec = (data.sections as Array<Record<string, string>>)?.find(
        (s) => s.id === sectionId,
      );
      if (!sec) continue;
      if (sec.generation_status === "completed") {
        dispatch({
          type: "UPDATE_SECTION",
          sectionId,
          updates: {
            generationStatus: "complete",
            content: sec.generated_content ?? "",
          },
        });
        return;
      }
      if (sec.generation_status === "failed") {
        dispatch({
          type: "UPDATE_SECTION",
          sectionId,
          updates: { generationStatus: "failed" },
        });
        return;
      }
    } catch {
      /* retry */
    }
  }
  // Timed out
  dispatch({
    type: "UPDATE_SECTION",
    sectionId,
    updates: { generationStatus: "failed" },
  });
}

async function generateOneSection(
  proposalId: string,
  section: SetupSection,
  differentiators: string[],
  fetchFn: FetchFn,
): Promise<SectionResult> {
  try {
    const res = await fetchFn(`/api/proposals/${proposalId}/generate/section`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sectionId: section.id,
        sectionType: section.sectionType,
        differentiators,
      }),
    });

    if (!res.ok) {
      return { status: "failed", error: await extractError(res) };
    }

    return (await res.json()) as SectionResult;
  } catch (err) {
    return {
      status: "failed",
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}
