import { buildExecutiveSummaryPrompt } from "../prompts/executive-summary";
import { buildUnderstandingPrompt } from "../prompts/understanding";
import { buildApproachPrompt } from "../prompts/approach";
import { buildMethodologyPrompt } from "../prompts/methodology";
import { buildTeamPrompt } from "../prompts/team";
import { buildCaseStudiesPrompt } from "../prompts/case-studies";
import { buildTimelinePrompt } from "../prompts/timeline";
import { buildPricingPrompt } from "../prompts/pricing";
import { buildRiskMitigationPrompt } from "../prompts/risk-mitigation";
import { buildWhyUsPrompt } from "../prompts/why-us";
import { buildCoverLetterPrompt } from "../prompts/cover-letter";
import { buildComplianceMatrixSectionPrompt } from "../prompts/compliance-matrix-section";
import { buildExceptionsTermsPrompt } from "../prompts/exceptions-terms";
import type { SectionConfig } from "./types";

/**
 * Helper: extract top win themes as search keywords.
 * Makes RAG retrieval context-aware instead of generic.
 */
function winThemeKeywords(
  winStrategy?: { win_themes?: string[] } | null,
): string {
  if (!winStrategy?.win_themes?.length) return "";
  return winStrategy.win_themes.slice(0, 2).join(" ");
}

/**
 * All possible section configurations.
 * Includes both the original 10 sections (order 1-10) and 3 boilerplate
 * sections (order 0, 11, 12) that are conditionally included based on
 * solicitation type.
 */
export const SECTION_CONFIGS: SectionConfig[] = [
  // ── Boilerplate: Cover Letter (order 0) ──────────────────────────────────
  {
    type: "cover_letter",
    title: "Cover Letter",
    order: 0,
    buildPrompt: buildCoverLetterPrompt,
    searchQuery: (d, ws) =>
      `cover letter ${d.client_industry} ${d.opportunity_type} ${winThemeKeywords(ws)} proposal introduction`,
  },

  // ── Original 10 sections (order 1-10) ────────────────────────────────────
  {
    type: "executive_summary",
    title: "Executive Summary",
    order: 1,
    buildPrompt: buildExecutiveSummaryPrompt,
    searchQuery: (d, ws) =>
      `executive summary ${d.opportunity_type} ${d.client_industry} ${winThemeKeywords(ws)} proposal overview`,
  },
  {
    type: "understanding",
    title: "Understanding of Client Needs",
    order: 2,
    buildPrompt: buildUnderstandingPrompt,
    searchQuery: (d, ws) =>
      `client needs ${d.client_industry} ${d.opportunity_type} ${winThemeKeywords(ws)} challenges pain points`,
  },
  {
    type: "approach",
    title: "Proposed Approach",
    order: 3,
    buildPrompt: buildApproachPrompt,
    searchQuery: (d, ws) =>
      `technical approach ${d.opportunity_type} ${d.client_industry} ${winThemeKeywords(ws)} methodology solution`,
  },
  {
    type: "methodology",
    title: "Methodology",
    order: 4,
    buildPrompt: buildMethodologyPrompt,
    searchQuery: (d, ws) =>
      `methodology framework ${d.opportunity_type} ${winThemeKeywords(ws)} delivery governance quality`,
  },
  {
    type: "team",
    title: "Proposed Team & Qualifications",
    order: 5,
    buildPrompt: buildTeamPrompt,
    searchQuery: (d, ws) =>
      `team qualifications certifications ${d.opportunity_type} ${d.client_industry} ${winThemeKeywords(ws)}`,
  },
  {
    type: "case_studies",
    title: "Relevant Experience & Case Studies",
    order: 6,
    buildPrompt: buildCaseStudiesPrompt,
    searchQuery: (d, ws) =>
      `case study ${d.client_industry} ${d.opportunity_type} ${winThemeKeywords(ws)} results outcomes metrics`,
  },
  {
    type: "timeline",
    title: "Timeline & Milestones",
    order: 7,
    buildPrompt: buildTimelinePrompt,
    searchQuery: (d, ws) =>
      `project timeline milestones ${d.opportunity_type} ${winThemeKeywords(ws)} delivery schedule phases`,
  },
  {
    type: "pricing",
    title: "Commercial Framework",
    order: 8,
    buildPrompt: buildPricingPrompt,
    searchQuery: (d, ws) =>
      `pricing commercial framework ${d.opportunity_type} ${winThemeKeywords(ws)} cost model value investment`,
  },
  {
    type: "risk_mitigation",
    title: "Risk Mitigation",
    order: 9,
    buildPrompt: buildRiskMitigationPrompt,
    searchQuery: (d, ws) =>
      `risk mitigation ${d.opportunity_type} ${d.client_industry} ${winThemeKeywords(ws)} governance compliance`,
  },
  {
    type: "why_us",
    title: "Why Us",
    order: 10,
    buildPrompt: buildWhyUsPrompt,
    searchQuery: (d, ws) =>
      `differentiators ${d.client_industry} ${d.opportunity_type} ${winThemeKeywords(ws)} capabilities partnerships unique value`,
  },

  // ── Boilerplate: Compliance Matrix (order 11) ────────────────────────────
  {
    type: "compliance_matrix_section",
    title: "Compliance Matrix",
    order: 11,
    buildPrompt: buildComplianceMatrixSectionPrompt,
    searchQuery: (d, ws) =>
      `compliance matrix requirements ${d.opportunity_type} ${d.client_industry} ${winThemeKeywords(ws)} cross-reference`,
  },

  // ── Boilerplate: Exceptions to Terms (order 12) ──────────────────────────
  {
    type: "exceptions_terms",
    title: "Exceptions to Terms & Conditions",
    order: 12,
    buildPrompt: buildExceptionsTermsPrompt,
    searchQuery: (d, ws) =>
      `exceptions terms conditions ${d.opportunity_type} ${winThemeKeywords(ws)} contract negotiation legal`,
  },
];

