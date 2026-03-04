import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/utils/logger";
import { extractJsonFromResponse } from "@/lib/utils/extract-json";
import { generateText } from "./gemini";
import {
  intelligenceClient,
  buildIntelligenceContext,
  buildWinProbabilityContext,
} from "@/lib/intelligence";
import type { WinProbabilityResponse } from "@/lib/intelligence";
import type { L1Context } from "./pipeline/types";
import { fetchL1ContextFromDb } from "./pipeline/fetch-l1-context";

// Fixed scoring factors and weights
export const SCORING_FACTORS = [
  { key: "requirement_match", label: "Requirement Match", weight: 30 },
  { key: "past_performance", label: "Past Performance", weight: 25 },
  { key: "capability_alignment", label: "Capability Alignment", weight: 20 },
  { key: "timeline_feasibility", label: "Timeline Feasibility", weight: 15 },
  { key: "strategic_value", label: "Strategic Value", weight: 10 },
] as const;

export type FactorKey = (typeof SCORING_FACTORS)[number]["key"];

export interface FactorScore {
  score: number; // 0-100
  rationale: string;
}

/** Intelligence context returned alongside bid scoring */
export interface BidIntelligenceContext {
  agency_name: string | null;
  agency_eval_method: string | null;
  agency_avg_offers: number | null;
  agency_total_awards: number | null;
  agency_avg_amount: number | null;
  has_agency_profile: boolean;
  has_pricing_data: boolean;
  pricing_categories_found: number;
  win_probability: WinProbabilityResponse | null;
}

export interface BidEvaluation {
  ai_scores: Record<FactorKey, FactorScore>;
  user_scores?: Partial<Record<FactorKey, number>>;
  weighted_total: number;
  recommendation: "bid" | "evaluate" | "pass";
  user_decision?: "proceed" | "skip";
  scored_at: string;
  decided_at?: string;
  intelligence?: BidIntelligenceContext;
}

function computeWeightedTotal(
  scores: Record<string, { score: number }> | Record<string, number>,
  userOverrides?: Partial<Record<string, number>>,
): number {
  let total = 0;
  for (const factor of SCORING_FACTORS) {
    const override = userOverrides?.[factor.key];
    const baseScore =
      typeof scores[factor.key] === "number"
        ? (scores[factor.key] as number)
        : ((scores[factor.key] as FactorScore)?.score ?? 50);
    const score = override ?? baseScore;
    total += score * (factor.weight / 100);
  }
  return Math.round(total * 100) / 100;
}

function getRecommendation(weightedTotal: number): "bid" | "evaluate" | "pass" {
  if (weightedTotal > 70) return "bid";
  if (weightedTotal >= 40) return "evaluate";
  return "pass";
}

/** Model used for bid-eval scoring — gemini-2.0-flash is more reliable for structured JSON output.
 * gemini-2.5-flash has known JSON truncation/parsing issues. */
const BID_SCORING_MODEL = "gemini-2.0-flash";

