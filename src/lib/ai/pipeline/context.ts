import { createAdminClient } from "@/lib/supabase/admin";
import { generateStructuredAnalysis, buildSystemPrompt } from "../claude";
import { loadSources, formatSourcesAsL1Context } from "@/lib/sources";
import { getIndustryConfig } from "../industry-configs";
import { createLogger } from "@/lib/utils/logger";
import { TtlCache } from "@/lib/utils/ttl-cache";
import type { WinStrategyData } from "@/types/outcomes";
import type { OutcomeContract, CompanyContext, ProductContext, EvidenceLibraryEntry, CompanyInfo } from "@/types/idd";
import type { BrandVoice } from "../persuasion";
import type { L1Context, PipelineContext } from "./types";

// L1 context changes rarely (admin-only updates). Cache for 5 minutes
// to avoid redundant DB queries during concurrent proposal generations.
const l1Cache = new TtlCache<L1Context>({ ttlMs: 5 * 60 * 1000, maxSize: 50 });

/** Clear the L1 context cache (used in tests and after L1 data updates) */
export function clearL1Cache(): void {
  l1Cache.clear();
}

/** Fetch L1 Context: Company Truth from the database.
 * Results are cached in-memory for 5 minutes keyed by org+serviceLine+industry. */
export async function fetchL1Context(
  supabase: ReturnType<typeof createAdminClient>,
  serviceLine?: string,
  industry?: string,
  organizationId?: string,
): Promise<L1Context> {
  // Check cache first
  const cacheKey = `${organizationId || "none"}:${serviceLine || "all"}:${industry || "all"}`;
  const cached = l1Cache.get(cacheKey);
  if (cached) return cached;

  try {
    // Fetch company context (brand, values, certifications, legal)
    let companyQuery = supabase
      .from("company_context")
      .select("*")
      .order("category");
    if (organizationId) {
      companyQuery = companyQuery.eq("organization_id", organizationId);
    }
    const { data: companyContext } = await companyQuery;

    // Fetch relevant product contexts
    let productQuery = supabase.from("product_contexts").select("*");
    if (organizationId) {
      productQuery = productQuery.eq("organization_id", organizationId);
    }
    if (serviceLine) {
      productQuery = productQuery.eq("service_line", serviceLine);
    }
    const { data: productContexts } = await productQuery;

    // Fetch relevant evidence (case studies, metrics)
    let evidenceQuery = supabase
      .from("evidence_library")
      .select("*")
      .eq("is_verified", true);
    if (organizationId) {
      evidenceQuery = evidenceQuery.eq("organization_id", organizationId);
    }
    if (serviceLine) {
      evidenceQuery = evidenceQuery.eq("service_line", serviceLine);
    }
    if (industry) {
      evidenceQuery = evidenceQuery.or(
        `client_industry.eq.${industry},client_industry.is.null`,
      );
    }
    const { data: evidenceLibrary } = await evidenceQuery.limit(10);

    const result: L1Context = {
      companyContext: (companyContext || []) as CompanyContext[],
      productContexts: (productContexts || []) as ProductContext[],
      evidenceLibrary: (evidenceLibrary || []) as EvidenceLibraryEntry[],
    };

    // Cache the result for subsequent calls with same params
    l1Cache.set(cacheKey, result);

    return result;
  } catch (error) {
    const l1Log = createLogger({ operation: "fetchL1Context" });
    l1Log.error("Error fetching L1 context", error);
    return {
      companyContext: [],
      productContexts: [],
      evidenceLibrary: [],
    };
  }
}

/** Build the Outcome Contract context string for prompts */
export function buildOutcomeContractContext(
  outcomeContract: OutcomeContract | null,
): string {
  if (!outcomeContract) return "";

  const sections: string[] = [];

  if (outcomeContract.current_state?.length > 0) {
    sections.push(
      `## Client Current State (Pain Points)\n${outcomeContract.current_state.map((p) => `- ${p}`).join("\n")}`,
    );
  }

  if (outcomeContract.desired_state?.length > 0) {
    sections.push(
      `## Client Desired Outcomes\n${outcomeContract.desired_state.map((o) => `- ${o}`).join("\n")}`,
    );
  }

  if (outcomeContract.transformation) {
    sections.push(
      `## Transformation Promise\n${outcomeContract.transformation}`,
    );
  }

  if (outcomeContract.success_metrics?.length > 0) {
    const metricsTable = outcomeContract.success_metrics
      .filter((m) => m.outcome)
      .map(
        (m) =>
          `- ${m.outcome}: ${m.metric} → Target: ${m.target} (Measured by: ${m.measurement_method})`,
      )
      .join("\n");
    sections.push(`## Success Metrics\n${metricsTable}`);
  }

  return sections.length > 0
    ? `\n\n=== OUTCOME CONTRACT (Source of Truth) ===\n${sections.join("\n\n")}\n=== END OUTCOME CONTRACT ===\n`
    : "";
}

