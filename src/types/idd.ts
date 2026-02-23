/**
 * IDD (Intent-Driven Development) Types for Proposal Generation
 *
 * Three-layer context model:
 *   L1 - Company Truth (canonical, locked)
 *   L2 - Proposal Intent (human-reviewed)
 *   L3 - Generated Content (AI-executed, verified)
 */

// ===========================================
// COMPANY INFO (for dynamic prompts)
// ===========================================

export interface CompanyInfo {
  name: string;
  description?: string;
  tagline?: string;
  industry?: string;
}

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

export interface TeamMemberProjectHistory {
  title: string;
  client_industry?: string;
  scope?: string;
  results?: string;
  dates?: string;
}

export interface TeamMember {
  id: string;
  organization_id?: string;
  name: string;
  role: string;
  title?: string;
  email?: string;
  skills: string[];
  certifications: string[];
  clearance_level?: string;
  years_experience?: number;
  project_history: TeamMemberProjectHistory[];
  resume_document_id?: string;
  bio?: string;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  created_at?: string;
  updated_at?: string;
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
  transformation: string;       // How the company bridges the gap
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

// Dead types removed during cleanup:
// VerificationLogEntry, VerificationSummary, CapabilityMapping,
// GenerationContext, GeneratedClaim, SectionGenerationResult,
// IntentInterviewStep, INTENT_INTERVIEW_STEPS
// — none were imported anywhere in the codebase.

// ===========================================
// RFP TASK STRUCTURE TYPES (re-exported from pipeline/types.ts)
// ===========================================

export {
  TASK_CATEGORIES,
  isValidRfpTask,
  isValidRfpTaskStructure,
} from "@/lib/ai/pipeline/types";

export type {
  TaskCategory,
  RfpTask,
  RfpTaskStructure,
} from "@/lib/ai/pipeline/types";
