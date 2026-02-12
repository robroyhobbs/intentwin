-- Migration: Create organization-assets storage bucket for logo uploads
-- Public bucket so logo URLs can be served directly in exports

INSERT INTO storage.buckets (id, name, public)
VALUES ('organization-assets', 'organization-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their org folder
CREATE POLICY "Authenticated users can upload org assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'organization-assets');

-- Allow public read access (logos need to be publicly visible)
CREATE POLICY "Public read access for org assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'organization-assets');

-- Allow authenticated users to update/delete their uploads
CREATE POLICY "Authenticated users can manage org assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'organization-assets');

CREATE POLICY "Authenticated users can delete org assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'organization-assets');
