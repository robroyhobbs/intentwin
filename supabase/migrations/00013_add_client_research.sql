-- ===========================================
-- FLEXIBLE INTAKE: Client Research & Source Tracking
-- ===========================================
-- Stores AI-researched client intel and tracks how intake was provided

ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS client_research jsonb,
  ADD COLUMN IF NOT EXISTS intake_source_type text,
  ADD COLUMN IF NOT EXISTS intake_raw_content text;

COMMENT ON COLUMN public.proposals.client_research IS 'AI-researched client intel (company overview, news, priorities)';
COMMENT ON COLUMN public.proposals.intake_source_type IS 'How intake was provided: upload, paste, describe, manual';
COMMENT ON COLUMN public.proposals.intake_raw_content IS 'Original content provided for intake extraction';

-- Constraint for intake_source_type values
ALTER TABLE public.proposals
  ADD CONSTRAINT proposals_intake_source_type_check
  CHECK (intake_source_type IS NULL OR intake_source_type IN ('upload', 'paste', 'describe', 'manual'));

-- Index for filtering by intake source type
CREATE INDEX IF NOT EXISTS idx_proposals_intake_source_type ON public.proposals(intake_source_type);
