-- =============================================================================
-- PROPOSAL DOCUMENTS: Multi-Document Support for Proposals
-- =============================================================================
-- Enables proposals to reference multiple source documents (RFP, amendments,
-- attachments, Q&A addenda, etc.) with role classification and extraction tracking.
--
-- Replaces the single rfp_document_id FK on proposals with a proper junction table.
-- =============================================================================

-- 1. Junction table: proposal <-> document (many-to-many with metadata)
CREATE TABLE IF NOT EXISTS public.proposal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Role classification: what kind of document is this in the proposal context?
  document_role text NOT NULL DEFAULT 'supplemental'
    CHECK (document_role IN (
      'primary_rfp',        -- The main solicitation document
      'amendment',          -- RFP amendment/modification (overrides primary)
      'attachment',         -- Referenced attachment (SOW, specs, etc.)
      'qa_addendum',        -- Q&A responses from issuing agency
      'incumbent_info',     -- Incumbent/background information
      'evaluation_criteria',-- Separate scoring rubric or eval criteria
      'template',           -- Required response template/format
      'supplemental'        -- Catch-all for other supporting docs
    )),

  -- Ordering & metadata
  upload_order integer NOT NULL DEFAULT 0,
  added_at timestamptz NOT NULL DEFAULT now(),
  added_by uuid REFERENCES auth.users(id),
  notes text,                       -- User annotation ("Amendment 3 - revised timeline")

  -- Extraction tracking per document
  extraction_status text NOT NULL DEFAULT 'pending'
    CHECK (extraction_status IN (
      'pending',    -- Not yet extracted
      'extracted',  -- Extraction complete, awaiting merge
      'merged',     -- Extraction merged into proposal data
      'skipped'     -- User chose to skip extraction
    )),
  extracted_at timestamptz,

  -- Prevent duplicate associations
  UNIQUE(proposal_id, document_id)
);

-- 2. Event log: audit trail for document lifecycle on a proposal
CREATE TABLE IF NOT EXISTS public.proposal_document_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  event_type text NOT NULL CHECK (event_type IN (
    'added',       -- Document associated with proposal
    'extracted',   -- Requirements/intake extracted from this document
    'merged',      -- Extraction results merged into proposal
    'superseded',  -- Document superseded by a newer version (e.g., amendment)
    'removed'      -- Document disassociated from proposal
  )),
  event_data jsonb DEFAULT '{}',   -- Context: { new_requirements_count, updated_fields, etc. }
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- 3. Add source_document_id to proposal_requirements for provenance tracking
ALTER TABLE public.proposal_requirements
  ADD COLUMN IF NOT EXISTS source_document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL;

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_proposal_documents_proposal
  ON public.proposal_documents(proposal_id);

CREATE INDEX IF NOT EXISTS idx_proposal_documents_document
  ON public.proposal_documents(document_id);

CREATE INDEX IF NOT EXISTS idx_proposal_documents_org
  ON public.proposal_documents(organization_id);

CREATE INDEX IF NOT EXISTS idx_proposal_documents_role
  ON public.proposal_documents(proposal_id, document_role);

CREATE INDEX IF NOT EXISTS idx_proposal_document_events_proposal
  ON public.proposal_document_events(proposal_id);

CREATE INDEX IF NOT EXISTS idx_proposal_document_events_document
  ON public.proposal_document_events(document_id);

CREATE INDEX IF NOT EXISTS idx_proposal_requirements_source_doc
  ON public.proposal_requirements(source_document_id);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE public.proposal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_document_events ENABLE ROW LEVEL SECURITY;

-- proposal_documents: org-scoped CRUD
CREATE POLICY "proposal_documents_select_own_org"
  ON public.proposal_documents
  FOR SELECT TO authenticated
  USING (
    organization_id = (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "proposal_documents_insert_own_org"
  ON public.proposal_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "proposal_documents_update_own_org"
  ON public.proposal_documents
  FOR UPDATE TO authenticated
  USING (
    organization_id = (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "proposal_documents_delete_own_org"
  ON public.proposal_documents
  FOR DELETE TO authenticated
  USING (
    organization_id = (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- proposal_document_events: org-scoped read + insert only
CREATE POLICY "proposal_document_events_select_own_org"
  ON public.proposal_document_events
  FOR SELECT TO authenticated
  USING (
    organization_id = (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "proposal_document_events_insert_own_org"
  ON public.proposal_document_events
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- =============================================================================
-- DATA MIGRATION: Move existing rfp_document_id into proposal_documents
-- =============================================================================

-- For every proposal that has an rfp_document_id set, create a proposal_documents
-- row with role 'primary_rfp' and extraction_status 'merged' (since data was
-- already used during initial intake).
INSERT INTO public.proposal_documents (
  proposal_id,
  document_id,
  organization_id,
  document_role,
  upload_order,
  added_at,
  added_by,
  extraction_status,
  extracted_at
)
SELECT
  p.id AS proposal_id,
  p.rfp_document_id AS document_id,
  p.organization_id,
  'primary_rfp' AS document_role,
  0 AS upload_order,
  p.created_at AS added_at,
  p.created_by AS added_by,
  'merged' AS extraction_status,
  p.created_at AS extracted_at
FROM public.proposals p
WHERE p.rfp_document_id IS NOT NULL
  AND p.organization_id IS NOT NULL
ON CONFLICT (proposal_id, document_id) DO NOTHING;

-- Mark rfp_document_id as deprecated (do NOT drop -- backwards compat)
COMMENT ON COLUMN public.proposals.rfp_document_id IS
  'DEPRECATED: Use proposal_documents junction table instead. Will be removed in a future migration.';
