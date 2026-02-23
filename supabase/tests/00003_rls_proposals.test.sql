-- ============================================================
-- pgTAP Test: RLS Policies on proposals and all child tables
-- ============================================================
-- Tables covered: proposals, proposal_sections, section_sources,
--   section_claims, section_outcome_mapping, verification_log,
--   deal_outcome_history, section_feedback, proposal_versions,
--   section_versions
--
-- Test matrix:
--   Happy: User sees own org's proposals and child data
--   Bad:   User CANNOT see other org's proposals or child data
--   Bad:   User CANNOT insert proposal with wrong org_id
--   Bad:   User CANNOT update/delete proposals in other org
--   Edge:  proposal_versions visible to org members (not just creator)
--   Edge:  section_versions visible to org members (not just creator)
--   Security: Anonymous gets 0 rows from all tables
--   Security: Service role sees all rows
-- ============================================================

BEGIN;
SELECT plan(15);

-- ============================================================
-- FIXTURES: Fixed UUIDs for reproducibility
-- ============================================================

-- Organizations
SELECT tests.create_test_org('a0000000-0000-0000-0000-000000000001'::uuid, 'Org Alpha');
SELECT tests.create_test_org('b0000000-0000-0000-0000-000000000002'::uuid, 'Org Beta');

-- Org Alpha: admin + member
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

-- Org Beta: admin + member
SELECT tests.create_test_user(
  'u0000000-0000-0000-0000-000000000003'::uuid,
  'charlie@beta.com',
  'b0000000-0000-0000-0000-000000000002'::uuid,
  'admin'
);
SELECT tests.create_test_user(
  'u0000000-0000-0000-0000-000000000004'::uuid,
  'diana@beta.com',
  'b0000000-0000-0000-0000-000000000002'::uuid,
  'member'
);

-- -----------------------------------------------
-- Insert test data as superuser (bypass RLS)
-- -----------------------------------------------

