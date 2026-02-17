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

export const SECTION_CONFIGS: SectionConfig[] = [
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
