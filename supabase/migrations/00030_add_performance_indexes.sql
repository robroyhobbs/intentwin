-- Performance Optimization: Add indexes for common query patterns
-- Phase 6.2 of robustness improvement plan
--
-- These indexes address the most frequent query patterns identified
-- in the API routes and pipeline code. They use CREATE INDEX IF NOT EXISTS
-- to be idempotent and safe to re-run.

-- ═══════════════════════════════════════════════════════════════════════════
-- PROPOSALS: Frequently filtered by organization + status
-- Used by: GET /api/proposals (list), dashboard views, analytics
-- ═══════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_proposals_org_status
  ON proposals (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_proposals_org_created
  ON proposals (organization_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- PROPOSAL_SECTIONS: Always queried by proposal_id
-- Used by: Section generation, editing, export, quality review
-- ═══════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_proposal_sections_proposal
  ON proposal_sections (proposal_id, section_order);

CREATE INDEX IF NOT EXISTS idx_proposal_sections_status
  ON proposal_sections (proposal_id, generation_status);

-- ═══════════════════════════════════════════════════════════════════════════
-- DOCUMENTS: Knowledge base queries filtered by org + type/status
-- Used by: Document list, upload processing, RAG retrieval
-- ═══════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_documents_org_type
  ON documents (organization_id, document_type);

CREATE INDEX IF NOT EXISTS idx_documents_org_status
  ON documents (organization_id, processing_status);

-- ═══════════════════════════════════════════════════════════════════════════
-- DOCUMENT_CHUNKS: Vector search + document filtering
-- Used by: RAG retrieval in pipeline, match_document_chunks RPC
-- Note: The vector similarity search uses its own ivfflat/hnsw index
-- (created in 00003). This index helps the post-filter step.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_document_chunks_document
  ON document_chunks (document_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION_SOURCES: Claim traceability lookups
-- Used by: Source reference display, evidence verification
-- ═══════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_section_sources_section
  ON section_sources (section_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- EVIDENCE_LIBRARY: Filtered by org + service line + verification status
-- Used by: L1 context fetch in pipeline
-- ═══════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_evidence_library_org_verified
  ON evidence_library (organization_id, is_verified)
  WHERE is_verified = true;

-- ═══════════════════════════════════════════════════════════════════════════
-- COMPANY_CONTEXT: L1 context lookups by org + category
-- Used by: fetchL1Context in pipeline
-- ═══════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_company_context_org_category
  ON company_context (organization_id, category);

-- ═══════════════════════════════════════════════════════════════════════════
-- PRODUCT_CONTEXTS: Filtered by org + service_line
-- Used by: L1 context fetch, product capabilities display
-- ═══════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_product_contexts_org_service
  ON product_contexts (organization_id, service_line);

-- ═══════════════════════════════════════════════════════════════════════════
-- PROFILES: User lookup by organization
-- Used by: Team management, access control
-- ═══════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_profiles_org
  ON profiles (organization_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- PROPOSAL_VERSIONS: Version history lookups
-- Used by: Version comparison, audit trail
-- ═══════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_proposal_versions_proposal
  ON proposal_versions (proposal_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- DEAL_OUTCOMES: Analytics queries
-- Used by: Win/loss analytics dashboard
-- ═══════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_deal_outcomes_org
  ON deal_outcomes (organization_id, created_at DESC);
