# Execution Plan: Enterprise Hardening (Phase 1)

## Overview

Fix broken RLS policies across 13+ tables, write pgTAP tests proving tenant isolation, enforce AI mock usage in CI, and add network-level blocking to prevent real AI calls in E2E tests. Two parallel workstreams executed via git worktrees.

## Prerequisites

- Supabase CLI installed (`npx supabase` or global)
- Docker running (for `supabase test db`)
- Access to `~/intentwin` repository
- Existing 44 migrations applied to local Supabase

---

## Phase 0: RLS Migration — Fix Broken Policies

**Workstream A | Branch: `feat/rls-policy-tests`**

### Description

Write migration `00045_fix_rls_org_scoping.sql` that replaces all `team_id`-based and wide-open RLS policies with proper `organization_id`-scoped policies. This is the foundation — tests in Phase 1 verify this migration.

### Tests

#### Happy Path
- [ ] Migration applies cleanly on fresh `supabase db reset`
- [ ] Migration applies on top of existing 44 migrations
- [ ] All existing app queries still work after migration (E2E suite passes)

#### Bad Path
- [ ] Migration rolls back cleanly if partially applied (transaction-wrapped)
- [ ] Migration handles case where a policy was already dropped by a prior run (IF EXISTS)

#### Edge Cases
- [ ] Tables with no existing data still get correct policies
- [ ] `document_chunks` policy works when parent `documents.organization_id` is NULL (should deny)
- [ ] Storage policies handle paths with special characters in org IDs

#### Security
- [ ] Every `DROP POLICY` is paired with a `CREATE POLICY` — no window of no-policy
- [ ] RPCs with NULL default are fixed to require non-null org_id
- [ ] `match_document_chunks` (non-org version) is either dropped or restricted

#### Data Leak
- [ ] No policy uses `USING (true)` after migration (audit query confirms zero matches)
- [ ] No policy references `team_id` after migration (audit query confirms zero matches)

#### Data Damage
- [ ] Migration is wrapped in a transaction — partial apply is impossible
- [ ] No data is modified — only DDL changes (policies, functions)

### E2E Gate

```bash
# Apply migration and verify
supabase db reset
# Audit: zero team_id references in policies
psql "$DATABASE_URL" -c "SELECT policyname, qual FROM pg_policies WHERE qual LIKE '%team_id%';" | grep -c "team_id" | xargs test 0 -eq
# Audit: zero USING (true) on non-service tables
psql "$DATABASE_URL" -c "SELECT policyname, tablename, qual FROM pg_policies WHERE qual = 'true' AND tablename NOT IN ('waitlist', 'allowed_emails', 'waitlist_signups');" | grep -c "true" | xargs test 0 -eq
```

### Acceptance Criteria

- [ ] Migration `00045_fix_rls_org_scoping.sql` written and applies cleanly
- [ ] Zero `team_id` references remain in any RLS policy
- [ ] Zero `USING (true)` on user-facing tables
- [ ] All 4 RPCs fixed (NULL bypass removed)
- [ ] `proposal_versions` and `section_versions` updated to org-member access
- [ ] Storage policies include org-path scoping

---

## Phase 1: pgTAP Test Infrastructure + Core Table Tests

**Workstream A | Branch: `feat/rls-policy-tests`**

### Description

Set up pgTAP testing framework with `supabase/tests/` directory and helper functions. Write tests for `profiles` and `organizations` tables — the foundation of the tenant model.

### Tests

#### Happy Path
- [ ] `supabase test db` runs successfully with at least 1 test file
- [ ] Test fixture creates two orgs with two users each
- [ ] User A (org A) can SELECT own profile
- [ ] User A (org A) can SELECT other profiles in org A
- [ ] User A (org A) can UPDATE own profile
- [ ] Admin (org A) can SELECT own organization
- [ ] Admin (org A) can UPDATE own organization

#### Bad Path
- [ ] User A (org A) CANNOT SELECT profiles in org B — returns 0 rows
- [ ] User A (org A) CANNOT UPDATE profiles in org B — 0 rows affected
- [ ] User A (org A) CANNOT SELECT organization B — returns 0 rows
- [ ] Non-admin (org A) CANNOT UPDATE organization A — 0 rows affected
- [ ] User A CANNOT INSERT into organizations directly — policy violation

#### Edge Cases
- [ ] User with NULL organization_id cannot see any org-scoped data
- [ ] Newly created user (via trigger) gets correct org assignment
- [ ] `get_user_organization_id()` returns correct org for each user

#### Security
- [ ] Anonymous role gets 0 rows from profiles
- [ ] Anonymous role gets 0 rows from organizations
- [ ] Service role bypasses RLS and sees all rows

