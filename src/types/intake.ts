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

// ── RFP-Driven Section Requirements ─────────────────────────────────────────

/** Standard section types that match our SECTION_CONFIGS */
export type StandardSectionType =
  | "cover_letter"
  | "executive_summary"
  | "understanding"
  | "approach"
  | "methodology"
  | "team"
  | "case_studies"
  | "timeline"
  | "pricing"
  | "risk_mitigation"
  | "why_us"
  | "compliance_matrix_section"
  | "exceptions_terms";

/** A section requirement derived from RFP analysis */
export interface RfpSectionRequirement {
  /** Maps to one of our standard section types, or "custom" for RFP-specific sections */
  section_type: StandardSectionType | "custom";
  /** Human-readable title (uses our standard title, or the RFP's heading for custom sections) */
  title: string;
  /** Why this section is needed — references the specific RFP requirement */
  rationale: string;
  /** Whether the RFP explicitly requires this, or the AI recommends it to win */
  requirement_level: "mandatory" | "recommended" | "optional";
  /** Specific RFP requirements this section must address */
  rfp_requirements: string[];
  /** For custom sections: detailed description of what the section should contain */
  custom_description?: string;
}

/** Evaluation criterion extracted from the RFP */
export interface RfpEvaluationCriterion {
  /** Name of the criterion (e.g., "Technical Approach", "Past Performance") */
  name: string;
  /** Weight or points if specified (e.g., "30%", "300 points", or null if unspecified) */
  weight: string | null;
  /** Description of what evaluators are looking for */
  description: string;
  /** Which section type(s) should address this criterion */
  mapped_sections: string[];
}

/** RFP structural analysis — output of the extraction pipeline */
export interface RfpAnalysis {
  /** Ordered list of sections the proposal should contain */
  sections: RfpSectionRequirement[];
  /** Evaluation criteria with weights and section mappings */
  evaluation_criteria: RfpEvaluationCriterion[];
  /** Page/word limits if specified (e.g., "50 pages", "no limit") */
  page_limit: string | null;
  /** Submission format requirements (e.g., "separate technical and cost volumes") */
  submission_format: string | null;
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
    solicitation_type?: ExtractedField<string>;
  };

  // AI-inferred fields (not explicit in source)
  inferred: {
    client_size?: InferredField<string>;
    opportunity_type?: InferredField<string>;
    industry?: InferredField<string>;
    solicitation_type?: InferredField<string>;
  };

  // RFP structural analysis — sections, evaluation criteria, constraints
  // Present when input_type is "formal_rfp" or has enough structure to analyze
  rfp_analysis?: RfpAnalysis;

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

export type IntakeMode = "upload" | "paste" | "describe" | "manual" | "url";

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
