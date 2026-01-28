/**
 * IDD (Intent-Driven Development) Types for Proposal Generation
 *
 * Three-layer context model:
 *   L1 - Company Truth (canonical, locked)
 *   L2 - Proposal Intent (human-reviewed)
 *   L3 - Generated Content (AI-executed, verified)
 */

// ===========================================
// L1: COMPANY TRUTH TYPES
// ===========================================

export interface CompanyContext {
  id: string;
  category: "brand" | "values" | "certifications" | "legal" | "partnerships";
  key: string;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
  is_locked: boolean;
  lock_reason?: string;
  last_verified_at?: string;
  verified_by?: string;
}

export interface ProductCapability {
  name: string;
  description: string;
  outcomes: OutcomeCategory[];
}

export interface PricingModel {
  model: string;
  description: string;
  best_for: string;
}

export interface ProductContext {
  id: string;
  product_name: string;
  service_line: string;
  description: string;
  capabilities: ProductCapability[];
  specifications: Record<string, unknown>;
  pricing_models: PricingModel[];
  constraints: {
    minimum_engagement?: string;
    team_size?: string;
    not_suitable_for?: string[];
  };
  supported_outcomes: OutcomeCategory[];
  is_locked: boolean;
  lock_reason?: string;
}

export interface OutcomeDemonstrated {
  outcome: OutcomeCategory;
  description: string;
}

export interface EvidenceMetric {
  name: string;
  value: string;
  context: string;
}

export interface EvidenceLibraryEntry {
  id: string;
  evidence_type: "case_study" | "metric" | "testimonial" | "certification" | "award";
  title: string;
  summary: string;
  full_content: string;
  client_industry?: string;
  service_line?: string;
  client_size?: "enterprise" | "mid_market" | "smb";
  outcomes_demonstrated: OutcomeDemonstrated[];
  metrics: EvidenceMetric[];
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  verification_notes?: string;
}

// ===========================================
// L2: PROPOSAL INTENT TYPES
// ===========================================

export type OutcomeCategory =
  | "cost_optimization"
  | "speed_to_value"
  | "quality_improvement"
  | "risk_reduction"
  | "innovation"
  | "compliance";

export const OUTCOME_LABELS: Record<OutcomeCategory, string> = {
  cost_optimization: "Cost Optimization",
  speed_to_value: "Speed to Value",
  quality_improvement: "Quality Improvement",
  risk_reduction: "Risk Reduction",
  innovation: "Innovation",
  compliance: "Compliance",
};

export interface SuccessMetric {
  outcome: string;
  metric: string;
  target: string;
  measurement_method: string;
}

export interface OutcomeContract {
  current_state: string[];      // Pain points, challenges
  desired_state: string[];      // Desired outcomes
  transformation: string;       // How Capgemini bridges the gap
  success_metrics: SuccessMetric[];
}

export interface IntentConstraints {
  must_include: string[];       // Required elements
  must_avoid: string[];         // Prohibited content
  budget_range?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  timeline?: {
    start?: string;
    end?: string;
    milestones?: string[];
  };
}

export type IntentStatus = "draft" | "pending_review" | "approved" | "locked";

export interface ProposalIntent {
  outcome_contract: OutcomeContract;
  constraints: IntentConstraints;
  intent_status: IntentStatus;
  intent_approved_by?: string;
  intent_approved_at?: string;
  intent_notes?: string;
}

// ===========================================
// L3: VERIFICATION & TRACKING TYPES
// ===========================================

export type ClaimVerificationStatus =
  | "verified"
  | "unverified"
  | "flagged"
  | "approved_unverified";

export interface SectionClaim {
  id: string;
  section_id: string;
  claim_text: string;
  claim_type?: "capability" | "metric" | "experience" | "certification" | "methodology";
  evidence_id?: string;
  product_context_id?: string;
  company_context_id?: string;
  verification_status: ClaimVerificationStatus;
  flagged_reason?: string;
  verified_by?: string;
  verified_at?: string;
  start_offset?: number;
  end_offset?: number;
}

export interface SectionOutcomeMapping {
  id: string;
  section_id: string;
  outcome_key: string;
  outcome_description?: string;
  relevance_score: number;       // 0-1
  relevance_explanation?: string;
  is_confirmed: boolean;
  confirmed_by?: string;
}

export interface VerificationLogEntry {
  id: string;
  proposal_id: string;
  verification_type: "intent_approval" | "claim_verification" | "outcome_mapping" | "constraint_check";
  target_type?: "proposal" | "section" | "claim";
  target_id?: string;
  status: "passed" | "failed" | "warning" | "skipped";
  message?: string;
  details?: Record<string, unknown>;
  performed_by?: string;
  is_automated: boolean;
  created_at: string;
}

