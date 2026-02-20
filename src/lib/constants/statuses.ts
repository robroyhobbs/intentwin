/**
 * Centralized status constants for all domain entities.
 *
 * Each group exports:
 *   - A const object with individual status values (e.g. ProposalStatus.DRAFT)
 *   - A union type derived from the object (e.g. ProposalStatusType)
 *   - An array of all valid values for validation (e.g. PROPOSAL_STATUSES)
 *
 * Usage:
 *   import { ProposalStatus, GenerationStatus } from "@/lib/constants/statuses";
 *   .eq("status", ProposalStatus.GENERATING)
 *   .update({ generation_status: GenerationStatus.COMPLETED })
 */

// ============================================
// Proposal Status
// ============================================

export const ProposalStatus = {
  DRAFT: "draft",
  INTAKE: "intake",
  GENERATING: "generating",
  REVIEW: "review",
  FINAL: "final",
  EXPORTED: "exported",
} as const;

export type ProposalStatusType = (typeof ProposalStatus)[keyof typeof ProposalStatus];
export const PROPOSAL_STATUSES = Object.values(ProposalStatus);

// ============================================
// Section Generation Status
// ============================================

export const GenerationStatus = {
  PENDING: "pending",
  GENERATING: "generating",
  COMPLETED: "completed",
  FAILED: "failed",
  REGENERATING: "regenerating",
} as const;

export type GenerationStatusType = (typeof GenerationStatus)[keyof typeof GenerationStatus];
export const GENERATION_STATUSES = Object.values(GenerationStatus);

// ============================================
// Section Review Status
// ============================================

export const SectionReviewStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  NEEDS_REVISION: "needs_revision",
  SKIPPED: "skipped",
} as const;

export type SectionReviewStatusType = (typeof SectionReviewStatus)[keyof typeof SectionReviewStatus];
export const SECTION_REVIEW_STATUSES = Object.values(SectionReviewStatus);

// ============================================
// Intent Status
// ============================================

export const IntentStatus = {
  DRAFT: "draft",
  PENDING_REVIEW: "pending_review",
  APPROVED: "approved",
  LOCKED: "locked",
} as const;

export type IntentStatusType = (typeof IntentStatus)[keyof typeof IntentStatus];
export const INTENT_STATUSES = Object.values(IntentStatus);

// ============================================
// Document Processing Status
// ============================================

export const ProcessingStatus = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export type ProcessingStatusType = (typeof ProcessingStatus)[keyof typeof ProcessingStatus];
export const PROCESSING_STATUSES = Object.values(ProcessingStatus);

// ============================================
// Deal Outcome
// ============================================

export const DealOutcome = {
  PENDING: "pending",
  WON: "won",
  LOST: "lost",
  NO_DECISION: "no_decision",
  WITHDRAWN: "withdrawn",
} as const;

export type DealOutcomeType = (typeof DealOutcome)[keyof typeof DealOutcome];
export const DEAL_OUTCOMES = Object.values(DealOutcome);

// ============================================
// Quality Review Status
// ============================================

export const QualityReviewStatus = {
  REVIEWING: "reviewing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export type QualityReviewStatusType = (typeof QualityReviewStatus)[keyof typeof QualityReviewStatus];
export const QUALITY_REVIEW_STATUSES = Object.values(QualityReviewStatus);

// ============================================
// Compliance Status
// ============================================

export const ComplianceStatus = {
  MET: "met",
  PARTIALLY_MET: "partially_met",
  NOT_ADDRESSED: "not_addressed",
  NOT_APPLICABLE: "not_applicable",
} as const;

export type ComplianceStatusType = (typeof ComplianceStatus)[keyof typeof ComplianceStatus];
export const COMPLIANCE_STATUSES = Object.values(ComplianceStatus);

// ============================================
// Review Stage Status (Color Team)
// ============================================

export const ReviewStageStatus = {
  PENDING: "pending",
  ACTIVE: "active",
  COMPLETED: "completed",
  SKIPPED: "skipped",
} as const;

export type ReviewStageStatusType = (typeof ReviewStageStatus)[keyof typeof ReviewStageStatus];
export const REVIEW_STAGE_STATUSES = Object.values(ReviewStageStatus);

// ============================================
// Annotation Type
// ============================================

export const AnnotationType = {
  COMMENT: "comment",
  SUGGESTION: "suggestion",
  APPROVAL: "approval",
  REJECTION: "rejection",
} as const;

export type AnnotationTypeValue = (typeof AnnotationType)[keyof typeof AnnotationType];
export const ANNOTATION_TYPES = Object.values(AnnotationType);

// ============================================
// Annotation Review Status
// ============================================

export const ReviewStatus = {
  OPEN: "open",
  RESOLVED: "resolved",
  DISMISSED: "dismissed",
} as const;

export type ReviewStatusType = (typeof ReviewStatus)[keyof typeof ReviewStatus];
export const REVIEW_STATUSES = Object.values(ReviewStatus);

// ============================================
// Waitlist Status
// ============================================

export const WaitlistStatus = {
  PENDING: "pending",
  CONTACTED: "contacted",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export type WaitlistStatusType = (typeof WaitlistStatus)[keyof typeof WaitlistStatus];
export const WAITLIST_STATUSES = Object.values(WaitlistStatus);

// ============================================
// Stage Reviewer Status
// ============================================

export const StageReviewerStatus = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
} as const;

export type StageReviewerStatusType = (typeof StageReviewerStatus)[keyof typeof StageReviewerStatus];
export const STAGE_REVIEWER_STATUSES = Object.values(StageReviewerStatus);

// ============================================
// Compliance Assessment Status
// ============================================

export const ComplianceAssessmentStatus = {
  ASSESSING: "assessing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export type ComplianceAssessmentStatusType = (typeof ComplianceAssessmentStatus)[keyof typeof ComplianceAssessmentStatus];
export const COMPLIANCE_ASSESSMENT_STATUSES = Object.values(ComplianceAssessmentStatus);
