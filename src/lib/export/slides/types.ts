/**
 * Shared types for the cinematic slide generator
 */

export interface ProposalSection {
  title: string;
  content: string;
  section_type: string;
}

export interface ProposalData {
  title: string;
  client_name: string;
  company_name?: string;
  date: string;
  sections: ProposalSection[];
}

export interface SlideContent {
  type:
    | "hero"
    | "executive"
    | "understanding"
    | "challenge"
    | "solution"
    | "approach"
    | "methodology"
    | "team"
    | "case_study"
    | "timeline"
    | "investment"
    | "risk"
    | "metrics"
    | "differentiator"
    | "closing";
  title: string;
  subtitle?: string;
  items?: string[];
  metrics?: { value: string; label: string; description?: string }[];
  quote?: string;
  phases?: { name: string; description: string }[];
  caseStudyNumber?: number;
}
