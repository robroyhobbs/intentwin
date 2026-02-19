import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext, checkProposalAccess } from "@/lib/supabase/auth-api";
import { createLogger } from "@/lib/utils/logger";
import { inngest } from "@/inngest/client";

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

/**
 * POST /api/proposals/[id]/compliance-assessment
 * Trigger compliance auto-assessment via Inngest. Returns immediately.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await checkProposalAccess(context, id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

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
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Block if proposal is still generating
    if (proposal.status === "generating") {
      return NextResponse.json(
        { error: "Cannot assess while proposal is generating" },
        { status: 409 },
      );
    }

    // Check for stale/stuck assessment
    const assessment = proposal.compliance_assessment as Record<string, unknown> | null;
    if (assessment?.status === "assessing") {
      const assessedAt = assessment.assessed_at as string | undefined;
      // If timestamp is missing, treat as stale (safe fallback — avoids permanently stuck state)
      const startTime = assessedAt ? new Date(assessedAt).getTime() : 0;
      const elapsed = Date.now() - startTime;

      if (elapsed < STALE_THRESHOLD_MS) {
        return NextResponse.json(
          { error: "Assessment already in progress" },
          { status: 409 },
        );
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
            status: "failed",
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

    return NextResponse.json({ status: "assessing" });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/proposals/[id]/compliance-assessment
 * Returns the current assessment status/metadata.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await checkProposalAccess(context, id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const supabase = createAdminClient();
    const { data: proposal } = await supabase
      .from("proposals")
      .select("compliance_assessment")
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .single();

    return NextResponse.json({
      assessment: proposal?.compliance_assessment || null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