/** Boilerplate section types that are conditionally included */
const BOILERPLATE_TYPES = new Set([
  "cover_letter",
  "compliance_matrix_section",
  "exceptions_terms",
]);

/**
 * Mapping of solicitation type to which boilerplate sections to include.
 * - RFP: All 3 (cover letter + compliance matrix + exceptions)
 * - RFI: Cover letter only (capability showcase, no compliance needed)
 * - RFQ: Cover letter only (pricing-focused, minimal boilerplate)
 * - SOW: Cover letter + exceptions (contractual focus)
 * - Proactive: None (unsolicited, no compliance formality)
 */
const BOILERPLATE_BY_SOLICITATION: Record<string, Set<string>> = {
  RFP: new Set(["cover_letter", "compliance_matrix_section", "exceptions_terms"]),
  RFI: new Set(["cover_letter"]),
  RFQ: new Set(["cover_letter"]),
  SOW: new Set(["cover_letter", "exceptions_terms"]),
  Proactive: new Set(),
};

/**
 * Returns the section configs appropriate for a given solicitation type.
 * Filters boilerplate sections based on solicitation type rules.
 * Results are sorted by order.
 */
export function getSectionsForSolicitationType(
  solicitationType: string,
): SectionConfig[] {
  // Look up which boilerplate sections this solicitation type needs
  // Default: cover letter only (safe fallback for unknown types)
  const enabledBoilerplate = BOILERPLATE_BY_SOLICITATION[solicitationType]
    ?? new Set(["cover_letter"]);

  return SECTION_CONFIGS.filter((config) => {
    // Always include non-boilerplate sections
    if (!BOILERPLATE_TYPES.has(config.type)) return true;
    // Include boilerplate only if enabled for this solicitation type
    return enabledBoilerplate.has(config.type);
  }).sort((a, b) => a.order - b.order);
}
