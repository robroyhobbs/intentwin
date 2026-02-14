-- Add bid_evaluation JSONB column to proposals table
-- Stores bid/no-bid scoring engine results: AI scores, user overrides, recommendation, decision
-- Structure: { ai_scores: {...}, user_scores?: {...}, weighted_total: number, recommendation: string, user_decision: string, scored_at: string }

ALTER TABLE proposals ADD COLUMN IF NOT EXISTS bid_evaluation jsonb;

COMMENT ON COLUMN proposals.bid_evaluation IS
  'Bid/no-bid scoring evaluation. Contains 5-factor AI scores, optional user overrides, weighted total, recommendation tier, and proceed/skip decision.';
