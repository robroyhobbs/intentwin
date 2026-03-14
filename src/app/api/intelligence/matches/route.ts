import { NextRequest } from "next/server";
import { getUserContext } from "@/lib/supabase/auth-api";
import { checkFeature } from "@/lib/features/check-feature";
import { createAdminClient } from "@/lib/supabase/admin";
import { intelligenceClient } from "@/lib/intelligence";
import { buildOpportunityMatchProfile } from "@/lib/intelligence/opportunity-match-profile";
import {
  unauthorized,
  apiError,
  badRequest,
  ok,
  serverError,
} from "@/lib/api/response";
import type { OpportunityMatchFeedbackStatus } from "@/lib/intelligence/types";

function clampLimit(value: string | null): number {
  const parsed = Number.parseInt(value ?? "10", 10);
  if (!Number.isFinite(parsed)) return 10;
  return Math.min(Math.max(parsed, 1), 25);
}

function parseNaicsCodes(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean);
}

function isFeedbackStatus(
  value: unknown,
): value is OpportunityMatchFeedbackStatus {
  return value === "saved" || value === "dismissed";
}

function normalizeText(value: unknown, maxLength = 240): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
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

    const searchParams = request.nextUrl.searchParams;
    const filters = {
      q: searchParams.get("q")?.trim() || undefined,
      city: searchParams.get("city")?.trim() || undefined,
      state: searchParams.get("state")?.trim().toUpperCase() || undefined,
      setAsideType: searchParams.get("set_aside_type")?.trim() || undefined,
      naicsCodes: parseNaicsCodes(searchParams.get("naics")),
    };
    const limit = clampLimit(searchParams.get("limit"));

    const { profile, summary } = buildOpportunityMatchProfile({
      companyContext: companyRes.data ?? [],
      products: (productsRes.data ?? []).map((product) => ({
        ...product,
        capabilities: Array.isArray(product.capabilities)
          ? product.capabilities
          : [],
      })),
      filters,
    });

    const response = await intelligenceClient.getOpportunityMatches({
      profile,
      filters: {
        naics_codes: filters.naicsCodes.length > 0 ? filters.naicsCodes : undefined,
        q: filters.q,
        city: filters.city,
        state: filters.state,
      },
      limit,
    });

    if (!response) {
      return apiError({
        message: "Opportunity matches are temporarily unavailable",
        status: 502,
        code: "BAD_GATEWAY",
      });
    }

    const opportunityIds = response.matches.map((match) => match.opportunity_id);
    let feedbackByOpportunityId: Record<
      string,
      { status: OpportunityMatchFeedbackStatus; updated_at: string }
    > = {};

    if (opportunityIds.length > 0) {
      const feedbackRes = await adminClient
        .from("opportunity_match_feedback")
        .select("opportunity_id, status, updated_at")
        .eq("organization_id", context.organizationId)
        .in("opportunity_id", opportunityIds);

      if (feedbackRes.error) {
        return serverError("Failed to load match feedback", feedbackRes.error);
      }

      feedbackByOpportunityId = Object.fromEntries(
        (feedbackRes.data ?? []).flatMap((row) =>
          isFeedbackStatus(row.status)
            ? [[row.opportunity_id, { status: row.status, updated_at: row.updated_at }]]
            : [],
        ),
      );
    }

    return ok({
      ...response,
      profile_summary: summary,
      feedback_by_opportunity_id: feedbackByOpportunityId,
    });
  } catch (error) {
    return serverError("Failed to load opportunity matches", error);
  }
}

export async function PATCH(request: NextRequest) {
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

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return badRequest("Invalid JSON body");
    }

    const opportunityId = normalizeText(body.opportunity_id, 120);
    if (!opportunityId) {
      return badRequest("opportunity_id is required");
    }

    const status = body.status;
    if (status !== null && !isFeedbackStatus(status)) {
      return badRequest("status must be 'saved', 'dismissed', or null");
    }

    const adminClient = createAdminClient();

    if (status === null) {
      const deleteRes = await adminClient
        .from("opportunity_match_feedback")
        .delete()
        .eq("organization_id", context.organizationId)
        .eq("opportunity_id", opportunityId);

      if (deleteRes.error) {
        return serverError("Failed to clear match feedback", deleteRes.error);
      }

      return ok({ feedback: null });
    }

    const opportunity =
      body.opportunity && typeof body.opportunity === "object" && !Array.isArray(body.opportunity)
        ? (body.opportunity as Record<string, unknown>)
        : null;

    const source = normalizeText(opportunity?.source, 80);
    const title = normalizeText(opportunity?.title, 240);

    if (!source || !title) {
      return badRequest("opportunity source and title are required");
    }

    const upsertRes = await adminClient
      .from("opportunity_match_feedback")
      .upsert(
        {
          organization_id: context.organizationId,
          user_id: context.user.id,
          opportunity_id: opportunityId,
          source,
          title,
          agency: normalizeText(opportunity?.agency, 240),
          portal_url: normalizeText(opportunity?.portal_url, 500),
          status,
        },
        { onConflict: "organization_id,opportunity_id" },
      )
      .select("opportunity_id, status, updated_at")
      .single();

    if (upsertRes.error || !upsertRes.data) {
      return serverError("Failed to save match feedback", upsertRes.error);
    }

    return ok({
      feedback: {
        opportunity_id: upsertRes.data.opportunity_id,
        status: upsertRes.data.status,
        updated_at: upsertRes.data.updated_at,
      },
    });
  } catch (error) {
    return serverError("Failed to update match feedback", error);
  }
}
