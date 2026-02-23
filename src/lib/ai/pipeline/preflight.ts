/**
 * Pre-Flight Gate: Readiness Check
 *
 * Runs between intake and generation. Compares RFP requirements against L1 data
 * to identify gaps the user should fill before generating. Never blocks generation
 * (fail-open), but surfaces actionable feedback.
 */

import type { L1Context } from "./types";

// ── Types ────────────────────────────────────────────────────────────────────

export interface PreflightGap {
  /** What kind of data is missing */
  type: "evidence" | "personnel" | "product" | "compliance";
  /** Gap severity */
  category: "ready" | "needs_data" | "cannot_address";
  /** Human-readable description of the gap */
  description: string;
  /** Additional detail (e.g., which industry, which role) */
  detail?: string;
  /** Structured placeholder text to inject into generation */
  placeholder?: string;
  /** Hint for what the user should upload */
  uploadHint?: string;
  /** Which proposal section this gap affects */
  affectedSection?: string;
}

interface PreflightSummary {
  evidenceCount: number;
  productCount: number;
  companyContextCount: number;
  requirementCount: number;
  gapCount: number;
  readyCount: number;
  needsDataCount: number;
}

export interface PreflightResult {
  status: "ready" | "needs_data" | "cannot_address";
  gaps: PreflightGap[];
  summary: PreflightSummary;
}

// ── Evidence thresholds ──────────────────────────────────────────────────────

/** Minimum verified evidence entries for a solid case studies section */
const MIN_EVIDENCE_FOR_CASE_STUDIES = 2;

// ── Main function ────────────────────────────────────────────────────────────

/**
 * Run a pre-flight readiness check comparing RFP requirements against L1 data.
 *
 * This is a pure, synchronous, read-only function. It never modifies L1, intake,
 * or any DB state. It never throws — returns a valid result even with empty inputs.
 */
export function runPreflightCheck(
  l1Context: L1Context,
  intakeData: Record<string, unknown>,
  requirements: Record<string, unknown>[] | null | undefined,
): PreflightResult {
  const gaps: PreflightGap[] = [];
  const safeRequirements = Array.isArray(requirements) ? requirements : [];

  const evidenceCount = l1Context.evidenceLibrary?.length ?? 0;
  const productCount = l1Context.productContexts?.length ?? 0;
  const companyContextCount = l1Context.companyContext?.length ?? 0;

  // ── Check 1: Evidence availability ───────────────────────────────────────

  if (evidenceCount < MIN_EVIDENCE_FOR_CASE_STUDIES) {
    const industry = (intakeData.client_industry as string) || "the target industry";
    const scope = (intakeData.scope_description as string) || "the requested scope";

    gaps.push({
      type: "evidence",
      category: "needs_data",
      description: `Only ${evidenceCount} verified case studies available (recommend at least ${MIN_EVIDENCE_FOR_CASE_STUDIES})`,
      detail: `No evidence matching industry: ${industry}`,
      placeholder: `[CASE STUDY NEEDED: ${industry}, ${scope}]`,
      uploadHint: `Upload a case study document for a ${industry} engagement, or add one manually in the Evidence Library.`,
      affectedSection: "case_studies",
    });
  }

  // ── Check 2: Product/capability coverage ─────────────────────────────────

  if (productCount === 0) {
    gaps.push({
      type: "product",
      category: "needs_data",
      description: "No products or services defined in Company Truth",
      detail: "The proposal will describe capabilities in generic terms without specific offerings",
      uploadHint: "Add your products and services in Settings > Company Profile > Products & Services.",
      affectedSection: "approach",
    });
  }

  // ── Check 3: Company context ─────────────────────────────────────────────

  if (companyContextCount === 0) {
    gaps.push({
      type: "compliance",
      category: "needs_data",
      description: "No company context (brand, certifications, values) defined",
      detail: "The proposal cannot reference your brand identity or certifications",
      uploadHint: "Add your company profile in Settings > Company Profile.",
      affectedSection: "why_us",
    });
  }

  // ── Check 4: Requirement-specific gaps ───────────────────────────────────

  for (const req of safeRequirements) {
    const text = (req.requirement_text as string || "").toLowerCase();
    const category = req.category as string;
    // Check for case study requirements
    if (
      category === "mandatory" &&
      (text.includes("case stud") || text.includes("past performance") || text.includes("relevant experience"))
    ) {
      if (evidenceCount < MIN_EVIDENCE_FOR_CASE_STUDIES) {
        // Only add if we haven't already flagged evidence gap
        if (!gaps.some(g => g.type === "evidence" && g.affectedSection === "case_studies")) {
          gaps.push({
            type: "evidence",
            category: "needs_data",
            description: `RFP requires case studies but only ${evidenceCount} available`,
            placeholder: `[CASE STUDY NEEDED: ${intakeData.client_industry || "relevant"}, ${intakeData.scope_description || "matching scope"}]`,
            uploadHint: "Upload case study documents or add evidence in the Evidence Library.",
            affectedSection: "case_studies",
          });
        }
      }
    }

    // Check for named personnel requirements
    if (
      category === "mandatory" &&
      (text.includes("named") || text.includes("personnel") || text.includes("resume") || text.includes("key staff"))
    ) {
      // Check if org actually has team members before flagging as a gap
      const hasTeamMembers = l1Context.teamMembers.length > 0;
      if (!hasTeamMembers) {
        gaps.push({
          type: "personnel",
          category: "needs_data",
          description: "RFP requires named personnel but no team members are registered",
          detail: text.slice(0, 100),
          placeholder: `[TEAM MEMBER NEEDED: See RFP requirement]`,
          uploadHint: "Upload team member resumes or add personnel in Settings > Company Profile > Team Members.",
          affectedSection: "team",
        });
      }
    }

    // Check for pricing requirements
    if (
      category === "mandatory" &&
      (text.includes("pricing") || text.includes("cost") || text.includes("line-item") || text.includes("budget"))
    ) {
      if (!intakeData.budget_range) {
        gaps.push({
          type: "compliance",
          category: "needs_data",
          description: "RFP requires pricing but no budget information captured during intake",
          detail: text.slice(0, 100),
          uploadHint: "Enter pricing details in the proposal's intake data.",
          affectedSection: "pricing",
        });
      }
    }
  }

  // ── Compute summary ──────────────────────────────────────────────────────

  const readyCount = gaps.filter(g => g.category === "ready").length;
  const needsDataCount = gaps.filter(g => g.category === "needs_data").length;
  const cannotAddressCount = gaps.filter(g => g.category === "cannot_address").length;

  let status: PreflightResult["status"];
  if (needsDataCount === 0 && cannotAddressCount === 0) {
    status = "ready";
  } else if (cannotAddressCount > 0) {
    status = "cannot_address";
  } else {
    status = "needs_data";
  }

  return {
    status,
    gaps,
    summary: {
      evidenceCount,
      productCount,
      companyContextCount,
      requirementCount: safeRequirements.length,
      gapCount: gaps.length,
      readyCount,
      needsDataCount,
    },
  };
}
