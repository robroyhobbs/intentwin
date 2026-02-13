/**
 * Quality Overseer — 3-Judge Council Review + Remediation
 *
 * Reviews all generated sections using a council of 3 LLMs:
 *   1. GPT-4o (OpenAI)
 *   2. Llama 3.3 70B (Groq)
 *   3. Mistral Small (Mistral)
 *
 * Judges review each section in parallel. Scores are aggregated via
 * weighted average with majority vote for pass/fail.
 *
 * Flow: Council reviews → Aggregate → Weak by consensus (2+)? → Gemini remediates → GPT-4o re-reviews → Store
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { reviewWithGPT4o } from "./openai-client";
import { reviewWithGroq } from "./groq-client";
import { reviewWithMistral } from "./mistral-client";
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

export interface JudgeInfo {
  judge_id: string;
  judge_name: string;
  provider: string;
  status: "completed" | "failed" | "timeout";
  error?: string;
}

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
// Judge Definitions
// ============================================================

interface JudgeDefinition {
  id: string;
  name: string;
  provider: string;
  reviewFn: (prompt: string) => Promise<QualityScores>;
}

/** Returns the model label for the initial "reviewing" status based on available judges. */
export function getReviewModelLabel(): string {
  const judges = getAvailableJudges();
  return judges.length > 1 ? "council" : judges[0]?.id || "gpt-4o";
}

function getAvailableJudges(): JudgeDefinition[] {
  const judges: JudgeDefinition[] = [];

  // GPT-4o is always available (required)
  judges.push({
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    reviewFn: reviewWithGPT4o,
  });

  // Groq — optional, skipped if no API key
  if (process.env.GROQ_API_KEY) {
    judges.push({
      id: "llama-3.3-70b",
      name: "Llama 3.3",
      provider: "groq",
      reviewFn: reviewWithGroq,
    });
  }

  // Mistral — optional, skipped if no API key
  if (process.env.MISTRAL_API_KEY) {
    judges.push({
      id: "mistral-small",
      name: "Mistral Small",
      provider: "mistral",
      reviewFn: reviewWithMistral,
    });
  }

  return judges;
}

// ============================================================
// Council Review (per-section)
// ============================================================

/**
 * Run all available judges on a single section prompt in parallel.
 * Returns individual JudgeResults + aggregated scores.
 */
async function runCouncilReview(
  prompt: string,
  judges: JudgeDefinition[],
): Promise<{
  judgeResults: JudgeResult[];
  aggregated: QualityScores;
  aggregatedScore: number;
}> {
  // Run all judges in parallel — never Promise.all so one failure doesn't cancel others
  const settled = await Promise.allSettled(
    judges.map(async (judge) => {
      try {
        const scores = await judge.reviewFn(prompt);
        const avg = calculateSectionScore(scores);
        return {
          judge_id: judge.id,
          judge_name: judge.name,
          provider: judge.provider,
          scores: {
            content_quality: scores.content_quality,
            client_fit: scores.client_fit,
            evidence: scores.evidence,
            brand_voice: scores.brand_voice,
          },
          score: avg,
          feedback: scores.feedback,
          status: "completed" as const,
        };
      } catch (err) {
        const isTimeout =
          err instanceof Error &&
          (err.message.includes("timeout") ||
            err.message.includes("ETIMEDOUT"));
        return {
          judge_id: judge.id,
          judge_name: judge.name,
          provider: judge.provider,
          scores: {
            content_quality: 0,
            client_fit: 0,
            evidence: 0,
            brand_voice: 0,
          },
          score: 0,
          feedback: "",
          status: (isTimeout ? "timeout" : "failed") as "timeout" | "failed",
          error: err instanceof Error ? err.message : "Unknown error",
        };
      }
    }),
  );

  // Extract results (allSettled always returns fulfilled since we catch inside)
  const judgeResults: JudgeResult[] = settled.map((s) =>
    s.status === "fulfilled"
      ? s.value
      : {
          judge_id: "unknown",
          judge_name: "Unknown",
          provider: "unknown",
          scores: {
            content_quality: 0,
            client_fit: 0,
            evidence: 0,
            brand_voice: 0,
          },
          score: 0,
          feedback: "",
          status: "failed" as const,
          error: "Promise rejected unexpectedly",
        },
  );

  // Filter to successful judges for aggregation
  const successful = judgeResults.filter((r) => r.status === "completed");

  if (successful.length === 0) {
    // All judges failed — return zeros
    return {
      judgeResults,
      aggregated: {
        content_quality: 0,
        client_fit: 0,
        evidence: 0,
        brand_voice: 0,
        feedback: "All judges failed to review this section.",
      },
      aggregatedScore: 0,
    };
  }

  // Average across successful judges
  const avg = (arr: number[]) =>
    Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 10) / 10;

  const aggregated: QualityScores = {
    content_quality: avg(successful.map((r) => r.scores.content_quality)),
    client_fit: avg(successful.map((r) => r.scores.client_fit)),
    evidence: avg(successful.map((r) => r.scores.evidence)),
    brand_voice: avg(successful.map((r) => r.scores.brand_voice)),
    feedback: successful
      .map((r) => `**${r.judge_name}:** ${r.feedback}`)
      .join("\n\n"),
  };

  const aggregatedScore = calculateSectionScore(aggregated);

  return { judgeResults, aggregated, aggregatedScore };
}

