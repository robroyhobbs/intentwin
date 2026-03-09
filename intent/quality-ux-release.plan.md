# Execution Plan: Quality & UX Release

## Overview

Improve IntentBid reliability, progress visibility, and input handling based on direct paying customer feedback. Covers retry logic, progress bars, SAM.gov URL handling, product recommendations, parallel generation, NAICS input, changelog, and error diagnostics.

## Prerequisites

- IntentBid codebase builds successfully (`npm run build`)
- Supabase database accessible (for metadata columns)
- Existing test suite passes (`npx vitest run`)
- Node.js 18+ with Next.js App Router

## Phase 0: Retry Wrapper & Error Diagnostics

### Description

Create the generic `withRetry` utility and integrate it into extraction, bid evaluation, and section generation routes. Add structured diagnostic error responses with attempt count, failure reason, and retryable flag. This is the foundation — all subsequent phases depend on reliable operations.

**Stage A:** Write tests only. **Stage B:** Implement against frozen tests.

### Tests

#### Happy Path

- [x] `withRetry` executes function once when it succeeds on first attempt
- [x] `withRetry` returns the successful result value
- [x] `withRetry` retries on failure and returns result when second attempt succeeds
- [x] `withRetry` respects custom `maxRetries` option
- [x] `withRetry` calls `onRetry` callback with attempt number and error on each retry
- [x] Extraction route retries transient AI failures and succeeds on retry
- [x] Section generation route retries and returns cached content on success

#### Bad Path

- [x] `withRetry` throws last error after exhausting all retries (2x default)
- [x] Thrown error includes `attempts` metadata property
- [x] Thrown error includes `retryable: true` flag for transient failures
- [x] `withRetry` does NOT retry non-retryable errors (e.g., 400 Bad Request, validation errors)
- [x] `withRetry` does NOT retry when `maxRetries` is 0
- [x] Error response format matches `{ error: "[Step] failed: [reason]", attempts: 3, retryable: true }`
- [x] Invalid `RetryOptions` values (negative retries, zero delay) throw immediately

#### Edge Cases

- [x] `withRetry` handles async functions that reject vs throw
- [x] `withRetry` handles functions that return undefined/null on success
- [x] Backoff timing: delay doubles per attempt (2s → 4s with default config)
- [x] Concurrent retries don't interfere (each call has independent state)

#### Security

- [x] Error messages don't expose internal stack traces to client
- [x] Error messages don't leak API keys, model names, or internal URLs
- [x] `onRetry` callback errors don't break the retry loop

#### Data Leak

- [x] Diagnostic error responses exclude raw AI provider error details
- [x] Server-side logs include full error; client response includes sanitized reason only
- [x] Retry metadata doesn't expose timing that reveals infrastructure details

#### Data Damage

- [x] Failed retries don't leave partial state (extraction metadata, section records)
- [x] Retry of section generation doesn't create duplicate sections
- [x] Atomic: if retry succeeds, only the successful result is persisted

### E2E Gate

```bash
# Unit tests for retry wrapper
npx vitest run src/lib/retry/

# Integration: verify extraction route handles transient failure
npx vitest run src/app/api/intake/extract/ --grep "retry"

# Integration: verify section route handles transient failure
npx vitest run src/app/api/proposals/ --grep "retry"

# Verify error response format
npx vitest run --grep "diagnostic error"
```

### Acceptance Criteria

- [x] L1: All 6 test categories pass
- [x] L2: Error messages sanitized, no internal leaks
- [x] L3: N/A (retry wrapper is per-request, not concurrent load)
- [x] L4: N/A
- [x] L5: N/A
- [x] `withRetry` used in extract/route.ts, section/route.ts, and bid evaluation
- [x] ESLint passes on all changed files

---

## Phase 1: Progress Tracking & UI

### Description

Implement task-based percentage progress tracking for extraction (4 sub-tasks) and bid evaluation (3 sub-tasks). Store progress in existing metadata columns. Update frontend step components to display percentage progress bars with current step labels. Add elapsed timer fallback for polling gaps.

**Stage A:** Write tests only. **Stage B:** Implement against frozen tests.

### Tests

#### Happy Path

- [x] `ProgressTracker` computes correct percentage (1/4 = 25%, 2/4 = 50%, etc.)
- [x] Extraction route updates progress metadata after each sub-task completion
- [ ] Bid evaluation route updates progress metadata after each sub-task completion
- [ ] Frontend polls and renders progress bar with correct percentage
- [ ] Frontend displays current step label (e.g., "Extracting requirements...")
- [x] Progress bar reaches 100% when all sub-tasks complete
- [ ] Progress bar component renders accessible ARIA attributes (role="progressbar", aria-valuenow)

