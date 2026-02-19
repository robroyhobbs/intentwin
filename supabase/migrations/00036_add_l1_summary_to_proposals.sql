-- ==================
-- ADD l1_summary JSONB column to proposals
-- ==================
-- Stores metadata about what L1 data was available during generation.
-- Used for auditing and debugging L1 content injection.

ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS l1_summary JSONB;

-- Add comment for documentation
COMMENT ON COLUMN public.proposals.l1_summary IS 'Metadata about L1 (Company Truth) data used during proposal generation: counts, IDs, string length, timestamp';
