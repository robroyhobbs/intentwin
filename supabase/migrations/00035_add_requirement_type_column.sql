-- ==================
-- ADD requirement_type COLUMN to proposal_requirements
-- ==================
-- Distinguishes content requirements from format/submission/certification requirements.
-- This enables the compliance tab to function as a full review checklist for RFP responses.

-- Add the requirement_type column with a default of 'content' for backward compat
ALTER TABLE public.proposal_requirements
  ADD COLUMN IF NOT EXISTS requirement_type TEXT NOT NULL DEFAULT 'content'
    CHECK (requirement_type IN ('content', 'format', 'submission', 'certification'));

-- Add index for filtering by requirement_type
CREATE INDEX IF NOT EXISTS idx_proposal_requirements_type
  ON public.proposal_requirements(proposal_id, requirement_type);

-- Add a composite index for the checklist view (type + status)
CREATE INDEX IF NOT EXISTS idx_proposal_requirements_type_status
  ON public.proposal_requirements(proposal_id, requirement_type, compliance_status);
