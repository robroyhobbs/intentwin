-- ============================================================
-- Migration 00045: Fix RLS Organization Scoping
-- ============================================================
-- Comprehensive fix for all RLS policies that still reference team_id,
-- lack organization_id checks, or have overly permissive access.
--
-- Categories:
--   1. Replace team_id-based policies with organization_id
--   2. Fix missing org checks on writes
--   3. Fix wide-open policies (proposal_reviews)
--   4. Fix RPC NULL bypass on search functions
--   5. Fix overly restrictive policies (versions)
--   6. Fix storage policies
-- ============================================================

BEGIN;

-- ============================================================
-- CATEGORY 1: Replace team_id-based policies with organization_id
-- ============================================================

-- -----------------------------------------------
-- PROPOSALS: UPDATE, DELETE, INSERT
-- -----------------------------------------------

-- Fix proposals UPDATE: was using team_id for role check
DROP POLICY IF EXISTS "proposals_update" ON public.proposals;
CREATE POLICY "proposals_update_org" ON public.proposals
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT p.organization_id FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('admin', 'manager')
    )
    OR created_by = (SELECT auth.uid())
  );

-- Fix proposals DELETE: was using team_id and global admin check
DROP POLICY IF EXISTS "proposals_delete" ON public.proposals;
CREATE POLICY "proposals_delete_org" ON public.proposals
  FOR DELETE TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    OR organization_id IN (
      SELECT p.organization_id FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
    )
  );

-- Fix proposals INSERT: was only checking created_by, no org check
DROP POLICY IF EXISTS "proposals_insert" ON public.proposals;
CREATE POLICY "proposals_insert_org" ON public.proposals
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND organization_id IN (
      SELECT p.organization_id FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
    )
  );

-- -----------------------------------------------
-- PROPOSAL_SECTIONS: SELECT, UPDATE
-- -----------------------------------------------

-- Fix sections SELECT: was using team_id
DROP POLICY IF EXISTS "sections_select" ON public.proposal_sections;
CREATE POLICY "sections_select_org" ON public.proposal_sections
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.proposals pr
      WHERE pr.id = proposal_id
      AND pr.organization_id IN (
        SELECT p.organization_id FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
      )
    )
  );

-- Fix sections UPDATE: was using team_id
DROP POLICY IF EXISTS "sections_update" ON public.proposal_sections;
CREATE POLICY "sections_update_org" ON public.proposal_sections
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.proposals pr
      WHERE pr.id = proposal_id
      AND pr.organization_id IN (
        SELECT p.organization_id FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
      )
    )
  );

-- -----------------------------------------------
-- SECTION_SOURCES: SELECT
-- -----------------------------------------------

DROP POLICY IF EXISTS "section_sources_select" ON public.section_sources;
CREATE POLICY "section_sources_select_org" ON public.section_sources
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.proposal_sections ps
      JOIN public.proposals pr ON pr.id = ps.proposal_id
      WHERE ps.id = section_id
      AND pr.organization_id IN (
        SELECT p.organization_id FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
      )
    )
  );

-- -----------------------------------------------
-- SECTION_CLAIMS: SELECT, INSERT, UPDATE
-- -----------------------------------------------

DROP POLICY IF EXISTS "section_claims_select" ON public.section_claims;
CREATE POLICY "section_claims_select_org" ON public.section_claims
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.proposal_sections ps
      JOIN public.proposals pr ON pr.id = ps.proposal_id
      WHERE ps.id = section_id
      AND pr.organization_id IN (
        SELECT p.organization_id FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "section_claims_insert" ON public.section_claims;
CREATE POLICY "section_claims_insert_org" ON public.section_claims
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.proposal_sections ps
      JOIN public.proposals pr ON pr.id = ps.proposal_id
      WHERE ps.id = section_id
      AND pr.organization_id IN (
        SELECT p.organization_id FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "section_claims_update" ON public.section_claims;
CREATE POLICY "section_claims_update_org" ON public.section_claims
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.proposal_sections ps
      JOIN public.proposals pr ON pr.id = ps.proposal_id
      WHERE ps.id = section_id
      AND pr.organization_id IN (
        SELECT p.organization_id FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
        AND p.role IN ('admin', 'manager')
      )
    )
  );

