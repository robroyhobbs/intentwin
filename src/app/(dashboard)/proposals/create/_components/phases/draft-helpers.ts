import type { Dispatch } from "react";
import type { CreateAction, CreateFlowState, SectionDraft } from "../create-types";
import { logger } from "@/lib/utils/logger";

// ── Constants ───────────────────────────────────────────────────────────────

const POLL_INITIAL_MS = 2_000;
const POLL_BACKOFF = 1.5;
const POLL_MAX_MS = 10_000;
const POLL_TIMEOUT_MS = 600_000; // 10 min

// ── API response types ──────────────────────────────────────────────────────

interface CreateProposalResponse {
  proposal: { id: string };
}

interface GenerateResponse {
  status: string;
  proposalId: string;
  message: string;
}

interface ApiSection {
  id: string;
  section_type: string;
  title: string;
  generated_content: string | null;
  generation_status: "pending" | "generating" | "completed" | "failed";
  section_order: number;
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
  return {
    id: s.id,
    sectionType: s.section_type,
    title: s.title,
    content: s.generated_content ?? "",
    generationStatus: mapGenerationStatus(s.generation_status),
    reviewed: false,
    order: s.section_order,
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
): Promise<string> {
  const payload = buildProposalPayload(state);

  const res = await fetch("/api/proposals", {
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

export async function triggerGeneration(proposalId: string): Promise<void> {
  const res = await fetch(`/api/proposals/${proposalId}/generate`, {
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

  const data = (await res.json()) as GenerateResponse;
  logger.info("Generation triggered", {
    proposalId,
    status: data.status,
  });
}

// ── Poll sections ───────────────────────────────────────────────────────────

function allTerminal(sections: ApiSection[]): boolean {
  return (
    sections.length > 0 &&
    sections.every((s) =>
      s.generation_status === "completed" || s.generation_status === "failed",
    )
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function pollSections(
  proposalId: string,
  dispatch: Dispatch<CreateAction>,
  mountedRef: { current: boolean },
): Promise<void> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let interval = POLL_INITIAL_MS;

  while (Date.now() < deadline) {
    if (!mountedRef.current) return;

    const res = await fetch(`/api/proposals/${proposalId}`);
    if (!res.ok) {
      logger.warn("Poll request failed", { proposalId, status: res.status });
      await delay(interval);
      interval = Math.min(interval * POLL_BACKOFF, POLL_MAX_MS);
      continue;
    }

    const data = (await res.json()) as ProposalPollResponse;
    if (!mountedRef.current) return;

    const mapped = data.sections.map(mapApiSection);
    dispatch({ type: "SET_SECTIONS", sections: mapped });

    if (allTerminal(data.sections)) {
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

  // Timeout
  if (mountedRef.current) {
    dispatch({ type: "GENERATION_FAIL" });
    logger.error("Generation polling timed out", undefined, { proposalId });
  }
}

// ── Orchestrate full draft flow ─────────────────────────────────────────────

export async function runDraftFlow(
  state: CreateFlowState,
  dispatch: Dispatch<CreateAction>,
  mountedRef: { current: boolean },
): Promise<void> {
  dispatch({ type: "GENERATION_START" });

  try {
    const proposalId = await createProposal(state, dispatch);
    if (!mountedRef.current) return;

    await triggerGeneration(proposalId);
    if (!mountedRef.current) return;

    await pollSections(proposalId, dispatch, mountedRef);
  } catch (err) {
    if (!mountedRef.current) return;
    const message = err instanceof Error ? err.message : "Draft generation failed";
    logger.error("Draft flow error", err, { message });
    dispatch({ type: "GENERATION_FAIL" });
  }
}
