-- Migration: Fix L1 unique constraints for multi-tenancy upserts
-- The original unique constraints don't include organization_id,
-- so ON CONFLICT upserts fail. This migration replaces them with
-- org-scoped unique constraints.

-- ==================
-- COMPANY CONTEXT
-- ==================
-- Drop old constraint: unique(category, key)
ALTER TABLE public.company_context
  DROP CONSTRAINT IF EXISTS company_context_category_key_key;

-- Add org-scoped constraint
ALTER TABLE public.company_context
  ADD CONSTRAINT company_context_category_key_org_unique
  UNIQUE (category, key, organization_id);

-- ==================
-- PRODUCT CONTEXTS
-- ==================
-- Drop old constraint: unique(product_name, service_line)
ALTER TABLE public.product_contexts
  DROP CONSTRAINT IF EXISTS product_contexts_product_name_service_line_key;

-- Add org-scoped constraint
ALTER TABLE public.product_contexts
  ADD CONSTRAINT product_contexts_name_service_org_unique
  UNIQUE (product_name, service_line, organization_id);

-- ==================
-- EVIDENCE LIBRARY
-- ==================
-- No previous unique constraint existed; add org-scoped one
ALTER TABLE public.evidence_library
  ADD CONSTRAINT evidence_library_title_org_unique
  UNIQUE (title, organization_id);
