-- Proposal Versioning System
-- Enables change tracking and rollback for proposals

-- ============================================
-- PROPOSAL VERSIONS TABLE
-- ============================================
-- Stores snapshots of proposal state at key milestones

CREATE TABLE IF NOT EXISTS proposal_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,

  -- Snapshot of proposal fields
  title TEXT NOT NULL,
  intake_data JSONB,
  outcome_contract JSONB,
  status TEXT,

  -- Version metadata
  trigger_event TEXT NOT NULL, -- 'intent_approved', 'generation_complete', 'section_edited', 'manual_save', 'pre_export'
  change_summary TEXT, -- Optional description of what changed
  label TEXT, -- Optional user-defined label like "Client Review v1"

  -- Audit fields
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(proposal_id, version_number)
);

-- ============================================
-- SECTION VERSIONS TABLE
-- ============================================
-- Stores snapshots of section content linked to proposal versions

CREATE TABLE IF NOT EXISTS section_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_version_id UUID NOT NULL REFERENCES proposal_versions(id) ON DELETE CASCADE,
  original_section_id UUID NOT NULL, -- Reference to the original section (may be deleted)

  -- Snapshot of section fields
  title TEXT NOT NULL,
  section_type TEXT NOT NULL,
  section_order INTEGER NOT NULL,
  generated_content TEXT,
  edited_content TEXT,
  generation_status TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_proposal_versions_proposal_id
  ON proposal_versions(proposal_id);

CREATE INDEX IF NOT EXISTS idx_proposal_versions_created_at
  ON proposal_versions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_section_versions_proposal_version_id
  ON section_versions(proposal_version_id);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE proposal_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_versions ENABLE ROW LEVEL SECURITY;

-- Users can view versions of proposals they own
CREATE POLICY "Users can view own proposal versions"
  ON proposal_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_versions.proposal_id
      AND proposals.created_by = auth.uid()
    )
  );

-- Users can create versions for their own proposals
CREATE POLICY "Users can create versions for own proposals"
  ON proposal_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_versions.proposal_id
      AND proposals.created_by = auth.uid()
    )
  );

-- Users can update version labels/summaries for their own proposals
CREATE POLICY "Users can update own proposal versions"
  ON proposal_versions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_versions.proposal_id
      AND proposals.created_by = auth.uid()
    )
  );

-- Section versions follow proposal version permissions
CREATE POLICY "Users can view own section versions"
  ON section_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM proposal_versions pv
      JOIN proposals p ON p.id = pv.proposal_id
      WHERE pv.id = section_versions.proposal_version_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create section versions"
  ON section_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM proposal_versions pv
      JOIN proposals p ON p.id = pv.proposal_id
      WHERE pv.id = section_versions.proposal_version_id
      AND p.created_by = auth.uid()
    )
  );

-- ============================================
-- HELPER FUNCTION: Get next version number
-- ============================================

CREATE OR REPLACE FUNCTION get_next_version_number(p_proposal_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_num
  FROM proposal_versions
  WHERE proposal_id = p_proposal_id;

  RETURN next_num;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- HELPER FUNCTION: Create version snapshot
-- ============================================

CREATE OR REPLACE FUNCTION create_proposal_version(
  p_proposal_id UUID,
  p_trigger_event TEXT,
  p_change_summary TEXT DEFAULT NULL,
  p_label TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_version_id UUID;
  v_version_number INTEGER;
  v_proposal RECORD;
BEGIN
  -- Get next version number
  v_version_number := get_next_version_number(p_proposal_id);

  -- Get current proposal state
  SELECT * INTO v_proposal FROM proposals WHERE id = p_proposal_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proposal not found: %', p_proposal_id;
  END IF;

  -- Create proposal version
  INSERT INTO proposal_versions (
    proposal_id,
    version_number,
    title,
    intake_data,
    outcome_contract,
    status,
    trigger_event,
    change_summary,
    label,
    created_by
  ) VALUES (
    p_proposal_id,
    v_version_number,
    v_proposal.title,
    v_proposal.intake_data,
    v_proposal.outcome_contract,
    v_proposal.status,
    p_trigger_event,
    p_change_summary,
    p_label,
    COALESCE(p_user_id, auth.uid())
  )
  RETURNING id INTO v_version_id;

  -- Snapshot all sections
  INSERT INTO section_versions (
    proposal_version_id,
    original_section_id,
    title,
    section_type,
    section_order,
    generated_content,
    edited_content,
    generation_status
  )
  SELECT
    v_version_id,
    id,
    title,
    section_type,
    section_order,
    generated_content,
    edited_content,
    generation_status
  FROM proposal_sections
  WHERE proposal_id = p_proposal_id;

  RETURN v_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: Restore from version
-- ============================================

CREATE OR REPLACE FUNCTION restore_proposal_version(
  p_version_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_version RECORD;
  v_proposal_id UUID;
  v_new_version_id UUID;
BEGIN
  -- Get the version to restore
  SELECT * INTO v_version FROM proposal_versions WHERE id = p_version_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Version not found: %', p_version_id;
  END IF;

  v_proposal_id := v_version.proposal_id;

  -- First, create a version of current state (so we can undo the restore)
  v_new_version_id := create_proposal_version(
    v_proposal_id,
    'pre_restore',
    'Auto-saved before restoring to version ' || v_version.version_number,
    NULL,
    p_user_id
  );

  -- Restore proposal fields
  UPDATE proposals SET
    title = v_version.title,
    intake_data = v_version.intake_data,
    outcome_contract = v_version.outcome_contract,
    status = v_version.status,
    updated_at = NOW()
  WHERE id = v_proposal_id;

  -- Delete current sections
  DELETE FROM proposal_sections WHERE proposal_id = v_proposal_id;

  -- Restore sections from version
  INSERT INTO proposal_sections (
    proposal_id,
    title,
    section_type,
    section_order,
    generated_content,
    edited_content,
    generation_status
  )
  SELECT
    v_proposal_id,
    title,
    section_type,
    section_order,
    generated_content,
    edited_content,
    generation_status
  FROM section_versions
  WHERE proposal_version_id = p_version_id;

  -- Create a version recording the restore
  PERFORM create_proposal_version(
    v_proposal_id,
    'restored',
    'Restored from version ' || v_version.version_number || COALESCE(' (' || v_version.label || ')', ''),
    NULL,
    p_user_id
  );

  RETURN v_proposal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VIEW: Version summary with section counts
-- ============================================

CREATE OR REPLACE VIEW proposal_versions_summary AS
SELECT
  pv.*,
  u.email as created_by_email,
  COUNT(sv.id) as section_count,
  COUNT(CASE WHEN sv.generation_status = 'completed' THEN 1 END) as completed_sections
FROM proposal_versions pv
LEFT JOIN auth.users u ON u.id = pv.created_by
LEFT JOIN section_versions sv ON sv.proposal_version_id = pv.id
GROUP BY pv.id, u.email;
