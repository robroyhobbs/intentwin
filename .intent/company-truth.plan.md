# Execution Plan: Company Truth (IMF L1)

## Overview

Build the management UI for IMF L1 — Products & Services CRUD tab, Evidence Library page with card grid, and AI evidence extraction from existing documents. Database tables and pipeline integration already exist; this is purely API routes + UI.

## Prerequisites

- IMF Phase 1 (Persuasion Engine) complete ✓
- IMF Phase 2 (Compliance Matrix) complete ✓
- L1 tables exist: company_context, product_contexts, evidence_library ✓
- TypeScript types defined in src/types/idd.ts ✓
- fetchL1Context() + buildL1ContextString() in pipeline.ts ✓
- vitest configured and passing (143 tests) ✓

---

## Phase 0: Products API + Products & Services Tab

### Description

Build the CRUD API routes for `product_contexts` table and the Products & Services tab on the company settings page. Each product has a name, service line, description, and inline expandable capabilities with outcomes.

**Deliverables:**

- Products API routes (GET/POST/PATCH/DELETE)
- Products & Services tab added to `/settings/company`
- Inline capabilities CRUD within each product
- Full test coverage of API logic

**Files to create:**

- `src/app/api/settings/products/route.ts`
- `src/lib/ai/__tests__/company-truth-api.test.ts`

**Files to modify:**

- `src/app/(dashboard)/settings/company/page.tsx` (add Products & Services tab)

### Tests

#### Happy Path

- [x] GET `/api/settings/products` returns empty array for org with no products
- [x] POST creates a product with all fields (product_name, service_line, description, capabilities)
- [x] POST with capabilities array creates product with structured JSONB capabilities
- [x] GET returns created products sorted by product_name
- [x] PATCH updates product_name, service_line, description
- [x] PATCH updates capabilities array (add/remove/edit capabilities)
- [x] DELETE removes a product by ID
- [x] GET returns products scoped to current org only

#### Bad Path

- [x] POST with empty product_name returns 400
- [x] POST with duplicate (product_name, service_line) returns 409 conflict
- [x] PATCH with non-existent product ID returns 404
- [x] DELETE with non-existent product ID returns 404
- [x] POST with invalid capabilities structure returns 400
- [x] PATCH with missing id in body returns 400
- [x] Unauthenticated request returns 401

#### Edge Cases

- [x] POST product_name with leading/trailing whitespace — trims
- [x] POST with empty capabilities array succeeds (no capabilities yet)
- [x] PATCH with empty capabilities array removes all capabilities
- [x] GET with 20+ products returns all correctly
- [x] Product with very long description (10K chars) succeeds

#### Security

- [x] API validates user belongs to an organization
- [x] Cannot access products from another organization
- [x] SQL injection in product_name is prevented (parameterized queries)
- [x] Capabilities JSONB is validated before insert

#### Data Leak

- [x] Error responses don't expose database schema details
- [x] API response doesn't include organization_id (internal field)
- [x] 404 response doesn't reveal product exists in another org

#### Data Damage

- [x] Failed insert doesn't leave partial data
- [x] PATCH update failure doesn't modify product
- [x] DELETE doesn't cascade to unrelated data

### E2E Gate

```bash
cd /Users/robroyhobbs/projects/capgemini-proposal-generator

# Run Products API tests
npx vitest run src/lib/ai/__tests__/company-truth-api.test.ts

# All tests pass (no regressions)
npx vitest run

# TypeScript compiles
npx tsc --noEmit
```

### Acceptance Criteria

- [x] GET/POST/PATCH/DELETE routes implemented and tested
- [x] All 6 test categories pass (30/30 tests)
- [x] Products & Services tab renders on settings page
- [x] Inline capabilities expand/collapse with add/edit/delete
- [x] TypeScript compiles clean

---

## Phase 1: Evidence API + Evidence Library Page

### Description

Build the CRUD API routes for `evidence_library` table with filter support, and the Evidence Library page with card grid grouped by evidence type. Includes inline verification toggle and filter bar.

**Deliverables:**

- Evidence API routes (GET with filters, POST, PATCH incl. verify, DELETE)
- Evidence Library page at `/evidence-library`
- Card grid grouped by type (case_study, metric, testimonial, certification, award)
- Filter bar (type, industry, service_line, verified)
- Inline verify toggle
- Add/edit evidence form (simplified: textareas for metrics/outcomes)
- Sidebar nav item

**Files to create:**

- `src/app/api/evidence/route.ts`
- `src/app/(dashboard)/evidence-library/page.tsx`
- `src/lib/ai/__tests__/evidence-api.test.ts`