#### Data Leak
- [ ] Cross-org profile query returns empty set, not an error (no information leakage about existence)
- [ ] Error messages from policy violations don't reveal org structure

#### Data Damage
- [ ] Test transactions ROLLBACK — no test data persists
- [ ] Concurrent test runs don't interfere (each uses unique UUIDs)

### E2E Gate

```bash
supabase test db 2>&1 | tail -5
# Should show: "All tests passed" or similar success
```

### Acceptance Criteria

- [ ] `supabase/tests/` directory created with helper setup
- [ ] `00001_rls_profiles.test.sql` passes all assertions
- [ ] `00002_rls_organizations.test.sql` passes all assertions
- [ ] Test fixtures are self-contained (create + cleanup in transaction)

---

## Phase 2: pgTAP Tests — Proposals, Documents, Chunks, RPCs

**Workstream A | Branch: `feat/rls-policy-tests`**

### Description

Write tests for the high-value tables: proposals (+ child tables), documents, document_chunks, and the RPC functions. These are the tables where cross-tenant leakage has the most business impact.

### Tests

#### Happy Path
- [ ] User A can SELECT proposals in own org
- [ ] User A can INSERT proposal with own org_id
- [ ] User A can UPDATE own proposal
- [ ] Admin can DELETE proposal in own org
- [ ] User A can SELECT documents in own org
- [ ] User A can INSERT document with own org_id
- [ ] User A can SELECT document_chunks for own org's documents
- [ ] `match_document_chunks_org(embedding, org_a_id)` returns only org A chunks
- [ ] `hybrid_search_chunks_org(query, embedding, org_a_id)` returns only org A chunks

#### Bad Path
- [ ] User A CANNOT SELECT proposals in org B — 0 rows
- [ ] User A CANNOT INSERT proposal with org B's organization_id — policy violation
- [ ] User A CANNOT UPDATE proposals in org B — 0 rows affected
- [ ] User A CANNOT DELETE proposals in org B — 0 rows affected
- [ ] User A CANNOT SELECT documents in org B — 0 rows
- [ ] User A CANNOT INSERT document with org B's organization_id
- [ ] User A CANNOT SELECT document_chunks belonging to org B's documents
- [ ] `match_document_chunks_org(embedding, org_b_id)` returns 0 rows for user A
- [ ] User A CANNOT access proposal_sections of org B's proposals
- [ ] User A CANNOT access section_sources of org B's proposals
- [ ] User A CANNOT access section_claims of org B's proposals
- [ ] User A CANNOT access verification_log of org B's proposals
- [ ] User A CANNOT access deal_outcome_history of org B's proposals
- [ ] User A CANNOT access section_feedback of org B's proposals

#### Edge Cases
- [ ] Proposal with NULL organization_id is invisible to all non-service users
- [ ] Document chunk whose parent document has NULL org_id is invisible
- [ ] `match_document_chunks_org` with valid org_id but no matching chunks returns empty (not error)
- [ ] proposal_versions visible to org members (not just creator)
- [ ] section_versions visible to org members (not just creator)

#### Security
- [ ] Anonymous role gets 0 rows from all tested tables
- [ ] `match_document_chunks_org(embedding, NULL)` returns 0 rows or errors (NULL bypass fixed)
- [ ] `hybrid_search_chunks_org(query, embedding, NULL)` same behavior
- [ ] `match_document_chunks` (non-org version) either dropped or returns 0 for non-service role
- [ ] proposal_reviews SELECT no longer returns all reviews (USING(true) removed)
- [ ] proposal_reviews INSERT requires org membership on the related proposal

#### Data Leak
- [ ] Cross-org chunk query returns empty, not an error
- [ ] RPC error messages don't reveal existence of other orgs' data
- [ ] proposal_review content from org B not visible to org A

#### Data Damage
- [ ] All test transactions ROLLBACK cleanly
- [ ] No foreign key violations from test fixture creation/cleanup

### E2E Gate

```bash
supabase test db 2>&1 | tail -10
# All test files pass
# Verify specific counts:
supabase test db 2>&1 | grep -E "(ok|not ok)" | grep -c "not ok" | xargs test 0 -eq
```

### Acceptance Criteria

- [ ] `00003_rls_proposals.test.sql` passes (covers proposals + all child tables)
- [ ] `00004_rls_documents.test.sql` passes (covers documents + chunks)
- [ ] `00005_rls_document_chunks.test.sql` passes (chunk-specific edge cases)
- [ ] `00006_rls_rpcs.test.sql` passes (all 4 RPCs tested)
- [ ] `00007_rls_proposal_reviews.test.sql` passes (wide-open policy fixed + verified)
- [ ] Zero cross-tenant data access possible across all tested tables

