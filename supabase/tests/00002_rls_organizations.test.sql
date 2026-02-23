-- ============================================================
-- pgTAP Test: RLS Policies on organizations table
-- ============================================================
-- Test matrix:
--   Happy: Admin sees own org
--   Happy: Member sees own org
--   Happy: Admin can update own org
--   Bad:   Admin CANNOT see Org B
--   Bad:   Non-admin CANNOT update own org
--   Bad:   Admin CANNOT update Org B
--   Bad:   Admin CANNOT insert new org directly
--   Edge:  Orphan user (NULL org_id) sees 0 orgs
--   Security: Anonymous gets 0 rows
--   Security: Service role sees all rows
-- ============================================================

BEGIN;
SELECT plan(11);

-- ============================================================
-- FIXTURES
-- ============================================================

-- Organizations
SELECT tests.create_test_org('a0000000-0000-0000-0000-000000000001'::uuid, 'Org Alpha');
SELECT tests.create_test_org('b0000000-0000-0000-0000-000000000002'::uuid, 'Org Beta');

-- Org Alpha users
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

-- Org Beta admin
SELECT tests.create_test_user(
  'a0000000-0000-0000-0000-000000000003'::uuid,
  'charlie@beta.com',
  'b0000000-0000-0000-0000-000000000002'::uuid,
  'admin'
);

-- Orphan user
SELECT tests.create_test_user_no_org(
  'a0000000-0000-0000-0000-000000000099'::uuid,
  'orphan@nowhere.com'
);

-- ============================================================
-- TEST 1: Happy — Admin (Alice) sees own org
-- ============================================================
SELECT tests.set_auth_user('a0000000-0000-0000-0000-000000000001'::uuid);

SELECT is(
  (SELECT count(*)::integer FROM public.organizations
   WHERE id = 'a0000000-0000-0000-0000-000000000001'::uuid),
  1,
  'Alice (admin) can see Org Alpha'
);

-- ============================================================
-- TEST 2: Happy — Member (Bob) sees own org
-- ============================================================
SELECT tests.set_auth_user('a0000000-0000-0000-0000-000000000002'::uuid);

SELECT is(
  (SELECT count(*)::integer FROM public.organizations
   WHERE id = 'a0000000-0000-0000-0000-000000000001'::uuid),
  1,
  'Bob (member) can see Org Alpha'
);

-- ============================================================
-- TEST 3: Happy — Admin can update own org name
-- ============================================================
SELECT tests.set_auth_user('a0000000-0000-0000-0000-000000000001'::uuid);

SELECT lives_ok(
  $$UPDATE public.organizations SET name = 'Org Alpha Updated'
    WHERE id = 'a0000000-0000-0000-0000-000000000001'::uuid$$,
  'Alice (admin) can update Org Alpha'
);

-- ============================================================
-- TEST 4: Bad — Alice (Org Alpha) CANNOT see Org Beta
-- ============================================================
SELECT is(
  (SELECT count(*)::integer FROM public.organizations
   WHERE id = 'b0000000-0000-0000-0000-000000000002'::uuid),
  0,
  'Alice cannot see Org Beta'
);

-- ============================================================
-- TEST 5: Bad — Alice sees exactly 1 organization (her own)
-- ============================================================
SELECT is(
  (SELECT count(*)::integer FROM public.organizations),
  1,
  'Alice sees exactly 1 organization total'
);

-- ============================================================
-- TEST 6: Bad — Non-admin (Bob) CANNOT update own org
-- ============================================================
SELECT tests.set_auth_user('a0000000-0000-0000-0000-000000000002'::uuid);

SELECT is_empty(
  $$UPDATE public.organizations SET name = 'HACKED by Bob'
    WHERE id = 'a0000000-0000-0000-0000-000000000001'::uuid
    RETURNING id$$,
  'Bob (member) cannot update Org Alpha'
);

-- ============================================================
-- TEST 7: Bad — Admin CANNOT update Org B (cross-tenant)
-- ============================================================
SELECT tests.set_auth_user('a0000000-0000-0000-0000-000000000001'::uuid);

SELECT is_empty(
  $$UPDATE public.organizations SET name = 'HACKED by Alice'
    WHERE id = 'b0000000-0000-0000-0000-000000000002'::uuid
    RETURNING id$$,
  'Alice (admin, Org Alpha) cannot update Org Beta'
);

-- ============================================================
-- TEST 8: Bad — Admin CANNOT insert new org directly
-- No INSERT policy exists on organizations table
-- ============================================================
SELECT throws_ok(
  $$INSERT INTO public.organizations (id, name, slug)
    VALUES ('c0000000-0000-0000-0000-000000000003', 'Sneaky Org', 'sneaky-org')$$,
  NULL,
  NULL,
  'Admin cannot directly insert a new organization (no INSERT policy)'
);

-- ============================================================
-- TEST 9: Edge — Orphan user (NULL org_id) sees 0 orgs
-- ============================================================
SELECT tests.set_auth_user('a0000000-0000-0000-0000-000000000099'::uuid);

SELECT is(
  (SELECT count(*)::integer FROM public.organizations),
  0,
  'Orphan user with NULL org_id sees 0 organizations'
);

-- ============================================================
-- TEST 10: Security — Anonymous gets 0 rows
-- ============================================================
SELECT tests.set_anon();

SELECT is(
  (SELECT count(*)::integer FROM public.organizations),
  0,
  'Anonymous user sees 0 organizations'
);

-- ============================================================
-- TEST 11: Security — Service role sees all rows
-- ============================================================
SELECT tests.reset_role();

SELECT cmp_ok(
  (SELECT count(*)::integer FROM public.organizations),
  '>=',
  2,
  'Superuser sees all organizations (>= 2)'
);

-- ============================================================
-- CLEANUP
-- ============================================================
SELECT * FROM finish();
ROLLBACK;
