import type { Dispatch } from "react";
import type {
  CreateAction,
  CreateFlowState,
  SectionDraft,
} from "../create-types";
import { logger } from "@/lib/utils/logger";
import {
  calculateGenerationPollDelay,
  hasGenerationPollingTimedOut,
} from "@/lib/proposals/generation-poll";
import { startBackgroundGeneration } from "@/lib/proposals/background-generation";
import {
  fetchProposalGenerationSnapshot,
  summarizeProposalGeneration,
} from "@/lib/proposals/proposal-generation-status";

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

interface ProposalPollSection {
  id: string;
  section_type: string;
  title: string;
  section_order?: number;
  generation_status: string;
  generation_error?: string | null;
  generated_content?: string | null;
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

// ── Map setup section to SectionDraft ───────────────────────────────────────

function mapSetupSection(s: SetupSection, order: number): SectionDraft {
  return {
    id: s.id,
    sectionType: s.sectionType,
    title: s.title,
    content: "",
    generationStatus: "pending",
    reviewed: false,
    order,
  };
}

function mapProposalSection(
  section: ProposalPollSection,
  order: number,
  existing?: SectionDraft,
): SectionDraft {
  const generationStatus =
    section.generation_status === "completed"
      ? "complete"
      : section.generation_status === "failed"
        ? "failed"
        : section.generation_status === "generating"
          ? "generating"
          : "pending";

  return {
    id: section.id,
    sectionType: section.section_type,
    title: section.title,
    content:
      generationStatus === "complete"
        ? (section.generated_content ?? "")
        : (existing?.content ?? ""),
    generationStatus,
    generationError: section.generation_error ?? undefined,
    reviewed: existing?.reviewed ?? false,
    order: section.section_order ?? existing?.order ?? order,
  };
}

async function setupDraftGeneration(
  proposalId: string,
  dispatch: Dispatch<CreateAction>,
  fetchFn: FetchFn,
): Promise<SetupSection[]> {
  const { sections, status } = await startBackgroundGeneration(proposalId, fetchFn);

  if (!sections || sections.length === 0) {
    throw new Error(
      status === "already-generating"
        ? "Generation is already in progress. Please refresh and try again."
        : "Setup returned zero sections — cannot generate",
    );
  }

  dispatch({
    type: "SET_SECTIONS",
    sections: sections.map((section, index) => mapSetupSection(section, index)),
  });

  return sections;
}

async function pollDraftGeneration(
  proposalId: string,
  dispatch: Dispatch<CreateAction>,
  mountedRef: { current: boolean },
  fetchFn: FetchFn,
  existingSections: SectionDraft[] = [],
): Promise<void> {
  const startedAt = Date.now();
  const reviewedById = new Map(
    existingSections.map((section) => [section.id, section.reviewed] as const),
  );
  let knownSections = existingSections;

  for (let attempt = 0; ; attempt++) {
    if (!mountedRef.current) return;

    if (attempt > 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, calculateGenerationPollDelay(attempt - 1)),
      );
    }

    if (hasGenerationPollingTimedOut(startedAt, Date.now())) {
      dispatch({ type: "GENERATION_FAIL" });
      return;
    }

    try {
      const proposalData =
        await fetchProposalGenerationSnapshot<ProposalPollSection>(
          proposalId,
          fetchFn,
        );
      if (!proposalData) continue;
      const apiSections = proposalData.sections ?? [];
      const summary = summarizeProposalGeneration(proposalData);

      if (apiSections.length > 0) {
        const existingById = new Map(
          knownSections.map((section) => [section.id, section] as const),
        );
        knownSections = apiSections.map((section, index) =>
          mapProposalSection(section, index, existingById.get(section.id)),
        );
        knownSections = knownSections.map((section) => ({
          ...section,
          reviewed: reviewedById.get(section.id) ?? section.reviewed,
        }));
        dispatch({ type: "SET_SECTIONS", sections: knownSections });
      }

      if (summary.phase !== "generating") {
        dispatch({
          type:
            summary.phase === "complete"
              ? "GENERATION_COMPLETE"
              : "GENERATION_FAIL",
        });
        return;
      }
    } catch {
      // Retry until timeout
    }
  }
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
    // Step 1: Reuse existing proposal on retry/resume instead of creating duplicates
    const proposalId =
      state.proposalId ?? (await createProposal(state, dispatch, fetchFn));
    if (!mountedRef.current) return;

    const sectionCount = await executeDraftGeneration(
      proposalId,
      dispatch,
      mountedRef,
      fetchFn,
    );

    logger.info("Draft flow complete", {
      proposalId,
      sectionCount,
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
    await executeDraftGeneration(proposalId, dispatch, mountedRef, fetchFn);
    logger.info("Resume draft flow complete", { proposalId });
  } catch (err) {
    if (!mountedRef.current) return;
    logger.error("Resume draft flow error", err);
    dispatch({ type: "GENERATION_FAIL" });
  }
}

async function executeDraftGeneration(
  proposalId: string,
  dispatch: Dispatch<CreateAction>,
  mountedRef: { current: boolean },
  fetchFn: FetchFn,
): Promise<number> {
  const sections = await setupDraftGeneration(proposalId, dispatch, fetchFn);
  if (!mountedRef.current) return 0;

  await pollDraftGeneration(
    proposalId,
    dispatch,
    mountedRef,
    fetchFn,
    sections.map((section, index) => mapSetupSection(section, index)),
  );

  return sections.length;
}

const REGEN_POLL_TIMEOUT_MS = 75_000;
const REGEN_POLL_CONFIG = {
  minIntervalMs: 3_000,
  maxIntervalMs: 8_000,
  backoffFactor: 1.35,
} as const;

async function pollSectionStatus(
  proposalId: string,
  sectionId: string,
  dispatch: Dispatch<CreateAction>,
  fetchFn: FetchFn,
): Promise<void> {
  const startedAt = Date.now();
  for (let i = 0; ; i++) {
    if (hasGenerationPollingTimedOut(startedAt, Date.now(), REGEN_POLL_TIMEOUT_MS)) {
      break;
    }
    await new Promise((r) =>
      setTimeout(r, calculateGenerationPollDelay(i, REGEN_POLL_CONFIG)),
    );
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