**Files to modify:**

- `src/components/layout/sidebar.tsx` (add Evidence Library nav item)

### Tests

#### Happy Path

- [ ] GET `/api/evidence` returns empty array for org with no evidence
- [ ] POST creates evidence entry with all fields (evidence_type, title, summary, full_content, etc.)
- [ ] POST auto-defaults `is_verified` to false
- [ ] GET returns evidence sorted by evidence_type then created_at
- [ ] GET with `?type=case_study` filter returns only case studies
- [ ] GET with `?industry=healthcare` filter returns matching + null industry entries
- [ ] GET with `?service_line=cloud` filter returns matching entries
- [ ] GET with `?verified=true` filter returns only verified entries
- [ ] GET with multiple filters combines them (AND logic)
- [ ] PATCH updates title, summary, full_content
- [ ] PATCH with `{ id, is_verified: true }` marks entry as verified
- [ ] PATCH with `{ id, is_verified: false }` unverifies entry
- [ ] DELETE removes an evidence entry by ID

#### Bad Path

- [ ] POST with empty title returns 400
- [ ] POST with invalid evidence_type returns 400
- [ ] POST with missing summary returns 400
- [ ] PATCH with non-existent evidence ID returns 404
- [ ] DELETE with non-existent evidence ID returns 404
- [ ] PATCH with missing id in body returns 400
- [ ] GET with invalid filter value (e.g., `?type=invalid`) returns 400
- [ ] Unauthenticated request returns 401
- [ ] PATCH with invalid is_verified value (not boolean) returns 400

#### Edge Cases

- [ ] POST evidence with null client_industry and null service_line succeeds
- [ ] POST with client_size "enterprise" / "mid_market" / "smb" all succeed
- [ ] GET with no filters returns all evidence for org
- [ ] GET with `?verified=false` returns only unverified
- [ ] POST with very long full_content (50K chars) succeeds
- [ ] PATCH verify then unverify roundtrip works correctly
- [ ] GET with 50+ evidence entries returns all correctly

#### Security

- [ ] API validates user belongs to an organization
- [ ] Cannot access evidence from another organization
- [ ] Cannot verify evidence in another organization
- [ ] SQL injection in title/summary is prevented
- [ ] Filter values are sanitized before query

#### Data Leak

- [ ] Error responses don't expose database schema details
- [ ] API response doesn't include organization_id
- [ ] 404 response doesn't reveal evidence exists in another org
- [ ] Verification toggle response doesn't expose who verified

#### Data Damage

- [ ] Failed insert doesn't leave partial data
- [ ] Verification toggle failure reverts cleanly
- [ ] DELETE with confirmation dialog prevents accidental deletion
- [ ] PATCH failure doesn't corrupt existing evidence

### E2E Gate

```bash
cd /Users/robroyhobbs/projects/capgemini-proposal-generator

# Run Evidence API tests
npx vitest run src/lib/ai/__tests__/evidence-api.test.ts

# All tests pass (no regressions)
npx vitest run

# TypeScript compiles
npx tsc --noEmit

# Dev server starts without errors
timeout 15 bash -c 'npx next dev -p 3099 2>&1 | head -20' || true
```

### Acceptance Criteria

- [ ] GET/POST/PATCH/DELETE routes with filter support
- [ ] All 6 test categories pass
- [ ] Evidence Library page renders with card grid grouped by 5 types
- [ ] Filter bar works (type, industry, service_line, verified)
- [ ] Inline verify toggle updates is_verified via PATCH
- [ ] Add/edit form with simplified metrics/outcomes textareas
- [ ] Delete with confirmation dialog
- [ ] Sidebar nav item added under Knowledge group
- [ ] Empty states for each type section
- [ ] TypeScript compiles clean

---

## Phase 2: AI Evidence Extraction + Polish

### Description

Build the AI evidence extraction endpoint and UI integration. Users select from org's processed documents, AI extracts structured evidence entries (unverified by default). Polish the full integration and verify the pipeline consumes L1 data correctly.

**Deliverables:**

- Evidence extraction prompt builder + JSON parser
- `/api/evidence/extract` endpoint
- Document selector UI on Evidence Library page
- Toast notifications for extraction
- End-to-end verification: L1 data flows into proposal generation

**Files to create:**

- `src/app/api/evidence/extract/route.ts`
- `src/lib/ai/prompts/extract-evidence.ts`
- `src/lib/ai/__tests__/extract-evidence.test.ts`

### Tests

#### Happy Path

