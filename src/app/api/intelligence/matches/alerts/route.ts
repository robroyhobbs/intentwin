import { NextRequest } from "next/server";
import { getUserContext } from "@/lib/supabase/auth-api";
import { checkFeature } from "@/lib/features/check-feature";
import { createAdminClient } from "@/lib/supabase/admin";
import { intelligenceClient } from "@/lib/intelligence";
import { buildOpportunityMatchProfile } from "@/lib/intelligence/opportunity-match-profile";
import { buildMatchAlerts } from "@/lib/intelligence/match-alerts";
import {
  apiError,
  ok,
  serverError,
  unauthorized,
} from "@/lib/api/response";
import type { OpportunityMatchFeedback } from "@/lib/intelligence/types";

const ALERT_MATCH_LIMIT = 25;

function isFeedbackStatus(
  value: unknown,
): value is OpportunityMatchFeedback["status"] {
  return (
    value === "saved" ||
    value === "reviewing" ||
    value === "proposal_started" ||
    value === "dismissed"
  );
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

    if (!intelligenceClient.isConfigured) {
      return apiError({
        message: "Intelligence service not configured",
        status: 503,
        code: "SERVICE_UNAVAILABLE",
      });
    }

    const adminClient = createAdminClient();
    const [companyRes, productsRes] = await Promise.all([
      adminClient
        .from("company_context")
        .select("category, key, title, content")
        .eq("organization_id", context.organizationId)
        .order("category"),
      adminClient
        .from("product_contexts")
        .select("id, product_name, service_line, description, capabilities")
        .eq("organization_id", context.organizationId)
        .order("service_line")
        .order("product_name"),
    ]);

    if (companyRes.error) {
      return serverError("Failed to load company context", companyRes.error);
    }
    if (productsRes.error) {
      return serverError("Failed to load products", productsRes.error);
    }

    const { profile } = buildOpportunityMatchProfile({
      companyContext: companyRes.data ?? [],
      products: (productsRes.data ?? []).map((product) => ({
        ...product,
        capabilities: Array.isArray(product.capabilities)
          ? product.capabilities
          : [],
      })),
    });

    const matchResponse = await intelligenceClient.getOpportunityMatches({
      profile,
      limit: ALERT_MATCH_LIMIT,
    });

    if (!matchResponse) {
      return apiError({
        message: "Opportunity alerts are temporarily unavailable",
        status: 502,
        code: "BAD_GATEWAY",
      });
    }

    const opportunityIds = matchResponse.matches.map((match) => match.opportunity_id);
    let feedbackByOpportunityId: Record<string, OpportunityMatchFeedback> = {};

    if (opportunityIds.length > 0) {
      const feedbackRes = await adminClient
        .from("opportunity_match_feedback")
        .select("opportunity_id, status, updated_at, proposal_id")
        .eq("organization_id", context.organizationId)
        .in("opportunity_id", opportunityIds);

      if (feedbackRes.error) {
        return serverError("Failed to load match feedback", feedbackRes.error);
      }

      feedbackByOpportunityId = Object.fromEntries(
        (feedbackRes.data ?? []).flatMap((row) =>
          isFeedbackStatus(row.status)
            ? [[
                row.opportunity_id,
                {
                  opportunity_id: row.opportunity_id,
                  status: row.status,
                  updated_at: row.updated_at,
                  proposal_id: row.proposal_id ?? null,
                },
              ]]
            : [],
        ),
      );
    }

    return ok(
      buildMatchAlerts({
        matches: matchResponse.matches,
        feedbackByOpportunityId,
      }),
    );
  } catch (error) {
    return serverError("Failed to load match alerts", error);
  }
}
