import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateText,
  generateStructuredAnalysis,
  buildSystemPrompt,
} from "./claude";
import { generateQueryEmbedding } from "./embeddings";
import { buildExecutiveSummaryPrompt } from "./prompts/executive-summary";
import { buildUnderstandingPrompt } from "./prompts/understanding";
import { buildApproachPrompt } from "./prompts/approach";
import { buildMethodologyPrompt } from "./prompts/methodology";
import { buildTeamPrompt } from "./prompts/team";
import { buildCaseStudiesPrompt } from "./prompts/case-studies";
import { buildTimelinePrompt } from "./prompts/timeline";
import { buildPricingPrompt } from "./prompts/pricing";
import { buildRiskMitigationPrompt } from "./prompts/risk-mitigation";
import { buildWhyUsPrompt } from "./prompts/why-us";
import { createProposalVersion } from "@/lib/versioning/create-version";
import { runQualityReview } from "./quality-overseer";
import { loadSources, formatSourcesAsL1Context } from "@/lib/sources";
import {
  getPersuasionPrompt,
  getBestPracticesPrompt,
  buildWinThemesPrompt,
  buildCompetitivePrompt,
  runQualityChecks,
  type BrandVoice,
} from "./persuasion";
import { getIndustryConfig, buildIndustryContext } from "./industry-configs";
import type { WinStrategyData } from "@/types/outcomes";
import type {
  OutcomeContract,
  CompanyContext,
  ProductContext,
  EvidenceLibraryEntry,
  CompanyInfo,
} from "@/types/idd";

// L1 Context: Company Truth
interface L1Context {
  companyContext: CompanyContext[];
  productContexts: ProductContext[];
  evidenceLibrary: EvidenceLibraryEntry[];
}

interface SectionConfig {
  type: string;
  title: string;
  order: number;
  buildPrompt: (
    intakeData: Record<string, unknown>,
    analysis: string,
    retrievedContext: string,
    winStrategy?: WinStrategyData | null,
    companyInfo?: CompanyInfo,
  ) => string;
  searchQuery: (intakeData: Record<string, unknown>) => string;
}

const SECTION_CONFIGS: SectionConfig[] = [
  {
    type: "executive_summary",
    title: "Executive Summary",
    order: 1,
    buildPrompt: buildExecutiveSummaryPrompt,
    searchQuery: (d) =>
      `executive summary ${d.opportunity_type} ${d.client_industry} proposal overview`,
  },
  {
    type: "understanding",
    title: "Understanding of Client Needs",
    order: 2,
    buildPrompt: buildUnderstandingPrompt,
    searchQuery: (d) =>
      `client needs analysis ${d.client_industry} ${d.opportunity_type} business challenges`,
  },
  {
    type: "approach",
    title: "Proposed Approach",
    order: 3,
    buildPrompt: buildApproachPrompt,
    searchQuery: (d) =>
      `technical approach ${d.opportunity_type} cloud migration modernization methodology`,
  },
  {
    type: "methodology",
    title: "Methodology",
    order: 4,
    buildPrompt: buildMethodologyPrompt,
    searchQuery: (d) =>
      `methodology framework ${d.opportunity_type} agile devops quality assurance`,
  },
  {
    type: "team",
    title: "Proposed Team & Qualifications",
    order: 5,
    buildPrompt: buildTeamPrompt,
    searchQuery: (d) =>
      `team structure qualifications certifications ${d.opportunity_type}`,
  },
  {
    type: "case_studies",
    title: "Relevant Experience & Case Studies",
    order: 6,
    buildPrompt: buildCaseStudiesPrompt,
    searchQuery: (d) =>
      `case study ${d.client_industry} ${d.opportunity_type} results outcomes metrics`,
  },
  {
    type: "timeline",
    title: "Timeline & Milestones",
    order: 7,
    buildPrompt: buildTimelinePrompt,
    searchQuery: (d) =>
      `project timeline milestones phases ${d.opportunity_type} delivery schedule`,
  },
  {
    type: "pricing",
    title: "Commercial Framework",
    order: 8,
    buildPrompt: buildPricingPrompt,
    searchQuery: (d) =>
      `pricing commercial framework ${d.opportunity_type} cost model investment`,
  },
  {
    type: "risk_mitigation",
    title: "Risk Mitigation",
    order: 9,
    buildPrompt: buildRiskMitigationPrompt,
    searchQuery: (d) =>
      `risk mitigation ${d.opportunity_type} challenges governance`,
  },
  {
    type: "why_us",
    title: "Why Us",
    order: 10,
    buildPrompt: buildWhyUsPrompt,
    searchQuery: (d) =>
      `differentiators partnerships ${d.client_industry} capabilities unique value proposition`,
  },
];

