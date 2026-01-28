import { createAdminClient } from "@/lib/supabase/admin";
import { generateText, generateStructuredAnalysis } from "./claude";
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
import { buildWhyCapgeminiPrompt } from "./prompts/why-capgemini";
import type { WinStrategyData } from "@/types/outcomes";

interface SectionConfig {
  type: string;
  title: string;
  order: number;
  buildPrompt: (
    intakeData: Record<string, unknown>,
    analysis: string,
    retrievedContext: string,
    winStrategy?: WinStrategyData | null
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
    type: "why_capgemini",
    title: "Why Capgemini",
    order: 10,
    buildPrompt: buildWhyCapgeminiPrompt,
    searchQuery: (d) =>
      `why capgemini differentiators partnerships ${d.client_industry} capabilities`,
  },
];

async function retrieveContext(
  supabase: ReturnType<typeof createAdminClient>,
  searchQuery: string,
  limit: number = 5
): Promise<{ context: string; chunkIds: string[] }> {
  try {
    const queryEmbedding = await generateQueryEmbedding(searchQuery);

    const { data: results } = await supabase.rpc("match_document_chunks", {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: 0.5,
      match_count: limit,
    });

    if (!results || results.length === 0) {
      return { context: "No relevant reference material found.", chunkIds: [] };
    }

    const context = results
      .map(
        (r: { document_title: string; section_heading: string; content: string; similarity: number }) =>
          `--- From "${r.document_title}" (${r.section_heading || "General"}) [Relevance: ${(r.similarity * 100).toFixed(0)}%] ---\n${r.content}`
      )
      .join("\n\n");

    const chunkIds = results.map((r: { id: string }) => r.id);

    return { context, chunkIds };
  } catch (error) {
    console.error("Context retrieval error:", error);
    return { context: "Reference material temporarily unavailable.", chunkIds: [] };
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

  try {
    // Fetch proposal
    const { data: proposal, error: fetchError } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", proposalId)
      .single();

    if (fetchError || !proposal) {
      throw new Error(`Proposal not found: ${proposalId}`);
    }

    const intakeData = proposal.intake_data as Record<string, unknown>;
    const winStrategy = (proposal.win_strategy_data as WinStrategyData) || null;

    // Stage 1: Strategic Analysis (incorporating win strategy if available)
    const analysis = await generateStructuredAnalysis(
      intakeData,
      proposal.rfp_extracted_requirements as Record<string, unknown> | undefined,
      winStrategy
    );

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
          searchQuery
        );

        // Build the prompt (with win strategy for outcome-driven content)
        const prompt = config.buildPrompt(intakeData, analysis, context, winStrategy);

        // Generate the section content
        const generatedContent = await generateText(prompt);

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
          const sourceInserts = chunkIds.map((chunkId: string, idx: number) => ({
            section_id: section.id,
            chunk_id: chunkId,
            relevance_score: 1 - idx * 0.1, // Approximate scoring by rank
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
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`Proposal generation failed for ${proposalId}:`, errorMessage);

    await supabase
      .from("proposals")
      .update({ status: "draft" })
      .eq("id", proposalId);

    throw error;
  }
}
