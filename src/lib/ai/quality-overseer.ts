/**
 * Quality Overseer — Gemini Review + Remediation
 *
 * Reviews all generated sections using Gemini. Sections scoring below
 * REGEN_THRESHOLD are regenerated and re-reviewed.
 *
 * Flow: Gemini reviews → Weak sections? → Gemini remediates → Gemini re-reviews → Store
 */

import { createAdminClient } from "@/lib/supabase/admin";
import {
  GenerationStatus,
  QualityReviewStatus,
} from "@/lib/constants/statuses";
import { logger } from "@/lib/utils/logger";
import { logQualityReviewMetric } from "@/lib/observability/metrics";
import { parallelBatch, PIPELINE_CONCURRENCY } from "./pipeline/retrieval";
import { reviewWithGemini } from "./gemini-review-client";
import {
  buildQualityReviewPrompt,
  calculateSectionScore,
  REGEN_THRESHOLD,
  PASS_THRESHOLD,
  getQualityThreshold,
  type QualityScores,
} from "./prompts/quality-review";
import { intelligenceClient } from "@/lib/intelligence";
import { generateText, buildSystemPrompt } from "./gemini";
import { createProposalVersion } from "@/lib/versioning/create-version";

// ============================================================
// Types
// ============================================================

/** Single-judge review result stored in JSONB for backward compat. */
export interface JudgeResult {
  judge_id: string;
  judge_name: string;
  provider: string;
  scores: {
    content_quality: number;
    client_fit: number;
    evidence: number;
    brand_voice: number;
  };
  score: number;
  feedback: string;
  status: "completed" | "failed" | "timeout";
  error?: string;
}

/** @deprecated Kept for backward compatibility with old council data in JSONB */
export interface JudgeInfo {
  judge_id: string;
  judge_name: string;
  provider: string;
  status: "completed" | "failed" | "timeout";
  error?: string;
}

/** Section review stored in DB JSONB. judge_reviews is a single-element array (Gemini). */
export interface CouncilSectionReview {
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
  judge_reviews: JudgeResult[];
}

/** Kept for backward compatibility with old single-judge data */
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
  judges?: JudgeInfo[];
  consensus?: "unanimous" | "majority" | "split";
  overall_score: number;
  pass: boolean;
  sections: CouncilSectionReview[] | SectionReview[];
  remediation: RemediationEntry[];
}

// ============================================================
// Core Function
// ============================================================

/** Returns the model label used for the initial "reviewing" status. */
export function getReviewModelLabel(): string {
  return process.env.GEMINI_MODEL || "gemini-3.1-flash-lite-preview";
}

/**
 * Run quality review on all sections of a proposal using Gemini.
 */
