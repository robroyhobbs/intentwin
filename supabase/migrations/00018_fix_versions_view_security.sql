-- Fix security issue: proposal_versions_summary exposes auth.users data
-- Issue 1: View joins auth.users which exposes user emails to any authenticated user
-- Issue 2: View was implicitly using SECURITY DEFINER behavior

-- Drop the problematic view
DROP VIEW IF EXISTS proposal_versions_summary;

-- Recreate the view WITHOUT auth.users join
-- If the email is needed, it should be fetched separately through the profiles table
-- which has proper RLS policies
CREATE VIEW proposal_versions_summary
WITH (security_invoker = true) -- Use invoker's permissions, not definer's
AS
SELECT
  pv.id,
  pv.proposal_id,
  pv.version_number,
  pv.title,
  pv.intake_data,
  pv.outcome_contract,
  pv.status,
  pv.trigger_event,
  pv.change_summary,
  pv.label,
  pv.created_by,
  pv.created_at,
  -- Get email from profiles table (which has proper RLS)
  p.email as created_by_email,
  COUNT(sv.id) as section_count,
  COUNT(CASE WHEN sv.generation_status = 'completed' THEN 1 END) as completed_sections
FROM proposal_versions pv
LEFT JOIN profiles p ON p.id = pv.created_by
LEFT JOIN section_versions sv ON sv.proposal_version_id = pv.id
GROUP BY pv.id, p.email;

-- Add comment explaining the security fix
COMMENT ON VIEW proposal_versions_summary IS
  'Summary view for proposal versions. Uses profiles table (with RLS) instead of auth.users. Uses SECURITY INVOKER to respect caller permissions.';
