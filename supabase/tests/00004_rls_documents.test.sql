-- ============================================================
-- pgTAP Test: RLS Policies on documents table
-- ============================================================
-- Test matrix:
--   Happy: User sees own org's documents
--   Happy: User can insert document with own org_id
--   Bad:   User CANNOT see other org's documents
--   Bad:   User CANNOT insert document with wrong org_id
--   Bad:   User CANNOT update other org's documents
--   Bad:   User CANNOT delete other org's documents
--   Security: Anonymous gets 0 rows
--   Security: Service role sees all rows
-- ============================================================

BEGIN;
SELECT plan(10);

-- ============================================================
-- FIXTURES
-- ============================================================

-- Organizations
SELECT tests.create_test_org('a0000000-0000-0000-0000-000000000001'::uuid, 'Org Alpha');
SELECT tests.create_test_org('b0000000-0000-0000-0000-000000000002'::uuid, 'Org Beta');

-- Org Alpha: admin + member
SELECT tests.create_test_user(
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'alice@alpha.com',
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'admin'
);
SELECT tests.create_test_user(
  'a0000000-0000-0000-0000-000000000002'::uuid,
  'bob@alpha.com',
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'member'
);

-- Org Beta: admin
SELECT tests.create_test_user(
  'a0000000-0000-0000-0000-000000000003'::uuid,
  'charlie@beta.com',
  'b0000000-0000-0000-0000-000000000002'::uuid,
  'admin'
);

-- -----------------------------------------------
-- Insert test documents as superuser (bypass RLS)
-- -----------------------------------------------
INSERT INTO public.documents (id, title, file_name, file_type, file_size_bytes, storage_path, mime_type, processing_status, uploaded_by, organization_id, created_at, updated_at)
VALUES
  ('f0000000-0000-0000-0000-000000000001'::uuid, 'Alpha Doc', 'alpha.pdf', 'pdf', 1024, '/alpha.pdf', 'application/pdf', 'completed', 'a0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, now(), now()),
  ('f0000000-0000-0000-0000-000000000002'::uuid, 'Beta Doc',  'beta.pdf',  'pdf', 2048, '/beta.pdf',  'application/pdf', 'completed', 'a0000000-0000-0000-0000-000000000003'::uuid, 'b0000000-0000-0000-0000-000000000002'::uuid, now(), now());

-- ============================================================
-- TEST 1: Happy — Alice sees own org's documents
-- ============================================================
SELECT tests.set_auth_user('a0000000-0000-0000-0000-000000000001'::uuid);

SELECT is(
  (SELECT count(*)::integer FROM public.documents),
  1,
  'Alice sees exactly 1 document (her org)'
);

-- ============================================================
-- TEST 2: Happy — Alice sees the correct document
-- ============================================================
SELECT is(
  (SELECT title FROM public.documents WHERE id = 'f0000000-0000-0000-0000-000000000001'::uuid),
  'Alpha Doc',
  'Alice can see Alpha Doc by ID'
);

-- ============================================================
-- TEST 3: Happy — Alice can insert document with own org_id
-- ============================================================
SELECT lives_ok(
  $$INSERT INTO public.documents (id, title, file_name, file_type, file_size_bytes, storage_path, mime_type, uploaded_by, organization_id)
    VALUES ('f0000000-0000-0000-0000-000000000099', 'New Alpha Doc', 'new.pdf', 'pdf', 512, '/new.pdf', 'application/pdf',
            'a0000000-0000-0000-0000-000000000001',
            'a0000000-0000-0000-0000-000000000001')$$,
  'Alice can insert document with her own org_id'
);

-- ============================================================
-- TEST 4: Bad — Alice CANNOT see other org's documents
-- ============================================================
SELECT is(
  (SELECT count(*)::integer FROM public.documents
   WHERE organization_id = 'b0000000-0000-0000-0000-000000000002'::uuid),
  0,
  'Alice cannot see any documents from Org Beta'
);

-- ============================================================
-- TEST 5: Bad — Alice CANNOT insert document with wrong org_id
-- ============================================================
SELECT throws_ok(
  $$INSERT INTO public.documents (id, title, file_name, file_type, file_size_bytes, storage_path, mime_type, uploaded_by, organization_id)
    VALUES ('f0000000-0000-0000-0000-000000000098', 'Sneaky Doc', 'sneaky.pdf', 'pdf', 512, '/sneaky.pdf', 'application/pdf',
            'a0000000-0000-0000-0000-000000000001',
            'b0000000-0000-0000-0000-000000000002')$$,
  NULL,
  NULL,
  'Alice cannot insert document with Beta org_id'
);

-- ============================================================
-- TEST 6: Bad — Alice CANNOT update other org's documents
-- ============================================================
SELECT is_empty(
  $$UPDATE public.documents SET title = 'HACKED'
    WHERE id = 'f0000000-0000-0000-0000-000000000002'::uuid
    RETURNING id$$,
  'Alice cannot update Beta document (0 rows affected)'
);

-- ============================================================
-- TEST 7: Bad — Alice CANNOT delete other org's documents
-- ============================================================
SELECT is_empty(
  $$DELETE FROM public.documents
    WHERE id = 'f0000000-0000-0000-0000-000000000002'::uuid
    RETURNING id$$,
  'Alice cannot delete Beta document (0 rows affected)'
);

-- ============================================================
-- TEST 8: Happy — Bob (member, same org) sees Alpha's documents
-- ============================================================
SELECT tests.set_auth_user('a0000000-0000-0000-0000-000000000002'::uuid);

SELECT cmp_ok(
  (SELECT count(*)::integer FROM public.documents
   WHERE organization_id = 'a0000000-0000-0000-0000-000000000001'::uuid),
  '>=',
  1,
  'Bob (member) can see Alpha org documents'
);

-- ============================================================
-- TEST 9: Security — Anonymous gets 0 rows
-- ============================================================
SELECT tests.set_anon();

SELECT is(
  (SELECT count(*)::integer FROM public.documents),
  0,
  'Anonymous user sees 0 documents'
);

-- ============================================================
-- TEST 10: Security — Service role sees all rows
-- ============================================================
SELECT tests.reset_role();

SELECT cmp_ok(
  (SELECT count(*)::integer FROM public.documents),
  '>=',
  2,
  'Superuser sees all documents (>= 2)'
);

-- ============================================================
-- CLEANUP
-- ============================================================
SELECT * FROM finish();
ROLLBACK;
