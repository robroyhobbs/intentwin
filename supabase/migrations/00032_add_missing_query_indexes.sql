-- Phase 2: Add missing indexes for common query patterns
-- These tables are frequently filtered by organization_id but lack indexes.

-- proposal_requirements: filtered by organization_id in requirements API routes
CREATE INDEX IF NOT EXISTS idx_proposal_requirements_org
  ON proposal_requirements (organization_id);

-- proposal_requirements: commonly queried by proposal_id + category
CREATE INDEX IF NOT EXISTS idx_proposal_requirements_proposal
  ON proposal_requirements (proposal_id, category);

-- waitlist: nurture cron queries by status + nurture_step + created_at
CREATE INDEX IF NOT EXISTS idx_waitlist_nurture
  ON waitlist (status, nurture_step, created_at);
