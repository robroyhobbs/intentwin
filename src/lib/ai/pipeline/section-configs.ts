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

export const SECTION_CONFIGS: SectionConfig[] = [
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
];
