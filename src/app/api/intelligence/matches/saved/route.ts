import { NextRequest } from "next/server";
import { getUserContext } from "@/lib/supabase/auth-api";
import { checkFeature } from "@/lib/features/check-feature";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  unauthorized,
  apiError,
  ok,
  serverError,
} from "@/lib/api/response";
import type { OpportunityMatchFeedbackStatus } from "@/lib/intelligence/types";

function isSavedLifecycleStatus(
  value: unknown,
): value is Exclude<OpportunityMatchFeedbackStatus, "dismissed"> {
  return value === "saved" || value === "reviewing" || value === "proposal_started";
}

export async function GET(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    if (!context) {
      return unauthorized();
    }

    const canUseIntelligence = await checkFeature(
      context.organizationId,
      "intelligence_suite",
    );
    if (!canUseIntelligence) {
      return apiError({
        message: "The intelligence suite requires a Pro plan or above. Upgrade at /pricing.",
        status: 403,
        code: "FEATURE_GATED",
      });
    }

    const adminClient = createAdminClient();
    const feedbackRes = await adminClient
      .from("opportunity_match_feedback")
      .select(
        "opportunity_id, source, title, agency, portal_url, status, updated_at, proposal_id",
      )
      .eq("organization_id", context.organizationId)
      .in("status", ["saved", "reviewing", "proposal_started"])
      .order("updated_at", { ascending: false });

    if (feedbackRes.error) {
      return serverError("Failed to load saved matches", feedbackRes.error);
    }

    const proposalIds = (feedbackRes.data ?? [])
      .map((row) => row.proposal_id)
      .filter((value): value is string => typeof value === "string" && value.length > 0);

    let proposalsById: Record<
      string,
      { id: string; title: string; status: string; updated_at: string }
    > = {};

    if (proposalIds.length > 0) {
      const proposalsRes = await adminClient
        .from("proposals")
        .select("id, title, status, updated_at")
        .eq("organization_id", context.organizationId)
        .in("id", proposalIds);

      if (proposalsRes.error) {
        return serverError("Failed to load linked proposals", proposalsRes.error);
      }

      proposalsById = Object.fromEntries(
        (proposalsRes.data ?? []).map((proposal) => [
          proposal.id,
          {
            id: proposal.id,
            title: proposal.title,
            status: proposal.status,
            updated_at: proposal.updated_at,
          },
        ]),
      );
    }

    return ok({
      saved_matches: (feedbackRes.data ?? [])
        .filter((row) => isSavedLifecycleStatus(row.status))
        .map((row) => ({
          opportunity_id: row.opportunity_id,
          source: row.source,
          title: row.title,
          agency: row.agency,
          portal_url: row.portal_url,
          status: row.status,
          updated_at: row.updated_at,
          proposal_id: row.proposal_id ?? null,
          proposal: row.proposal_id ? proposalsById[row.proposal_id] ?? null : null,
        })),
    });
  } catch (error) {
    return serverError("Failed to load saved matches", error);
  }
}
