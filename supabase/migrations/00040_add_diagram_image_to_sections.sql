-- Add diagram_image column to proposal_sections for AI-generated diagrams.
-- Stores base64-encoded image data URLs (e.g., "data:image/png;base64,...").
-- Only populated for sections that have diagram generation enabled
-- (team, approach, methodology, timeline, risk_mitigation).
ALTER TABLE public.proposal_sections
  ADD COLUMN IF NOT EXISTS diagram_image text;

COMMENT ON COLUMN public.proposal_sections.diagram_image IS 'Base64 data URL of AI-generated diagram image (Gemini image generation)';
