import { NextRequest } from "next/server";
import { getUserContext } from "@/lib/supabase/auth-api";
import { checkFeature } from "@/lib/features/check-feature";
import { createAdminClient } from "@/lib/supabase/admin";
import { intelligenceClient } from "@/lib/intelligence";
import { buildOpportunityMatchProfile } from "@/lib/intelligence/opportunity-match-profile";
import { unauthorized, apiError, ok, serverError } from "@/lib/api/response";

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

    return ok({
      ...response,
      profile_summary: summary,
    });
  } catch (error) {
    return serverError("Failed to load opportunity matches", error);
  }
}
