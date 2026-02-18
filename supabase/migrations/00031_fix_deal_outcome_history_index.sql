-- Fix: Migration 00030 line 94-95 targeted nonexistent table "deal_outcomes".
-- The correct table is "deal_outcome_history". However, deal_outcome_history
-- has no organization_id column (it joins through proposal_id → proposals).
-- Create a useful index on proposal_id + changed_at instead.

CREATE INDEX IF NOT EXISTS idx_deal_outcome_history_proposal_changed
  ON deal_outcome_history (proposal_id, changed_at DESC);