const BID_SCORING_SYSTEM_PROMPT = `You are a SKEPTICAL bid/no-bid evaluation analyst for a professional services firm. Your job is to rigorously assess whether an RFP opportunity is worth pursuing based ONLY on documented, verified evidence.

You will receive:
1. Extracted RFP requirements and details
2. The firm's L1 context (company identity, capabilities, evidence, certifications)
3. Relevant knowledge base context

Score each of the 5 factors on a 0-100 scale with a brief rationale (2-3 sentences each).

IMPORTANT: Return ONLY a JSON object in this exact format, wrapped in a markdown code block:

\`\`\`json
{
  "requirement_match": { "score": 75, "rationale": "Brief explanation..." },
  "past_performance": { "score": 60, "rationale": "Brief explanation..." },
  "capability_alignment": { "score": 80, "rationale": "Brief explanation..." },
  "timeline_feasibility": { "score": 70, "rationale": "Brief explanation..." },
  "strategic_value": { "score": 55, "rationale": "Brief explanation..." }
}
\`\`\`

## Scoring Rubric (follow exactly)

**Requirement Match (30%)**:
- 80-100: 80%+ of stated requirements directly match firm's proven delivery areas WITH documented evidence
- 60-79: 50-79% match with evidence; gaps are in adjacent/learnable areas
- 40-59: Some overlap but significant gaps in core requirements
- 20-39: Mostly outside firm's delivery areas
- 0-19: No meaningful overlap with firm capabilities

**Past Performance (25%)**:
- 80-100: 3+ directly relevant case studies with quantified outcomes in the SAME domain and at COMPARABLE scale
- 60-79: 1-2 relevant case studies or strong adjacent experience (adjacent domain OR smaller scale)
- 40-59: General industry experience but no specific case studies cited in this domain
- 20-39: Minimal relevant experience, mostly aspirational
- 0-19: No evidence of relevant past performance

**Capability Alignment (20%)**:
- 80-100: Firm has ALL required certifications, clearances, tools, and methodologies EXPLICITLY listed in evidence
- 60-79: Has most capabilities with evidence; minor gaps easily filled without new hires
- 40-59: Has core capabilities but MISSING key certifications, clearances, or tools required by the RFP
- 20-39: Significant capability gaps requiring new hires or partnerships to fill
- 0-19: Fundamental capability mismatch

**Timeline Feasibility (15%)**:
- 80-100: Timeline is generous relative to scope AND firm has demonstrated capacity at this scale
- 60-79: Timeline is tight but achievable with existing resources at DOCUMENTED scale
- 40-59: Timeline requires careful planning; scope may exceed firm's demonstrated delivery scale
- 20-39: Timeline is aggressive, significant risk of delays given firm's documented capacity
- 0-19: Timeline is unrealistic for the stated scope

**Strategic Value (10%)**:
- 80-100: Directly advances stated strategic goals or enters priority market
- 60-79: Aligns with growth direction, good brand-building opportunity
- 40-59: Neutral — neither advances nor conflicts with strategy
- 20-39: Low strategic fit, commodity work
- 0-19: Conflicts with strategic direction or diverts from priorities

## CRITICAL CALIBRATION RULES
1. **Evidence or nothing.** If a capability/certification/clearance is NOT explicitly listed in the firm's L1 context, treat it as ABSENT. Do not infer capabilities from related experience.
2. **Scale matters.** A case study serving 500 users does NOT demonstrate readiness for 50,000 users. Score past performance based on comparable scale, not just domain.
3. **Clearances are binary.** If the RFP requires a specific security clearance (e.g., Top Secret Facility Clearance) and it is not explicitly listed in the firm's certifications, score Capability Alignment in the 20-39 band maximum.
4. **Gaps must be named.** Every rationale must explicitly state what is MISSING or WEAK, not just what is present. Format: "Firm has X and Y, but LACKS Z which the RFP requires."
5. **Default to the lower band.** When evidence is ambiguous or partially relevant, always score to the LOWER band, not the upper.
6. **No benefit of the doubt.** Do not assume the firm "could" do something. Score only what is DOCUMENTED.
7. Scores must be integers divisible by 5 (e.g., 65, 70, 75 — not 67 or 73).
8. Each rationale must cite specific evidence from the input (company name, certification, case study title, or requirement text).`;

/**
 * Score extracted RFP requirements during intake (before proposal creation).
 * Uses the authenticated user's org for L1 context lookup.
 */