#### Bad Path

- [x] `ProgressTracker` handles `total: 0` without division by zero
- [x] `ProgressTracker` clamps percentage to 0-100 range
- [ ] Frontend handles missing progress metadata gracefully (shows spinner fallback)
- [ ] Frontend handles progress metadata with unexpected format

#### Edge Cases

- [ ] Progress metadata survives extraction retry (doesn't reset to 0 on retry)
- [ ] Polling gap > 30s triggers elapsed timer fallback ("Still working... 45s")
- [ ] Multiple concurrent extractions don't cross-contaminate progress
- [ ] Progress updates arrive out of order (completed=3 before completed=2 due to parallel extractors)

#### Security

- [ ] Progress metadata endpoint scoped by organization_id
- [ ] Cannot read another org's extraction progress via API

#### Data Leak

- [x] Progress metadata doesn't expose AI model names or internal pipeline details
- [x] Step labels use user-friendly names, not internal function names

#### Data Damage

- [x] Progress metadata writes don't overwrite extraction results
- [x] Partial progress update doesn't corrupt existing metadata

### E2E Gate

```bash
# Unit tests for progress tracker
npx vitest run src/lib/progress/

# Integration: extraction progress updates
npx vitest run src/app/api/intake/extract/ --grep "progress"

# Component tests for progress bar
npx vitest run src/components/ --grep "progress"

# Full pipeline: extract with progress tracking
npx vitest run --grep "extraction progress"
```

### Acceptance Criteria

- [ ] L1: All 6 test categories pass
- [ ] L2: Multi-tenant scoping verified
- [ ] L3: N/A
- [ ] L4: N/A
- [ ] L5: N/A
- [ ] Extraction shows 4-step progress (25% increments)
- [ ] Bid evaluation shows 3-step progress (33% increments)
- [ ] Polling gap fallback triggers at 30s
- [ ] ESLint passes on all changed files

---

## Phase 2: SAM.gov URL Handling & Parallel Generation

### Description

Two independent improvements bundled: (1) Detect SAM.gov workspace URLs, extract opportunity ID, redirect to public URL, auto-fetch with fallback guidance. (2) Modify `client-orchestrate.ts` to generate executive summary first, then fire remaining sections in batches of 3-4 using `Promise.allSettled()`.

**Stage A:** Write tests only. **Stage B:** Implement against frozen tests.

### Tests

#### Happy Path — SAM.gov

- [x] `detectSamGovUrl` identifies workspace URL pattern (`sam.gov/workspace/contract/opp/{uuid}/view`)
- [x] `detectSamGovUrl` extracts correct UUID from workspace URL
- [x] `constructPublicSamUrl` builds correct public URL (`sam.gov/opp/{uuid}/view`)
- [x] Fetch-url route auto-redirects workspace URL to public URL and fetches successfully
- [x] `detectSamGovUrl` returns `{ isWorkspace: false }` for non-SAM.gov URLs
- [x] `detectSamGovUrl` handles public SAM.gov URLs correctly (passes through)

#### Happy Path — Parallel Generation

- [x] Executive summary generates first (awaited before batch)
- [x] Remaining sections fire in batches of 3-4
- [x] All sections complete successfully in batched mode
- [x] Finalize runs after all batches complete
- [x] Differentiators from exec summary are available to batch sections

#### Bad Path — SAM.gov

- [x] Public URL returns non-200: shows guidance message with paste instructions
- [x] Public URL returns login/auth page: shows guidance message
- [x] Malformed SAM.gov URL (no UUID): treated as regular URL fetch
- [x] SAM.gov URL with extra query params: UUID still extracted correctly

#### Bad Path — Parallel Generation

- [x] Single section failure in batch doesn't block other sections
- [x] All sections in a batch fail: next batch still runs, finalize marks failures
- [x] Setup failure: reverts to DRAFT, no batch execution attempted

#### Edge Cases

- [x] SAM.gov URL with trailing slash
- [x] SAM.gov URL with mixed case (`SAM.gov`, `Sam.Gov`)
- [x] Batch of 1 section (last batch with remainder)
- [x] Proposal with only 1 section (no batching needed, just exec summary)
- [x] Proposal with exactly 4 sections (1 exec + 1 full batch of 3)

#### Security

- [x] SAM.gov URL handler doesn't follow redirects to non-SAM.gov domains (SSRF prevention)
- [x] Constructed public URL validated before fetch
- [x] Parallel generation respects existing auth/org scoping

#### Data Leak

- [x] SAM.gov guidance message doesn't expose internal fetch error details
- [x] Batch generation errors don't leak section content from other orgs

#### Data Damage

- [x] Parallel batch doesn't create duplicate sections
- [x] Failed batch section properly marked FAILED (not stuck in GENERATING)
- [x] Rate limit (429) caught per-section, retry-after respected, batch continues

### E2E Gate

```bash
# SAM.gov URL detection tests
npx vitest run src/app/api/intake/fetch-url/ --grep "sam.gov"

# Parallel generation tests
npx vitest run src/lib/ai/pipeline/ --grep "batch\|parallel"

# Integration: full generation with batching
npx vitest run src/app/api/proposals/ --grep "parallel\|batch"
```

### Acceptance Criteria

- [x] L1: All 6 test categories pass
- [x] L2: SSRF prevention on URL redirect
- [x] L3: Batch generation handles 429 rate limits gracefully
- [x] L4: Generation time measurably faster (log before/after for 4+ section proposals)
- [x] L5: N/A
- [x] SAM.gov workspace URLs auto-redirect to public format
- [x] Generation uses batches of 3-4 after exec summary
- [x] ESLint passes on all changed files

---

## Phase 3: Product Alignment Panel & NAICS Input

### Description

Two UI enhancements: (1) Extend `computeCapabilityAlignment()` to return per-product match scores, then build inline collapsible panel in bid evaluation step showing scores with one-click enable/disable. (2) Bundle static `naics-2022.json` (~1,000 entries), replace NAICS text input with searchable multi-select combobox with autocomplete, comma-paste support, and RFP extraction with user confirmation.

**Stage A:** Write tests only. **Stage B:** Implement against frozen tests.

### Tests

#### Happy Path — Product Alignment

- [x] Panel renders product list with match scores (0-100)
- [x] Each product shows matched and unmatched requirements
- [x] One-click toggle enables/disables product for current proposal
- [x] Panel uses existing `computeCapabilityAlignment()` output (no new AI calls)
- [ ] Panel is collapsible (starts collapsed, expands on click)

#### Happy Path — NAICS

- [ ] Multi-select combobox renders with search input
- [x] Typing filters NAICS codes by code number and description
- [ ] Selected codes appear as removable tags
- [x] Comma-separated paste adds multiple codes at once (e.g., "541512,541511")
- [x] Extracted NAICS codes from RFP shown as suggestions with "Confirm" action
- [ ] Confirmed codes added to selected list

#### Bad Path — Product Alignment

- [x] No products configured: shows "Configure products in Settings" message
- [ ] No capability alignment data: shows "Run bid evaluation first" message
- [x] Product with 0% match score still renders (not hidden)

#### Bad Path — NAICS

- [x] Invalid NAICS code (non-existent) shows "Code not found" feedback
- [x] Empty search query shows top-level categories
- [x] Pasting non-numeric text doesn't add invalid codes
- [x] Extraction returns no NAICS codes: shows "No codes detected. Add manually."

#### Edge Cases

- [x] Product alignment panel with 20+ products renders without performance issues
- [x] NAICS search with ambiguous partial input (e.g., "54") shows multiple results
- [ ] Removing all selected NAICS codes returns to empty state
- [x] NAICS extractor handles RFPs that mention NAICS in various formats ("NAICS: 541512", "NAICS Code 541512", "541512 (Computer Systems)")

#### Security

- [x] Product alignment data scoped by organization_id
- [x] NAICS lookup doesn't accept arbitrary queries that could be used for injection
- [ ] Product enable/disable action validates user has edit permission

#### Data Leak

- [x] Product alignment scores don't expose other organizations' product data
- [x] NAICS extraction doesn't send full RFP text to client (extraction happens server-side)

#### Data Damage

- [x] Toggling product enable/disable doesn't modify global product settings (proposal-scoped only)
- [x] NAICS confirmation doesn't overwrite manually entered codes

### E2E Gate

```bash
# Product alignment panel tests
npx vitest run src/components/product-recs/

# NAICS component tests
npx vitest run src/components/naics/
npx vitest run src/lib/naics/

# Integration: bid evaluation with product panel
npx vitest run --grep "product alignment\|naics"
```

### Acceptance Criteria

- [ ] L1: All 6 test categories pass
- [ ] L2: Multi-tenant scoping verified for both features
- [ ] L3: N/A
- [ ] L4: N/A
- [ ] L5: N/A
- [ ] Product panel renders inline in bid evaluation step
- [ ] NAICS multi-select replaces text input in intelligence search
- [ ] ESLint passes on all changed files

---

## Phase 4: Changelog & What's New Badge

### Description

Create in-app `/changelog` page rendering structured entries from `changelog.json`. Add "What's New" badge to nav that tracks `last_viewed_changelog` per user and clears on page view. Populate initial changelog entry for this release.

**Stage A:** Write tests only. **Stage B:** Implement against frozen tests.

### Tests

#### Happy Path

- [x] `/changelog` page renders entries from `changelog.json`
- [x] Entries display version, date, title, and categorized items (new/improved/fixed)
- [x] Most recent entry appears first
- [x] "What's New" badge appears in nav when latest entry is newer than user's last view
- [x] Visiting `/changelog` clears the badge (updates `last_viewed_changelog`)
- [x] Badge does not appear after viewing latest changelog

#### Bad Path

- [x] Empty `changelog.json`: page shows "No updates yet. Check back soon."
- [x] Malformed `changelog.json` entry: skipped, others still render
- [x] User has no `last_viewed_changelog` record: badge shows (treats as never viewed)

#### Edge Cases

- [x] Multiple entries on same date render in correct order
- [x] Long item text wraps correctly
- [x] Page renders correctly with 50+ entries (pagination or virtual scroll)

#### Security

- [x] `/changelog` page accessible to all authenticated users (no plan-gating)
- [ ] `last_viewed_changelog` update scoped to authenticated user only
- [ ] Cannot update another user's `last_viewed_changelog`

#### Data Leak

- [x] Changelog content doesn't reference internal systems, API keys, or infrastructure
- [ ] User preference update endpoint doesn't expose other user preferences

#### Data Damage

- [ ] Updating `last_viewed_changelog` doesn't affect other user preferences
- [ ] Concurrent badge checks from multiple tabs don't corrupt state

### E2E Gate

```bash
# Changelog page tests
npx vitest run src/app/(dashboard)/changelog/

# Badge component tests
npx vitest run src/components/changelog/

# Data format validation
node -e "const d = require('./src/data/changelog.json'); console.log('Entries:', d.length, 'Valid:', d.every(e => e.version && e.date && e.title))"
```

### Acceptance Criteria

- [x] L1: All 6 test categories pass
- [ ] L2: Auth scoping verified (last_viewed_changelog persistence pending)
- [x] L3: N/A
- [x] L4: N/A
- [x] L5: N/A
- [x] Changelog page renders at `/changelog`
- [x] Badge appears/clears correctly
- [x] Initial entry written for this release
- [x] ESLint passes on all changed files

---

## Final E2E Verification

```bash
# Full test suite — no regressions
npx vitest run

# Build verification
npm run build

# Lint verification
npx eslint src/lib/retry/ src/lib/progress/ src/lib/naics/ \
  src/components/naics/ src/components/product-recs/ src/components/changelog/ \
  src/app/api/intake/ src/app/api/proposals/ \
  src/app/\(dashboard\)/changelog/

# Smoke: verify key routes don't 500
npm run smoke:prod 2>/dev/null || echo "Smoke skipped (no prod URL configured)"
```

## Risk Mitigation

| Risk                                               | Mitigation                                        | Contingency                                    |
| -------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------- |
| Parallel batch generation causes rate limit spikes | Batch size limited to 3-4, 429 handling built in  | Reduce batch size to 2 or revert to sequential |
| SAM.gov public URL format changes                  | URL detection uses regex, easy to update          | Fall back to guidance message                  |
| NAICS data source (2022 revision) becomes stale    | Static JSON import, versioned                     | Update JSON file on NAICS revision release     |
| Retry wrapper masks permanent failures             | Non-retryable errors (400, 403, 422) bypass retry | Review error classification quarterly          |
| Progress metadata column size                      | Progress object is small (~100 bytes JSON)        | N/A, fits in existing JSONB column             |

## References

- [Intent](./quality-ux-release.intent.md)
- [Interview Decisions](../docs/decisions-quality-ux-release.md)
- [Existing extraction route](../src/app/api/intake/extract/route.ts)
- [Existing client orchestration](../src/lib/ai/pipeline/client-orchestrate.ts)
- [Existing capability alignment](../src/lib/ai/pipeline/capability-alignment.ts)
