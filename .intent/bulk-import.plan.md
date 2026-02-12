# Execution Plan: Bulk Import (AI-Powered L1 + L2 Onboarding)

## Overview

Build the multi-file Bulk Import feature for IntentWin's Knowledge Base page. Users drop up to 20 files; the system stores each as L2 content (existing pipeline) then sends parsed text to Gemini for L1 extraction (company context, products, evidence). A review screen lets the user accept/reject extracted items and resolve conflicts before committing to the database.

## Prerequisites

- L1 tables exist: `company_context`, `product_contexts`, `evidence_library` ✓
- L2 pipeline exists: document upload → parse → chunk → embed ✓
- Gemini integration exists: `generateText()` in `src/lib/ai/claude.ts` ✓
- Document parsers exist: PDF, DOCX, PPTX, MD in `src/lib/documents/pipeline.ts` ✓
- Auth pattern exists: `getUserContext()` + org-scoped queries ✓
- vitest configured ✓

---

## Phase 0: L1 Extractor Module

### Description

Build the core AI extraction module that takes parsed document text and returns structured L1 items (company context, products, evidence). This is a pure library module with no API routes — just the Gemini prompt, JSON parser, and TypeScript types.

**Deliverables:**

- `ExtractionResult` TypeScript interface
- `buildL1ExtractionPrompt(text: string, fileName: string)` function
- `parseExtractionResponse(raw: string)` function with robust JSON parsing
- Handles code-fenced JSON, malformed responses, partial results

**Files to create:**

- `src/lib/ai/l1-extractor.ts`
- `src/lib/ai/__tests__/l1-extractor.test.ts`

### Tests

#### Happy Path

- [x] `buildL1ExtractionPrompt` includes document text wrapped in structured tags
- [x] `buildL1ExtractionPrompt` includes fileName in prompt for context
- [x] `buildL1ExtractionPrompt` requests JSON output matching ExtractionResult schema
- [x] `parseExtractionResponse` parses valid JSON with all three categories (company_context, product_contexts, evidence_library)
- [x] `parseExtractionResponse` handles raw JSON string (no wrapping)
- [x] `parseExtractionResponse` handles JSON wrapped in ```json code fence
- [x] Parsed company_context items have: category, key, title, content
- [x] Parsed product_contexts items have: product_name, service_line, description, capabilities
- [x] Parsed evidence_library items have: evidence_type, title, summary, full_content
- [x] `extractL1FromText(text, fileName)` calls generateText and returns parsed ExtractionResult

#### Bad Path

- [x] `parseExtractionResponse` with empty string returns empty ExtractionResult (no crash)
- [x] `parseExtractionResponse` with "I cannot extract" text returns empty ExtractionResult
- [x] `parseExtractionResponse` with malformed JSON returns empty ExtractionResult
- [x] `parseExtractionResponse` with JSON missing company_context key defaults to empty array
- [x] `parseExtractionResponse` with JSON missing product_contexts key defaults to empty array
- [x] `parseExtractionResponse` with JSON missing evidence_library key defaults to empty array
- [x] `parseExtractionResponse` with array instead of object returns empty ExtractionResult
- [x] `extractL1FromText` when generateText throws returns empty ExtractionResult + error flag
- [x] Company context item with invalid category is filtered out
- [x] Evidence item with invalid evidence_type is filtered out

#### Edge Cases

- [x] `buildL1ExtractionPrompt` with empty text still produces valid prompt
- [x] `buildL1ExtractionPrompt` truncates text over 100K characters
- [x] `parseExtractionResponse` handles code fence without "json" label (just ```)
- [x] `parseExtractionResponse` handles extra text before/after JSON block
- [x] `parseExtractionResponse` handles nested code fences in content fields
- [x] Company context items with duplicate (category, key) pairs are deduplicated
- [x] Product contexts with duplicate (product_name, service_line) pairs are deduplicated
- [x] Evidence items with duplicate title are deduplicated

#### Security

- [x] Document text is wrapped in XML-like tags to prevent prompt injection
- [x] Extracted content is treated as untrusted (no eval or template interpolation)
- [x] Category values are validated against allowlist before returning
- [x] Evidence types are validated against allowlist before returning

#### Data Leak

- [x] Error messages from parseExtractionResponse don't expose raw AI text
- [x] Extraction prompt doesn't include org-specific settings or API keys
- [x] Failed extraction returns safe error without internal details

#### Data Damage

- [x] Failed parsing returns empty arrays, never undefined or null
- [x] Partial JSON response still returns whatever was successfully parsed
- [x] extractL1FromText is idempotent (same input → same output)

