-- Migration: Add rfp_task_structure column to proposals
-- Phase 5.0: RFP Task-by-Task Mirroring - Data Model
--
-- Stores the extracted hierarchical task structure from RFP documents.
-- When populated, the pipeline uses task-mirrored section generation
-- instead of the fixed template.
--
-- Additive only: no data modification, no RLS changes needed
-- (existing proposal RLS covers the new column).

ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS rfp_task_structure JSONB DEFAULT NULL;

COMMENT ON COLUMN proposals.rfp_task_structure IS
  'Extracted hierarchical task structure from RFP for task-mirrored section generation';
