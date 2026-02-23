-- Migration: Update section_type CHECK constraint on proposal_sections
-- 
-- The original constraint (migration 00004) only allowed 11 section types.
-- Several new types have been added since:
--   - why_us (renamed from why_capgemini)
--   - cover_letter (boilerplate section)
--   - compliance_matrix_section (boilerplate section)
--   - exceptions_terms (boilerplate section)
--   - rfp_task (task-mirrored sections from Phase 5)
--
-- This migration drops the old constraint and creates a new one with all types.

-- Drop the old CHECK constraint
ALTER TABLE public.proposal_sections
  DROP CONSTRAINT IF EXISTS proposal_sections_section_type_check;

-- Create new CHECK constraint with all section types
ALTER TABLE public.proposal_sections
  ADD CONSTRAINT proposal_sections_section_type_check
  CHECK (section_type IN (
    -- Original 10 sections
    'executive_summary',
    'understanding',
    'approach',
    'methodology',
    'team',
    'case_studies',
    'timeline',
    'pricing',
    'risk_mitigation',
    'why_capgemini',  -- Legacy name, kept for backwards compatibility
    'why_us',         -- Current name (renamed from why_capgemini)
    'appendix',
    -- Boilerplate sections (added for solicitation-type-aware generation)
    'cover_letter',
    'compliance_matrix_section',
    'exceptions_terms',
    -- Task-mirrored sections (Phase 5: RFP task-by-task mirroring)
    'rfp_task'
  ));

COMMENT ON CONSTRAINT proposal_sections_section_type_check ON public.proposal_sections IS
  'Allowed section types for proposal generation. Updated in migration 00044 to include boilerplate and task-mirrored types.';
