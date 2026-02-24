import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/utils/logger";
import { generateText } from "./gemini";
import { intelligenceClient, buildIntelligenceContext, buildWinProbabilityContext } from "@/lib/intelligence";
import type { WinProbabilityResponse } from "@/lib/intelligence";
import type { L1Context } from "./pipeline/types";

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

const BID_SCORING_SYSTEM_PROMPT = `You are a bid/no-bid evaluation analyst for a professional services firm. Your job is to assess whether an RFP opportunity is worth pursuing based on the firm's capabilities and context.

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

Scoring guidance:
- **Requirement Match (30%)**: How well do the RFP requirements align with what the firm typically delivers? Consider scope, domain, complexity.
- **Past Performance (25%)**: Does the firm have relevant case studies, metrics, or prior work in this domain/industry?
- **Capability Alignment (20%)**: How well do the firm's products, services, and certifications match what the RFP demands?
- **Timeline Feasibility (15%)**: Is the RFP timeline realistic given the scope and the firm's capacity?
- **Strategic Value (10%)**: Does this opportunity align with the firm's strategic goals, target markets, or growth areas?

Be honest and calibrated. A score of 50 means neutral/uncertain. Below 30 means significant concerns. Above 80 means strong alignment.`;

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

  const [l1Context, agencyProfile, pricingRates, winProbability] = await Promise.all([
    fetchL1ContextForScoring(supabase, serviceLine, industry, organizationId),
    agencyName
      ? intelligenceClient.getAgencyProfile(agencyName)
      : Promise.resolve(null),
    intelligenceClient.getPricingRates({
      categories: ["Software Developer", "Project Manager", "Systems Engineer"],
      naicsCode: naicsCode ?? undefined,
    }),
    intelligenceClient.getWinProbability({
      agency: agencyName ?? undefined,
      naicsCode: naicsCode ?? undefined,
      awardAmount: budgetRange ? parseFloat(String(budgetRange).replace(/[^0-9.]/g, "")) || undefined : undefined,
      competitionType: competitionType ?? undefined,
      setAsideType: setAside ?? undefined,
      businessSize: "small",
    }),
  ]);

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

  const response = await generateText(prompt, {
    systemPrompt: BID_SCORING_SYSTEM_PROMPT,
    temperature: 0.3,
    maxTokens: 4096,
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
  const l1Context = await fetchL1ContextForScoring(
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

  // Call LLM for scoring
  const response = await generateText(prompt, {
    systemPrompt: BID_SCORING_SYSTEM_PROMPT,
    temperature: 0.3,
    maxTokens: 4096,
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

/**
 * Fetch L1 context for bid scoring.
 *
 * NOTE: This is intentionally a standalone copy of fetchL1Context from pipeline/context.ts.
 * We cannot import from context.ts here because bid-scoring.ts is imported by client components
 * (proposals/new/page.tsx) and context.ts transitively imports @/lib/sources/loader.ts which
 * uses Node's 'fs' module — causing Turbopack build failures in the browser bundle.
 *
 * Includes proper evidence ordering (is_verified desc, created_at desc) before limit.
 */
async function fetchL1ContextForScoring(
  supabase: ReturnType<typeof createAdminClient>,
  serviceLine?: string,
  industry?: string,
  organizationId?: string,
): Promise<L1Context> {
  try {
    let companyQuery = supabase
      .from("company_context")
      .select("id, category, key, title, content, metadata, is_locked, lock_reason, last_verified_at, verified_by")
      .order("category");
    if (organizationId) {
      companyQuery = companyQuery.eq("organization_id", organizationId);
    }
    const { data: companyContext } = await companyQuery;

    let productQuery = supabase.from("product_contexts").select("id, product_name, service_line, description, capabilities, specifications, pricing_models, constraints, supported_outcomes, is_locked, lock_reason");
    if (organizationId) {
      productQuery = productQuery.eq("organization_id", organizationId);
    }
    if (serviceLine) {
      productQuery = productQuery.eq("service_line", serviceLine);
    }
    const { data: productContexts } = await productQuery;

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

    return {
      companyContext: (companyContext || []) as L1Context["companyContext"],
      productContexts: (productContexts || []) as L1Context["productContexts"],
      evidenceLibrary: (evidenceLibrary || []) as L1Context["evidenceLibrary"],
      teamMembers: [],
    };
  } catch (error) {
    logger.error("Error fetching L1 context for scoring", error);
    return { companyContext: [], productContexts: [], evidenceLibrary: [], teamMembers: [] };
  }
}

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

  // Handle requirements array
  if (Array.isArray(requirements.requirements)) {
    const reqList = requirements.requirements
      .slice(0, 20)
      .map((r: string | { description?: string }) =>
        typeof r === "string" ? `- ${r}` : `- ${r.description || r}`,
      )
      .join("\n");
    sections.push(`**Key Requirements:**\n${reqList}`);
  }

  // Handle evaluation criteria
  if (Array.isArray(requirements.evaluation_criteria)) {
    const criteria = requirements.evaluation_criteria
      .slice(0, 10)
      .map((c: string | { criterion?: string; weight?: string }) =>
        typeof c === "string"
          ? `- ${c}`
          : `- ${c.criterion || c}${c.weight ? ` (${c.weight})` : ""}`,
      )
      .join("\n");
    sections.push(`**Evaluation Criteria:**\n${criteria}`);
  }

  // Handle compliance requirements
  if (Array.isArray(requirements.compliance_requirements)) {
    const compliance = requirements.compliance_requirements
      .slice(0, 10)
      .map((c: string) => `- ${c}`)
      .join("\n");
    sections.push(`**Compliance Requirements:**\n${compliance}`);
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

  const brand = l1Context.companyContext.filter(
    (c) => c.category === "brand" || c.category === "values",
  );
  if (brand.length > 0) {
    sections.push(
      `**Company Identity:**\n${brand.map((c) => `- ${c.title}: ${c.content}`).join("\n")}`,
    );
  }

  const certs = l1Context.companyContext.filter(
    (c) => c.category === "certifications",
  );
  if (certs.length > 0) {
    sections.push(
      `**Certifications:**\n${certs.map((c) => `- ${c.title}`).join("\n")}`,
    );
  }

  if (l1Context.productContexts.length > 0) {
    const prods = l1Context.productContexts
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
    const evidence = l1Context.evidenceLibrary
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
function extractJsonFromResponse(response: string): Record<string, unknown> | null {
  // Strategy 1: Markdown code block (greedy to handle nested content)
  const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      // Code block found but content isn't valid JSON — continue to other strategies
    }
  }

  // Strategy 2: Find the outermost { ... } in the response
  const firstBrace = response.indexOf("{");
  const lastBrace = response.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(response.slice(firstBrace, lastBrace + 1));
    } catch {
      // Braces found but not valid JSON — continue
    }
  }

  // Strategy 3: Try parsing the entire response as-is (raw JSON, no wrapper)
  try {
    return JSON.parse(response.trim());
  } catch {
    // Nothing worked
  }

  return null;
}

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
    const raw = parsed[factor.key] as { score?: unknown; rationale?: unknown } | undefined;
    // Accept score as number or numeric string
    const rawScore = raw?.score;
    const score = typeof rawScore === "number"
      ? rawScore
      : typeof rawScore === "string" && !isNaN(Number(rawScore))
        ? Number(rawScore)
        : null;

    if (raw && score !== null) {
      result[factor.key] = {
        score: Math.max(0, Math.min(100, Math.round(score))),
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
