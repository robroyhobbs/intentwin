-- Fix: Migration 00030 line 94-95 targeted nonexistent table "deal_outcomes".
-- The correct table is "deal_outcome_history". The original CREATE INDEX
-- silently no-ops due to IF NOT EXISTS on a missing table.
-- This migration creates the intended index on the correct table.

CREATE INDEX IF NOT EXISTS idx_deal_outcome_history_org
  ON deal_outcome_history (organization_id, created_at DESC);