/**
 * Fetch L1 Context: Company Truth from the database
 * This provides canonical information for claim verification
 */
async function fetchL1Context(
  supabase: ReturnType<typeof createAdminClient>,
  serviceLine?: string,
  industry?: string,
  organizationId?: string,
): Promise<L1Context> {
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

    return {
      companyContext: (companyContext || []) as CompanyContext[],
      productContexts: (productContexts || []) as ProductContext[],
      evidenceLibrary: (evidenceLibrary || []) as EvidenceLibraryEntry[],
    };
  } catch (error) {
    console.error("Error fetching L1 context:", error);
    return {
      companyContext: [],
      productContexts: [],
      evidenceLibrary: [],
    };
  }
}

/**
 * Build the Outcome Contract context string for prompts
 */
function buildOutcomeContractContext(
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

/**
 * Build L1 context string for prompts
 */
function buildL1ContextString(l1Context: L1Context): string {
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

// Document types to exclude from evidence retrieval (not useful as proposal evidence)
const EXCLUDED_DOC_TYPES = new Set(["rfp", "template"]);

async function retrieveContext(
  supabase: ReturnType<typeof createAdminClient>,
  searchQuery: string,
  limit: number = 5,
): Promise<{ context: string; chunkIds: string[] }> {
  try {
    const queryEmbedding = await generateQueryEmbedding(searchQuery);

    // Over-fetch to compensate for filtering out RFP/template docs
    const { data: results } = await supabase.rpc("match_document_chunks", {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: 0.5,
      match_count: limit * 3,
    });

    if (!results || results.length === 0) {
      return { context: "No relevant reference material found.", chunkIds: [] };
    }

    // Filter out RFP and template documents — they're not evidence
    const filtered = results
      .filter(
        (r: { document_type: string }) =>
          !EXCLUDED_DOC_TYPES.has(r.document_type),
      )
      .slice(0, limit);

    if (filtered.length === 0) {
      return { context: "No relevant reference material found.", chunkIds: [] };
    }

    const context = filtered
      .map(
        (r: {
          document_title: string;
          section_heading: string;
          content: string;
          similarity: number;
        }) =>
          `--- From "${r.document_title}" (${r.section_heading || "General"}) [Relevance: ${(r.similarity * 100).toFixed(0)}%] ---\n${r.content}`,
      )
      .join("\n\n");

    const chunkIds = filtered.map((r: { id: string }) => r.id);

    return { context, chunkIds };
  } catch (error) {
    console.error("Context retrieval error:", error);
    return {
      context: "Reference material temporarily unavailable.",
      chunkIds: [],
    };
  }
}

export async function generateProposal(proposalId: string): Promise<void> {
  const supabase = createAdminClient();

  // Update proposal status
  await supabase
    .from("proposals")
    .update({
      status: "generating",
      generation_started_at: new Date().toISOString(),
    })
    .eq("id", proposalId);

  // Safety timeout: if generation takes longer than 10 minutes, abort and reset
  const GENERATION_TIMEOUT_MS = 10 * 60 * 1000;
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(
    () => timeoutController.abort(),
    GENERATION_TIMEOUT_MS,
  );

  try {
    // Check for abort periodically during the generation loop
    if (timeoutController.signal.aborted) {
      throw new Error("Generation timed out");
    }
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

    // Debug log for L1 context - only in development
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[IDD] Fetched L1 context: ${l1Context.companyContext.length} company, ${l1Context.productContexts.length} products, ${l1Context.evidenceLibrary.length} evidence`,
      );
    }

    // Load static sources from sources/ directory
    let staticSourcesContext = "";
    try {
      const staticSources = await loadSources();
      staticSourcesContext = formatSourcesAsL1Context(staticSources, {
        opportunityType: serviceLine,
        industry: industry,
      });
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[IDD] Loaded static sources: ${staticSources.all.length} files (${staticSources.methodologies.length} methodologies, ${staticSources.caseStudies.length} case studies)`,
        );
      }
    } catch (sourceError) {
      // Non-critical - static sources are supplementary
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[IDD] Failed to load static sources, continuing with database context only:",
          sourceError,
        );
      }
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

    // Create all section rows (pending)
    const sectionInserts = SECTION_CONFIGS.map((config) => ({
      proposal_id: proposalId,
      section_type: config.type,
      section_order: config.order,
      title: config.title,
      generation_status: "pending" as const,
    }));

    const { data: sections, error: sectionError } = await supabase
      .from("proposal_sections")
      .insert(sectionInserts)
      .select();

    if (sectionError || !sections) {
      throw new Error(`Failed to create sections: ${sectionError?.message}`);
    }

    // Stage 2 & 3: Retrieve context and generate each section
    for (const config of SECTION_CONFIGS) {
      // Check timeout before each section
      if (timeoutController.signal.aborted) {
        throw new Error("Generation timed out");
      }

      const section = sections.find((s) => s.section_type === config.type);
      if (!section) continue;

      // Update section status to generating
      await supabase
        .from("proposal_sections")
        .update({ generation_status: "generating" })
        .eq("id", section.id);

      try {
        // Retrieve relevant context
        const searchQuery = config.searchQuery(intakeData);
        const { context, chunkIds } = await retrieveContext(
          supabase,
          searchQuery,
        );

        // Build the base prompt (with win strategy, outcome contract, L1 context, and company info for IDD)
        const basePrompt = config.buildPrompt(
          intakeData,
          enhancedAnalysis,
          context,
          winStrategy,
          companyInfo,
        );

        // Build persuasion layers for this section type
        const persuasionFramework = getPersuasionPrompt(config.type);
        const bestPractices = getBestPracticesPrompt(config.type);
        const winThemesPrompt = winStrategy?.win_themes
          ? buildWinThemesPrompt(winStrategy.win_themes)
          : "";
        const competitivePrompt = winStrategy?.differentiators
          ? buildCompetitivePrompt(winStrategy.differentiators, [])
          : "";

        // Combine base prompt with persuasion context
        const persuasionContext = [
          persuasionFramework,
          bestPractices,
          winThemesPrompt,
          competitivePrompt,
        ]
          .filter(Boolean)
          .join("\n\n");

        // Build industry intelligence context for this section
        const industryContext = buildIndustryContext(
          industryConfig,
          config.type,
        );

        const prompt = [
          basePrompt,
          industryContext ? `\n\n---\n\n${industryContext}` : "",
          persuasionContext
            ? `\n\n---\n\n## Persuasion & Quality Guidance\n\n${persuasionContext}`
            : "",
        ]
          .filter(Boolean)
          .join("");

        // Generate the section content with organization-aware system prompt
        const generatedContent = await generateText(prompt, {
          systemPrompt,
        });

        // Run quality checks (advisory — log results, don't block generation)
        try {
          const avoidTerms = brandVoice?.terminology?.avoid ?? [];
          const themes = winStrategy?.win_themes ?? [];
          const qualityResult = runQualityChecks(
            generatedContent,
            config.type,
            themes,
            avoidTerms,
          );
          if (process.env.NODE_ENV === "development") {
            console.log(
              `[IMF] Quality check for ${config.type}:`,
              JSON.stringify(qualityResult),
            );
          }
        } catch (qcError) {
          if (process.env.NODE_ENV === "development") {
            console.warn(
              `[IMF] Quality check failed for ${config.type}:`,
              qcError,
            );
          }
        }

        // Update section with generated content
        await supabase
          .from("proposal_sections")
          .update({
            generated_content: generatedContent,
            generation_status: "completed",
            generation_prompt: prompt.slice(0, 2000), // Store truncated prompt for debugging
            retrieved_context_ids: chunkIds,
          })
          .eq("id", section.id);

        // Store source references
        if (chunkIds.length > 0) {
          const sourceInserts = chunkIds.map(
            (chunkId: string, idx: number) => ({
              section_id: section.id,
              chunk_id: chunkId,
              relevance_score: 1 - idx * 0.1, // Approximate scoring by rank
            }),
          );

          await supabase.from("section_sources").insert(sourceInserts);
        }
      } catch (sectionErr) {
        const errorMessage =
          sectionErr instanceof Error ? sectionErr.message : "Unknown error";

        await supabase
          .from("proposal_sections")
          .update({
            generation_status: "failed",
            generation_error: errorMessage,
          })
          .eq("id", section.id);
      }
    }

    // Update proposal status to review
    await supabase
      .from("proposals")
      .update({
        status: "review",
        generation_completed_at: new Date().toISOString(),
      })
      .eq("id", proposalId);

    // Create a version snapshot after generation completes
    await createProposalVersion({
      proposalId,
      triggerEvent: "generation_complete",
      changeSummary: "AI generation completed for all sections",
      label: "Initial Generation",
    });

    // Auto-trigger quality review after generation completes (fire-and-forget)
    runQualityReview(proposalId, "auto_post_generation").catch((err) => {
      console.error(
        `Auto quality review failed for proposal ${proposalId}:`,
        err,
      );
      // Don't throw — user can manually trigger if auto-trigger fails
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `Proposal generation failed for ${proposalId}:`,
      errorMessage,
    );

    await supabase
      .from("proposals")
      .update({ status: "draft" })
      .eq("id", proposalId);

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Regenerate a single section of a proposal.
 * Reuses the same pipeline context (analysis, L1, persuasion) as full generation.
 */
export async function regenerateSection(
  proposalId: string,
  sectionId: string,
  qualityFeedback?: string | null,
): Promise<void> {
  const supabase = createAdminClient();

  // Fetch the section to get its type
  const { data: section, error: secErr } = await supabase
    .from("proposal_sections")
    .select("*")
    .eq("id", sectionId)
    .eq("proposal_id", proposalId)
    .single();

  if (secErr || !section) {
    throw new Error("Section not found");
  }

  const config = SECTION_CONFIGS.find((c) => c.type === section.section_type);
  if (!config) {
    throw new Error(`Unknown section type: ${section.section_type}`);
  }

  // Mark as generating
  await supabase
    .from("proposal_sections")
    .update({ generation_status: "generating", generation_error: null })
    .eq("id", sectionId);

  try {
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

    const orgData = proposal.organizations as {
      name: string;
      settings?: Record<string, unknown>;
    } | null;
    const companyInfo: CompanyInfo = {
      name: orgData?.name || "Our Company",
      description: (orgData?.settings?.description as string) || undefined,
      industry: (orgData?.settings?.industry as string) || undefined,
    };

    const brandVoice: BrandVoice | null = orgData?.settings?.brand_voice
      ? (orgData.settings.brand_voice as BrandVoice)
      : null;

    const systemPrompt = buildSystemPrompt({
      name: companyInfo.name,
      description: companyInfo.description,
      brandVoice,
    });

    // Fetch L1 context
    const serviceLine = (intakeData.opportunity_type as string) || undefined;
    const industry = (intakeData.client_industry as string) || undefined;
    const l1Context = await fetchL1Context(
      supabase,
      serviceLine,
      industry,
      proposal.organization_id,
    );

    let staticSourcesContext = "";
    try {
      const staticSources = await loadSources();
      staticSourcesContext = formatSourcesAsL1Context(staticSources, {
        opportunityType: serviceLine,
        industry,
      });
    } catch {
      // Non-critical
    }

    const outcomeContractContext = buildOutcomeContractContext(outcomeContract);
    const l1ContextString =
      buildL1ContextString(l1Context) + staticSourcesContext;

    const analysis = await generateStructuredAnalysis(
      intakeData,
      proposal.rfp_extracted_requirements as
        | Record<string, unknown>
        | undefined,
      winStrategy,
    );
    const enhancedAnalysis = `${analysis}\n${outcomeContractContext}\n${l1ContextString}`;

    // Generate section content
    const searchQuery = config.searchQuery(intakeData);
    const { context, chunkIds } = await retrieveContext(supabase, searchQuery);

    const basePrompt = config.buildPrompt(
      intakeData,
      enhancedAnalysis,
      context,
      winStrategy,
      companyInfo,
    );

    const persuasionFramework = getPersuasionPrompt(config.type);
    const bestPractices = getBestPracticesPrompt(config.type);
    const winThemesPrompt = winStrategy?.win_themes
      ? buildWinThemesPrompt(winStrategy.win_themes)
      : "";
    const competitivePrompt = winStrategy?.differentiators
      ? buildCompetitivePrompt(winStrategy.differentiators, [])
      : "";

    const persuasionContext = [
      persuasionFramework,
      bestPractices,
      winThemesPrompt,
      competitivePrompt,
    ]
      .filter(Boolean)
      .join("\n\n");

    let prompt = persuasionContext
      ? `${basePrompt}\n\n---\n\n## Persuasion & Quality Guidance\n\n${persuasionContext}`
      : basePrompt;

    // Inject quality council feedback when available (feedback-aware regeneration)
    if (qualityFeedback) {
      prompt += `\n\n---\n\n## Quality Review Feedback (from independent reviewer council)\n\nThe previous version of this section was reviewed by a quality council. Address ALL issues identified below:\n\n${qualityFeedback}\n\nIMPORTANT: Your rewrite must specifically address each piece of feedback above. Improve specificity, evidence, client relevance, and persuasive impact based on the judges' comments.`;
    }

    const generatedContent = await generateText(prompt, { systemPrompt });

    // Quality checks (advisory)
    try {
      const avoidTerms = brandVoice?.terminology?.avoid ?? [];
      const themes = winStrategy?.win_themes ?? [];
      runQualityChecks(generatedContent, config.type, themes, avoidTerms);
    } catch {
      // Non-critical
    }

    // Update section
    await supabase
      .from("proposal_sections")
      .update({
        generated_content: generatedContent,
        edited_content: null,
        is_edited: false,
        generation_status: "completed",
        generation_prompt: prompt.slice(0, 2000),
        retrieved_context_ids: chunkIds,
        generation_error: null,
      })
      .eq("id", sectionId);

    // Store source references
    if (chunkIds.length > 0) {
      // Clear old sources first
      await supabase
        .from("section_sources")
        .delete()
        .eq("section_id", sectionId);

      const sourceInserts = chunkIds.map((chunkId: string, idx: number) => ({
        section_id: sectionId,
        chunk_id: chunkId,
        relevance_score: 1 - idx * 0.1,
      }));
      await supabase.from("section_sources").insert(sourceInserts);
    }
  } catch (sectionErr) {
    const errorMessage =
      sectionErr instanceof Error ? sectionErr.message : "Unknown error";

    await supabase
      .from("proposal_sections")
      .update({
        generation_status: "failed",
        generation_error: errorMessage,
      })
      .eq("id", sectionId);

    throw sectionErr;
  }
}