// ============================================================
// Consensus Calculation
// ============================================================

function calculateConsensus(
  sectionReviews: CouncilSectionReview[],
): "unanimous" | "majority" | "split" {
  if (sectionReviews.length === 0) return "split";

  // Look at individual judge pass/fail across all sections
  let unanimousCount = 0;
  let majorityCount = 0;
  let splitCount = 0;

  for (const section of sectionReviews) {
    const successful = section.judge_reviews.filter(
      (r) => r.status === "completed",
    );
    if (successful.length === 0) {
      splitCount++;
      continue;
    }

    const passes = successful.filter((r) => r.score >= PASS_THRESHOLD).length;
    const fails = successful.length - passes;

    if (passes === successful.length || fails === successful.length) {
      unanimousCount++;
    } else if (passes > fails || fails > passes) {
      majorityCount++;
    } else {
      splitCount++;
    }
  }

  // Overall consensus from section-level agreement
  if (unanimousCount === sectionReviews.length) return "unanimous";
  if (splitCount > sectionReviews.length / 2) return "split";
  return "majority";
}

// ============================================================
// Core Function
// ============================================================

/**
 * Run quality review on all sections of a proposal using the 3-judge council.
 */
export async function runQualityReview(
  proposalId: string,
  trigger: "auto_post_generation" | "manual",
): Promise<QualityReviewResult> {
  const supabase = createAdminClient();
  const runAt = new Date().toISOString();
  const judges = getAvailableJudges();

  const result: QualityReviewResult = {
    status: "reviewing",
    run_at: runAt,
    trigger,
    model: judges.length > 1 ? "council" : judges[0]?.id || "unknown",
    judges: judges.map((j) => ({
      judge_id: j.id,
      judge_name: j.name,
      provider: j.provider,
      status: "completed" as const,
    })),
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
      result.consensus = "split";
      await storeResult(supabase, proposalId, result);
      return result;
    }

    const intakeData = (proposal.intake_data || {}) as Record<string, unknown>;
    const winStrategy = proposal.win_strategy_data as {
      win_themes?: string[];
      differentiators?: string[];
    } | null;

    // ── Round 1: Council reviews all sections ──
    const sectionReviews: CouncilSectionReview[] = [];
    const weakSections: {
      sectionId: string;
      sectionType: string;
      score: number;
      feedback: string;
    }[] = [];

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

        const { judgeResults, aggregated, aggregatedScore } =
          await runCouncilReview(prompt, judges);

        const review: CouncilSectionReview = {
          section_id: section.id,
          section_type: section.section_type,
          score: aggregatedScore,
          dimensions: {
            content_quality: aggregated.content_quality,
            client_fit: aggregated.client_fit,
            evidence: aggregated.evidence,
            brand_voice: aggregated.brand_voice,
          },
          feedback: aggregated.feedback,
          judge_reviews: judgeResults,
        };

        sectionReviews.push(review);

        // Council consensus for remediation: 2+ judges must score below threshold
        const successfulJudges = judgeResults.filter(
          (r) => r.status === "completed",
        );
        const weakJudgeCount = successfulJudges.filter(
          (r) => r.score < REGEN_THRESHOLD,
        ).length;

        if (
          weakJudgeCount >= 2 ||
          (successfulJudges.length === 1 && weakJudgeCount === 1)
        ) {
          weakSections.push({
            sectionId: section.id,
            sectionType: section.section_type,
            score: aggregatedScore,
            feedback: aggregated.feedback,
          });
        }
      } catch (err) {
        console.error(`Council review failed for section ${section.id}:`, err);
        result.status = "failed";
        result.sections = sectionReviews;
        // Update judge statuses based on what we know
        await storeResult(supabase, proposalId, result);
        return result;
      }
    }

    // Update judge info with actual statuses from the last section reviewed
    if (sectionReviews.length > 0 && result.judges) {
      const lastSection = sectionReviews[sectionReviews.length - 1];
      result.judges = lastSection.judge_reviews.map((jr) => ({
        judge_id: jr.judge_id,
        judge_name: jr.judge_name,
        provider: jr.provider,
        status: jr.status,
        error: jr.error,
      }));
    }

    // ── Round 2: Remediate weak sections (council consensus) ──
    let remediationOccurred = false;

    for (const weak of weakSections) {
      try {
        const originalSection = sections.find((s) => s.id === weak.sectionId);
        if (!originalSection) continue;

        // Regenerate with Gemini, injecting council feedback
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

        // Re-review with GPT-4o only (single judge, not full council)
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

        // Update the section review with GPT-4o re-review score
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
        console.error(`Remediation failed for section ${weak.sectionId}:`, err);
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
    result.consensus = calculateConsensus(sectionReviews);
    result.status = "completed";

    // Store result
    await storeResult(supabase, proposalId, result);

    // Create version snapshot if remediation changed content
    if (remediationOccurred) {
      await createProposalVersion({
        proposalId,
        triggerEvent: "generation_complete",
        changeSummary: `Quality council remediated ${weakSections.length} section(s). Overall score: ${result.overall_score}`,
        label: "Quality Council Remediation",
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
 * Build a Gemini regeneration prompt that injects council feedback.
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

## Quality Review Feedback (from independent reviewer council)
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
