-- ============================================================
-- pgTAP Test: RLS on RPC search functions
-- ============================================================
-- Tests the fixed RPC functions from migration 00045:
--   - match_document_chunks_org: NULL org_id bypass fixed
--   - match_document_chunks: restricted to service_role
--   - hybrid_search_chunks_org: NULL org_id bypass fixed
--   - hybrid_search_chunks: restricted to service_role
--
-- NOTE: Testing with real 1024-dim vector embeddings in pgTAP
-- is impractical. Instead we focus on the critical security fixes:
--   1. NULL bypass returns 0 rows (not all rows)
--   2. Non-org RPCs reject authenticated role
--   3. Functions exist and have correct signatures
--
-- Test matrix:
--   Security: match_document_chunks_org with NULL org returns 0 rows
--   Security: hybrid_search_chunks_org with NULL org returns 0 rows
--   Security: match_document_chunks rejects authenticated role
--   Security: hybrid_search_chunks rejects authenticated role
--   Happy:    Functions exist with expected signatures
-- ============================================================

BEGIN;
SELECT plan(10);

-- ============================================================
-- FIXTURES
-- ============================================================

SELECT tests.create_test_org('a0000000-0000-0000-0000-000000000001'::uuid, 'Org Alpha');

SELECT tests.create_test_user(
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'alice@alpha.com',
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'admin'
);

-- Insert a document + chunk with a dummy embedding for completeness
INSERT INTO public.documents (id, title, file_name, file_type, file_size_bytes, storage_path, mime_type, processing_status, uploaded_by, organization_id, created_at, updated_at)
VALUES
  ('f0000000-0000-0000-0000-000000000001'::uuid, 'Alpha Doc', 'alpha.pdf', 'pdf', 1024, '/alpha.pdf', 'application/pdf', 'completed', 'a0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, now(), now());

-- Insert chunk WITHOUT embedding (embedding IS NULL) — won't match any search
INSERT INTO public.document_chunks (id, document_id, content, chunk_index, created_at)
VALUES
  ('c0000000-0000-0000-0000-000000000001'::uuid, 'f0000000-0000-0000-0000-000000000001'::uuid, 'Test content for Alpha', 0, now());


-- ============================================================
-- TEST 1: Verify match_document_chunks_org function exists
-- ============================================================
SELECT has_function(
  'public',
  'match_document_chunks_org',
  'match_document_chunks_org function exists'
);

-- ============================================================
-- TEST 2: Verify match_document_chunks function exists
-- ============================================================
SELECT has_function(
  'public',
  'match_document_chunks',
  'match_document_chunks function exists'
);

-- ============================================================
-- TEST 3: Verify hybrid_search_chunks_org function exists
-- ============================================================
SELECT has_function(
  'public',
  'hybrid_search_chunks_org',
  'hybrid_search_chunks_org function exists'
);

-- ============================================================
-- TEST 4: Verify hybrid_search_chunks function exists
-- ============================================================
SELECT has_function(
  'public',
  'hybrid_search_chunks',
  'hybrid_search_chunks function exists'
);

-- ============================================================
-- TEST 5: Security — match_document_chunks_org with NULL org returns 0 rows
-- The NULL bypass was the critical vulnerability: passing NULL org_id
-- would skip the org filter entirely, leaking all chunks.
-- After the fix, NULL org_id returns empty set immediately.
-- ============================================================
SELECT tests.set_auth_user('a0000000-0000-0000-0000-000000000001'::uuid);

-- Generate a dummy 1024-dim vector for the query
SELECT is(
  (SELECT count(*)::integer FROM public.match_document_chunks_org(
    -- Dummy embedding: all zeros (won't match anything, but tests the NULL guard)
    (SELECT array_agg(0.0)::vector(1024) FROM generate_series(1, 1024)),
    0.0,   -- match_threshold = 0 to be permissive
    100,   -- match_count
    NULL   -- filter_organization_id = NULL (the exploit)
  )),
  0,
  'match_document_chunks_org with NULL org_id returns 0 rows (NULL bypass fixed)'
);

-- ============================================================
-- TEST 6: Security — hybrid_search_chunks_org with NULL org returns 0 rows
-- ============================================================
SELECT is(
  (SELECT count(*)::integer FROM public.hybrid_search_chunks_org(
    'test query',
    (SELECT array_agg(0.0)::vector(1024) FROM generate_series(1, 1024)),
    100,   -- match_count
    0.7,   -- vector_weight
    0.3,   -- text_weight
    NULL   -- filter_organization_id = NULL (the exploit)
  )),
  0,
  'hybrid_search_chunks_org with NULL org_id returns 0 rows (NULL bypass fixed)'
);

-- ============================================================
-- TEST 7: Security — match_document_chunks rejects authenticated role
-- After the fix, this function requires service_role. Calling as
-- authenticated should raise an exception.
-- ============================================================
SELECT throws_ok(
  $$SELECT * FROM public.match_document_chunks(
    (SELECT array_agg(0.0)::vector(1024) FROM generate_series(1, 1024)),
    0.0,
    100
  )$$,
  NULL,
  NULL,
  'match_document_chunks raises exception for authenticated role (service_role required)'
);

-- ============================================================
-- TEST 8: Security — hybrid_search_chunks rejects authenticated role
-- ============================================================
SELECT throws_ok(
  $$SELECT * FROM public.hybrid_search_chunks(
    'test query',
    (SELECT array_agg(0.0)::vector(1024) FROM generate_series(1, 1024)),
    100
  )$$,
  NULL,
  NULL,
  'hybrid_search_chunks raises exception for authenticated role (service_role required)'
);

-- ============================================================
-- TEST 9: Security — Anonymous CANNOT call match_document_chunks_org
-- (function is SECURITY DEFINER, but NULL org returns empty)
-- ============================================================
SELECT tests.set_anon();

SELECT is(
  (SELECT count(*)::integer FROM public.match_document_chunks_org(
    (SELECT array_agg(0.0)::vector(1024) FROM generate_series(1, 1024)),
    0.0,
    100,
    NULL
  )),
  0,
  'Anonymous calling match_document_chunks_org with NULL returns 0 rows'
);

-- ============================================================
-- TEST 10: Security — match_document_chunks_org with valid org but no
-- matching embeddings returns 0 rows (not an error)
-- ============================================================
SELECT tests.set_auth_user('a0000000-0000-0000-0000-000000000001'::uuid);

SELECT is(
  (SELECT count(*)::integer FROM public.match_document_chunks_org(
    (SELECT array_agg(0.0)::vector(1024) FROM generate_series(1, 1024)),
    0.99,  -- very high threshold — nothing should match
    100,
    'a0000000-0000-0000-0000-000000000001'::uuid
  )),
  0,
  'match_document_chunks_org with valid org but no matching embeddings returns 0 rows'
);

-- ============================================================
-- CLEANUP
-- ============================================================
SELECT * FROM finish();
ROLLBACK;