---

## Phase 3: pgTAP Tests — Storage + CI Integration

**Workstream A | Branch: `feat/rls-policy-tests`**

### Description

Write storage bucket RLS tests and integrate all pgTAP tests into the GitHub Actions CI pipeline. This is the final phase for Workstream A.

### Tests

#### Happy Path
- [ ] Storage: User can upload to `organization-assets/{own_org_id}/` path
- [ ] Storage: User can read from `organization-assets/{own_org_id}/` path
- [ ] Storage: User can upload to `exported-proposals/{own_org_id}/` path
- [ ] Storage: User can read from `exported-proposals/{own_org_id}/` path
- [ ] CI: `supabase test db` runs successfully in GitHub Actions

#### Bad Path
- [ ] Storage: User CANNOT upload to `organization-assets/{other_org_id}/` path
- [ ] Storage: User CANNOT read from `organization-assets/{other_org_id}/` path
- [ ] Storage: User CANNOT read from `exported-proposals/{other_org_id}/` path
- [ ] CI: Pipeline fails when a pgTAP test fails (hard fail, blocks merge)

#### Edge Cases
- [ ] Storage: Paths with URL-encoded characters handled correctly
- [ ] Storage: Root-level uploads (no org prefix) are denied
- [ ] CI: Tests pass on clean runner with no cached Docker images

#### Security
- [ ] Storage: Anonymous cannot access any storage bucket paths
- [ ] Storage: Path traversal attempts (`../../other_org/`) are blocked
- [ ] CI: No real database credentials in workflow file (uses local Supabase)

#### Data Leak
- [ ] Storage: Listing bucket contents doesn't reveal other orgs' file names
- [ ] CI: Test output doesn't contain sensitive data

#### Data Damage
- [ ] CI: Docker caching doesn't cause stale schema issues (always resets)

### E2E Gate

```bash
# Local verification
supabase test db

# CI verification (simulate locally)
act -j rls-tests  # if using 'act' for local GitHub Actions testing
# Or push to branch and verify CI passes
```

### Acceptance Criteria

- [ ] `00008_rls_storage.test.sql` passes
- [ ] `.github/workflows/ci.yml` updated with `rls-tests` job
- [ ] CI job uses `supabase/setup-cli@v1` + `supabase start` + `supabase test db`
- [ ] Docker layer caching configured for CI
- [ ] RLS test failure blocks PR merge
- [ ] All 8 test files pass in CI on a clean runner

---

## Phase 4: AI Mock Audit + Missing Factories

**Workstream B | Branch: `feat/enforce-ai-mocks-ci`**

### Description

Audit all 6 E2E test specs to determine current AI call behavior. Add missing Groq and Mistral mock factories to `mock-ai.ts`. This phase is research + code, no CI changes yet.

### Tests

#### Happy Path
- [ ] Audit report documents which E2E specs make AI calls and which don't
- [ ] `createMockGroqClient()` factory returns a valid mock with expected methods
- [ ] `createMockMistralClient()` factory returns a valid mock with expected methods
- [ ] All 5 mock factories (Gemini, OpenAI, Groq, Mistral, Voyage) export consistently
- [ ] Existing tests that use `createMockGeminiClient()` still pass

#### Bad Path
- [ ] Mock factory throws descriptive error if called with wrong arguments
- [ ] Mock pipeline handles edge cases (empty response, null fields)

#### Edge Cases
- [ ] Groq mock matches actual Groq SDK method signatures
- [ ] Mistral mock matches actual Mistral SDK method signatures
- [ ] Mock embeddings return correct dimensionality (1024)

#### Security
- [ ] Mock factories never reference real API keys
- [ ] Mock responses don't contain real customer data

#### Data Leak
- [ ] Audit report doesn't log any intercepted real API responses

#### Data Damage
- [ ] Adding new factories doesn't modify existing factory behavior (backwards compatible)

### E2E Gate

```bash
# Verify mock factories compile
npx tsc --noEmit src/lib/test-utils/mock-ai.ts

# Verify existing tests still pass
npx vitest run --grep "mock"
```

### Acceptance Criteria

- [ ] Audit document produced listing all E2E specs and their AI call status
- [ ] `createMockGroqClient()` added to `mock-ai.ts`
- [ ] `createMockMistralClient()` added to `mock-ai.ts`
- [ ] All mock factories match their respective SDK interfaces
- [ ] Existing unit tests pass unchanged

---

## Phase 5: Playwright AI Blocker + CI Hardening