-- Proposals
INSERT INTO public.proposals (id, title, status, intake_data, created_by, organization_id, created_at, updated_at)
VALUES
  ('d0000000-0000-0000-0000-000000000001'::uuid, 'Alpha Proposal', 'draft', '{}', 'u0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, now(), now()),
  ('d0000000-0000-0000-0000-000000000002'::uuid, 'Beta Proposal',  'draft', '{}', 'u0000000-0000-0000-0000-000000000003'::uuid, 'b0000000-0000-0000-0000-000000000002'::uuid, now(), now());

-- Proposal Sections
INSERT INTO public.proposal_sections (id, proposal_id, section_type, section_order, title, created_at, updated_at)
VALUES
  ('e0000000-0000-0000-0000-000000000001'::uuid, 'd0000000-0000-0000-0000-000000000001'::uuid, 'executive_summary', 1, 'Alpha Exec Summary', now(), now()),
  ('e0000000-0000-0000-0000-000000000002'::uuid, 'd0000000-0000-0000-0000-000000000002'::uuid, 'executive_summary', 1, 'Beta Exec Summary',  now(), now());

-- Documents + Chunks (needed for section_sources FK)
INSERT INTO public.documents (id, title, file_name, file_type, file_size_bytes, storage_path, mime_type, processing_status, uploaded_by, organization_id, created_at, updated_at)
VALUES
  ('f0000000-0000-0000-0000-000000000001'::uuid, 'Alpha Doc', 'alpha.pdf', 'pdf', 1024, '/alpha.pdf', 'application/pdf', 'completed', 'u0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, now(), now());

INSERT INTO public.document_chunks (id, document_id, content, chunk_index, created_at)
VALUES
  ('c0000000-0000-0000-0000-000000000001'::uuid, 'f0000000-0000-0000-0000-000000000001'::uuid, 'Alpha chunk content', 0, now());

-- Section Sources
INSERT INTO public.section_sources (id, section_id, chunk_id, relevance_score, created_at)
VALUES
  ('a1000000-0000-0000-0000-000000000001'::uuid, 'e0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid, 0.9, now());

-- Section Claims
INSERT INTO public.section_claims (id, section_id, claim_text, claim_type, verification_status, created_at, updated_at)
VALUES
  ('a2000000-0000-0000-0000-000000000001'::uuid, 'e0000000-0000-0000-0000-000000000001'::uuid, 'We reduced costs by 40%', 'metric', 'unverified', now(), now()),
  ('a2000000-0000-0000-0000-000000000002'::uuid, 'e0000000-0000-0000-0000-000000000002'::uuid, 'Beta claim text', 'capability', 'unverified', now(), now());

-- Section Outcome Mapping
INSERT INTO public.section_outcome_mapping (id, section_id, outcome_key, outcome_description, created_at)
VALUES
  ('a3000000-0000-0000-0000-000000000001'::uuid, 'e0000000-0000-0000-0000-000000000001'::uuid, 'cost_reduction', 'Reduce infra cost', now()),
  ('a3000000-0000-0000-0000-000000000002'::uuid, 'e0000000-0000-0000-0000-000000000002'::uuid, 'speed_increase', 'Improve delivery speed', now());

-- Verification Log
INSERT INTO public.verification_log (id, proposal_id, verification_type, status, message, created_at)
VALUES
  ('a4000000-0000-0000-0000-000000000001'::uuid, 'd0000000-0000-0000-0000-000000000001'::uuid, 'claim_verification', 'passed', 'All good', now()),
  ('a4000000-0000-0000-0000-000000000002'::uuid, 'd0000000-0000-0000-0000-000000000002'::uuid, 'claim_verification', 'passed', 'Beta ok', now());

-- Deal Outcome History
INSERT INTO public.deal_outcome_history (id, proposal_id, new_outcome, changed_by, changed_at)
VALUES
  ('a5000000-0000-0000-0000-000000000001'::uuid, 'd0000000-0000-0000-0000-000000000001'::uuid, 'won', 'u0000000-0000-0000-0000-000000000001'::uuid, now()),
  ('a5000000-0000-0000-0000-000000000002'::uuid, 'd0000000-0000-0000-0000-000000000002'::uuid, 'lost', 'u0000000-0000-0000-0000-000000000003'::uuid, now());

-- Section Feedback
INSERT INTO public.section_feedback (id, section_id, proposal_id, feedback_type, created_by, created_at)
VALUES
  ('a6000000-0000-0000-0000-000000000001'::uuid, 'e0000000-0000-0000-0000-000000000001'::uuid, 'd0000000-0000-0000-0000-000000000001'::uuid, 'helpful', 'u0000000-0000-0000-0000-000000000001'::uuid, now()),
  ('a6000000-0000-0000-0000-000000000002'::uuid, 'e0000000-0000-0000-0000-000000000002'::uuid, 'd0000000-0000-0000-0000-000000000002'::uuid, 'excellent', 'u0000000-0000-0000-0000-000000000003'::uuid, now());

-- Proposal Versions (created by Alice in Alpha, but should be visible to Bob too)
INSERT INTO public.proposal_versions (id, proposal_id, version_number, title, trigger_event, created_by, created_at)
VALUES
  ('a7000000-0000-0000-0000-000000000001'::uuid, 'd0000000-0000-0000-0000-000000000001'::uuid, 1, 'Alpha Proposal v1', 'manual_save', 'u0000000-0000-0000-0000-000000000001'::uuid, now()),
  ('a7000000-0000-0000-0000-000000000002'::uuid, 'd0000000-0000-0000-0000-000000000002'::uuid, 1, 'Beta Proposal v1', 'manual_save', 'u0000000-0000-0000-0000-000000000003'::uuid, now());

-- Section Versions
INSERT INTO public.section_versions (id, proposal_version_id, original_section_id, title, section_type, section_order, created_at)
VALUES
  ('a8000000-0000-0000-0000-000000000001'::uuid, 'a7000000-0000-0000-0000-000000000001'::uuid, 'e0000000-0000-0000-0000-000000000001'::uuid, 'Alpha Exec v1', 'executive_summary', 1, now()),
  ('a8000000-0000-0000-0000-000000000002'::uuid, 'a7000000-0000-0000-0000-000000000002'::uuid, 'e0000000-0000-0000-0000-000000000002'::uuid, 'Beta Exec v1', 'executive_summary', 1, now());


-- ============================================================
-- TEST 1: Happy — Alice sees own org's proposal
-- ============================================================
SELECT tests.set_auth_user('u0000000-0000-0000-0000-000000000001'::uuid);

SELECT is(
  (SELECT count(*)::integer FROM public.proposals),
  1,
  'Alice sees exactly 1 proposal (her org)'
);

-- ============================================================
-- TEST 2: Happy — Alice sees own org's child data (sections, sources, claims, etc.)
-- ============================================================
SELECT is(
  (SELECT count(*)::integer FROM public.proposal_sections),
  1,
  'Alice sees 1 proposal_section (her org only)'
);

-- ============================================================
-- TEST 3: Happy — Alice sees section_sources for her org
-- ============================================================
SELECT is(
  (SELECT count(*)::integer FROM public.section_sources),
  1,
  'Alice sees 1 section_source (her org only)'
);

-- ============================================================
-- TEST 4: Bad — Alice CANNOT see other org's proposals (0 from Beta)
-- ============================================================
SELECT is(
  (SELECT count(*)::integer FROM public.proposals
   WHERE organization_id = 'b0000000-0000-0000-0000-000000000002'::uuid),
  0,
  'Alice cannot see Beta org proposals'
);

-- ============================================================
-- TEST 5: Bad — Alice CANNOT see other org's child data
-- ============================================================
SELECT is(
  (SELECT count(*)::integer FROM public.section_claims),
  1,
  'Alice sees only 1 section_claim (her org); Beta claim invisible'
);

-- ============================================================
-- TEST 6: Bad — Alice CANNOT see Beta's outcome mapping / verification / feedback
-- ============================================================
SELECT is(
  (SELECT count(*)::integer FROM public.section_outcome_mapping) +
  (SELECT count(*)::integer FROM public.verification_log) +
  (SELECT count(*)::integer FROM public.deal_outcome_history) +
  (SELECT count(*)::integer FROM public.section_feedback),
  4,
  'Alice sees exactly 4 child rows total (1 each from her org, 0 from Beta)'
);

-- ============================================================
-- TEST 7: Bad — Alice CANNOT insert proposal with wrong org_id
-- ============================================================
SELECT throws_ok(
  $$INSERT INTO public.proposals (id, title, status, intake_data, created_by, organization_id)
    VALUES ('d0000000-0000-0000-0000-000000000099', 'Sneaky', 'draft', '{}',
            'u0000000-0000-0000-0000-000000000001',
            'b0000000-0000-0000-0000-000000000002')$$,
  NULL,
  NULL,
  'Alice cannot insert proposal with Beta org_id (RLS denies)'
);

-- ============================================================
-- TEST 8: Bad — Alice CANNOT update proposals in other org
-- ============================================================
SELECT is(
  (SELECT count(*)::integer FROM (
    UPDATE public.proposals SET title = 'HACKED'
    WHERE id = 'd0000000-0000-0000-0000-000000000002'::uuid
    RETURNING id
  ) t),
  0,
  'Alice cannot update Beta proposal (0 rows affected)'
);

-- ============================================================
-- TEST 9: Bad — Alice CANNOT delete proposals in other org
-- ============================================================
SELECT is(
  (SELECT count(*)::integer FROM (
    DELETE FROM public.proposals
    WHERE id = 'd0000000-0000-0000-0000-000000000002'::uuid
    RETURNING id
  ) t),
  0,
  'Alice cannot delete Beta proposal (0 rows affected)'
);

-- ============================================================
-- TEST 10: Edge — proposal_versions visible to org member (Bob), not just creator
-- ============================================================
SELECT tests.set_auth_user('u0000000-0000-0000-0000-000000000002'::uuid);

SELECT is(
  (SELECT count(*)::integer FROM public.proposal_versions
   WHERE proposal_id = 'd0000000-0000-0000-0000-000000000001'::uuid),
  1,
  'Bob (member, same org) can see proposal_versions created by Alice'
);

-- ============================================================
-- TEST 11: Edge — section_versions visible to org member (Bob), not just creator
-- ============================================================
SELECT is(
  (SELECT count(*)::integer FROM public.section_versions),
  1,
  'Bob can see section_versions for his org (not just creator)'
);

-- ============================================================
-- TEST 12: Edge — Bob CANNOT see Beta's proposal_versions
-- ============================================================
SELECT is(
  (SELECT count(*)::integer FROM public.proposal_versions
   WHERE proposal_id = 'd0000000-0000-0000-0000-000000000002'::uuid),
  0,
  'Bob cannot see Beta org proposal_versions'
);

-- ============================================================
-- TEST 13: Security — Anonymous gets 0 rows from all tables
-- ============================================================
SELECT tests.set_anon();

SELECT is(
  (SELECT count(*)::integer FROM public.proposals) +
  (SELECT count(*)::integer FROM public.proposal_sections) +
  (SELECT count(*)::integer FROM public.section_sources) +
  (SELECT count(*)::integer FROM public.section_claims) +
  (SELECT count(*)::integer FROM public.verification_log) +
  (SELECT count(*)::integer FROM public.deal_outcome_history) +
  (SELECT count(*)::integer FROM public.section_feedback) +
  (SELECT count(*)::integer FROM public.proposal_versions) +
  (SELECT count(*)::integer FROM public.section_versions),
  0,
  'Anonymous sees 0 rows across all proposal-related tables'
);

-- ============================================================
-- TEST 14: Security — Service role sees all rows
-- ============================================================
SELECT tests.reset_role();

SELECT cmp_ok(
  (SELECT count(*)::integer FROM public.proposals),
  '>=',
  2,
  'Superuser sees all proposals (>= 2)'
);

-- ============================================================
-- TEST 15: Security — Service role sees all child rows
-- ============================================================
SELECT cmp_ok(
  (SELECT count(*)::integer FROM public.proposal_versions),
  '>=',
  2,
  'Superuser sees all proposal_versions (>= 2)'
);

-- ============================================================
-- CLEANUP
-- ============================================================
SELECT * FROM finish();
ROLLBACK;
