/**
 * Quality Overseer — Core Review + Remediation Logic
 *
 * Reviews all generated sections using GPT-4o, identifies weak sections,
 * regenerates them with Gemini (injecting GPT-4o feedback), and stores
 * the complete quality_review JSONB on the proposals table.
 *
 * Flow: Review all → Identify weak (< 8.5) → Regen with Gemini → Re-review → Store
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { reviewWithGPT4o } from "./openai-client";
import {
  buildQualityReviewPrompt,
  calculateSectionScore,
  REGEN_THRESHOLD,
  PASS_THRESHOLD,
  type QualityScores,
} from "./prompts/quality-review";
import { generateText, buildSystemPrompt } from "./claude";
import { createProposalVersion } from "@/lib/versioning/create-version";

// ============================================================
// Types
// ============================================================

export interface SectionReview {
  section_id: string;
  section_type: string;
  score: number;
  dimensions: {
    content_quality: number;
    client_fit: number;
    evidence: number;
    brand_voice: number;
  };
  feedback: string;
}

export interface RemediationEntry {
  section_id: string;
  round: number;
  original_score: number;
  issues: string[];
  new_score: number;
}

export interface QualityReviewResult {
  status: "reviewing" | "completed" | "failed";
  run_at: string;
  trigger: "auto_post_generation" | "manual";
  model: string;
  overall_score: number;
  pass: boolean;
  sections: SectionReview[];
  remediation: RemediationEntry[];
}

// ============================================================
// Core Function
// ============================================================

/**
 * Run quality review on all sections of a proposal.
 * Returns the complete QualityReviewResult to be stored in proposals.quality_review.
 */
