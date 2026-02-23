import { createAdminClient } from "@/lib/supabase/admin";
import { createLogger } from "@/lib/utils/logger";
import { inngest } from "@/inngest/client";
import { ProposalStatus, ComplianceAssessmentStatus } from "@/lib/constants/statuses";
import { conflict, notFound, ok, withProposalRoute } from "@/lib/api/response";

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

/**
 * POST /api/proposals/[id]/compliance-assessment
 * Trigger compliance auto-assessment via Inngest. Returns immediately.
 */
export const POST = withProposalRoute(
  async (_request, id, context) => {
    const supabase = createAdminClient();
    const log = createLogger({ operation: "complianceAssessmentRoute", proposalId: id });

    // Fetch current proposal state
    const { data: proposal } = await supabase
      .from("proposals")
      .select("id, status, compliance_assessment")
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .single();

    if (!proposal) {
      return notFound("Proposal not found");
    }

    // Block if proposal is still generating
    if (proposal.status === ProposalStatus.GENERATING) {
      return conflict("Cannot assess while proposal is generating");
    }

    // Check for stale/stuck assessment
    const assessment = proposal.compliance_assessment as Record<string, unknown> | null;
    if (assessment?.status === ComplianceAssessmentStatus.ASSESSING) {
      const assessedAt = assessment.assessed_at as string | undefined;
      // If timestamp is missing, treat as stale (safe fallback — avoids permanently stuck state)
      const startTime = assessedAt ? new Date(assessedAt).getTime() : 0;
      const elapsed = Date.now() - startTime;

      if (elapsed < STALE_THRESHOLD_MS) {
        return conflict("Assessment already in progress");
      }

      // Stale — explicitly reset to "failed" in DB before re-triggering
      log.warn("Stale assessment detected, resetting and allowing re-trigger", {
        elapsed: Math.round(elapsed / 1000),
        startedAt: assessedAt ?? "missing",
      });
      await supabase
        .from("proposals")
        .update({
          compliance_assessment: {
            ...assessment,
            status: ComplianceAssessmentStatus.FAILED,
            error: "Assessment timed out and was automatically reset.",
          },
        })
        .eq("id", id);
    }

    // Send event to Inngest for durable background execution
    await inngest.send({
      name: "proposal/compliance.requested",
      data: { proposalId: id, trigger: "manual" },
    });

    return ok({ status: ComplianceAssessmentStatus.ASSESSING });
  },
);

/**
 * GET /api/proposals/[id]/compliance-assessment
 * Returns the current assessment status/metadata.
 */
export const GET = withProposalRoute(
  async (_request, id, context) => {
    const supabase = createAdminClient();
    const { data: proposal } = await supabase
      .from("proposals")
      .select("compliance_assessment")
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .single();

    return ok({
      assessment: proposal?.compliance_assessment || null,
    });
  },
);