-- -----------------------------------------------
-- SECTION_OUTCOME_MAPPING: SELECT, ALL
-- -----------------------------------------------

DROP POLICY IF EXISTS "section_outcome_mapping_select" ON public.section_outcome_mapping;
CREATE POLICY "section_outcome_mapping_select_org" ON public.section_outcome_mapping
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.proposal_sections ps
      JOIN public.proposals pr ON pr.id = ps.proposal_id
      WHERE ps.id = section_id
      AND pr.organization_id IN (
        SELECT p.organization_id FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "section_outcome_mapping_all" ON public.section_outcome_mapping;
CREATE POLICY "section_outcome_mapping_all_org" ON public.section_outcome_mapping
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.proposal_sections ps
      JOIN public.proposals pr ON pr.id = ps.proposal_id
      WHERE ps.id = section_id
      AND pr.organization_id IN (
        SELECT p.organization_id FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
      )
    )
  );

-- -----------------------------------------------
-- VERIFICATION_LOG: SELECT, INSERT
-- -----------------------------------------------

DROP POLICY IF EXISTS "verification_log_select" ON public.verification_log;
CREATE POLICY "verification_log_select_org" ON public.verification_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.proposals pr
      WHERE pr.id = proposal_id
      AND pr.organization_id IN (
        SELECT p.organization_id FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "verification_log_insert" ON public.verification_log;
CREATE POLICY "verification_log_insert_org" ON public.verification_log
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.proposals pr
      WHERE pr.id = proposal_id
      AND pr.organization_id IN (
        SELECT p.organization_id FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
      )
    )
  );

-- -----------------------------------------------
-- DEAL_OUTCOME_HISTORY: SELECT, INSERT
-- -----------------------------------------------

DROP POLICY IF EXISTS "deal_outcome_history_select" ON public.deal_outcome_history;
CREATE POLICY "deal_outcome_history_select_org" ON public.deal_outcome_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.proposals pr
      WHERE pr.id = proposal_id
      AND pr.organization_id IN (
        SELECT p.organization_id FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "deal_outcome_history_insert" ON public.deal_outcome_history;
CREATE POLICY "deal_outcome_history_insert_org" ON public.deal_outcome_history
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.proposals pr
      WHERE pr.id = proposal_id
      AND pr.organization_id IN (
        SELECT p.organization_id FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
        AND p.role IN ('admin', 'manager')
      )
    )
  );

-- -----------------------------------------------
-- SECTION_FEEDBACK: SELECT, INSERT
-- -----------------------------------------------

DROP POLICY IF EXISTS "section_feedback_select" ON public.section_feedback;
CREATE POLICY "section_feedback_select_org" ON public.section_feedback
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.proposals pr
      WHERE pr.id = proposal_id
      AND pr.organization_id IN (
        SELECT p.organization_id FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "section_feedback_insert" ON public.section_feedback;
CREATE POLICY "section_feedback_insert_org" ON public.section_feedback
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.proposals pr
      WHERE pr.id = proposal_id
      AND pr.organization_id IN (
        SELECT p.organization_id FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
      )
    )
  );

-- -----------------------------------------------
-- DOCUMENT_CHUNKS: SELECT (was using team_id IS NULL fallback)
-- -----------------------------------------------

DROP POLICY IF EXISTS "chunks_select" ON public.document_chunks;
CREATE POLICY "chunks_select_org" ON public.document_chunks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_id
      AND d.organization_id IN (
        SELECT p.organization_id FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
      )
    )
  );


-- ============================================================
-- CATEGORY 2: Fix missing org checks on writes
-- ============================================================

-- -----------------------------------------------
-- DOCUMENTS: INSERT, UPDATE, DELETE
-- -----------------------------------------------