/** Build L1 context string for prompts */
export function buildL1ContextString(l1Context: L1Context): string {
  const sections: string[] = [];

  // Company brand and values
  const brandContext = l1Context.companyContext.filter(
    (c) => c.category === "brand" || c.category === "values",
  );
  if (brandContext.length > 0) {
    const brandStr = brandContext
      .map((c) => `- ${c.title}: ${c.content}`)
      .join("\n");
    sections.push(`## Company Identity\n${brandStr}`);
  }

  // Certifications
  const certs = l1Context.companyContext.filter(
    (c) => c.category === "certifications",
  );
  if (certs.length > 0) {
    const certsStr = certs.map((c) => `- ${c.title}: ${c.content}`).join("\n");
    sections.push(`## Certifications & Partnerships\n${certsStr}`);
  }

  // Product capabilities
  if (l1Context.productContexts.length > 0) {
    const prodStr = l1Context.productContexts
      .map((p) => {
        const caps = Array.isArray(p.capabilities)
          ? p.capabilities.map((c: { name: string }) => c.name).join(", ")
          : "";
        return `- ${p.product_name}: ${p.description}${caps ? ` (Capabilities: ${caps})` : ""}`;
      })
      .join("\n");
    sections.push(`## Relevant Capabilities\n${prodStr}`);
  }

  // Evidence (case studies with metrics)
  if (l1Context.evidenceLibrary.length > 0) {
    const evidenceStr = l1Context.evidenceLibrary
      .map((e) => {
        const metrics = Array.isArray(e.metrics)
          ? e.metrics
              .map(
                (m: { name: string; value: string }) => `${m.name}: ${m.value}`,
              )
              .join(", ")
          : "";
        return `- ${e.title} (${e.evidence_type}): ${e.summary}${metrics ? ` [Metrics: ${metrics}]` : ""}`;
      })
      .join("\n");
    sections.push(`## Verified Evidence\n${evidenceStr}`);
  }

  // Legal constraints
  const legal = l1Context.companyContext.filter((c) => c.category === "legal");
  if (legal.length > 0) {
    const legalStr = legal.map((c) => `- ${c.title}: ${c.content}`).join("\n");
    sections.push(`## Content Guidelines (Must Follow)\n${legalStr}`);
  }

  return sections.length > 0
    ? `\n\n=== COMPANY CONTEXT (L1 - Verified Truth) ===\n${sections.join("\n\n")}\n=== END COMPANY CONTEXT ===\n`
    : "";
}

/** Build the shared pipeline context for a proposal.
 * Fetches proposal data, org info, L1 context, static sources, and runs analysis. */
export async function buildPipelineContext(
  supabase: ReturnType<typeof createAdminClient>,
  proposalId: string,
): Promise<PipelineContext> {
  // Fetch proposal with organization
  const { data: proposal, error: fetchError } = await supabase
    .from("proposals")
    .select("*, organizations(name, settings)")
    .eq("id", proposalId)
    .single();

  if (fetchError || !proposal) {
    throw new Error(`Proposal not found: ${proposalId}`);
  }

  const intakeData = proposal.intake_data as Record<string, unknown>;
  const winStrategy = (proposal.win_strategy_data as WinStrategyData) || null;
  const outcomeContract =
    (proposal.outcome_contract as OutcomeContract) || null;

  // Get company info from organization
  const orgData = proposal.organizations as {
    name: string;
    settings?: Record<string, unknown>;
  } | null;
  const companyInfo: CompanyInfo = {
    name: orgData?.name || "Our Company",
    description: (orgData?.settings?.description as string) || undefined,
    industry: (orgData?.settings?.industry as string) || undefined,
  };

  // Extract brand voice from org settings (L2 persuasion layer)
  const brandVoice: BrandVoice | null = orgData?.settings?.brand_voice
    ? (orgData.settings.brand_voice as BrandVoice)
    : null;

  // Build organization-aware system prompt with brand voice
  const systemPrompt = buildSystemPrompt({
    name: companyInfo.name,
    description: companyInfo.description,
    brandVoice,
  });

  // IDD Stage 0: Fetch L1 Context (Company Truth)
  const serviceLine = (intakeData.opportunity_type as string) || undefined;
  const industry = (intakeData.client_industry as string) || undefined;
  const industryConfig = getIndustryConfig(industry || "");
  const l1Context = await fetchL1Context(
    supabase,
    serviceLine,
    industry,
    proposal.organization_id,
  );

  const ctxLog = createLogger({
    operation: "buildPipelineContext",
    proposalId,
    organizationId: proposal.organization_id,
  });
  ctxLog.debug("Fetched L1 context", {
    companyContextCount: l1Context.companyContext.length,
    productContextCount: l1Context.productContexts.length,
    evidenceCount: l1Context.evidenceLibrary.length,
  });

  // Load static sources from sources/ directory
  let staticSourcesContext = "";
  try {
    const staticSources = await loadSources();
    staticSourcesContext = formatSourcesAsL1Context(staticSources, {
      opportunityType: serviceLine,
      industry: industry,
    });
    ctxLog.debug("Loaded static sources", {
      totalFiles: staticSources.all.length,
      methodologies: staticSources.methodologies.length,
      caseStudies: staticSources.caseStudies.length,
    });
  } catch (sourceError) {
    // Non-critical - static sources are supplementary
    ctxLog.warn("Failed to load static sources, continuing with database context only", {
      error: sourceError instanceof Error ? sourceError.message : String(sourceError),
    });
  }

  // Build context strings for prompts
  const outcomeContractContext = buildOutcomeContractContext(outcomeContract);
  const l1ContextString =
    buildL1ContextString(l1Context) + staticSourcesContext;

  // Stage 1: Strategic Analysis (incorporating win strategy and outcome contract)
  const analysis = await generateStructuredAnalysis(
    intakeData,
    proposal.rfp_extracted_requirements as
      | Record<string, unknown>
      | undefined,
    winStrategy,
  );

  // Enhanced analysis with IDD context
  const enhancedAnalysis = `${analysis}\n${outcomeContractContext}\n${l1ContextString}`;

  return {
    proposal: proposal as Record<string, unknown>,
    organizationId: proposal.organization_id as string,
    intakeData,
    winStrategy,
    outcomeContract,
    companyInfo,
    brandVoice,
    systemPrompt,
    enhancedAnalysis,
    serviceLine,
    industry,
    industryConfig,
  };
}
