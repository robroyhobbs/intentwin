/**
 * Proposal Documents Types
 *
 * Types for multi-document support on proposals.
 * A proposal can reference N documents, each with a role classification,
 * extraction status, and audit trail.
 */

// -----------------------------------------------------------------------------
// Document Roles
// -----------------------------------------------------------------------------

export const DOCUMENT_ROLES = [
  "primary_rfp",
  "amendment",
  "attachment",
  "qa_addendum",
  "incumbent_info",
  "evaluation_criteria",
  "template",
  "supplemental",
] as const;

export type DocumentRole = (typeof DOCUMENT_ROLES)[number];

export const DOCUMENT_ROLE_LABELS: Record<DocumentRole, string> = {
  primary_rfp: "Primary RFP",
  amendment: "Amendment",
  attachment: "Attachment",
  qa_addendum: "Q&A Addendum",
  incumbent_info: "Incumbent Info",
  evaluation_criteria: "Evaluation Criteria",
  template: "Response Template",
  supplemental: "Supplemental",
};

export const DOCUMENT_ROLE_DESCRIPTIONS: Record<DocumentRole, string> = {
  primary_rfp: "The main solicitation document",
  amendment: "RFP amendment or modification (overrides primary)",
  attachment: "Referenced attachment (SOW, specs, etc.)",
  qa_addendum: "Q&A responses from the issuing agency",
  incumbent_info: "Incumbent or background information",
  evaluation_criteria: "Separate scoring rubric or evaluation criteria",
  template: "Required response template or format",
  supplemental: "Other supporting documentation",
};

// -----------------------------------------------------------------------------
// Extraction Status
// -----------------------------------------------------------------------------

export const EXTRACTION_STATUSES = [
  "pending",
  "extracted",
  "merged",
  "skipped",
] as const;

export type ExtractionStatus = (typeof EXTRACTION_STATUSES)[number];

// -----------------------------------------------------------------------------
// Proposal Document (junction table row)
// -----------------------------------------------------------------------------

export interface ProposalDocument {
  id: string;
  proposal_id: string;
  document_id: string;
  organization_id: string;
  document_role: DocumentRole;
  upload_order: number;
  added_at: string;
  added_by: string | null;
  notes: string | null;
  extraction_status: ExtractionStatus;
  extracted_at: string | null;
}

/** ProposalDocument with joined document metadata */
export interface ProposalDocumentWithMeta extends ProposalDocument {
  document: {
    id: string;
    title: string | null;
    file_name: string;
    file_type: string;
    file_size_bytes: number | null;
    processing_status: string;
    chunk_count: number | null;
  };
}

// -----------------------------------------------------------------------------
// Document Events (audit trail)
// -----------------------------------------------------------------------------

export const DOCUMENT_EVENT_TYPES = [
  "added",
  "extracted",
  "merged",
  "superseded",
  "removed",
] as const;

export type DocumentEventType = (typeof DOCUMENT_EVENT_TYPES)[number];

export interface ProposalDocumentEvent {
  id: string;
  proposal_id: string;
  document_id: string;
  organization_id: string;
  event_type: DocumentEventType;
  event_data: Record<string, unknown>;
  created_at: string;
  created_by: string | null;
}

// -----------------------------------------------------------------------------
// API Request/Response Types
// -----------------------------------------------------------------------------

/** POST /api/proposals/[id]/documents */
export interface AddDocumentRequest {
  document_id: string;
  document_role: DocumentRole;
  notes?: string;
  trigger_extraction?: boolean;
}

export interface AddDocumentResponse {
  proposal_document: ProposalDocument;
  event: ProposalDocumentEvent | null;
}

/** PATCH /api/proposals/[id]/documents/[docId] */
export interface UpdateDocumentRequest {
  document_role?: DocumentRole;
  notes?: string;
  extraction_status?: ExtractionStatus;
}

/** GET /api/proposals/[id]/documents */
export interface ListDocumentsResponse {
  documents: ProposalDocumentWithMeta[];
  count: number;
}

// -----------------------------------------------------------------------------
// Incremental Extraction Types
// -----------------------------------------------------------------------------

/** Result of extracting from a single new document */
export interface IncrementalExtractionResult {
  /** Requirements not found in existing set */
  new_requirements: IncrementalRequirement[];
  /** Existing requirements with updated wording from new doc */
  updated_requirements: UpdatedRequirement[];
  /** New intake fields discovered */
  new_intake_fields: Record<string, unknown>;
  /** Intake fields that differ from current proposal data */
  updated_intake_fields: IntakeFieldDiff[];
  /** Section types that may need regeneration */
  affected_sections: string[];
  /** Source document info */
  source_document: {
    id: string;
    file_name: string;
    document_role: DocumentRole;
  };
}

export interface IncrementalRequirement {
  temp_id: string; // Client-side tracking ID
  requirement_text: string;
  source_reference: string | null;
  category: "mandatory" | "desirable" | "informational";
  suggested_sections: string[];
  source_document_id: string;
}

export interface UpdatedRequirement {
  existing_id: string;
  existing_text: string;
  updated_text: string;
  similarity: number;
  source_document_id: string;
}

export interface IntakeFieldDiff {
  field: string;
  current_value: unknown;
  new_value: unknown;
  source_document_id: string;
  source_document_name: string;
}

/** POST /api/proposals/[id]/documents/[docId]/merge */
export interface MergeRequest {
  /** temp_ids of new requirements to include */
  approved_new_requirements: string[];
  /** existing_ids of requirements to update with new wording */
  approved_updated_requirements: string[];
  /** Field names to update in intake_data */
  approved_intake_changes: string[];
  /** Section types to flag for regeneration */
  regenerate_sections: string[];
}

export interface MergeResponse {
  requirements_added: number;
  requirements_updated: number;
  intake_fields_updated: string[];
  sections_flagged: string[];
  event: ProposalDocumentEvent | null;
}

// -----------------------------------------------------------------------------
// Document Role Auto-Detection
// -----------------------------------------------------------------------------

export interface RoleDetectionResult {
  document_id: string;
  file_name: string;
  suggested_role: DocumentRole;
  confidence: number;
  reasoning: string;
}

// Max documents per proposal
export const MAX_DOCUMENTS_PER_PROPOSAL = 20;
