-- ============================================================
-- pgTAP Test: RLS Policies on document_chunks table
-- ============================================================
-- document_chunks has no org_id column — org scoping is enforced
-- by joining through documents.organization_id.
--
-- Test matrix:
--   Happy: User sees chunks belonging to own org's documents
--   Bad:   User CANNOT see chunks belonging to other org's documents
--   Edge:  Chunk whose parent document has NULL org_id is invisible
--   Security: Anonymous gets 0 rows
--   Security: Service role sees all rows
-- ============================================================

BEGIN;
SELECT plan(8);

-- ============================================================
-- FIXTURES
-- ============================================================

-- Organizations
SELECT tests.create_test_org('a0000000-0000-0000-0000-000000000001'::uuid, 'Org Alpha');
SELECT tests.create_test_org('b0000000-0000-0000-0000-000000000002'::uuid, 'Org Beta');

-- Users
SELECT tests.create_test_user(
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'alice@alpha.com',
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'admin'
);
SELECT tests.create_test_user(
  'a0000000-0000-0000-0000-000000000003'::uuid,
  'charlie@beta.com',
  'b0000000-0000-0000-0000-000000000002'::uuid,
  'admin'
);

-- -----------------------------------------------
-- Insert documents and chunks as superuser
-- -----------------------------------------------

-- Alpha org document + chunks
INSERT INTO public.documents (id, title, file_name, file_type, file_size_bytes, storage_path, mime_type, processing_status, uploaded_by, organization_id, created_at, updated_at)
VALUES
  ('f0000000-0000-0000-0000-000000000001'::uuid, 'Alpha Doc', 'alpha.pdf', 'pdf', 1024, '/alpha.pdf', 'application/pdf', 'completed', 'a0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, now(), now());

INSERT INTO public.document_chunks (id, document_id, content, chunk_index, created_at)
VALUES
  ('c0000000-0000-0000-0000-000000000001'::uuid, 'f0000000-0000-0000-0000-000000000001'::uuid, 'Alpha chunk 1', 0, now()),
  ('c0000000-0000-0000-0000-000000000002'::uuid, 'f0000000-0000-0000-0000-000000000001'::uuid, 'Alpha chunk 2', 1, now());

-- Beta org document + chunks
INSERT INTO public.documents (id, title, file_name, file_type, file_size_bytes, storage_path, mime_type, processing_status, uploaded_by, organization_id, created_at, updated_at)
VALUES
  ('f0000000-0000-0000-0000-000000000002'::uuid, 'Beta Doc', 'beta.pdf', 'pdf', 2048, '/beta.pdf', 'application/pdf', 'completed', 'a0000000-0000-0000-0000-000000000003'::uuid, 'b0000000-0000-0000-0000-000000000002'::uuid, now(), now());

INSERT INTO public.document_chunks (id, document_id, content, chunk_index, created_at)
VALUES
  ('c0000000-0000-0000-0000-000000000003'::uuid, 'f0000000-0000-0000-0000-000000000002'::uuid, 'Beta chunk 1', 0, now());

-- Orphan document (NULL org_id) + chunk
INSERT INTO public.documents (id, title, file_name, file_type, file_size_bytes, storage_path, mime_type, processing_status, uploaded_by, organization_id, created_at, updated_at)
VALUES
  ('f0000000-0000-0000-0000-000000000003'::uuid, 'Orphan Doc', 'orphan.pdf', 'pdf', 512, '/orphan.pdf', 'application/pdf', 'completed', 'a0000000-0000-0000-0000-000000000001'::uuid, NULL, now(), now());

INSERT INTO public.document_chunks (id, document_id, content, chunk_index, created_at)
VALUES
  ('c0000000-0000-0000-0000-000000000004'::uuid, 'f0000000-0000-0000-0000-000000000003'::uuid, 'Orphan chunk', 0, now());

-- ============================================================
-- TEST 1: Happy — Alice sees chunks from her org's documents
-- ============================================================
SELECT tests.set_auth_user('a0000000-0000-0000-0000-000000000001'::uuid);

SELECT is(
  (SELECT count(*)::integer FROM public.document_chunks),
  2,
  'Alice sees 2 chunks (both from Alpha org documents)'
);

-- ============================================================
-- TEST 2: Happy — Alice sees specific Alpha chunk
-- ============================================================
SELECT is(
  (SELECT content FROM public.document_chunks WHERE id = 'c0000000-0000-0000-0000-000000000001'::uuid),
  'Alpha chunk 1',
  'Alice can read Alpha chunk 1 content'
);

-- ============================================================
-- TEST 3: Bad — Alice CANNOT see chunks from Beta's documents
-- ============================================================
SELECT is(
  (SELECT count(*)::integer FROM public.document_chunks
   WHERE id = 'c0000000-0000-0000-0000-000000000003'::uuid),
  0,
  'Alice cannot see Beta chunk'
);

-- ============================================================
-- TEST 4: Bad — Charlie (Beta) CANNOT see Alpha's chunks
-- ============================================================
SELECT tests.set_auth_user('a0000000-0000-0000-0000-000000000003'::uuid);

SELECT is(
  (SELECT count(*)::integer FROM public.document_chunks),
  1,
  'Charlie sees exactly 1 chunk (Beta org only)'
);

-- ============================================================
-- TEST 5: Edge — Chunk with NULL org_id parent document is invisible
-- ============================================================
SELECT tests.set_auth_user('a0000000-0000-0000-0000-000000000001'::uuid);

SELECT is(
  (SELECT count(*)::integer FROM public.document_chunks
   WHERE id = 'c0000000-0000-0000-0000-000000000004'::uuid),
  0,
  'Alice cannot see chunk whose parent document has NULL org_id'
);

-- ============================================================
-- TEST 6: Edge — Charlie also cannot see NULL org_id chunk
-- ============================================================
SELECT tests.set_auth_user('a0000000-0000-0000-0000-000000000003'::uuid);

SELECT is(
  (SELECT count(*)::integer FROM public.document_chunks
   WHERE id = 'c0000000-0000-0000-0000-000000000004'::uuid),
  0,
  'Charlie cannot see chunk whose parent document has NULL org_id'
);

-- ============================================================
-- TEST 7: Security — Anonymous gets 0 rows
-- ============================================================
SELECT tests.set_anon();

SELECT is(
  (SELECT count(*)::integer FROM public.document_chunks),
  0,
  'Anonymous user sees 0 document_chunks'
);

-- ============================================================
-- TEST 8: Security — Service role sees all rows
-- ============================================================
SELECT tests.reset_role();

SELECT cmp_ok(
  (SELECT count(*)::integer FROM public.document_chunks),
  '>=',
  4,
  'Superuser sees all chunks (>= 4 including orphan)'
);

-- ============================================================
-- CLEANUP
-- ============================================================
SELECT * FROM finish();
ROLLBACK;