export async function scoreFromRequirements(
  rfpRequirements: Record<string, unknown>,
  organizationId: string,
  serviceLine?: string,
  industry?: string,
): Promise<BidEvaluation> {
  const supabase = createAdminClient();

  // Fetch L1 context and intelligence in parallel (non-blocking)
  const agencyName =
    (rfpRequirements.agency as string) ??
    (rfpRequirements.client_name as string) ??
    null;
  const naicsCode = (rfpRequirements.naics_code as string) ?? null;
  const budgetRange = (rfpRequirements.budget_range as string) ?? null;
  const setAside = (rfpRequirements.set_aside as string) ?? null;
  const competitionType = (rfpRequirements.competition_type as string) ?? null;

  logger.info("[bid-scoring] Starting parallel fetch", {
    agencyName,
    orgId: organizationId,
    serviceLine,
    industry,
  });

  const [l1Context, agencyProfile, pricingRates, winProbability] =
    await Promise.all([
      fetchL1ContextFromDb(supabase, serviceLine, industry, organizationId),
      agencyName
        ? intelligenceClient.getAgencyProfile(agencyName)
        : Promise.resolve(null),
      intelligenceClient.getPricingRates({
        categories: [
          "Software Developer",
          "Project Manager",
          "Systems Engineer",
        ],
        naicsCode: naicsCode ?? undefined,
      }),
      intelligenceClient.getWinProbability({
        agency: agencyName ?? undefined,
        naicsCode: naicsCode ?? undefined,
        awardAmount: budgetRange
          ? parseFloat(String(budgetRange).replace(/[^0-9.]/g, "")) || undefined
          : undefined,
        competitionType: competitionType ?? undefined,
        setAsideType: setAside ?? undefined,
        businessSize: "small",
      }),
    ]);

  logger.info("[bid-scoring] Parallel fetch complete", {
    l1CompanyCount: l1Context.companyContext.length,
    l1ProductCount: l1Context.productContexts.length,
    l1EvidenceCount: l1Context.evidenceLibrary.length,
    hasAgencyProfile: !!agencyProfile,
    hasPricingRates: !!pricingRates,
    hasWinProbability: !!winProbability,
  });

  const rfpSummary = buildRfpSummary(rfpRequirements);
  const l1Summary = buildL1Summary(l1Context);
  const intelligenceContext = buildIntelligenceContext(
    agencyProfile,
    pricingRates,
  );
  const winProbContext = winProbability
    ? buildWinProbabilityContext(winProbability)
    : "";

  const prompt = `## RFP Opportunity Analysis

### RFP Details
${rfpSummary}

### Firm Context (L1 - Verified)
${l1Summary}
${intelligenceContext ? `\n### Procurement Intelligence\n${intelligenceContext}` : ""}
${winProbContext ? `\n### Win Probability Data\n${winProbContext}` : ""}
Based on the above, score each of the 5 bid evaluation factors (0-100) with rationale.${winProbability ? ` Historical win probability for similar opportunities is ${(winProbability.probability * 100).toFixed(0)}% — factor this into your strategic value assessment.` : ""}`;

  logger.info("[bid-scoring] Calling Gemini", {
    promptLength: prompt.length,
    rfpSummaryLength: rfpSummary.length,
    l1SummaryLength: l1Summary.length,
  });

  const response = await generateText(prompt, {
    systemPrompt: BID_SCORING_SYSTEM_PROMPT,
    temperature: 0,
    maxTokens: 4096,
    model: BID_SCORING_MODEL,
    jsonMode: true,
  });

  logger.info("[bid-scoring] Gemini response received", {
    responseLength: response.length,
  });

  const aiScores = parseScoresFromResponse(response);
  const weightedTotal = computeWeightedTotal(aiScores);
  const recommendation = getRecommendation(weightedTotal);

  // Build intelligence context summary for the client
  const intelligence: BidIntelligenceContext = {
    agency_name: agencyProfile?.agency_name ?? agencyName,
    agency_eval_method: agencyProfile?.preferred_eval_method ?? null,
    agency_avg_offers: agencyProfile?.avg_num_offers ?? null,
    agency_total_awards: agencyProfile?.total_awards_tracked ?? null,
    agency_avg_amount: agencyProfile?.avg_award_amount ?? null,
    has_agency_profile: agencyProfile !== null,
    has_pricing_data: pricingRates !== null,
    pricing_categories_found: pricingRates?.rate_benchmarks?.length ?? 0,
    win_probability: winProbability,
  };

  return {
    ai_scores: aiScores,
    weighted_total: weightedTotal,
    recommendation,
    scored_at: new Date().toISOString(),
    intelligence,
  };
}

/**
 * Score a bid opportunity by analyzing extracted RFP requirements against L1 context and KB.
 * For use after proposal creation (re-scoring).
 */
export async function scoreBidOpportunity(
  proposalId: string,
): Promise<BidEvaluation> {
  const supabase = createAdminClient();

  // Fetch proposal with extracted requirements
  const { data: proposal, error: proposalError } = await supabase
    .from("proposals")
    .select(
      "id, rfp_extracted_requirements, intake_data, organization_id, title",
    )
    .eq("id", proposalId)
    .single();

  if (proposalError || !proposal) {
    throw new Error(`Proposal ${proposalId} not found`);
  }

  if (!proposal.rfp_extracted_requirements) {
    throw new Error("RFP extraction must complete before bid evaluation");
  }

  // Fetch L1 context for the organization
  const l1Context = await fetchL1ContextFromDb(
    supabase,
    proposal.intake_data?.service_line,
    proposal.intake_data?.industry,
    proposal.organization_id,
  );

  // Build the scoring prompt
  const rfpSummary = buildRfpSummary(proposal.rfp_extracted_requirements);
  const l1Summary = buildL1Summary(l1Context);

  const prompt = `## RFP Opportunity Analysis

### RFP Details
${rfpSummary}

### Firm Context (L1 - Verified)
${l1Summary}

Based on the above, score each of the 5 bid evaluation factors (0-100) with rationale.`;

  // Call LLM for scoring with JSON mode for reliable structured output
  const response = await generateText(prompt, {
    systemPrompt: BID_SCORING_SYSTEM_PROMPT,
    temperature: 0,
    maxTokens: 4096,
    model: BID_SCORING_MODEL,
    jsonMode: true,
  });

  // Parse structured response
  const aiScores = parseScoresFromResponse(response);

  const weightedTotal = computeWeightedTotal(aiScores);
  const recommendation = getRecommendation(weightedTotal);

  const evaluation: BidEvaluation = {
    ai_scores: aiScores,
    weighted_total: weightedTotal,
    recommendation,
    scored_at: new Date().toISOString(),
  };

  // Store evaluation on proposal
  const { error: updateError } = await supabase
    .from("proposals")
    .update({ bid_evaluation: evaluation })
    .eq("id", proposalId);

  if (updateError) {
    logger.error("Failed to store bid evaluation", updateError);
    throw new Error("Failed to store bid evaluation");
  }

  return evaluation;
}

/**
 * Persist user's proceed/skip decision and optional score overrides.
 */
export async function saveBidDecision(
  proposalId: string,
  userDecision: "proceed" | "skip",
  userScores?: Partial<Record<FactorKey, number>>,
): Promise<BidEvaluation> {
  const supabase = createAdminClient();

  // Fetch current evaluation
  const { data: proposal, error } = await supabase
    .from("proposals")
    .select("bid_evaluation")
    .eq("id", proposalId)
    .single();

  if (error || !proposal?.bid_evaluation) {
    throw new Error("No bid evaluation found for this proposal");
  }

  const evaluation = proposal.bid_evaluation as BidEvaluation;

  // Validate user scores if provided
  if (userScores) {
    for (const [key, value] of Object.entries(userScores)) {
      if (typeof value !== "number" || value < 0 || value > 100) {
        throw new Error(
          `Invalid score for ${key}: must be a number between 0 and 100`,
        );
      }
    }
    evaluation.user_scores = userScores;
    evaluation.weighted_total = computeWeightedTotal(
      evaluation.ai_scores,
      userScores,
    );
    evaluation.recommendation = getRecommendation(evaluation.weighted_total);
  }

  evaluation.user_decision = userDecision;
  evaluation.decided_at = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("proposals")
    .update({ bid_evaluation: evaluation })
    .eq("id", proposalId);

  if (updateError) {
    throw new Error("Failed to save bid decision");
  }

  return evaluation;
}

// --- Internal helpers ---

function buildRfpSummary(requirements: Record<string, unknown>): string {
  const sections: string[] = [];

  if (requirements.title) sections.push(`**Title:** ${requirements.title}`);
  if (requirements.agency) sections.push(`**Agency:** ${requirements.agency}`);
  if (requirements.deadline)
    sections.push(`**Deadline:** ${requirements.deadline}`);
  if (requirements.budget_range)
    sections.push(`**Budget Range:** ${requirements.budget_range}`);
  if (requirements.scope) sections.push(`**Scope:** ${requirements.scope}`);
  if (requirements.naics_code)
    sections.push(`**NAICS Code:** ${requirements.naics_code}`);
  if (requirements.set_aside)
    sections.push(`**Set-Aside:** ${requirements.set_aside}`);

  // Handle requirements array (sorted for deterministic ordering)
  if (Array.isArray(requirements.requirements)) {
    const items = requirements.requirements
      .slice(0, 20)
      .map((r: string | { description?: string }) =>
        typeof r === "string" ? r : r.description || String(r),
      )
      .sort((a: string, b: string) => a.localeCompare(b));
    sections.push(
      `**Key Requirements:**\n${items.map((r: string) => `- ${r}`).join("\n")}`,
    );
  }

  // Handle evaluation criteria (sorted for deterministic ordering)
  if (Array.isArray(requirements.evaluation_criteria)) {
    const items = requirements.evaluation_criteria
      .slice(0, 10)
      .map((c: string | { criterion?: string; weight?: string }) =>
        typeof c === "string"
          ? c
          : `${c.criterion || c}${c.weight ? ` (${c.weight})` : ""}`,
      )
      .sort((a: string, b: string) => a.localeCompare(b));
    sections.push(
      `**Evaluation Criteria:**\n${items.map((c: string) => `- ${c}`).join("\n")}`,
    );
  }

  // Handle compliance requirements (sorted for deterministic ordering)
  if (Array.isArray(requirements.compliance_requirements)) {
    const items = [...requirements.compliance_requirements]
      .slice(0, 10)
      .sort((a: string, b: string) => a.localeCompare(b));
    sections.push(
      `**Compliance Requirements:**\n${items.map((c: string) => `- ${c}`).join("\n")}`,
    );
  }

  if (requirements.technical_environment)
    sections.push(
      `**Technical Environment:** ${requirements.technical_environment}`,
    );

  // Include source text as fallback context when structured fields are sparse
  if (sections.length < 3 && requirements.source_text) {
    const sourceText = String(requirements.source_text).slice(0, 3000);
    sections.push(`**Source Content:**\n${sourceText}`);
  }

  return sections.join("\n") || "No RFP details extracted.";
}

function buildL1Summary(l1Context: L1Context): string {
  const sections: string[] = [];

  const brand = l1Context.companyContext
    .filter((c) => c.category === "brand" || c.category === "values")
    .sort((a, b) => a.title.localeCompare(b.title));
  if (brand.length > 0) {
    sections.push(
      `**Company Identity:**\n${brand.map((c) => `- ${c.title}: ${c.content}`).join("\n")}`,
    );
  }

  const certs = l1Context.companyContext
    .filter((c) => c.category === "certifications")
    .sort((a, b) => a.title.localeCompare(b.title));
  if (certs.length > 0) {
    sections.push(
      `**Certifications:**\n${certs.map((c) => `- ${c.title}`).join("\n")}`,
    );
  }

  if (l1Context.productContexts.length > 0) {
    const sorted = [...l1Context.productContexts].sort((a, b) =>
      a.product_name.localeCompare(b.product_name),
    );
    const prods = sorted
      .map((p) => {
        const caps = Array.isArray(p.capabilities)
          ? p.capabilities.map((c: { name: string }) => c.name).join(", ")
          : "";
        return `- ${p.product_name}: ${p.description}${caps ? ` (${caps})` : ""}`;
      })
      .join("\n");
    sections.push(`**Capabilities:**\n${prods}`);
  }

  if (l1Context.evidenceLibrary.length > 0) {
    const sorted = [...l1Context.evidenceLibrary].sort((a, b) =>
      a.title.localeCompare(b.title),
    );
    const evidence = sorted
      .map((e) => `- ${e.title} (${e.evidence_type}): ${e.summary}`)
      .join("\n");
    sections.push(`**Past Performance & Evidence:**\n${evidence}`);
  }

  return sections.join("\n\n") || "No L1 context available.";
}

/**
 * Extract JSON from an AI response using multiple strategies.
 * Returns null if no valid JSON can be found.
 */
function parseScoresFromResponse(
  response: string,
): Record<FactorKey, FactorScore> {
  const parsed = extractJsonFromResponse(response);

  if (!parsed) {
    logger.error("Failed to parse bid scoring response after all strategies", {
      responseLength: response.length,
      first200: response.slice(0, 200),
      last200: response.slice(-200),
    });
    // Return neutral scores as fallback
    const defaults: Record<string, FactorScore> = {};
    for (const factor of SCORING_FACTORS) {
      defaults[factor.key] = {
        score: 50,
        rationale: "Scoring unavailable — AI response could not be parsed.",
      };
    }
    return defaults as Record<FactorKey, FactorScore>;
  }

  // Validate and clamp scores
  const result: Record<string, FactorScore> = {};
  for (const factor of SCORING_FACTORS) {
    const raw = parsed[factor.key] as
      | { score?: unknown; rationale?: unknown }
      | undefined;
    // Accept score as number or numeric string
    const rawScore = raw?.score;
    const score =
      typeof rawScore === "number"
        ? rawScore
        : typeof rawScore === "string" && !isNaN(Number(rawScore))
          ? Number(rawScore)
          : null;

    if (raw && score !== null) {
      // Round to nearest 5 for consistency with scoring rubric
      const rounded = Math.round(score / 5) * 5;
      result[factor.key] = {
        score: Math.max(0, Math.min(100, rounded)),
        rationale:
          typeof raw.rationale === "string"
            ? raw.rationale.slice(0, 500)
            : "No rationale provided.",
      };
    } else {
      result[factor.key] = {
        score: 50,
        rationale: "Factor could not be scored — insufficient data.",
      };
    }
  }

  return result as Record<FactorKey, FactorScore>;
}
