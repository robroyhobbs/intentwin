/**
 * Build Pipeline Context
 *
 * Fetches proposal data, org info, L1 context, static sources, and runs
 * strategic analysis. Returns the shared PipelineContext used by all
 * section generators.
 *
 * Split from context.ts for file size compliance (< 300 lines).
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { generateStructuredAnalysis, buildSystemPrompt } from "../gemini";
import { loadSources, formatSourcesAsL1Context } from "@/lib/sources";
import { getIndustryConfig } from "../industry-configs";
import {
  intelligenceClient,
  buildCompetitiveLandscapeContext,
  buildAgencySectionContext,
  buildPricingSuggestionsContext,
} from "@/lib/intelligence";
import { createLogger } from "@/lib/utils/logger";
import type { WinStrategyData } from "@/types/outcomes";
import type { OutcomeContract, CompanyInfo } from "@/types/idd";
import type { BrandVoice } from "../persuasion";
import type { PipelineContext } from "./types";
import type { BidEvaluation } from "../bid-scoring";
import { fetchL1Context, buildL1ContextString, buildOutcomeContractContext } from "./context";

/** Build the shared pipeline context for a proposal.
 * Fetches proposal data, org info, L1 context, static sources, and runs analysis. */
export async function buildPipelineContext(
  supabase: ReturnType<typeof createAdminClient>,
  proposalId: string,
): Promise<PipelineContext> {
  // Fetch proposal with organization
  const { data: proposal, error: fetchError } = await supabase
    .from("proposals")
    .select("id, organization_id, title, status, intake_data, win_strategy_data, outcome_contract, rfp_extracted_requirements, bid_evaluation, organizations(name, settings)")
    .eq("id", proposalId)
    .single();

  if (fetchError || !proposal) {
    throw new Error(`Proposal not found: ${proposalId}`);
  }

  const intakeData = proposal.intake_data as Record<string, unknown>;
  const winStrategy = (proposal.win_strategy_data as WinStrategyData) || null;
  const outcomeContract =
    (proposal.outcome_contract as OutcomeContract) || null;
  const bidEvaluation = (proposal.bid_evaluation as BidEvaluation) || null;

  // Get company info from organization (Supabase join may return object or array)
  const rawOrg = proposal.organizations;
  const orgData = (Array.isArray(rawOrg) ? rawOrg[0] : rawOrg) as {
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

  // Brand name lock — consistent naming across all sections
  const primaryBrandName = (orgData?.settings?.primary_brand_name as string) || undefined;

  // Inject brand name into intakeData so prompt builders can pass it to editorial standards
  // Uses underscore prefix to indicate it's a synthetic pipeline field, not user-entered data
  if (primaryBrandName) {
    intakeData._brand_name = primaryBrandName;
  }

  // Audience profile from intake extraction (inferred from RFP during extraction)
  const rawAudience = intakeData.audience_profile as
    | { tech_level?: string; evaluator?: string; size?: string }
    | { value?: { tech_level?: string; evaluator?: string; size?: string } }
    | undefined;
  // Handle both flat and nested (ExtractedIntake) formats
  const audienceProfile = rawAudience
    ? ("value" in rawAudience && rawAudience.value ? rawAudience.value : rawAudience as { tech_level?: string; evaluator?: string; size?: string })
    : undefined;

  // Build organization-aware system prompt with brand voice
  const systemPrompt = buildSystemPrompt({
    name: companyInfo.name,
    description: companyInfo.description,
    brandVoice,
  });

  // IDD Stage 0: Fetch L1 Context (Company Truth) + External Intelligence
  const serviceLine = (intakeData.opportunity_type as string) || undefined;
  const industry = (intakeData.client_industry as string) || undefined;
  const industryConfig = getIndustryConfig(industry || "");

  // Extract agency/NAICS from intake for intelligence lookup
  const agencyName =
    (intakeData.agency_name as string) ??
    (intakeData.client_name as string) ??
    null;
  const naicsCode = (intakeData.naics_code as string) ?? null;

  // Fetch L1 + intelligence in parallel (intelligence is non-blocking)
  const [l1Context, intelligence] = await Promise.all([
    fetchL1Context(supabase, serviceLine, industry, proposal.organization_id),
    intelligenceClient.getProposalIntelligence({
      agencyName,
      naicsCode,
      laborCategories: extractLaborCategoriesFromIntake(intakeData),
    }),
  ]);

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

  // Load static sources from sources/ directory — development/demo only.
  // In production every org has its own L1 context in Supabase; the static
  // sources/ directory contains placeholder/demo content (Capgemini examples)
  // that must not bleed into real customer proposals.
  let staticSourcesContext = "";
  if (process.env.NODE_ENV !== "production") {
    try {
      const staticSources = await loadSources();
      staticSourcesContext = formatSourcesAsL1Context(staticSources, {
        opportunityType: serviceLine,
        industry: industry,
      });
      ctxLog.debug("Loaded static sources (dev only)", {
        totalFiles: staticSources.all.length,
        methodologies: staticSources.methodologies.length,
        caseStudies: staticSources.caseStudies.length,
      });
    } catch (sourceError) {
      // Non-critical — static sources are supplementary demo content
      ctxLog.warn("Failed to load static sources", {
        error: sourceError instanceof Error ? sourceError.message : String(sourceError),
      });
    }
  }

  // Build context strings for prompts
  const outcomeContractContext = buildOutcomeContractContext(outcomeContract);
  const l1ContextString =
    buildL1ContextString(l1Context) + staticSourcesContext;

  // Stage 1: Strategic Analysis (incorporating win strategy and outcome contract)
  // Wrap in a timeout to prevent Gemini hangs from blocking the entire pipeline.
  // 90s is generous — typical analysis takes 10-30s.
  let analysis: string;
  try {
    analysis = await Promise.race([
      generateStructuredAnalysis(
        intakeData,
        proposal.rfp_extracted_requirements as
          | Record<string, unknown>
          | undefined,
        winStrategy,
      ),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Strategic analysis timed out after 90s")), 90_000)
      ),
    ]);
    ctxLog.info("Strategic analysis completed", { analysisLength: analysis.length });
  } catch (analysisError) {
    // If strategic analysis fails, use a minimal fallback rather than killing the whole pipeline
    ctxLog.error("Strategic analysis FAILED — using minimal fallback", {
      error: analysisError instanceof Error ? analysisError.message : String(analysisError),
    });
    analysis = `Strategic analysis unavailable. Generate sections based on intake data directly.
Key themes: ${(intakeData.key_themes as string) || "Not specified"}
Client: ${(intakeData.client_name as string) || "Not specified"}
Industry: ${(intakeData.client_industry as string) || "Not specified"}`;
  }

  // Build competitive landscape context if available
  const competitiveLandscapeContext = intelligence?.competitiveLandscape
    ? buildCompetitiveLandscapeContext(intelligence.competitiveLandscape)
    : "";

  // Build agency + pricing context strings for section generation (Stream A: Deeper Pipeline)
  const agencyContext = buildAgencySectionContext(intelligence?.agency ?? null);
  const pricingContext = buildPricingSuggestionsContext(
    intelligence?.pricing ?? null,
    extractLaborCategoriesFromIntake(intakeData),
  );

  // Build evaluation criteria context from RFP analysis (if available)
  const rfpAnalysis = intakeData.rfp_analysis as { evaluation_criteria?: Array<{ name: string; weight: string | null; description: string; mapped_sections: string[] }>; page_limit?: string } | null;
  let evalCriteriaContext = "";
  if (rfpAnalysis?.evaluation_criteria?.length) {
    const criteriaLines = rfpAnalysis.evaluation_criteria.map(c =>
      `- **${c.name}**${c.weight ? ` (${c.weight})` : ""}: ${c.description}`
    ).join("\n");
    evalCriteriaContext = `\n\n## EVALUATION CRITERIA (from RFP)
The proposal will be scored on these criteria. Address each one directly:
${criteriaLines}
${rfpAnalysis.page_limit ? `\nPage limit: ${rfpAnalysis.page_limit}` : ""}`;
  }

  // Enhanced analysis with outcome contract, competitive landscape, and eval criteria (L1 is now passed separately)
  const enhancedAnalysis = `${analysis}\n${outcomeContractContext}${competitiveLandscapeContext ? `\n\n${competitiveLandscapeContext}` : ""}${evalCriteriaContext}`;

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
    primaryBrandName,
    audienceProfile,
    systemPrompt,
    enhancedAnalysis,
    l1ContextString,
    rawL1Context: l1Context,
    serviceLine,
    industry,
    industryConfig,
    intelligence,
    bidEvaluation,
    agencyContext,
    pricingContext,
  };
}

/**
 * Extract likely labor categories from intake data for pricing intelligence lookup.
 * Returns common categories if intake doesn't specify explicit ones.
 */
function extractLaborCategoriesFromIntake(
  intakeData: Record<string, unknown>,
): string[] {
  const categories = intakeData.labor_categories;
  if (Array.isArray(categories) && categories.length > 0) {
    return categories.filter((c): c is string => typeof c === "string");
  }
  // Default probe categories — covers most IT services proposals
  return ["Software Developer", "Project Manager", "Systems Engineer"];
}
