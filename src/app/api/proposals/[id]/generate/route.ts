/**
 * POST /api/proposals/[id]/generate
 *
 * Triggers full proposal generation via Inngest (durable background execution).
 *
 * Active callers:
 *   - /proposals/[id]/page.tsx (re-generate button)
 *   - /proposals/new/_components/step-generate.tsx (old wizard)
 *
 * The new /proposals/create wizard uses client-orchestrated routes instead:
 *   - POST /generate/setup
 *   - POST /generate/section
 *   - POST /generate/finalize
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { inngest } from "@/inngest/client";
import { ProposalStatus } from "@/lib/constants/statuses";
import { fetchL1Context } from "@/lib/ai/pipeline/context";
import {
  runPreflightCheck,
  type PreflightResult,
} from "@/lib/ai/pipeline/preflight";
import type { BidEvaluation } from "@/lib/ai/bid-scoring";
import { logger } from "@/lib/utils/logger";
import { checkFeature } from "@/lib/features/check-feature";
import { checkPlanLimit } from "@/lib/supabase/auth-api";
import {
  conflict,
  ok,
  serverError,
  forbidden,
  withProposalRoute,
} from "@/lib/api/response";
import { apiError } from "@/lib/api/response";

const formatTimingMs = (value: number) => Math.max(0, Math.round(value));

export const POST = withProposalRoute(
  async (_request, { id }, context, proposal) => {
    const startedAt = Date.now();
    let featureGateDurationMs = 0;
    let preflightDurationMs = 0;
    let claimDurationMs = 0;
    let tokenCheckDurationMs = 0;
    let queueDurationMs = 0;

    // ── Feature gate: ai_generation requires Starter+ ────────────────────
    const featureGateStartedAt = Date.now();
    const canGenerate = await checkFeature(
      context.organizationId,
      "ai_generation",
    );
    featureGateDurationMs = Date.now() - featureGateStartedAt;
    if (!canGenerate) {
      return forbidden(
        "AI proposal generation requires a Starter plan or above. Upgrade at /pricing.",
      );
    }

    // ── Pre-flight readiness check (fail-open) ───────────────────────────
    const preflightStartedAt = Date.now();
    let preflight: PreflightResult | null = null;
    try {
      const intakeData =
        (proposal!.intake_data as Record<string, unknown>) || {};
      const serviceLine = intakeData.service_line as string | undefined;
      const industry = intakeData.client_industry as string | undefined;
      const adminClient = createAdminClient();
      const l1Context = await fetchL1Context(
        adminClient,
        serviceLine,
        industry,
        context.organizationId,
      );
      const requirements =
        (proposal!.rfp_extracted_requirements as
          | Record<string, unknown>[]
          | null) ?? null;
      const bidEvaluation =
        (proposal!.bid_evaluation as BidEvaluation | null) ?? null;
      preflight = runPreflightCheck(
        l1Context,
        intakeData,
        requirements,
        bidEvaluation,
      );
    } catch (preflightError) {
      logger.warn("Preflight check failed (non-blocking)", {
        error:
          preflightError instanceof Error
            ? preflightError.message
            : String(preflightError),
      });
    }
    preflightDurationMs = Date.now() - preflightStartedAt;

    // Atomic guard: only one generation at a time.
    const claimStartedAt = Date.now();
    const adminClientForClaim = createAdminClient();
    const { data: claimed, error: claimError } = await adminClientForClaim
      .from("proposals")
      .update({
        status: ProposalStatus.GENERATING,
        generation_started_at: new Date().toISOString(),
      })
      .eq("id", id)
      .neq("status", ProposalStatus.GENERATING)
      .select("id")
      .maybeSingle();
    claimDurationMs = Date.now() - claimStartedAt;

    if (claimError) {
      logger.error("Generation claim error", claimError);
      return serverError("Failed to start generation");
    }

    if (!claimed) {
      return conflict("Proposal is already being generated");
    }

    // ── Token limit check ────────────────────────────────────────────────
    const tokenCheckStartedAt = Date.now();
    const tokenCheck = await checkPlanLimit(
      context.organizationId,
      "ai_tokens_per_month",
    );
    tokenCheckDurationMs = Date.now() - tokenCheckStartedAt;
    if (!tokenCheck.allowed) {
      return apiError({
        message:
          tokenCheck.message ||
          "AI token limit reached. Upgrade your plan to continue.",
        status: 429,
        code: "TOKEN_LIMIT_REACHED",
      });
    }

    // Send event to Inngest for durable background execution.
    const queueStartedAt = Date.now();
    await inngest.send({
      name: "proposal/generate.requested",
      data: { proposalId: id },
    });
    queueDurationMs = Date.now() - queueStartedAt;

    const totalDurationMs = Date.now() - startedAt;
    const response = ok({
      status: ProposalStatus.GENERATING,
      proposalId: id,
      message: "Proposal generation started.",
      preflight: preflight ?? undefined,
    });
    response.headers.set(
      "Server-Timing",
      [
        `gate;dur=${formatTimingMs(featureGateDurationMs)}`,
        `preflight;dur=${formatTimingMs(preflightDurationMs)}`,
        `claim;dur=${formatTimingMs(claimDurationMs)}`,
        `token;dur=${formatTimingMs(tokenCheckDurationMs)}`,
        `queue;dur=${formatTimingMs(queueDurationMs)}`,
        `total;dur=${formatTimingMs(totalDurationMs)}`,
      ].join(", "),
    );
    return response;
  },
  { requireFullProposal: true },
);
