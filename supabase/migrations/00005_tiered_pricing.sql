-- Tiered pricing support
-- Extends organizations table for Free/Starter/Pro/Enterprise tiers

-- 1. Drop the old CHECK constraint that's missing 'free' and 'invite'
ALTER TABLE organizations
  DROP CONSTRAINT IF EXISTS organizations_plan_tier_check;

-- 2. Add new constraint covering all valid tiers
ALTER TABLE organizations
  ADD CONSTRAINT organizations_plan_tier_check
  CHECK (plan_tier = ANY(ARRAY[
    'free',
    'trial',
    'starter',
    'pro',
    'enterprise',
    'invite'   -- legacy: existing customers on the $999 invite-only plan
  ]));

-- 3. Migrate existing 'invite' orgs → 'enterprise' tier semantics
--    (they paid $999/mo and have unlimited access — enterprise is the correct mapping)
UPDATE organizations
  SET plan_tier = 'enterprise',
      plan_limits = jsonb_build_object(
        'proposals_per_month', 999999,
        'ai_tokens_per_month', 999999999,
        'max_users',           10,
        'max_documents',       999999
      )
  WHERE plan_tier = 'invite';

-- 4. Add feature_flags JSONB column for per-tier feature gating
--    Default: all false (free tier baseline)
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS feature_flags jsonb NOT NULL DEFAULT '{
    "ai_generation": false,
    "document_extraction": false,
    "intelligence_suite": false,
    "bid_evaluation": false,
    "all_export_formats": false,
    "semantic_search": false,
    "bulk_import": false,
    "quality_review": false,
    "preflight_gate": false,
    "client_research": false,
    "win_probability": false,
    "competitive_landscape": false,
    "white_label_exports": false,
    "advanced_analytics": false,
    "audit_trail": false
  }';

-- 5. Back-fill feature_flags for existing paid/enterprise orgs
UPDATE organizations
  SET feature_flags = '{
    "ai_generation": true,
    "document_extraction": true,
    "intelligence_suite": true,
    "bid_evaluation": true,
    "all_export_formats": true,
    "semantic_search": true,
    "bulk_import": true,
    "quality_review": true,
    "preflight_gate": true,
    "client_research": true,
    "win_probability": true,
    "competitive_landscape": true,
    "white_label_exports": true,
    "advanced_analytics": true,
    "audit_trail": true
  }'
  WHERE plan_tier IN ('enterprise', 'pro');

UPDATE organizations
  SET feature_flags = '{
    "ai_generation": true,
    "document_extraction": true,
    "intelligence_suite": false,
    "bid_evaluation": false,
    "all_export_formats": false,
    "semantic_search": true,
    "bulk_import": false,
    "quality_review": false,
    "preflight_gate": false,
    "client_research": false,
    "win_probability": false,
    "competitive_landscape": false,
    "white_label_exports": false,
    "advanced_analytics": false,
    "audit_trail": false
  }'
  WHERE plan_tier = 'starter';

-- 6. Add index on plan_tier for analytics queries
CREATE INDEX IF NOT EXISTS idx_organizations_plan_tier
  ON organizations (plan_tier);
