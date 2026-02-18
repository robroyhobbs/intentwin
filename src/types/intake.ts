// Flexible Intake Types
// Supports extraction from RFPs, emails, notes, verbal descriptions

export interface ExtractedField<T> {
  value: T;
  confidence: number; // 0.0 - 1.0
  source: string; // Quote or reference from input
  source_document_id?: string; // Which document this was extracted from
  source_document_name?: string; // Human-readable document filename
}

export interface InferredField<T> {
  value: T;
  reasoning: string;
}

export interface IntakeGap {
  field: string;
  importance: "critical" | "helpful" | "nice_to_have";
  suggested_question?: string;
}

export interface ExtractedIntake {
  // Input classification
  input_type:
    | "formal_rfp"
    | "email"
    | "meeting_notes"
    | "brief"
    | "verbal"
    | "other";
  input_summary: string; // 2-3 sentence summary of what was provided

  // Extracted fields with confidence
  extracted: {
    client_name?: ExtractedField<string>;
    client_industry?: ExtractedField<string>;
    client_size?: ExtractedField<string>;
    opportunity_type?: ExtractedField<string>;
    scope_description?: ExtractedField<string>;
    key_requirements?: ExtractedField<string[]>;
    budget_range?: ExtractedField<string>;
    timeline?: ExtractedField<string>;
    decision_criteria?: ExtractedField<string[]>;
    technical_environment?: ExtractedField<string>;
    compliance_requirements?: ExtractedField<string[]>;
    current_state_pains?: ExtractedField<string[]>;
    desired_outcomes?: ExtractedField<string[]>;
  };

  // AI-inferred fields (not explicit in source)
  inferred: {
    client_size?: InferredField<string>;
    opportunity_type?: InferredField<string>;
    industry?: InferredField<string>;
  };

  // Missing critical info
  gaps: IntakeGap[];

  // Raw source for reference
  source_documents?: { id: string; name: string; type: string }[];
  source_text?: string;
}

export interface ClientResearchNews {
  headline: string;
  date: string;
  summary: string;
  relevance: string;
}

export interface ClientResearchExecutive {
  name: string;
  title: string;
}

export interface ClientResearchSource {
  title: string;
  url: string;
}

export interface ClientResearch {
  company_overview: string;
  industry: string;
  size_estimate: string;
  headquarters: string;

  recent_news: ClientResearchNews[];
  strategic_priorities: string[];
  technology_stack: string[];
  key_executives: ClientResearchExecutive[];

  competitive_landscape: string;
  industry_trends: string[];

  recommended_angles: string[]; // How to position for this client

  sources: ClientResearchSource[];
  researched_at: string;
}

export type IntakeMode = "upload" | "paste" | "describe" | "manual";

export interface IntakeState {
  mode: IntakeMode | null;
  files: File[];
  pastedContent: string;
  verbalDescription: string;
  researchEnabled: boolean;
  extractedData: ExtractedIntake | null;
  researchData: ClientResearch | null;
  isExtracting: boolean;
  isResearching: boolean;
  extractionError: string | null;
  researchError: string | null;
}