**Workstream B | Branch: `feat/enforce-ai-mocks-ci`**

### Description

Create a Playwright test fixture that intercepts and fails any outbound request to AI provider domains. Add dummy API keys to CI. Wire the blocker into all E2E specs.

### Tests

#### Happy Path
- [ ] AI blocker fixture intercepts requests to all 5 provider domains
- [ ] Intercepted request causes test failure with clear error message naming the provider
- [ ] All 6 E2E specs use the AI blocker fixture
- [ ] E2E tests pass with blocker active (proves they don't make real AI calls)
- [ ] CI workflow sets all 5 dummy API keys

#### Bad Path
- [ ] AI blocker catches requests even with non-standard paths (e.g., `/v1beta/...`)
- [ ] AI blocker catches requests from server-side API routes (not just browser)
- [ ] Blocker handles HTTPS and HTTP variants

#### Edge Cases
- [ ] Blocker doesn't interfere with legitimate test network requests (Supabase, localhost)
- [ ] Blocker works correctly when multiple AI calls happen in sequence
- [ ] Blocker handles WebSocket connections to AI providers (if any)

#### Security
- [ ] Dummy API keys in CI are obviously fake (`test-mock-do-not-use`)
- [ ] No real API keys appear in CI workflow file
- [ ] No real API keys in any test fixture

#### Data Leak
- [ ] Blocker error message doesn't log request body (could contain prompt data)
- [ ] CI logs don't contain real API keys

#### Data Damage
- [ ] Adding blocker doesn't modify any existing test logic
- [ ] Blocker is additive — removing it doesn't break tests (they just lose the safety net)

### E2E Gate

```bash
# Run E2E tests with blocker
npx playwright test --project=chromium 2>&1 | grep -c "AI provider" | xargs test 0 -eq
# The above should return 0 matches = no AI calls intercepted = tests are clean

# Verify CI workflow has dummy keys
grep -c "test-mock-do-not-use" .github/workflows/ci.yml | xargs test 5 -eq
```

### Acceptance Criteria

- [ ] `__tests__/e2e/fixtures/ai-blocker.ts` created with all 5 domains
- [ ] `playwright.config.ts` updated to use AI blocker fixture
- [ ] All 6 E2E spec files use the blocker
- [ ] E2E suite passes with blocker active
- [ ] `.github/workflows/ci.yml` has dummy API keys for all 5 providers
- [ ] Any test that makes a real AI call fails immediately with descriptive error

---

## Final E2E Verification

```bash
# Full system check — both workstreams merged to main

# 1. RLS tests pass
supabase db reset && supabase test db

# 2. No team_id in policies
psql "$DATABASE_URL" -c "SELECT count(*) FROM pg_policies WHERE qual LIKE '%team_id%';" | grep "0"

# 3. No USING(true) on user tables  
psql "$DATABASE_URL" -c "SELECT count(*) FROM pg_policies WHERE qual = 'true' AND tablename NOT IN ('waitlist','allowed_emails','waitlist_signups');" | grep "0"

# 4. Unit tests pass
npx vitest run

# 5. E2E tests pass with AI blocker
npx playwright test

# 6. TypeScript compiles
npx tsc --noEmit

# 7. Lint passes
npx eslint . --max-warnings 0
```

## Risk Mitigation

| Risk | Mitigation | Contingency |
|------|------------|-------------|
| RLS changes break existing queries | Run full E2E after migration; policies only tighten, never loosen | Revert migration, fix specific policy, re-apply |
| `document_chunks` join through `documents` is slow | Add index on `documents.organization_id` if not present | Add `organization_id` column to `document_chunks` in Phase 2 |
| Storage path scoping breaks uploads | Audit existing paths first; migration only if paths are already org-prefixed | Add data migration to move files into org-prefixed paths |
| pgTAP `create_supabase_user` unavailable | Fall back to direct `auth.users` INSERT + `SET LOCAL` role/claims | Document manual fixture approach |
| Playwright blocker misses server-side AI calls | Add server-side request logging in test mode that asserts zero AI calls | Add HTTP proxy in CI that blocks AI domains at network level |

## Parallelism

Phases 0-3 (Workstream A) and Phases 4-5 (Workstream B) are **fully independent** and execute in parallel via separate git worktrees:

```
Timeline:
  Workstream A (RLS):     Phase 0 → Phase 1 → Phase 2 → Phase 3
  Workstream B (Mocks):   Phase 4 ────────→ Phase 5
                          ↑ start together ↑
```

Both merge to `main` independently. Final E2E verification runs after both are merged.

## References

- [Intent](./enterprise-hardening.intent.md)
- [Decisions](./enterprise-hardening.decisions.md)