- [ ] `buildEvidenceExtractionPrompt(docText)` returns prompt with document content embedded
- [ ] Prompt includes all 5 evidence types for extraction
- [ ] Parsing valid JSON array response returns typed EvidenceExtraction[]
- [ ] Each parsed evidence has: evidence_type, title, summary, full_content, metrics, outcomes
- [ ] Extraction endpoint fetches document text, calls generateText, parses response
- [ ] Response includes count and extracted evidence entries
- [ ] Calls generateText with temperature 0.2
- [ ] Extracted entries inserted with is_verified=false
- [ ] Multiple documents concatenated for extraction
- [ ] Document selector shows org's processed documents

#### Bad Path

- [ ] Empty document text still produces a valid prompt
- [ ] AI returns malformed JSON — parser falls back to empty array
- [ ] AI returns JSON wrapped in markdown code block — parser strips wrapper
- [ ] AI returns evidence with invalid evidence_type — defaults to "metric"
- [ ] AI returns evidence with invalid outcomes — filters to valid OutcomeCategory only
- [ ] No processed documents in org returns 400 "No documents available"
- [ ] generateText throws — endpoint returns 500 with safe error message
- [ ] Empty document_ids array returns 400

#### Edge Cases

- [ ] Very large document (500K+ chars) — prompt truncates to MAX_DOCUMENT_CHARS
- [ ] Document with no extractable evidence — AI returns empty array, endpoint returns empty
- [ ] parseEvidenceResponse handles empty string
- [ ] parseEvidenceResponse handles code fence without json label
- [ ] Re-extraction does not delete previously extracted evidence (additive, not replace)

#### Security

- [ ] Document text in prompt is wrapped in structured tags (prevents injection)
- [ ] Extraction endpoint validates user belongs to org
- [ ] Cannot extract from documents in another org
- [ ] Unauthenticated request returns 401

#### Data Leak

- [ ] Extraction prompt doesn't include org settings
- [ ] Error responses don't include raw AI response text
- [ ] Evidence types are the only valid values (no custom labels leak)

#### Data Damage

- [ ] Failed AI response does not delete existing evidence
- [ ] Empty AI response does not insert any rows
- [ ] Partial extraction failure doesn't leave orphan rows
- [ ] Re-extraction is additive (preserves all existing entries)

### E2E Gate

```bash
cd /Users/robroyhobbs/projects/capgemini-proposal-generator

# Run extraction tests
npx vitest run src/lib/ai/__tests__/extract-evidence.test.ts

# Full test suite (no regressions)
npx vitest run

# TypeScript compiles
npx tsc --noEmit

# Production build succeeds
npx next build
```

### Acceptance Criteria

- [ ] Extraction prompt produces well-structured output
- [ ] JSON parsing handles all Gemini response formats (raw, code-fenced, partial)
- [ ] Extraction is additive (never deletes existing evidence)
- [ ] All 6 test categories pass
- [ ] Document selector UI works on Evidence Library page
- [ ] Toast notification after extraction: "X evidence entries extracted"
- [ ] Full pipeline verification: L1 data appears in generated proposal context
- [ ] All tests pass
- [ ] TypeScript compiles clean
- [ ] Production build succeeds

---

## Final E2E Verification

```bash
cd /Users/robroyhobbs/projects/capgemini-proposal-generator

# Full test suite
npx vitest run

# TypeScript compile
npx tsc --noEmit

# Production build
npx next build

# Dev server health
curl -s http://localhost:3001/api/health | jq .
```

## Risk Mitigation

| Risk                                                         | Mitigation                                        | Contingency                               |
| ------------------------------------------------------------ | ------------------------------------------------- | ----------------------------------------- |
| AI returns unparseable JSON                                  | Parser handles code-fenced, partial, and raw JSON | Fall back to empty array with error toast |
| Existing settings page becomes too complex with Products tab | Tab replaces content (not additive)               | Extract to separate route if needed       |
| Evidence cards render slowly with many entries               | Groups collapse by default, truncated summaries   | Add pagination or virtual scrolling       |
| Evidence extraction duplicates entries                       | Additive extraction + user deletes duplicates     | Add duplicate detection later             |
| Filter freeform values become inconsistent                   | Suggestions from org settings guide input         | Add normalization pass later              |

## References

- [Intent Spec](./company-truth.intent.md)
- [Overview](./company-truth.overview.md)
- Pipeline: `src/lib/ai/pipeline.ts` (fetchL1Context, buildL1ContextString)
- Types: `src/types/idd.ts` (ProductContext, EvidenceLibraryEntry)
- Company settings: `src/app/(dashboard)/settings/company/page.tsx`
- Sidebar: `src/components/layout/sidebar.tsx`
- Seed data: `scripts/seed-company-context.ts`
