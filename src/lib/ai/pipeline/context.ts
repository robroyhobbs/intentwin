import { createAdminClient } from "@/lib/supabase/admin";
import { generateStructuredAnalysis, buildSystemPrompt } from "../gemini";
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
      .select("id, category, key, title, content, metadata, is_locked, lock_reason, last_verified_at, verified_by")
      .order("category");
    if (organizationId) {
      companyQuery = companyQuery.eq("organization_id", organizationId);
    }
    const { data: companyContext } = await companyQuery;

    // Fetch relevant product contexts
    let productQuery = supabase.from("product_contexts").select("id, product_name, service_line, description, capabilities, specifications, pricing_models, constraints, supported_outcomes, is_locked, lock_reason");
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
      .select("id, evidence_type, title, summary, full_content, client_industry, service_line, client_size, outcomes_demonstrated, metrics, is_verified, verified_by, verified_at, verification_notes")
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
    const { data: evidenceLibrary } = await evidenceQuery
      .order("is_verified", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10);

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

/** 
 * Filter the global L1 Context down to only what's strictly necessary for a specific section.
 * This prevents the "Lost in the Middle" LLM syndrome and saves tokens.
 */
export function buildSectionSpecificL1Context(
  l1Context: L1Context,
  sectionType: string,
  solicitationType: string = "RFP"
): string {
  // Always include Brand Guidelines for tone
  const brandContext = l1Context.companyContext.filter(c => c.category === "brand");
  
  let relevantEvidence: EvidenceLibraryEntry[] = [];
  let relevantProducts: ProductContext[] = [];
  let relevantCompany = [...brandContext];

  // Specific routing logic
  if (sectionType === "case_studies" || solicitationType === "RFI") {
    // RFIs and Case Study sections need maximum proof points
    relevantEvidence = l1Context.evidenceLibrary;
  } else if (sectionType === "team" || sectionType === "methodology") {
    // Only fetch certs and methodology
    relevantCompany = [
      ...brandContext,
      ...l1Context.companyContext.filter(c => c.category === "certifications" || c.category === "values")
    ];
  } else if (sectionType === "pricing") {
    // Only fetch legal/pricing terms
    relevantCompany = [
      ...brandContext,
      ...l1Context.companyContext.filter(c => c.category === "legal")
    ];
  } else {
    // Default: Provide top 3 evidence points and product specs to avoid overwhelming
    relevantEvidence = l1Context.evidenceLibrary.slice(0, 3);
    relevantProducts = l1Context.productContexts;
  }

  return buildL1ContextString({
    companyContext: relevantCompany,
    productContexts: relevantProducts,
    evidenceLibrary: relevantEvidence
  });
}

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

  // Product capabilities (with pricing and constraints)
  if (l1Context.productContexts.length > 0) {
    const prodStr = l1Context.productContexts
      .map((p) => {
        const caps = Array.isArray(p.capabilities)
          ? p.capabilities.map((c: { name: string; description?: string }) =>
              c.description ? `  - ${c.name}: ${c.description}` : `  - ${c.name}`
            ).join("\n")
          : "";
        const pricing = Array.isArray(p.pricing_models) && p.pricing_models.length > 0
          ? `\n  Pricing: ${p.pricing_models.map((pm: { model: string; best_for?: string }) => `${pm.model}${pm.best_for ? ` (best for: ${pm.best_for})` : ""}`).join("; ")}`
          : "";
        const constraints = p.constraints?.not_suitable_for?.length
          ? `\n  Not suitable for: ${p.constraints.not_suitable_for.join(", ")}`
          : "";
        return `### ${p.product_name}\n${p.description}${caps ? `\n  Capabilities:\n${caps}` : ""}${pricing}${constraints}`;
      })
      .join("\n\n");
    sections.push(`## Our Capabilities & Services\n${prodStr}`);
  }

  // Evidence (case studies with metrics and full content for top entries)
  if (l1Context.evidenceLibrary.length > 0) {
    const evidenceStr = l1Context.evidenceLibrary
      .map((e, idx) => {
        const metrics = Array.isArray(e.metrics)
          ? e.metrics
              .map(
                (m: { name: string; value: string }) => `${m.name}: ${m.value}`,
              )
              .join(", ")
          : "";
        const outcomes = Array.isArray(e.outcomes_demonstrated) && e.outcomes_demonstrated.length > 0
          ? `\n  Outcomes: ${e.outcomes_demonstrated.map((o: { outcome: string; description?: string }) => o.description || o.outcome).join("; ")}`
          : "";
        // Include full_content for top 3 entries to give the LLM concrete material
        const detail = idx < 3 && e.full_content
          ? `\n  Detail: ${e.full_content.slice(0, 500)}`
          : "";
        return `### ${e.title} (${e.evidence_type})${e.client_industry ? ` [${e.client_industry}]` : ""}\n${e.summary}${metrics ? `\nMetrics: ${metrics}` : ""}${outcomes}${detail}`;
      })
      .join("\n\n");
    sections.push(`## Verified Evidence — CITE THESE IN YOUR RESPONSE\n${evidenceStr}`);
  }

  // Legal constraints
  const legal = l1Context.companyContext.filter((c) => c.category === "legal");
  if (legal.length > 0) {
    const legalStr = legal.map((c) => `- ${c.title}: ${c.content}`).join("\n");
    sections.push(`## Content Guidelines (Must Follow)\n${legalStr}`);
  }

  if (sections.length === 0) return "";

  return `\n\n=== COMPANY CONTEXT (L1 - Verified Truth) ===
IMPORTANT: The data below is verified company truth. You MUST:
1. Reference specific capabilities from "Our Capabilities" when describing solutions
2. Cite at least one entry from "Verified Evidence" with concrete metrics
3. Never invent capabilities, metrics, or case studies not listed below
4. Follow all "Content Guidelines" constraints

${sections.join("\n\n")}
=== END COMPANY CONTEXT ===\n`;
}

