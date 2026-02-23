-- ============================================================
-- pgTAP Test: RLS Policies on profiles table
-- ============================================================
-- Test matrix:
--   Happy: User A sees own profile
--   Happy: User A sees profiles in same org
--   Happy: User A can update own profile
--   Bad:   User A CANNOT see profiles in org B
--   Bad:   User A CANNOT update profiles in org B
--   Edge:  User with NULL org_id sees only own profile
--   Edge:  get_user_organization_id() returns correct value
--   Security: Anonymous gets 0 rows
--   Security: Service role sees all rows
-- ============================================================

BEGIN;
SELECT plan(12);

-- ============================================================
-- FIXTURES: Fixed UUIDs for reproducibility
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

-- Org Beta user
SELECT tests.create_test_user(
  'a0000000-0000-0000-0000-000000000003'::uuid,
  'charlie@beta.com',
  'b0000000-0000-0000-0000-000000000002'::uuid,
  'admin'
);

-- Orphan user (NULL org_id)
SELECT tests.create_test_user_no_org(
  'a0000000-0000-0000-0000-000000000099'::uuid,
  'orphan@nowhere.com'
);

-- ============================================================
-- TEST 1: Happy — User A (Alice) sees own profile
-- ============================================================
SELECT tests.set_auth_user('a0000000-0000-0000-0000-000000000001'::uuid);

SELECT is(
  (SELECT count(*)::integer FROM public.profiles WHERE id = 'a0000000-0000-0000-0000-000000000001'::uuid),
  1,
  'Alice can see her own profile'
);

-- ============================================================
-- TEST 2: Happy — Alice sees Bob (same org)
-- ============================================================
SELECT is(
  (SELECT count(*)::integer FROM public.profiles WHERE id = 'a0000000-0000-0000-0000-000000000002'::uuid),
  1,
  'Alice can see Bob (same org Alpha)'
);

-- ============================================================
-- TEST 3: Happy — Alice sees all profiles in her org
-- ============================================================
SELECT is(
  (SELECT count(*)::integer FROM public.profiles
   WHERE organization_id = 'a0000000-0000-0000-0000-000000000001'::uuid),
  2,
  'Alice sees exactly 2 profiles in Org Alpha'
);

-- ============================================================
-- TEST 4: Happy — Alice can update own profile
-- ============================================================
SELECT lives_ok(
  $$UPDATE public.profiles SET full_name = 'Alice Updated'
    WHERE id = 'a0000000-0000-0000-0000-000000000001'::uuid$$,
  'Alice can update her own profile'
);

-- ============================================================
-- TEST 5: Bad — Alice CANNOT see profiles in Org Beta
-- ============================================================
SELECT is(
  (SELECT count(*)::integer FROM public.profiles
   WHERE organization_id = 'b0000000-0000-0000-0000-000000000002'::uuid),
  0,
  'Alice cannot see any profiles in Org Beta'
);

-- ============================================================
-- TEST 6: Bad — Alice CANNOT update Bob's profile (not her own)
-- ============================================================
-- profiles_update_own policy: USING ((select auth.uid()) = id)
-- Alice's uid != Bob's id, so this should affect 0 rows
-- Use is_empty with dollar-quoting since UPDATE inside subquery is not allowed
SELECT is_empty(
  $$UPDATE public.profiles SET full_name = 'HACKED'
    WHERE id = 'a0000000-0000-0000-0000-000000000002'::uuid
    RETURNING id$$,
  'Alice cannot update Bob''s profile (update returns 0 rows)'
);

-- ============================================================
-- TEST 7: Bad — Alice CANNOT see Charlie's profile in Org Beta
-- ============================================================
SELECT is(
  (SELECT count(*)::integer FROM public.profiles
   WHERE id = 'a0000000-0000-0000-0000-000000000003'::uuid),
  0,
  'Alice cannot see Charlie (different org)'
);

-- ============================================================
-- TEST 8: Edge — Orphan user (NULL org_id) sees only own profile
-- ============================================================
SELECT tests.set_auth_user('a0000000-0000-0000-0000-000000000099'::uuid);

SELECT is(
  (SELECT count(*)::integer FROM public.profiles),
  1,
  'Orphan user with NULL org_id sees only own profile'
);

-- ============================================================
-- TEST 9: Edge — get_user_organization_id() returns correct value
-- ============================================================
SELECT tests.set_auth_user('a0000000-0000-0000-0000-000000000001'::uuid);

SELECT is(
  get_user_organization_id(),
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'get_user_organization_id() returns Org Alpha ID for Alice'
);

-- ============================================================
-- TEST 10: Edge — get_user_organization_id() returns NULL for orphan
-- ============================================================
SELECT tests.set_auth_user('a0000000-0000-0000-0000-000000000099'::uuid);

SELECT is(
  get_user_organization_id(),
  NULL::uuid,
  'get_user_organization_id() returns NULL for orphan user'
);

-- ============================================================
-- TEST 11: Security — Anonymous gets 0 rows
-- ============================================================
SELECT tests.set_anon();

SELECT is(
  (SELECT count(*)::integer FROM public.profiles),
  0,
  'Anonymous user sees 0 profiles'
);

-- ============================================================
-- TEST 12: Security — Service role sees ALL rows
-- ============================================================
SELECT tests.reset_role();

SELECT cmp_ok(
  (SELECT count(*)::integer FROM public.profiles),
  '>=',
  4,
  'Superuser/service role sees all profiles (>= 4)'
);

-- ============================================================
-- CLEANUP
-- ============================================================
SELECT * FROM finish();
ROLLBACK;