### E2E Gate

```bash
cd /Users/robroyhobbs/projects/capgemini-proposal-generator

# Run L1 extractor tests
npx vitest run src/lib/ai/__tests__/l1-extractor.test.ts

# All tests pass (no regressions)
npx vitest run

# TypeScript compiles
npx tsc --noEmit
```

### Acceptance Criteria

- [x] All 6 test categories pass
- [x] ExtractionResult type is well-defined and exported
- [x] Prompt produces structured JSON from real-world document text
- [x] Parser handles all Gemini response formats robustly
- [x] Deduplication works by (category, key), (product_name, service_line), and title
- [x] TypeScript compiles clean

---

## Phase 1: Bulk Import API Routes

### Description

Build the two new API routes: `/api/bulk-import/extract` (sends file content to Gemini for L1 extraction) and `/api/bulk-import/commit` (saves approved items to database). Both require auth and org context. The extract route also checks existing L1 data for conflicts.

**Deliverables:**

- `POST /api/bulk-import/extract` — accepts content + fileName, returns extracted items + conflict flags
- `POST /api/bulk-import/commit` — accepts approved items array, upserts to L1 tables
- Conflict detection logic against existing L1 data

**Files to create:**

- `src/app/api/bulk-import/extract/route.ts`
- `src/app/api/bulk-import/commit/route.ts`
- `src/lib/ai/__tests__/bulk-import-api.test.ts`

### Tests

#### Happy Path

- [x] POST `/api/bulk-import/extract` with valid content + fileName returns extracted items
- [x] Extract response includes `company_context`, `product_contexts`, `evidence_library` arrays
- [x] Extract response items include `isConflict: false` for new items
- [x] Extract response items include `isConflict: true` with `existingValue` for conflicts
- [x] Company context conflict detected on matching (category, key) in same org
- [x] Product conflict detected on matching (product_name, service_line) in same org
- [x] Evidence conflict detected on matching title in same org
- [x] POST `/api/bulk-import/commit` with approved items inserts into company_context
- [x] Commit inserts into product_contexts with capabilities as JSONB
- [x] Commit inserts into evidence_library with all fields
- [x] Commit upserts company_context on conflict (category, key)
- [x] Commit upserts product_contexts on conflict (product_name, service_line)
- [x] Commit upserts evidence_library on conflict (title)
- [x] Commit returns counts: `{ inserted: { company_context: N, product_contexts: N, evidence_library: N } }`

#### Bad Path

- [x] Extract with empty content string returns 400
- [x] Extract with missing fileName returns 400
- [x] Extract without auth returns 401
- [x] Commit with empty items array returns 400
- [x] Commit with items missing required fields returns 400
- [x] Commit without auth returns 401
- [x] Extract when Gemini fails returns 500 with safe message, no crash
- [x] Commit with invalid company_context category returns 400
- [x] Commit with invalid evidence_type returns 400

#### Edge Cases

- [x] Extract with very large content (200K chars) still works (truncated internally)
- [x] Commit with 100+ items processes all correctly
- [x] Commit with mix of new and conflict items handles both
- [x] Extract when org has zero existing L1 data — all items flagged as new
- [x] Extract when org has matching L1 data — correct items flagged as conflicts
- [x] Commit with all three table types in single request

#### Security

- [x] Extract validates user belongs to an organization
- [x] Commit validates user belongs to an organization
- [x] Cannot extract using another org's context for conflict check
- [x] Commit scopes all inserts to user's organization_id
- [x] SQL injection in content/title/key fields is prevented (parameterized queries)
- [x] XSS in extracted content is handled (stored as text, not rendered as HTML)

#### Data Leak

- [x] Extract error response doesn't expose Gemini raw response
- [x] Extract error response doesn't expose database schema
- [x] Commit error response doesn't expose other org's data
- [x] Conflict detection doesn't reveal full content of existing entries to unauthorized users

#### Data Damage

- [x] Failed commit doesn't leave partial data (all-or-nothing per table)
- [x] Commit failure on one table doesn't affect already-committed tables
- [x] Upsert on conflict correctly replaces old values
- [x] Commit doesn't delete existing L1 data that wasn't in the import
- [x] Re-submitting same commit is idempotent (upsert, not duplicate)

### E2E Gate

```bash
cd /Users/robroyhobbs/projects/capgemini-proposal-generator

# Run bulk import API tests
npx vitest run src/lib/ai/__tests__/bulk-import-api.test.ts

# All tests pass (no regressions)
npx vitest run

# TypeScript compiles
npx tsc --noEmit
```

### Acceptance Criteria