-- Fix INSERT: was only checking uploaded_by, no org check
DROP POLICY IF EXISTS "documents_insert" ON public.documents;
CREATE POLICY "documents_insert_org" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = (SELECT auth.uid())
    AND organization_id IN (
      SELECT p.organization_id FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
    )
  );

-- Fix UPDATE: was checking uploaded_by or admin but no org scoping
DROP POLICY IF EXISTS "documents_update" ON public.documents;
CREATE POLICY "documents_update_org" ON public.documents
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT p.organization_id FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
    )
    AND (
      uploaded_by = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.profiles p2
        WHERE p2.id = (SELECT auth.uid()) AND p2.role = 'admin'
      )
    )
  );

-- Fix DELETE: was checking uploaded_by or admin but no org scoping
DROP POLICY IF EXISTS "documents_delete" ON public.documents;
CREATE POLICY "documents_delete_org" ON public.documents
  FOR DELETE TO authenticated
  USING (
    organization_id IN (
      SELECT p.organization_id FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
    )
    AND (
      uploaded_by = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.profiles p2
        WHERE p2.id = (SELECT auth.uid()) AND p2.role = 'admin'
      )
    )
  );

-- -----------------------------------------------
-- TEAMS: UPDATE (was missing org check)
-- -----------------------------------------------

DROP POLICY IF EXISTS "teams_update_admin" ON public.teams;
CREATE POLICY "teams_update_org_admin" ON public.teams
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT p.organization_id FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
    )
  );


-- ============================================================
-- CATEGORY 3: Fix wide-open policies (proposal_reviews)
-- ============================================================

-- Fix SELECT: was USING(true) — anyone could see all reviews
DROP POLICY IF EXISTS "Users can view reviews for their proposals" ON public.proposal_reviews;
CREATE POLICY "proposal_reviews_select_org" ON public.proposal_reviews
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.proposals pr
      WHERE pr.id = proposal_id
      AND pr.organization_id IN (
        SELECT p.organization_id FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
      )
    )
  );

-- Fix INSERT: was only checking auth.uid() IS NOT NULL — any user could create reviews on any proposal
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.proposal_reviews;
CREATE POLICY "proposal_reviews_insert_org" ON public.proposal_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    reviewer_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.proposals pr
      WHERE pr.id = proposal_id
      AND pr.organization_id IN (
        SELECT p.organization_id FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
      )
    )
  );

-- Keep UPDATE — already scoped to reviewer_id = auth.uid()
-- (no cross-tenant risk since you can only update your own)


-- ============================================================
-- CATEGORY 4: Fix RPC NULL bypass on search functions
-- ============================================================

SET search_path TO public, extensions;

