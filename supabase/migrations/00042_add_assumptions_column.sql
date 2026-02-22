-- Add assumptions JSONB column to proposals table.
-- Stores auto-generated project assumptions from RFP extraction.
-- Structure: [{category: string, text: string, is_ai_generated: boolean}]
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS assumptions jsonb DEFAULT '[]';

COMMENT ON COLUMN public.proposals.assumptions IS 'Auto-generated project assumptions from RFP extraction. Array of {category, text, is_ai_generated} objects.';