/**
 * Extract competitive objections from intake data.
 * Parses incumbent_info, competitive_landscape, and client_concerns
 * into actionable objections for the competitive positioning prompt.
 */
export function extractCompetitiveObjections(
  intakeData: Record<string, unknown>,
): string[] {
  const objections: string[] = [];

  const incumbent = intakeData.incumbent_info as string | undefined;
  if (incumbent?.trim()) {
    objections.push(
      `Current vendor context: ${incumbent.trim().slice(0, 200)}`,
    );
  }

  const competitive = intakeData.competitive_landscape as string | undefined;
  if (competitive?.trim()) {
    objections.push(
      `Competitive context: ${competitive.trim().slice(0, 200)}`,
    );
  }

  const concerns = intakeData.client_concerns as
    | string
    | string[]
    | undefined;
  if (Array.isArray(concerns)) {
    for (const c of concerns.slice(0, 3)) {
      if (typeof c === "string" && c.trim()) {
        objections.push(`Client concern: ${c.trim()}`);
      }
    }
  } else if (typeof concerns === "string" && concerns.trim()) {
    objections.push(`Client concern: ${concerns.trim().slice(0, 200)}`);
  }

  return objections;
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

  const l1Counts = {
    companyContextCount: l1Context.companyContext.length,
    productContextCount: l1Context.productContexts.length,
    evidenceCount: l1Context.evidenceLibrary.length,
  };

  // Promote to warn if L1 is completely empty — visible in production logs
  if (
    l1Counts.companyContextCount === 0 &&
    l1Counts.productContextCount === 0 &&
    l1Counts.evidenceCount === 0
  ) {
    ctxLog.warn("L1 context is EMPTY — proposal will generate without company grounding data. Add company context, products, and evidence in Settings.", l1Counts);
  } else {
    ctxLog.info("L1 context loaded", l1Counts);
  }

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

  // Enhanced analysis with outcome contract (L1 is now passed separately)
  const enhancedAnalysis = `${analysis}\n${outcomeContractContext}`;

  // Store L1 metadata on proposal for auditability (non-blocking)
  const l1Summary = {
    companyContextCount: l1Counts.companyContextCount,
    productContextCount: l1Counts.productContextCount,
    evidenceCount: l1Counts.evidenceCount,
    evidenceIds: l1Context.evidenceLibrary.map(e => e.id),
    productIds: l1Context.productContexts.map(p => p.id),
    l1StringLength: l1ContextString.length,
    staticSourcesIncluded: staticSourcesContext.length > 0,
    fetchedAt: new Date().toISOString(),
  };

  supabase
    .from("proposals")
    .update({ l1_summary: l1Summary })
    .eq("id", proposalId)
    .then(({ error: l1Err }) => {
      if (l1Err) {
        ctxLog.warn("Failed to store L1 summary on proposal", { error: l1Err.message });
      }
    });

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
    l1ContextString,
    rawL1Context: l1Context,
    serviceLine,
    industry,
    industryConfig,
  };
}
