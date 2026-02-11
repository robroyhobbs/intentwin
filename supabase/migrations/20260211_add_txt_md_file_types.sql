-- Allow .txt and .md file uploads in the knowledge base
ALTER TABLE public.documents
  DROP CONSTRAINT IF EXISTS documents_file_type_check;

ALTER TABLE public.documents
  ADD CONSTRAINT documents_file_type_check
  CHECK (file_type IN ('docx', 'pdf', 'pptx', 'txt', 'md'));
