-- Add generation_metadata column for storing pipeline context between
-- client-orchestrated setup and per-section generation calls.
-- Replaces Inngest step memoization with explicit DB-backed context storage.
ALTER TABLE "public"."proposals"
  ADD COLUMN IF NOT EXISTS "generation_metadata" "jsonb";

COMMENT ON COLUMN "public"."proposals"."generation_metadata"
  IS 'Temporary storage for PipelineContext during client-orchestrated generation. Cleared after finalization.';