export interface VerificationSummary {
  total_claims: number;
  verified_claims: number;
  flagged_claims: number;
  unverified_claims: number;
  outcomes_mapped: number;
  intent_status: IntentStatus;
  verification_score: number;    // 0-100
}

// ===========================================
// GENERATION PIPELINE TYPES
// ===========================================

export interface CapabilityMapping {
  outcome: string;
  relevant_capabilities: {
    product_context_id: string;
    product_name: string;
    capability: ProductCapability;
    relevance: number;
  }[];
  supporting_evidence: {
    evidence_id: string;
    title: string;
    metrics: EvidenceMetric[];
    relevance: number;
  }[];
  gaps: string[];               // Outcomes without strong evidence
}

export interface GenerationContext {
  // From L1
  company_context: CompanyContext[];
  relevant_products: ProductContext[];
  relevant_evidence: EvidenceLibraryEntry[];

  // From L2
  outcome_contract: OutcomeContract;
  win_strategy: {
    win_themes: string[];
    differentiators: string[];
    competitive_positioning?: string;
    proof_points?: string[];
  };
  constraints: IntentConstraints;

  // Mapping
  capability_mapping: CapabilityMapping[];
}

export interface GeneratedClaim {
  text: string;
  type: SectionClaim["claim_type"];
  suggested_evidence_id?: string;
  confidence: number;            // 0-1
  needs_verification: boolean;
}

export interface SectionGenerationResult {
  content: string;
  claims: GeneratedClaim[];
  outcomes_served: string[];
  context_used: string[];        // IDs of evidence/context used
}

// ===========================================
// INTENT INTERVIEW TYPES
// ===========================================

export interface IntentInterviewStep {
  step: number;
  category: "outcomes" | "constraints" | "win_strategy" | "verification";
  question: string;
  field: string;
  input_type: "text" | "textarea" | "multi_select" | "metrics_builder";
  options?: string[];
  required: boolean;
  help_text?: string;
}

export const INTENT_INTERVIEW_STEPS: IntentInterviewStep[] = [
  // Outcomes
  {
    step: 1,
    category: "outcomes",
    question: "What is your client struggling with today? (Current state pain points)",
    field: "outcome_contract.current_state",
    input_type: "textarea",
    required: true,
    help_text: "List the key challenges, limitations, or pain points the client faces.",
  },
  {
    step: 2,
    category: "outcomes",
    question: "What specific outcomes does your client want to achieve? (Desired state)",
    field: "outcome_contract.desired_state",
    input_type: "textarea",
    required: true,
    help_text: "Be specific - 'reduce costs' becomes '40% reduction in infrastructure spend'.",
  },
  {
    step: 3,
    category: "outcomes",
    question: "How will success be measured? Define specific metrics.",
    field: "outcome_contract.success_metrics",
    input_type: "metrics_builder",
    required: true,
    help_text: "Each outcome should have a measurable target and method.",
  },
  // Constraints
  {
    step: 4,
    category: "constraints",
    question: "What must the proposal include? (Required elements)",
    field: "constraints.must_include",
    input_type: "textarea",
    required: false,
    help_text: "Certifications, specific capabilities, compliance requirements, etc.",
  },
  {
    step: 5,
    category: "constraints",
    question: "What must the proposal avoid? (Prohibited content)",
    field: "constraints.must_avoid",
    input_type: "textarea",
    required: false,
    help_text: "Competitor mentions, sensitive topics, unrealistic claims, etc.",
  },
  // Win Strategy
  {
    step: 6,
    category: "win_strategy",
    question: "What are your 2-3 win themes for this opportunity?",
    field: "win_strategy.win_themes",
    input_type: "textarea",
    required: true,
    help_text: "Themes that resonate with this specific client's priorities.",
  },
  {
    step: 7,
    category: "win_strategy",
    question: "What makes Capgemini uniquely qualified for this work?",
    field: "win_strategy.differentiators",
    input_type: "textarea",
    required: true,
    help_text: "Specific differentiators vs competitors for this opportunity.",
  },
  // Verification
  {
    step: 8,
    category: "verification",
    question: "Review your Intent. Is this ready for proposal generation?",
    field: "intent_status",
    input_type: "multi_select",
    options: ["Approve and generate", "Save as draft", "Need more input"],
    required: true,
    help_text: "Once approved, the Intent becomes the source of truth for generation.",
  },
];