-- Fix match_document_chunks_org: remove NULL bypass
CREATE OR REPLACE FUNCTION public.match_document_chunks_org(
  query_embedding vector(1024),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_organization_id uuid DEFAULT NULL,
  filter_document_type text DEFAULT NULL,
  filter_industry text DEFAULT NULL,
  filter_service_line text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  section_heading text,
  chunk_index integer,
  similarity float,
  document_title text,
  document_type text,
  file_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- SECURITY: organization_id is required — NULL returns empty set
  IF filter_organization_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.section_heading,
    dc.chunk_index,
    1 - (dc.embedding <=> query_embedding) AS similarity,
    d.title AS document_title,
    d.document_type,
    d.file_name
  FROM public.document_chunks dc
  JOIN public.documents d ON d.id = dc.document_id
  WHERE
    d.processing_status = 'completed'
    AND dc.embedding IS NOT NULL
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
    -- Organization filtering: strictly required (no NULL bypass)
    AND d.organization_id = filter_organization_id
    AND (filter_document_type IS NULL OR d.document_type = filter_document_type)
    AND (filter_industry IS NULL OR d.industry = filter_industry)
    AND (filter_service_line IS NULL OR d.service_line = filter_service_line)
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Fix hybrid_search_chunks_org: remove NULL bypass
CREATE OR REPLACE FUNCTION public.hybrid_search_chunks_org(
  query_text text,
  query_embedding vector(1024),
  match_count int DEFAULT 10,
  vector_weight float DEFAULT 0.7,
  text_weight float DEFAULT 0.3,
  filter_organization_id uuid DEFAULT NULL,
  filter_document_type text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  section_heading text,
  combined_score float,
  vector_score float,
  text_score float,
  document_title text,
  document_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- SECURITY: organization_id is required — NULL returns empty set
  IF filter_organization_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.section_heading,
    (vector_weight * (1 - (dc.embedding <=> query_embedding))) +
    (text_weight * coalesce(ts_rank(
      to_tsvector('english', dc.content),
      plainto_tsquery('english', query_text)
    ), 0)) AS combined_score,
    1 - (dc.embedding <=> query_embedding) AS vector_score,
    coalesce(ts_rank(
      to_tsvector('english', dc.content),
      plainto_tsquery('english', query_text)
    ), 0) AS text_score,
    d.title AS document_title,
    d.document_type
  FROM public.document_chunks dc
  JOIN public.documents d ON d.id = dc.document_id
  WHERE
    d.processing_status = 'completed'
    AND dc.embedding IS NOT NULL
    -- Organization filtering: strictly required (no NULL bypass)
    AND d.organization_id = filter_organization_id
    AND (filter_document_type IS NULL OR d.document_type = filter_document_type)
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$;

-- Fix match_document_chunks (non-org version): restrict to service_role only
-- NOTE: We do not drop this function as it may be used internally by service_role.
-- Instead, we add a guard to reject non-service-role callers.
CREATE OR REPLACE FUNCTION public.match_document_chunks(
  query_embedding vector(1024),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_document_type text DEFAULT NULL,
  filter_industry text DEFAULT NULL,
  filter_service_line text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  section_heading text,
  chunk_index integer,
  similarity float,
  document_title text,
  document_type text,
  file_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- SECURITY: Only service_role can call the non-org-scoped search
  IF current_setting('role', true) != 'service_role' THEN
    RAISE EXCEPTION 'match_document_chunks requires service_role. Use match_document_chunks_org for authenticated access.';
  END IF;

  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.section_heading,
    dc.chunk_index,
    1 - (dc.embedding <=> query_embedding) AS similarity,
    d.title AS document_title,
    d.document_type,
    d.file_name
  FROM public.document_chunks dc
  JOIN public.documents d ON d.id = dc.document_id
  WHERE
    d.processing_status = 'completed'
    AND dc.embedding IS NOT NULL
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
    AND (filter_document_type IS NULL OR d.document_type = filter_document_type)
    AND (filter_industry IS NULL OR d.industry = filter_industry)
    AND (filter_service_line IS NULL OR d.service_line = filter_service_line)
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Fix hybrid_search_chunks (non-org version): restrict to service_role only
CREATE OR REPLACE FUNCTION public.hybrid_search_chunks(
  query_text text,
  query_embedding vector(1024),
  match_count int DEFAULT 10,
  vector_weight float DEFAULT 0.7,
  text_weight float DEFAULT 0.3,
  filter_document_type text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  section_heading text,
  combined_score float,
  vector_score float,
  text_score float,
  document_title text,
  document_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- SECURITY: Only service_role can call the non-org-scoped search
  IF current_setting('role', true) != 'service_role' THEN
    RAISE EXCEPTION 'hybrid_search_chunks requires service_role. Use hybrid_search_chunks_org for authenticated access.';
  END IF;

  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.section_heading,
    (vector_weight * (1 - (dc.embedding <=> query_embedding))) +
    (text_weight * coalesce(ts_rank(
      to_tsvector('english', dc.content),
      plainto_tsquery('english', query_text)
    ), 0)) AS combined_score,
    1 - (dc.embedding <=> query_embedding) AS vector_score,
    coalesce(ts_rank(
      to_tsvector('english', dc.content),
      plainto_tsquery('english', query_text)
    ), 0) AS text_score,
    d.title AS document_title,
    d.document_type
  FROM public.document_chunks dc
  JOIN public.documents d ON d.id = dc.document_id
  WHERE
    d.processing_status = 'completed'
    AND dc.embedding IS NOT NULL
    AND (filter_document_type IS NULL OR d.document_type = filter_document_type)
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$;


-- ============================================================
-- CATEGORY 5: Fix overly restrictive policies (versions)
-- ============================================================

-- -----------------------------------------------
-- PROPOSAL_VERSIONS: SELECT, INSERT, UPDATE
-- All 3 only check created_by — org members should see versions
-- -----------------------------------------------

DROP POLICY IF EXISTS "Users can view own proposal versions" ON public.proposal_versions;
CREATE POLICY "proposal_versions_select_org" ON public.proposal_versions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.proposals pr
      WHERE pr.id = proposal_versions.proposal_id
      AND pr.organization_id IN (
        SELECT p.organization_id FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Users can create versions for own proposals" ON public.proposal_versions;
CREATE POLICY "proposal_versions_insert_org" ON public.proposal_versions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.proposals pr
      WHERE pr.id = proposal_versions.proposal_id
      AND pr.organization_id IN (
        SELECT p.organization_id FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Users can update own proposal versions" ON public.proposal_versions;
CREATE POLICY "proposal_versions_update_org" ON public.proposal_versions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.proposals pr
      WHERE pr.id = proposal_versions.proposal_id
      AND pr.organization_id IN (
        SELECT p.organization_id FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
      )
    )
  );

-- -----------------------------------------------
-- SECTION_VERSIONS: SELECT, INSERT
-- Only check created_by — org members should see section versions
-- -----------------------------------------------

DROP POLICY IF EXISTS "Users can view own section versions" ON public.section_versions;
CREATE POLICY "section_versions_select_org" ON public.section_versions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.proposal_versions pv
      JOIN public.proposals pr ON pr.id = pv.proposal_id
      WHERE pv.id = section_versions.proposal_version_id
      AND pr.organization_id IN (
        SELECT p.organization_id FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Users can create section versions" ON public.section_versions;
CREATE POLICY "section_versions_insert_org" ON public.section_versions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.proposal_versions pv
      JOIN public.proposals pr ON pr.id = pv.proposal_id
      WHERE pv.id = section_versions.proposal_version_id
      AND pr.organization_id IN (
        SELECT p.organization_id FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
      )
    )
  );


-- ============================================================
-- CATEGORY 6: Fix storage policies
-- ============================================================

-- -----------------------------------------------
-- organization-assets bucket
-- -----------------------------------------------

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can upload org assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can manage org assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete org assets" ON storage.objects;

-- INSERT: path must start with user's org_id
CREATE POLICY "org_assets_insert_scoped" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'organization-assets'
    AND (storage.foldername(name))[1] = (SELECT get_user_organization_id()::text)
  );

-- UPDATE: path must be within user's org_id folder
CREATE POLICY "org_assets_update_scoped" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'organization-assets'
    AND (storage.foldername(name))[1] = (SELECT get_user_organization_id()::text)
  );

-- DELETE: path must be within user's org_id folder
CREATE POLICY "org_assets_delete_scoped" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'organization-assets'
    AND (storage.foldername(name))[1] = (SELECT get_user_organization_id()::text)
  );

-- Keep SELECT as public read — intentional for serving assets
-- (policy "Public read access for org assets" already exists)

-- -----------------------------------------------
-- exported-proposals bucket
-- -----------------------------------------------

-- Drop overly permissive policies
DROP POLICY IF EXISTS "authenticated_insert_exported_proposals" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_select_exported_proposals" ON storage.objects;

-- INSERT: path must start with user's org_id
CREATE POLICY "exported_proposals_insert_scoped" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'exported-proposals'
    AND (storage.foldername(name))[1] = (SELECT get_user_organization_id()::text)
  );

-- SELECT: can only read files within user's org_id folder
CREATE POLICY "exported_proposals_select_scoped" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'exported-proposals'
    AND (storage.foldername(name))[1] = (SELECT get_user_organization_id()::text)
  );

-- Keep service_role policy — "service_role_all_exported_proposals" already exists


COMMIT;
