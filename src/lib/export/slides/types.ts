/**
 * Shared types for all export generators (PDF, HTML, DOCX, PPTX, Slides)
 */

export interface ProposalSection {
  title: string;
  content: string;
  section_type: string;
  diagram_image?: string | null;
}

export interface BrandingSettings {
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  header_text?: string;
  footer_text?: string;
}

export interface ProposalData {
  title: string;
  client_name: string;
  company_name?: string;
  date: string;
  sections: ProposalSection[];
  branding?: BrandingSettings;
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