export async function runQualityReview(
  proposalId: string,
  trigger: "auto_post_generation" | "manual",
): Promise<QualityReviewResult> {
  const supabase = createAdminClient();
  const runAt = new Date().toISOString();

  const result: QualityReviewResult = {
    status: "reviewing",
    run_at: runAt,
    trigger,
    model: "gpt-4o",
    overall_score: 0,
    pass: false,
    sections: [],
    remediation: [],
  };

  try {
    // Set status to reviewing
    await supabase
      .from("proposals")
      .update({ quality_review: { ...result } })
      .eq("id", proposalId);

    // Fetch proposal data
    const { data: proposal, error: proposalErr } = await supabase
      .from("proposals")
      .select("id, intake_data, win_strategy_data, organization_id, quality_review")
      .eq("id", proposalId)
      .single();

    if (proposalErr || !proposal) {
      throw new Error(`Proposal not found: ${proposalId}`);
    }

    // Fetch completed sections
    const { data: sections, error: sectionsErr } = await supabase
      .from("proposal_sections")
      .select("id, section_type, title, generated_content, generation_status")
      .eq("proposal_id", proposalId)
      .eq("generation_status", "completed")
      .order("section_order", { ascending: true });

    if (sectionsErr) {
      throw new Error(`Failed to fetch sections: ${sectionsErr.message}`);
    }

    // Handle empty sections
    if (!sections || sections.length === 0) {
      result.status = "completed";
      result.overall_score = 0;
      result.pass = false;
      await storeResult(supabase, proposalId, result);
      return result;
    }

    const intakeData = (proposal.intake_data || {}) as Record<string, unknown>;
    const winStrategy = proposal.win_strategy_data as {
      win_themes?: string[];
      differentiators?: string[];
    } | null;

    // ── Round 1: Review all sections ──
    const sectionReviews: SectionReview[] = [];
    const weakSections: { sectionId: string; sectionType: string; score: number; feedback: string }[] = [];

    for (const section of sections) {
      try {
        const prompt = buildQualityReviewPrompt({
          sectionContent: section.generated_content || "",
          sectionType: section.section_type,
          proposalContext: {
            clientName: intakeData.client_name as string | undefined,
            industry: intakeData.client_industry as string | undefined,
            opportunityType: intakeData.opportunity_type as string | undefined,
          },
          winStrategy,
        });

        const scores = await reviewWithGPT4o(prompt);
        const sectionAvg = calculateSectionScore(scores);

        const review: SectionReview = {
          section_id: section.id,
          section_type: section.section_type,
          score: sectionAvg,
          dimensions: {
            content_quality: scores.content_quality,
            client_fit: scores.client_fit,
            evidence: scores.evidence,
            brand_voice: scores.brand_voice,
          },
          feedback: scores.feedback,
        };

        sectionReviews.push(review);

        if (sectionAvg < REGEN_THRESHOLD) {
          weakSections.push({
            sectionId: section.id,
            sectionType: section.section_type,
            score: sectionAvg,
            feedback: scores.feedback,
          });
        }
      } catch (err) {
        // If a single section review fails, mark the whole review as failed
        console.error(`Quality review failed for section ${section.id}:`, err);
        result.status = "failed";
        result.sections = sectionReviews;
        await storeResult(supabase, proposalId, result);
        return result;
      }
    }

    // ── Round 2: Remediate weak sections ──
    let remediationOccurred = false;

    for (const weak of weakSections) {
      try {
        // Find the original section data
        const originalSection = sections.find((s) => s.id === weak.sectionId);
        if (!originalSection) continue;

        // Regenerate with Gemini, injecting GPT-4o feedback
        const regenPrompt = buildRemediationPrompt(
          originalSection.generated_content || "",
          originalSection.section_type,
          weak.feedback,
          intakeData,
        );

        const systemPrompt = buildSystemPrompt();
        const regeneratedContent = await generateText(regenPrompt, { systemPrompt });

        // Update section content in database
        await supabase
          .from("proposal_sections")
          .update({ generated_content: regeneratedContent })
          .eq("id", weak.sectionId);

        remediationOccurred = true;

        // Re-review the regenerated section
        const reReviewPrompt = buildQualityReviewPrompt({
          sectionContent: regeneratedContent,
          sectionType: weak.sectionType,
          proposalContext: {
            clientName: intakeData.client_name as string | undefined,
            industry: intakeData.client_industry as string | undefined,
            opportunityType: intakeData.opportunity_type as string | undefined,
          },
          winStrategy,
        });

        const newScores = await reviewWithGPT4o(reReviewPrompt);
        const newAvg = calculateSectionScore(newScores);

        // Update the section review with new scores
        const existingReview = sectionReviews.find((r) => r.section_id === weak.sectionId);
        if (existingReview) {
          existingReview.score = newAvg;
          existingReview.dimensions = {
            content_quality: newScores.content_quality,
            client_fit: newScores.client_fit,
            evidence: newScores.evidence,
            brand_voice: newScores.brand_voice,
          };
          existingReview.feedback = newScores.feedback;
        }

        // Log remediation
        result.remediation.push({
          section_id: weak.sectionId,
          round: 1,
          original_score: weak.score,
          issues: [weak.feedback],
          new_score: newAvg,
        });
      } catch (err) {
        // Remediation failure: log but don't crash — keep original score
        console.error(`Remediation failed for section ${weak.sectionId}:`, err);
        result.remediation.push({
          section_id: weak.sectionId,
          round: 1,
          original_score: weak.score,
          issues: [weak.feedback, `Remediation failed: ${err instanceof Error ? err.message : "Unknown error"}`],
          new_score: weak.score,
        });
      }
    }

    // ── Calculate final scores ──
    result.sections = sectionReviews;
    result.overall_score = sectionReviews.length > 0
      ? Math.round(
          (sectionReviews.reduce((sum, s) => sum + s.score, 0) / sectionReviews.length) * 10,
        ) / 10
      : 0;
    result.pass = result.overall_score >= PASS_THRESHOLD;
    result.status = "completed";

    // Store result
    await storeResult(supabase, proposalId, result);

    // Create version snapshot if remediation changed content
    if (remediationOccurred) {
      await createProposalVersion({
        proposalId,
        triggerEvent: "generation_complete",
        changeSummary: `Quality overseer remediated ${weakSections.length} section(s). Overall score: ${result.overall_score}`,
        label: "Quality Review Remediation",
      });
    }

    return result;
  } catch (err) {
    console.error("Quality review error:", err);
    result.status = "failed";
    await storeResult(supabase, proposalId, result).catch(() => {});
    return result;
  }
}

// ============================================================
// Helpers
// ============================================================

async function storeResult(
  supabase: ReturnType<typeof createAdminClient>,
  proposalId: string,
  result: QualityReviewResult,
): Promise<void> {
  await supabase
    .from("proposals")
    .update({ quality_review: result })
    .eq("id", proposalId);
}

/**
 * Build a Gemini regeneration prompt that injects GPT-4o feedback.
 */
function buildRemediationPrompt(
  originalContent: string,
  sectionType: string,
  feedback: string,
  intakeData: Record<string, unknown>,
): string {
  return `Rewrite and improve the following ${sectionType} section for a proposal.

## Original Content
${originalContent}

## Quality Review Feedback (from independent reviewer)
${feedback}

## Proposal Context
- Client: ${intakeData.client_name || "Unknown"}
- Industry: ${intakeData.client_industry || "Not specified"}
- Opportunity: ${intakeData.opportunity_type || "Not specified"}

## Instructions
Address ALL issues identified in the quality review feedback above.
Maintain the same overall structure and scope, but significantly improve:
- Specificity (replace vague claims with concrete details)
- Evidence (add metrics, case studies, or proof points where missing)
- Client relevance (ensure every point ties back to the client's situation)
- Persuasive impact (make every sentence earn its place)

Output only the improved section text, formatted in markdown.`;
}
