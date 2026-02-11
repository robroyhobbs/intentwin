-- Add quality_review JSONB column to proposals table
-- Stores automated quality review results from GPT-4o overseer
-- Structure: { status, run_at, trigger, model, overall_score, pass, sections[], remediation[] }

ALTER TABLE proposals ADD COLUMN IF NOT EXISTS quality_review jsonb;

COMMENT ON COLUMN proposals.quality_review IS
  'Automated quality review results from GPT-4o overseer. Contains scores, feedback, and remediation log.';
