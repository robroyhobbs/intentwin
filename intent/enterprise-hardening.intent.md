# Enterprise Hardening Intent (Phase 1)

> Anchor: Harden IntentBid for enterprise by guaranteeing tenant isolation via tested RLS policies and eliminating real AI calls from CI to make the test suite deterministic and cost-safe.

## Status: Reviewed

::: reviewed {by=rob date=2026-02-23}
## Responsibilities

### Workstream A: RLS Policy Audit, Fixes & Tests
1. **Fix broken RLS policies** — the audit found 13 tables with policies that use `team_id` instead of `organization_id`, or have no org scoping at all
2. **Write pgTAP tests** proving tenant isolation for `profiles`, `organizations`, `proposals`, `documents`, `document_chunks`, and RPCs
3. **Add pgTAP to CI** — `supabase test db` in GitHub Actions with Docker caching, hard fail on leak

### Workstream B: AI Mock Enforcement in CI
1. **Audit current E2E tests** to determine which (if any) make real AI calls
2. **Add missing mock factories** for Groq and Mistral to `mock-ai.ts`
3. **Add network-level blocking** in Playwright to intercept and fail any outbound AI requests
4. **Harden CI workflow** with dummy API keys as a safety net
:::

::: reviewed {by=rob date=2026-02-23}
## Non-Goals
- Migration squash (Phase 2)
- HNSW index migration (Phase 2)
- Langfuse/Helicone observability (Phase 2)
- Competitor intelligence / SAM.gov (Phase 3)
- Intelligence service CI/CD (separate repo)
- Changes to `src/app/(dashboard)` directory structure (guardrail)
- Consolidation of API routes (guardrail)
- LangGraph outside of Inngest step functions (guardrail)
:::

::: reviewed {by=rob date=2026-02-23}
## Critical Findings: RLS Audit

The migration audit found **3 categories of broken RLS policies**:

### Category 1: `team_id`-Based Policies (Pre-Multitenancy Legacy)
These tables still use the old `team_id` join pattern from migration 00005, which predates org-scoped multitenancy (00014). They provide **no org-level isolation**:

| Table | Operations Affected | Risk |
|-------|-------------------|------|
| `proposals` | UPDATE, DELETE | Admin/manager in org A can update/delete proposals in org B |
| `proposal_sections` | SELECT, UPDATE | Visible to anyone on the same team, not scoped to org |
| `section_sources` | SELECT | Same as above |
| `section_claims` | SELECT, INSERT, UPDATE | Same |
| `section_outcome_mapping` | SELECT, ALL | Same |
| `verification_log` | SELECT, INSERT | Same |
| `deal_outcome_history` | SELECT, INSERT | Same |
| `section_feedback` | SELECT, INSERT | Same |
| `document_chunks` | SELECT | Uses `team_id IS NULL` fallback — chunks with NULL team_id visible to ALL orgs |

### Category 2: Missing Org Checks on Write Operations
These tables have org-scoped SELECT but INSERT/UPDATE/DELETE only check `created_by` or `role`:

| Table | Operations Affected | Risk |
|-------|-------------------|------|
| `documents` | INSERT, UPDATE, DELETE | User can insert doc with any org_id; admin can update/delete any org's docs |
| `proposals` | INSERT | User can insert proposal with any org_id |
| `teams` | UPDATE | Admin can update any org's teams |

### Category 3: Wide-Open Policies
| Table | Issue |
|-------|-------|
| `proposal_reviews` | SELECT uses `USING (true)` — all reviews visible to all authenticated users |
| `proposal_reviews` | INSERT uses `auth.uid() IS NOT NULL` — any user can review any proposal |
| Storage: `organization-assets` | No org path scoping — any user can access any org's assets |
| Storage: `exported-proposals` | No org path scoping — any user can read any exported proposal |

### Category 4: RPC Vulnerabilities
| Function | Issue |
|----------|-------|
| `match_document_chunks` | No `organization_id` filter — returns chunks from ALL orgs |
| `match_document_chunks_org` | `filter_organization_id` defaults to `NULL` — calling with NULL returns all orgs |
| `hybrid_search_chunks` | No org filter |
| `hybrid_search_chunks_org` | Same NULL default issue |

### Category 5: Overly Restrictive (Not Leaked, But Broken)
| Table | Issue |
|-------|-------|
| `proposal_versions` | Only `created_by = auth.uid()` — other org members can't see versions |
| `section_versions` | Same — creator-only, no org member access |
:::

::: reviewed {by=rob date=2026-02-23}
## Structure

### Workstream A: RLS Fixes + Tests

```
Branch: feat/rls-policy-tests
Worktree: ../intentwin-rls-tests

New files:
  supabase/migrations/00045_fix_rls_org_scoping.sql  -- Fix all broken policies
  supabase/tests/
    00001_rls_profiles.test.sql
    00002_rls_organizations.test.sql
    00003_rls_proposals.test.sql
    00004_rls_documents.test.sql
    00005_rls_document_chunks.test.sql
    00006_rls_rpcs.test.sql
    00007_rls_proposal_reviews.test.sql
    00008_rls_storage.test.sql

Modified files:
  .github/workflows/ci.yml  -- Add supabase test db step
```
:::

::: reviewed {by=rob date=2026-02-23}
### Migration 00045: Fix RLS Policies

The migration must:

1. **Replace all `team_id`-based policies** with `organization_id`-based equivalents on: `proposals` (UPDATE, DELETE), `proposal_sections`, `section_sources`, `section_claims`, `section_outcome_mapping`, `verification_log`, `deal_outcome_history`, `section_feedback`, `document_chunks`
2. **Add org checks to write operations** on: `documents` (INSERT, UPDATE, DELETE), `proposals` (INSERT), `teams` (UPDATE)
3. **Fix wide-open policies**: `proposal_reviews` (SELECT, INSERT)
4. **Fix RPCs**: Make `filter_organization_id` NOT NULL on `match_document_chunks_org` and `hybrid_search_chunks_org`, or remove the `IS NULL` bypass
5. **Fix overly restrictive policies**: `proposal_versions` and `section_versions` — add org-member access
6. **Fix storage policies**: Add path-based org scoping for `organization-assets` and `exported-proposals`

Pattern for org-scoped policies (use consistently):
```sql
-- For tables WITH organization_id column:
USING (
  organization_id IN (
    SELECT p.organization_id FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
  )
)

-- For tables WITHOUT organization_id (join through parent):
USING (
  EXISTS (
    SELECT 1 FROM public.proposals pr
    WHERE pr.id = proposal_id
    AND pr.organization_id IN (
      SELECT p.organization_id FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
    )
  )
)
```
:::

::: reviewed {by=rob date=2026-02-23}
### pgTAP Test Pattern

Each test file follows this structure:
```sql
BEGIN;
SELECT plan(N);

-- Setup: Create test fixtures
SELECT tests.create_supabase_user('user-a-id', 'a@test.com');
SELECT tests.create_supabase_user('user-b-id', 'b@test.com');
-- Create orgs, link profiles, insert test data

-- Test 1: User A can read own org data
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "user-a-id"}';
SELECT results_eq(
  'SELECT count(*)::int FROM proposals WHERE organization_id = $org_a_id',
  ARRAY[expected_count],
  'User A sees own org proposals'
);

-- Test 2: User A CANNOT read org B data
SELECT is_empty(
  'SELECT * FROM proposals WHERE organization_id = $org_b_id',
  'User A cannot see org B proposals'
);

-- Test 3: Anonymous gets nothing
SET LOCAL ROLE anon;
SELECT is_empty(
  'SELECT * FROM proposals',
  'Anonymous sees no proposals'
);

SELECT * FROM finish();
ROLLBACK;
```
:::

::: reviewed {by=rob date=2026-02-23}
### Workstream B: AI Mock Enforcement

```
Branch: feat/enforce-ai-mocks-ci
Worktree: ../intentwin-ai-mocks

Modified files:
  src/lib/test-utils/mock-ai.ts             -- Add Groq + Mistral mock factories
  __tests__/e2e/fixtures/ai-blocker.ts       -- New Playwright fixture
  playwright.config.ts                       -- Register AI blocker fixture
  .github/workflows/ci.yml                   -- Add dummy API keys + AI leak check
```

### AI Blocker Fixture

```typescript
// __tests__/e2e/fixtures/ai-blocker.ts
const AI_PROVIDER_DOMAINS = [
  '**/generativelanguage.googleapis.com/**',
  '**/api.openai.com/**',
  '**/api.groq.com/**',
  '**/api.mistral.ai/**',
  '**/api.voyageai.com/**',
];

// Intercept all matching requests and abort them with a clear error
```

### CI Workflow Changes

Add to `.github/workflows/ci.yml`:
```yaml
env:
  GEMINI_API_KEY: test-mock-do-not-use
  OPENAI_API_KEY: test-mock-do-not-use
  GROQ_API_KEY: test-mock-do-not-use
  MISTRAL_API_KEY: test-mock-do-not-use
  VOYAGE_API_KEY: test-mock-do-not-use

# New job: RLS tests
rls-tests:
  runs-on: ubuntu-latest
  steps:
    - uses: supabase/setup-cli@v1
    - run: supabase start
    - run: supabase test db
```
:::

::: reviewed {by=rob date=2026-02-23}
## Verification

### Workstream A passes when:
- [ ] All pgTAP tests pass locally via `supabase test db`
- [ ] All pgTAP tests pass in CI
- [ ] Every cross-tenant SELECT test returns empty set
- [ ] Every cross-tenant INSERT/UPDATE/DELETE test raises error
- [ ] Anonymous role gets zero rows from every table
- [ ] `match_document_chunks_org(NULL)` either errors or returns empty
- [ ] CI blocks merge on RLS test failure

### Workstream B passes when:
- [ ] Playwright AI blocker fixture is active in all E2E specs
- [ ] Running E2E tests with real API keys still produces zero outbound AI requests
- [ ] `mock-ai.ts` has factories for all 5 providers (Gemini, OpenAI, Groq, Mistral, Voyage)
- [ ] CI sets dummy API keys for all providers
- [ ] Any test that accidentally makes a real AI call fails immediately with a clear error
:::

::: reviewed {by=rob date=2026-02-23}
## Risks

| Risk | Mitigation |
|------|-----------|
| RLS policy changes break existing app queries | Run full E2E suite after migration; policies are additive (tighter, not looser) |
| `document_chunks` lacks `organization_id` column | Join through `documents.organization_id` in policy; consider adding direct column in Phase 2 |
| Storage path scoping may break existing uploads | Audit existing storage paths before applying policy; may need a data migration |
| pgTAP fixtures may not accurately simulate `auth.uid()` | Use `supabase test db` which provides `tests.create_supabase_user()` helper for this |
| Supabase CLI Docker pull in CI may be slow on first run | Cache Docker layers via `docker/setup-buildx-action` |
:::
