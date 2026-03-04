import type { Dispatch } from "react";
import type {
  CreateAction,
  CreateFlowState,
  SectionDraft,
} from "../create-types";
import { logger } from "@/lib/utils/logger";

type FetchFn = (url: string, options?: RequestInit) => Promise<Response>;

// ── Constants ───────────────────────────────────────────────────────────────

const POLL_INITIAL_MS = 2_000;
const POLL_BACKOFF = 1.5;
const POLL_MAX_MS = 10_000;
const POLL_TIMEOUT_MS = 600_000; // 10 min

// ── API response types ──────────────────────────────────────────────────────

interface CreateProposalResponse {
  proposal: { id: string };
}

interface ApiSection {
  id: string;
  section_type: string;
  title: string;
  generated_content: string | null;
  generation_status: "pending" | "generating" | "completed" | "failed";
  section_order: number;
  metadata?: { grounding_level?: "high" | "medium" | "low" } | null;
}

interface ProposalPollResponse {
  proposal: { id: string; status: string };
  sections: ApiSection[];
}

// ── Status mapping ──────────────────────────────────────────────────────────

function mapGenerationStatus(
  apiStatus: string,
): SectionDraft["generationStatus"] {
  switch (apiStatus) {
    case "completed":
      return "complete";
    case "generating":
      return "generating";
    case "failed":
      return "failed";
    default:
      return "pending";
  }
}

function mapApiSection(s: ApiSection): SectionDraft {
  const meta = s.metadata as {
    grounding_level?: "high" | "medium" | "low";
  } | null;
  return {
    id: s.id,
    sectionType: s.section_type,
    title: s.title,
    content: s.generated_content ?? "",
    generationStatus: mapGenerationStatus(s.generation_status),
    reviewed: false,
    order: s.section_order,
    groundingLevel: meta?.grounding_level,
  };
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

// ── Trigger generation ──────────────────────────────────────────────────────

export async function triggerGeneration(
  proposalId: string,
  fetchFn: FetchFn,
): Promise<void> {
  const res = await fetchFn(`/api/proposals/${proposalId}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  // 409 means already generating — treat as success
  if (res.status === 409) {
    logger.info("Generation already in progress", { proposalId });
    return;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (body as Record<string, string>).message ?? res.statusText;
    throw new Error(`Failed to trigger generation: ${msg}`);
  }

  const data = (await res.json()) as { status: string };
  logger.info("Generation triggered", { proposalId, status: data.status });
}

// ── Poll sections ───────────────────────────────────────────────────────────

function allTerminal(sections: ApiSection[]): boolean {
  return (
    sections.length > 0 &&
    sections.every(
      (s) =>
        s.generation_status === "completed" || s.generation_status === "failed",
    )
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mapSections(sections: ApiSection[]): SectionDraft[] {
  return sections.map(mapApiSection);
}

function handlePollTimeout(
  sections: ApiSection[],
  dispatch: Dispatch<CreateAction>,
  proposalId: string,
): void {
  const completed = sections.filter((s) => s.generation_status === "completed");
  if (completed.length > 0) {
    dispatch({ type: "SET_SECTIONS", sections: mapSections(sections) });
    dispatch({ type: "GENERATION_COMPLETE" });
    logger.warn("Generation timed out with partial success", {
      proposalId,
      completed: completed.length,
      total: sections.length,
    });
  } else {
    dispatch({ type: "GENERATION_FAIL" });
    logger.error("Generation polling timed out", undefined, { proposalId });
  }
}

export async function pollSections(
  proposalId: string,
  dispatch: Dispatch<CreateAction>,
  mountedRef: { current: boolean },
  fetchFn: FetchFn,
): Promise<void> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let interval = POLL_INITIAL_MS;
  let latestSections: ApiSection[] = [];

  while (Date.now() < deadline) {
    if (!mountedRef.current) return;

    const res = await fetchFn(`/api/proposals/${proposalId}`);
    if (!res.ok) {
      logger.warn("Poll request failed", { proposalId, status: res.status });
      await delay(interval);
      interval = Math.min(interval * POLL_BACKOFF, POLL_MAX_MS);
      continue;
    }

    const data = (await res.json()) as ProposalPollResponse;
    if (!mountedRef.current) return;

    latestSections = data.sections;
    dispatch({
      type: "SET_SECTIONS",
      sections: data.sections.map(mapApiSection),
    });

    const proposalDone =
      data.proposal.status === "review" || data.proposal.status === "draft";

    // Proposal status can flip before every section row is visibly terminal.
    // Keep polling until sections settle to avoid false client-side failures.
    if (proposalDone && !allTerminal(data.sections)) {
      await delay(interval);
      interval = Math.min(interval * POLL_BACKOFF, POLL_MAX_MS);
      continue;
    }

    if (proposalDone || allTerminal(data.sections)) {
      dispatch({
        type: "SET_SECTIONS",
        sections: mapSections(data.sections),
      });
      dispatch({ type: "GENERATION_COMPLETE" });
      logger.info("Generation complete", {
        proposalId,
        sectionCount: data.sections.length,
      });
      return;
    }

    await delay(interval);
    interval = Math.min(interval * POLL_BACKOFF, POLL_MAX_MS);
  }

  if (mountedRef.current) {
    handlePollTimeout(latestSections, dispatch, proposalId);
  }
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

    logger.info("Section regeneration triggered", { proposalId, sectionId });
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

// ── Orchestrate full draft flow ─────────────────────────────────────────────

export async function runDraftFlow(
  state: CreateFlowState,
  dispatch: Dispatch<CreateAction>,
  mountedRef: { current: boolean },
  fetchFn: FetchFn,
): Promise<void> {
  dispatch({ type: "GENERATION_START" });

  try {
    const proposalId = await createProposal(state, dispatch, fetchFn);
    if (!mountedRef.current) return;

    await triggerGeneration(proposalId, fetchFn);
    if (!mountedRef.current) return;

    await pollSections(proposalId, dispatch, mountedRef, fetchFn);
  } catch (err) {
    if (!mountedRef.current) return;
    const message =
      err instanceof Error ? err.message : "Draft generation failed";
    logger.error("Draft flow error", err, { message });
    dispatch({ type: "GENERATION_FAIL" });
  }
}