- [x] Extract route returns structured items with conflict flags
- [x] Commit route upserts items to all 3 L1 tables correctly
- [x] Conflict detection matches on correct keys per table
- [x] All inserts scoped to user's organization_id
- [x] All 6 test categories pass
- [x] TypeScript compiles clean

---

## Phase 2: Bulk Import UI Components

### Description

Build the three UI components for the Bulk Import flow: the main modal (upload + processing), the review screen (accept/reject per item, conflict resolution), and the summary screen. All are client components using existing project patterns (CSS variables, Lucide icons, sonner toasts).

**Deliverables:**

- `BulkImportModal` — multi-step wizard: drop zone → processing → review → summary
- `BulkImportReview` — grouped item list with checkboxes, conflict display, accept/reject
- `BulkImportSummary` — post-import summary with counts and navigation links
- File queue with sliding window (3-4 concurrent files)

**Files to create:**

- `src/components/knowledge-base/bulk-import-modal.tsx`
- `src/components/knowledge-base/bulk-import-review.tsx`
- `src/components/knowledge-base/bulk-import-summary.tsx`

### Tests

#### Happy Path

- [x] BulkImportModal renders drop zone in initial state
- [x] Drop zone accepts .md, .pdf, .docx, .pptx files
- [x] Drop zone shows file list after files are dropped
- [x] File list shows filename, size, and pending status
- [x] Clicking "Import" starts processing with progress indicators
- [x] Per-file progress shows: pending → processing → done/failed
- [x] Processing runs 3-4 files concurrently (sliding window)
- [x] Each file triggers L2 upload (existing endpoint) then L1 extract (new endpoint)
- [x] After all files processed, review screen appears with extracted items
- [x] BulkImportReview groups items by category (company_context, products, evidence)
- [x] Each item has a checkbox (pre-checked for new items)
- [x] Conflict items show existing vs new value with radio toggle
- [x] "Accept All" button saves all checked items via commit endpoint
- [x] "Accept Selected" saves only checked items
- [x] BulkImportSummary shows counts of imported items per category
- [x] Summary has navigation links to Settings and Knowledge Base

#### Bad Path

- [x] Drop zone rejects unsupported file types (.exe, .zip, .jpg) with error message
- [x] Drop zone rejects more than 20 files with error message
- [x] Drop zone rejects empty file (0 bytes) with error message
- [x] Processing failure on one file shows error badge, continues other files
- [x] Gemini extraction failure shows warning, file still stored as L2
- [x] Network error during processing shows retry button
- [x] Commit failure shows error toast with retry option

#### Edge Cases

- [x] Single file upload works (not just multi-file)
- [x] Exactly 20 files at the limit works
- [x] All files fail extraction — review screen shows "No items extracted" message
- [x] All items are conflicts — review screen pre-selects "keep existing"
- [x] User unchecks all items — "Accept" button is disabled
- [x] User navigates away during processing — shows confirmation dialog
- [x] Modal closes cleanly when "Cancel" is clicked at any step

#### Security

- [x] File content sent to extract endpoint uses authFetch (includes session token)
- [x] Commit uses authFetch with POST method
- [x] No file content stored in browser localStorage or sessionStorage
- [x] Drop zone validates file type by extension AND MIME type

#### Data Leak

- [x] Processing errors don't show raw API response to user
- [x] Review screen doesn't show organization_id in UI
- [x] Failed extraction doesn't expose Gemini error details to user

#### Data Damage

- [x] Closing modal during upload doesn't corrupt uploaded L2 documents
- [x] Closing modal during extract doesn't save partial L1 items
- [x] Re-opening modal after close starts fresh (no stale state)
- [x] Double-clicking "Accept" doesn't submit twice (button disabled after first click)

### E2E Gate

```bash
cd /Users/robroyhobbs/projects/capgemini-proposal-generator

# TypeScript compiles (components type-check)
npx tsc --noEmit

# All tests pass (no regressions)
npx vitest run

# Dev server starts without errors
timeout 15 bash -c 'npx next dev -p 3099 2>&1 | head -30' || true
```

### Acceptance Criteria

- [x] BulkImportModal implements 4-step wizard (upload → processing → review → summary)
- [x] Drop zone supports drag-and-drop + file picker
- [x] Processing shows per-file progress with 4 states (pending/processing/done/failed)
- [x] Review screen has item checkboxes and conflict resolution UI
- [x] Summary screen shows counts and navigation links
- [x] All 6 test categories pass
- [x] TypeScript compiles clean

---

## Phase 3: Integration + Knowledge Base Page Wiring