export async function runQualityReview(
  proposalId: string,
  trigger: "auto_post_generation" | "manual",
): Promise<QualityReviewResult> {
  const reviewStartTime = performance.now();
  const supabase = createAdminClient();
  const runAt = new Date().toISOString();
  const geminiModel =
    process.env.GEMINI_MODEL || "gemini-3.1-flash-lite-preview";

  const result: QualityReviewResult = {
    status: QualityReviewStatus.REVIEWING,
    run_at: runAt,
    trigger,
    model: geminiModel,
    judges: [
      {
        judge_id: geminiModel,
        judge_name: "Gemini",
        provider: "google",
        status: "completed" as const,
      },
    ],
    overall_score: 0,
    pass: false,
    sections: [],
    remediation: [],
  };

  try {
    // Fetch proposal data
    const { data: proposal, error: proposalErr } = await supabase
      .from("proposals")
      .select(
        "id, intake_data, win_strategy_data, organization_id, quality_review",
      )
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
      .eq("generation_status", GenerationStatus.COMPLETED)
      .order("section_order", { ascending: true });

    if (sectionsErr) {
      throw new Error(`Failed to fetch sections: ${sectionsErr.message}`);
    }

    // Handle empty sections
    if (!sections || sections.length === 0) {
      result.status = QualityReviewStatus.COMPLETED;
      result.overall_score = 0;
      result.pass = false;
      result.consensus = "split";
      await storeResult(supabase, proposalId, result);
      return result;
    }

    const intakeData = (proposal.intake_data || {}) as Record<string, unknown>;
    const winStrategy = proposal.win_strategy_data as {
      win_themes?: string[];
      differentiators?: string[];
    } | null;

    // Fetch intelligence for dynamic quality threshold (non-blocking, returns null if unavailable)
    const agencyName =
      (intakeData.agency_name as string) ??
      (intakeData.client_name as string) ??
      null;
    const naicsCode = (intakeData.naics_code as string) ?? null;
    const intelligence = await intelligenceClient
      .getProposalIntelligence({
        agencyName,
        naicsCode,
      })
      .catch(() => null);

    // Dynamic threshold: competition-aware quality bar
    const dynamicThreshold = getQualityThreshold(intelligence);

    // ── Round 1: Review all sections ──
    const sectionReviews: CouncilSectionReview[] = [];
    const weakSections: {
      sectionId: string;
      sectionType: string;
      score: number;
      feedback: string;
    }[] = [];

    const sectionResults = await parallelBatch(
      sections,
      PIPELINE_CONCURRENCY,
      async (section) => {
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

        let scores: QualityScores;
        let reviewStatus: "completed" | "failed" = "completed";
        let reviewError: string | undefined;

        try {
          scores = await reviewWithGemini(prompt);
        } catch (err) {
          reviewStatus = "failed";
          reviewError = err instanceof Error ? err.message : "Unknown error";
          scores = {
            content_quality: 0,
            client_fit: 0,
            evidence: 0,
            brand_voice: 0,
            feedback: "",
          };
        }

        const sectionScore = calculateSectionScore(scores);

        // Build a single-element judge_reviews array for DB backward compat
        const judgeResult: JudgeResult = {
          judge_id: geminiModel,
          judge_name: "Gemini",
          provider: "google",
          scores: {
            content_quality: scores.content_quality,
            client_fit: scores.client_fit,
            evidence: scores.evidence,
            brand_voice: scores.brand_voice,
          },
          score: sectionScore,
          feedback: scores.feedback,
          status: reviewStatus,
          error: reviewError,
        };

        const review: CouncilSectionReview = {
          section_id: section.id,
          section_type: section.section_type,
          score: sectionScore,
          dimensions: {
            content_quality: scores.content_quality,
            client_fit: scores.client_fit,
            evidence: scores.evidence,
            brand_voice: scores.brand_voice,
          },
          feedback: scores.feedback,
          judge_reviews: [judgeResult],
        };

        const isWeak =
          reviewStatus === "completed" && sectionScore < dynamicThreshold;

        return { review, isWeak, sectionScore, feedback: scores.feedback };
      },
    );

    // Collect results
    let hasFatalError = false;
    for (let i = 0; i < sectionResults.length; i++) {
      const settled = sectionResults[i];
      if (settled.status === "fulfilled") {
        sectionReviews.push(settled.value.review);
        if (settled.value.isWeak) {
          weakSections.push({
            sectionId: sections[i].id,
            sectionType: sections[i].section_type,
            score: settled.value.sectionScore,
            feedback: settled.value.feedback,
          });
        }
      } else {
        logger.error(
          `Review failed for section ${sections[i].id}`,
          settled.reason,
        );
        hasFatalError = true;
      }
    }

    if (hasFatalError && sectionReviews.length === 0) {
      result.status = QualityReviewStatus.FAILED;
      result.sections = sectionReviews;
      await storeResult(supabase, proposalId, result);
      return result;
    }

    // Update judge status from actual review results
    if (sectionReviews.length > 0 && result.judges) {
      const lastSection = sectionReviews[sectionReviews.length - 1];
      const geminiJudge = lastSection.judge_reviews[0];
      if (geminiJudge) {
        result.judges = [
          {
            judge_id: geminiJudge.judge_id,
            judge_name: geminiJudge.judge_name,
            provider: geminiJudge.provider,
            status: geminiJudge.status,
            error: geminiJudge.error,
          },
        ];
      }
    }

    // ── Round 2: Remediate weak sections ──
    let remediationOccurred = false;

    for (const weak of weakSections) {
      try {
        const originalSection = sections.find((s) => s.id === weak.sectionId);
        if (!originalSection) continue;

        // Regenerate with Gemini, injecting feedback
        const regenPrompt = buildRemediationPrompt(
          originalSection.generated_content || "",
          originalSection.section_type,
          weak.feedback,
          intakeData,
        );

        const systemPrompt = buildSystemPrompt();
        const regeneratedContent = await generateText(regenPrompt, {
          systemPrompt,
        });

        // Update section content in database
        await supabase
          .from("proposal_sections")
          .update({ generated_content: regeneratedContent })
          .eq("id", weak.sectionId);

        remediationOccurred = true;

        // Re-review with Gemini
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

        const newScores = await reviewWithGemini(reReviewPrompt);
        const newAvg = calculateSectionScore(newScores);

        // Update the section review with re-review scores
        const existingReview = sectionReviews.find(
          (r) => r.section_id === weak.sectionId,
        );
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

        result.remediation.push({
          section_id: weak.sectionId,
          round: 1,
          original_score: weak.score,
          issues: [weak.feedback],
          new_score: newAvg,
        });
      } catch (err) {
        logger.error(`Remediation failed for section ${weak.sectionId}`, err);
        result.remediation.push({
          section_id: weak.sectionId,
          round: 1,
          original_score: weak.score,
          issues: [
            weak.feedback,
            `Remediation failed: ${err instanceof Error ? err.message : "Unknown error"}`,
          ],
          new_score: weak.score,
        });
      }
    }

    // ── Calculate final scores ──
    result.sections = sectionReviews;
    result.overall_score =
      sectionReviews.length > 0
        ? Math.round(
            (sectionReviews.reduce((sum, s) => sum + s.score, 0) /
              sectionReviews.length) *
              10,
          ) / 10
        : 0;
    result.pass = result.overall_score >= PASS_THRESHOLD;
    result.consensus = "unanimous"; // Single judge always unanimous
    result.status = QualityReviewStatus.COMPLETED;

    // Log quality review metric (non-critical)
    try {
      const sectionScores: Record<string, number> = {};
      for (const sr of sectionReviews) {
        sectionScores[sr.section_type] = sr.score;
      }
      logQualityReviewMetric({
        proposalId,
        organizationId: proposal.organization_id,
        durationMs: Math.round(performance.now() - reviewStartTime),
        status: "success",
        overallScore: result.overall_score,
        sectionScores,
        judgesUsed: 1,
      });
    } catch {
      // Metric logging must never break quality review
    }

    // Store result
    await storeResult(supabase, proposalId, result);

    // Create version snapshot if remediation changed content
    if (remediationOccurred) {
      await createProposalVersion({
        proposalId,
        triggerEvent: "generation_complete",
        changeSummary: `Quality review remediated ${weakSections.length} section(s). Overall score: ${result.overall_score}`,
        label: "Quality Council Remediation",
      });
    }

    return result;
  } catch (err) {
    logger.error("Quality review error", err);
    result.status = QualityReviewStatus.FAILED;

    // Log quality review failure metric (non-critical)
    try {
      logQualityReviewMetric({
        proposalId,
        organizationId: "",
        durationMs: Math.round(performance.now() - reviewStartTime),
        status: "failure",
        judgesUsed: 1,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    } catch {
      // Metric logging must never break quality review
    }

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
 * Extract quality review feedback for a specific section from the proposal's
 * quality_review JSONB column. Returns a formatted string with scores and
 * comments, or null if no feedback exists.
 */
export async function getQualityFeedbackForSection(
  proposalId: string,
  sectionId: string,
): Promise<string | null> {
  try {
    const supabase = createAdminClient();
    const { data: proposal, error } = await supabase
      .from("proposals")
      .select("quality_review")
      .eq("id", proposalId)
      .single();

    if (error || !proposal?.quality_review) return null;

    const review = proposal.quality_review as QualityReviewResult;
    if (review.status === "failed" || !review.sections?.length) return null;

    const sectionReview = review.sections.find(
      (s) => s.section_id === sectionId,
    );
    if (!sectionReview) return null;

    // Build formatted feedback string
    const lines: string[] = [];
    lines.push(`Overall Section Score: ${sectionReview.score}/10`);
    lines.push(`Dimensions:`);
    lines.push(
      `  - Content Quality: ${sectionReview.dimensions.content_quality}/10`,
    );
    lines.push(`  - Client Fit: ${sectionReview.dimensions.client_fit}/10`);
    lines.push(`  - Evidence: ${sectionReview.dimensions.evidence}/10`);
    lines.push(`  - Brand Voice: ${sectionReview.dimensions.brand_voice}/10`);
    lines.push("");

    // Include per-judge feedback if available (CouncilSectionReview — supports old multi-judge data too)
    const councilReview = sectionReview as CouncilSectionReview;
    if (councilReview.judge_reviews?.length) {
      for (const jr of councilReview.judge_reviews) {
        if (jr.status === "completed" && jr.feedback) {
          lines.push(
            `**${jr.judge_name} (${jr.provider})** — Score: ${jr.score}/10`,
          );
          lines.push(jr.feedback);
          lines.push("");
        }
      }
    } else if (sectionReview.feedback) {
      // Old single-judge format
      lines.push(sectionReview.feedback);
    }

    return lines.join("\n").trim() || null;
  } catch {
    return null;
  }
}

/**
 * Build a Gemini regeneration prompt that injects review feedback.
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

## Quality Review Feedback
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
