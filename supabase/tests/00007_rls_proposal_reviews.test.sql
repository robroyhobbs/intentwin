-- ============================================================
-- pgTAP Test: RLS Policies on proposal_reviews table
-- ============================================================
-- proposal_reviews was wide open (USING(true) for SELECT,
-- auth.uid() IS NOT NULL for INSERT). Now org-scoped via
-- proposal join.
--
-- Test matrix:
--   Happy: User sees reviews for own org's proposals
--   Happy: User can create review for own org's proposal
--   Bad:   User CANNOT see reviews for other org's proposals
--   Bad:   User CANNOT create review for other org's proposal
--   Edge:  User can update own review (reviewer_id check unchanged)
--   Edge:  User CANNOT update another user's review
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

-- Users
SELECT tests.create_test_user(
  'u0000000-0000-0000-0000-000000000001'::uuid,
  'alice@alpha.com',
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'admin'
);
SELECT tests.create_test_user(
  'u0000000-0000-0000-0000-000000000002'::uuid,
  'bob@alpha.com',
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'member'
);
SELECT tests.create_test_user(
  'u0000000-0000-0000-0000-000000000003'::uuid,
  'charlie@beta.com',
  'b0000000-0000-0000-0000-000000000002'::uuid,
  'admin'
);

-- -----------------------------------------------
-- Proposals (superuser insert, bypass RLS)
-- -----------------------------------------------
INSERT INTO public.proposals (id, title, status, intake_data, created_by, organization_id, created_at, updated_at)
VALUES
  ('d0000000-0000-0000-0000-000000000001'::uuid, 'Alpha Proposal', 'draft', '{}', 'u0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, now(), now()),
  ('d0000000-0000-0000-0000-000000000002'::uuid, 'Beta Proposal',  'draft', '{}', 'u0000000-0000-0000-0000-000000000003'::uuid, 'b0000000-0000-0000-0000-000000000002'::uuid, now(), now());

-- Sections (needed for section_id FK in reviews)
INSERT INTO public.proposal_sections (id, proposal_id, section_type, section_order, title, created_at, updated_at)
VALUES
  ('e0000000-0000-0000-0000-000000000001'::uuid, 'd0000000-0000-0000-0000-000000000001'::uuid, 'executive_summary', 1, 'Alpha Exec', now(), now()),
  ('e0000000-0000-0000-0000-000000000002'::uuid, 'd0000000-0000-0000-0000-000000000002'::uuid, 'executive_summary', 1, 'Beta Exec',  now(), now());

-- Reviews (superuser insert)
INSERT INTO public.proposal_reviews (id, proposal_id, section_id, reviewer_id, reviewer_email, content, created_at, updated_at)
VALUES
  ('r0000000-0000-0000-0000-000000000001'::uuid, 'd0000000-0000-0000-0000-000000000001'::uuid, 'e0000000-0000-0000-0000-000000000001'::uuid, 'u0000000-0000-0000-0000-000000000001'::uuid, 'alice@alpha.com', 'Looks good', now(), now()),
  ('r0000000-0000-0000-0000-000000000002'::uuid, 'd0000000-0000-0000-0000-000000000001'::uuid, 'e0000000-0000-0000-0000-000000000001'::uuid, 'u0000000-0000-0000-0000-000000000002'::uuid, 'bob@alpha.com', 'Needs work', now(), now()),
  ('r0000000-0000-0000-0000-000000000003'::uuid, 'd0000000-0000-0000-0000-000000000002'::uuid, 'e0000000-0000-0000-0000-000000000002'::uuid, 'u0000000-0000-0000-0000-000000000003'::uuid, 'charlie@beta.com', 'Beta review', now(), now());

-- ============================================================
-- TEST 1: Happy — Alice sees reviews for own org's proposals
-- ============================================================
SELECT tests.set_auth_user('u0000000-0000-0000-0000-000000000001'::uuid);

SELECT is(
  (SELECT count(*)::integer FROM public.proposal_reviews),
  2,
  'Alice sees 2 reviews (both on Alpha proposal)'
);

-- ============================================================
-- TEST 2: Happy — Alice can create review for own org's proposal
-- ============================================================
SELECT lives_ok(
  $$INSERT INTO public.proposal_reviews (id, proposal_id, section_id, reviewer_id, reviewer_email, content)
    VALUES ('r0000000-0000-0000-0000-000000000099',
            'd0000000-0000-0000-0000-000000000001',
            'e0000000-0000-0000-0000-000000000001',
            'u0000000-0000-0000-0000-000000000001',
            'alice@alpha.com',
            'Another review from Alice')$$,
  'Alice can insert review for her org proposal'
);

-- ============================================================
-- TEST 3: Bad — Alice CANNOT see reviews for Beta's proposals
-- (Previously USING(true) allowed this!)
-- ============================================================
SELECT is(
  (SELECT count(*)::integer FROM public.proposal_reviews
   WHERE proposal_id = 'd0000000-0000-0000-0000-000000000002'::uuid),
  0,
  'Alice cannot see reviews on Beta proposal (was USING(true), now org-scoped)'
);

-- ============================================================
-- TEST 4: Bad — Alice CANNOT create review for Beta's proposal
-- ============================================================
SELECT throws_ok(
  $$INSERT INTO public.proposal_reviews (id, proposal_id, section_id, reviewer_id, reviewer_email, content)
    VALUES ('r0000000-0000-0000-0000-000000000098',
            'd0000000-0000-0000-0000-000000000002',
            'e0000000-0000-0000-0000-000000000002',
            'u0000000-0000-0000-0000-000000000001',
            'alice@alpha.com',
            'Sneaky cross-org review')$$,
  NULL,
  NULL,
  'Alice cannot insert review for Beta proposal (RLS denies)'
);

-- ============================================================
-- TEST 5: Bad — Charlie (Beta) CANNOT see Alpha's reviews
-- ============================================================
SELECT tests.set_auth_user('u0000000-0000-0000-0000-000000000003'::uuid);

SELECT is(
  (SELECT count(*)::integer FROM public.proposal_reviews
   WHERE proposal_id = 'd0000000-0000-0000-0000-000000000001'::uuid),
  0,
  'Charlie cannot see reviews on Alpha proposal'
);

-- ============================================================
-- TEST 6: Happy — Charlie sees only Beta's review
-- ============================================================
SELECT is(
  (SELECT count(*)::integer FROM public.proposal_reviews),
  1,
  'Charlie sees exactly 1 review (Beta org only)'
);

-- ============================================================
-- TEST 7: Edge — Alice can update her own review (reviewer_id match)
-- ============================================================
SELECT tests.set_auth_user('u0000000-0000-0000-0000-000000000001'::uuid);

SELECT is(
  (SELECT count(*)::integer FROM (
    UPDATE public.proposal_reviews SET content = 'Updated by Alice'
    WHERE id = 'r0000000-0000-0000-0000-000000000001'::uuid
    RETURNING id
  ) t),
  1,
  'Alice can update her own review'
);

-- ============================================================
-- TEST 8: Edge — Alice CANNOT update Bob's review (different reviewer_id)
-- ============================================================
SELECT is(
  (SELECT count(*)::integer FROM (
    UPDATE public.proposal_reviews SET content = 'HACKED by Alice'
    WHERE id = 'r0000000-0000-0000-0000-000000000002'::uuid
    RETURNING id
  ) t),
  0,
  'Alice cannot update Bob''s review (reviewer_id mismatch)'
);

-- ============================================================
-- TEST 9: Security — Anonymous gets 0 rows
-- ============================================================
SELECT tests.set_anon();

SELECT is(
  (SELECT count(*)::integer FROM public.proposal_reviews),
  0,
  'Anonymous user sees 0 proposal_reviews'
);

-- ============================================================
-- TEST 10: Security — Service role sees all rows
-- ============================================================
SELECT tests.reset_role();

SELECT cmp_ok(
  (SELECT count(*)::integer FROM public.proposal_reviews),
  '>=',
  3,
  'Superuser sees all proposal_reviews (>= 3)'
);

-- ============================================================
-- CLEANUP
-- ============================================================
SELECT * FROM finish();
ROLLBACK;
