-- Migration: Create exported-proposals storage bucket for proposal exports
-- Private bucket — access via signed URLs only

INSERT INTO storage.buckets (id, name, public)
VALUES ('exported-proposals', 'exported-proposals', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload exports
CREATE POLICY "authenticated_insert_exported_proposals"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'exported-proposals');

-- Allow authenticated users to read their exports (via signed URLs from admin client)
CREATE POLICY "authenticated_select_exported_proposals"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'exported-proposals');

-- Allow service role to manage all exports (used by admin client for signed URLs)
CREATE POLICY "service_role_all_exported_proposals"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'exported-proposals');
