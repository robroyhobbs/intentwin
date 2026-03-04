/**
 * Capability Alignment — Pre-Generation Assessment
 *
 * Pure function that computes how well the company's L1 data (evidence,
 * products, team) aligns with the opportunity. Used to gate generation
 * with a warning when alignment is low.
 */

import type { BidEvaluation } from "@/lib/ai/bid-scoring";
import { SCORING_FACTORS } from "@/lib/ai/bid-scoring";

// ── Types ────────────────────────────────────────────────────────────────────

export type AlignmentLevel = "high" | "moderate" | "low";

export interface CapabilityAlignmentResult {
  level: AlignmentLevel;
  bidScore: number | null;
  evidenceCount: number;
  productCount: number;
  reasons: string[];
  sectionRisks: string[];
}

// ── Sections at risk when data is thin ───────────────────────────────────────

const EVIDENCE_DEPENDENT_SECTIONS = [
  "Case Studies & Past Performance",
  "Approach & Methodology",
  "Executive Summary",
  "Why Us / Differentiators",
  "Cover Letter",
];

const PRODUCT_DEPENDENT_SECTIONS = [
  "Approach & Methodology",
  "Technical Solution",
  "Timeline & Milestones",
];

// ── Thresholds ───────────────────────────────────────────────────────────────

const LOW_BID_SCORE = 50;
const MODERATE_BID_SCORE = 70;
const WEAK_FACTOR_THRESHOLD = 50;

// ── Main function ────────────────────────────────────────────────────────────

export interface L1Summary {
  evidenceCount: number;
  productCount: number;
  teamMemberCount: number;
}

/**
 * Compute capability alignment from bid evaluation and L1 data summary.
 * Pure function — no DB calls, no side effects.
 */
export function computeCapabilityAlignment(
  bidEvaluation: BidEvaluation | null,
  l1Summary?: L1Summary,
): CapabilityAlignmentResult {
  const reasons: string[] = [];
  const sectionRisks = new Set<string>();
  const bidScore = bidEvaluation?.weighted_total ?? null;
  const evidenceCount = l1Summary?.evidenceCount ?? 0;
  const productCount = l1Summary?.productCount ?? 0;

  // Check bid score
  if (bidScore !== null && bidScore < LOW_BID_SCORE) {
    reasons.push(`Bid score is ${Math.round(bidScore)}/100 — below the 50-point threshold`);
  } else if (bidScore !== null && bidScore < MODERATE_BID_SCORE) {
    reasons.push(`Bid score is ${Math.round(bidScore)}/100 — moderate alignment`);
  }

  // Check weak scoring factors
  if (bidEvaluation?.ai_scores) {
    for (const factor of SCORING_FACTORS) {
      const score = bidEvaluation.ai_scores[factor.key]?.score ?? 100;
      if (score < WEAK_FACTOR_THRESHOLD) {
        reasons.push(`${factor.label}: ${score}/100 — "${bidEvaluation.ai_scores[factor.key]?.rationale ?? "weak"}"`);
      }
    }
  }

  // Check L1 data availability
  if (evidenceCount === 0) {
    reasons.push("No case studies or evidence in your library");
    for (const s of EVIDENCE_DEPENDENT_SECTIONS) sectionRisks.add(s);
  } else if (evidenceCount < 2) {
    reasons.push(`Only ${evidenceCount} case study available — most sections need 2+`);
    sectionRisks.add("Case Studies & Past Performance");
  }

  if (productCount === 0) {
    reasons.push("No products or services defined in company context");
    for (const s of PRODUCT_DEPENDENT_SECTIONS) sectionRisks.add(s);
  }

  // Determine level
  let level: AlignmentLevel;
  const isLowBid = bidScore !== null && bidScore < LOW_BID_SCORE;
  const noData = evidenceCount === 0 && productCount === 0;

  if (isLowBid || noData) {
    level = "low";
  } else if (
    (bidScore !== null && bidScore < MODERATE_BID_SCORE) ||
    evidenceCount < 2
  ) {
    level = "moderate";
  } else {
    level = "high";
  }

  return {
    level,
    bidScore,
    evidenceCount,
    productCount,
    reasons,
    sectionRisks: Array.from(sectionRisks),
  };
}
