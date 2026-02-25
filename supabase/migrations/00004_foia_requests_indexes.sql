-- Add indexes to foia_requests for common query patterns
-- organization_id is used in every query (RLS + direct filters)
CREATE INDEX IF NOT EXISTS idx_foia_requests_organization_id
    ON foia_requests (organization_id);

-- status is used for filtering/dashboard queries
CREATE INDEX IF NOT EXISTS idx_foia_requests_status
    ON foia_requests (status);

-- state is used for geographic filtering
CREATE INDEX IF NOT EXISTS idx_foia_requests_state
    ON foia_requests (state);

-- Composite index for the most common query pattern: org + status
CREATE INDEX IF NOT EXISTS idx_foia_requests_org_status
    ON foia_requests (organization_id, status);

-- created_at for ordering (most recent first)
CREATE INDEX IF NOT EXISTS idx_foia_requests_created_at
    ON foia_requests (created_at DESC);
