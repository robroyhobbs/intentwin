-- Add metadata JSONB column to proposal_sections
-- Used by generate-single-section.ts to store grounding_level, provider info, task metadata
ALTER TABLE proposal_sections
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

-- Drop the old section_type CHECK constraint and replace with one that allows custom_ prefixed types
-- Custom sections come from RFP analysis and have types like custom_past_performance_matrix
ALTER TABLE proposal_sections
DROP CONSTRAINT IF EXISTS proposal_sections_section_type_check;

ALTER TABLE proposal_sections
ADD CONSTRAINT proposal_sections_section_type_check CHECK (
  section_type = ANY (ARRAY[
    'executive_summary'::text,
    'understanding'::text,
    'approach'::text,
    'methodology'::text,
    'team'::text,
    'case_studies'::text,
    'timeline'::text,
    'pricing'::text,
    'risk_mitigation'::text,
    'why_capgemini'::text,
    'why_us'::text,
    'appendix'::text,
    'cover_letter'::text,
    'compliance_matrix_section'::text,
    'exceptions_terms'::text,
    'rfp_task'::text
  ])
  OR section_type LIKE 'custom_%'
);