### Description

Wire the Bulk Import modal into the Knowledge Base page. Add the "Bulk Import" button, connect the modal to the page's state, and verify the full end-to-end flow: upload files → L2 stored → L1 extracted → review → commit → data visible in Settings/Evidence pages.

**Deliverables:**

- "Bulk Import" button on Knowledge Base page
- Modal opens/closes from page state
- Full integration test: files → L2 + L1 → review → commit → verify in DB

**Files to modify:**

- `src/app/(dashboard)/knowledge-base/page.tsx` (add Bulk Import button + modal)

### Tests

#### Happy Path

- [ ] Knowledge Base page has "Bulk Import" button
- [ ] Clicking button opens BulkImportModal
- [ ] Modal closes on successful import and refreshes document list
- [ ] After import, new documents appear in Knowledge Base list
- [ ] After import, new company_context entries accessible via GET /api/settings/company
- [ ] After import, new product_contexts entries accessible via GET /api/settings/products
- [ ] After import, new evidence entries accessible via GET /api/evidence
- [ ] Full flow: drop files → process → review → accept → summary → close → data in DB

#### Bad Path

- [ ] Button disabled when user has no organization
- [ ] Modal handles session expiry mid-import (re-auth prompt)
- [ ] Import with files that all fail parsing shows appropriate error state

#### Edge Cases

- [ ] Opening modal when Knowledge Base is empty works
- [ ] Opening modal when Knowledge Base already has documents works
- [ ] Re-importing same files updates existing L1 entries (upsert) without duplicating L2 docs
- [ ] Bulk Import button coexists with existing "Upload Documents" button

#### Security

- [ ] Bulk Import button only shown to authenticated users
- [ ] Modal passes organization context correctly to all API calls
- [ ] Cannot trigger import without valid session

#### Data Leak

- [ ] Page doesn't show import data from other organizations
- [ ] After modal close, no import data remains in component state

#### Data Damage

- [ ] Failed import doesn't affect existing Knowledge Base documents
- [ ] Cancelled import doesn't leave partial state in database
- [ ] L2 documents from failed L1 extraction are still properly stored

### E2E Gate

```bash
cd /Users/robroyhobbs/projects/capgemini-proposal-generator

# Full test suite
npx vitest run

# TypeScript compiles
npx tsc --noEmit

# Production build succeeds
npx next build

# Verify API endpoints exist
timeout 30 bash -c '
  npx next dev -p 3099 &
  sleep 10
  curl -s -o /dev/null -w "%{http_code}" http://localhost:3099/api/bulk-import/extract -X POST -H "Content-Type: application/json" -d "{}"
  curl -s -o /dev/null -w "%{http_code}" http://localhost:3099/api/bulk-import/commit -X POST -H "Content-Type: application/json" -d "{}"
  kill %1
' || true
```

### Acceptance Criteria

- [ ] "Bulk Import" button visible on Knowledge Base page
- [ ] Full end-to-end flow works: upload → process → review → commit
- [ ] L2 documents stored and indexed
- [ ] L1 items saved to correct tables with org scope
- [ ] All 6 test categories pass
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
```

## Risk Mitigation

| Risk                                     | Mitigation                                                            | Contingency                                                |
| ---------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------- |
| Gemini returns poorly structured JSON    | Robust parser with fallbacks for code-fenced, partial, malformed JSON | Return empty result + error flag, file still stored as L2  |
| Large files exceed Gemini context window | Truncate to 100K chars in prompt builder                              | Note truncation in review UI                               |
| Slow processing for 20 files             | Sliding window of 3-4 concurrent, progress UI manages expectations    | Reduce concurrency if rate-limited                         |
| Extraction duplicates across files       | Deduplicate by key before review step                                 | User manually unchecks duplicates                          |
| User drops browser tab during processing | L2 uploads still complete server-side, L1 results lost                | User can re-import; L2 won't duplicate (same storage path) |
| Conflict detection misses edge cases     | Match on (category, key), (product_name, service_line), (title)       | User sees both values, can choose                          |

## References

- [Intent Spec](./bulk-import.intent.md)
- [Overview](./bulk-import.overview.md)
- Gemini client: `src/lib/ai/claude.ts` (generateText)
- Document pipeline: `src/lib/documents/pipeline.ts` (processDocument)
- Document upload: `src/app/api/documents/upload/route.ts`
- Knowledge Base: `src/app/(dashboard)/knowledge-base/page.tsx`
- Auth: `src/lib/supabase/auth-api.ts` (getUserContext)
- L1 tables: `company_context`, `product_contexts`, `evidence_library`
