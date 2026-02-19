-- ==================
-- ADD compliance_assessment JSONB column to proposals
-- ==================
-- Stores metadata about the latest compliance auto-assessment run.

ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS compliance_assessment JSONB;

COMMENT ON COLUMN public.proposals.compliance_assessment IS 'Metadata from compliance auto-assessment: status, counts, timestamp, trigger type';
