# Execution Plan: Quality Overseer

## Overview

Implement an automated Quality Overseer that reviews every AI-generated proposal section using GPT-4o (cross-model validation against Gemini). Scores each section across 4 quality dimensions, auto-regenerates weak sections with a single remediation pass, and displays results in a Quality Report panel on the proposal edit page.

## Prerequisites

- Existing Gemini generation pipeline (`src/lib/ai/pipeline.ts`)
- `proposals` table with `proposal_sections` in Supabase
- `OPENAI_API_KEY` environment variable configured
- Proposal edit page at `src/app/(dashboard)/proposals/[id]/page.tsx`

---

## Phase 0: Database Migration + OpenAI SDK Setup

### Description

Add `quality_review` JSONB column to the `proposals` table and install the OpenAI SDK. This is the foundation — no logic yet, just schema and dependency.

### Tests

#### Happy Path

- [x] Migration applies cleanly to local Supabase
- [x] `quality_review` column exists and accepts valid JSONB
- [x] `openai` package installs and imports correctly
- [x] Can instantiate OpenAI client with env key

#### Bad Path

- [x] Column handles NULL gracefully (default state)
- [x] Migration is idempotent (re-running doesn't error)
- [x] OpenAI client creation fails gracefully when key is missing/invalid

#### Edge Cases

- [x] Existing proposals have NULL quality_review (no backfill needed)
- [x] JSONB column accepts empty object `{}`
- [x] Column works with existing RLS policies on proposals table

#### Security

- [x] OPENAI_API_KEY is only accessed server-side (not exposed to client)
- [x] RLS on proposals table still controls access to quality_review data
- [x] Migration doesn't weaken existing security policies

#### Data Leak

- [x] API key not logged or exposed in error messages
- [x] quality_review JSONB doesn't leak to unauthorized users (covered by existing RLS)

#### Data Damage

- [x] Adding column doesn't affect existing proposal data
- [x] No data loss on existing rows
- [x] Column allows concurrent reads/writes

### E2E Gate

```bash
# Verify migration
cd /Users/robroyhobbs/projects/capgemini-proposal-generator
npx supabase db push --dry-run 2>&1 | grep -i "quality_review"

# Verify OpenAI SDK
node -e "const { OpenAI } = require('openai'); console.log('OpenAI SDK OK')"

# Verify column exists (via API or direct query)
curl -s "$SUPABASE_URL/rest/v1/proposals?select=quality_review&limit=1" \
  -H "apikey: $SUPABASE_ANON_KEY" | head -c 200
```

### Acceptance Criteria

- [ ] Migration file `00025_add_quality_review_column.sql` created and applied
- [ ] `openai` package in dependencies
- [ ] OpenAI client wrapper created at `src/lib/ai/openai-client.ts`
- [ ] All tests pass
- [ ] Code committed

---

## Phase 1: GPT-4o Review Prompt + Scoring Function

### Description

Build the GPT-4o review prompt and the core scoring function that evaluates a single section against 4 quality dimensions. This is the atomic unit of the overseer — one section in, score + feedback out.

### Tests

#### Happy Path

- [x] Review prompt includes all 4 dimensions with clear rubric
- [x] Prompt injects section content, section type, and proposal context
- [x] GPT-4o returns valid JSON with scores (1-10) for each dimension + feedback
- [x] Section average is calculated correctly from 4 dimension scores
- [x] Prompt includes brand voice settings when available
- [x] Prompt includes win strategy context when available

#### Bad Path

- [x] Handles GPT-4o returning malformed JSON (retry with JSON mode)
- [x] Handles GPT-4o timeout (returns error, doesn't crash)
- [x] Handles GPT-4o rate limit (backs off, retries once)
- [x] Handles empty section content (returns low score with "no content" feedback)
- [x] Handles missing brand voice settings (skips that dimension context, still scores)
- [x] Handles OpenAI API error (500, 503) gracefully

#### Edge Cases

- [x] Very long section content (truncate to GPT-4o context limit)
- [x] Section with only headers/formatting, no substance
- [x] Section content is HTML vs markdown vs plain text
- [x] All dimensions score exactly 10 (perfect score)
- [x] All dimensions score exactly 1 (worst score)

#### Security

- [x] Prompt doesn't leak system instructions or internal architecture
- [x] Client data sent to GPT-4o is only the section content + context needed for review
- [x] No PII beyond what's in the proposal content itself

#### Data Leak

- [x] GPT-4o feedback doesn't echo back sensitive internal prompts
- [x] Error messages from OpenAI don't expose API keys or internal URLs
- [x] Scores and feedback are sanitized before storage

#### Data Damage

- [x] Review function is read-only (doesn't modify section content)
- [x] Scoring function is pure (same input → same structure output, scores may vary)
- [x] Failed review doesn't corrupt existing proposal data

### E2E Gate

```bash
# Unit test the scoring function with mock data
cd /Users/robroyhobbs/projects/capgemini-proposal-generator
pnpm test -- --grep "quality-review"

# Integration test with real GPT-4o call (optional, costs API credits)
# node -e "const { reviewSection } = require('./src/lib/ai/quality-overseer'); ..."
```

### Acceptance Criteria

- [ ] `src/lib/ai/prompts/quality-review.ts` — prompt builder with 4-dimension rubric
- [ ] `src/lib/ai/quality-overseer.ts` — `reviewSection()` function that calls GPT-4o and returns structured score
- [ ] JSON response schema validated with Zod
- [ ] Unit tests for prompt building and score calculation
- [ ] Code committed

---

## Phase 2: Quality Overseer Core Logic (Review + Remediation)

### Description

Build the full review pipeline: review all sections, identify weak ones (< 8.5 avg), regenerate weak sections with Gemini injecting GPT-4o feedback, re-review regenerated sections, calculate overall score, and store the complete quality_review JSONB.

### Tests

#### Happy Path

- [x] Reviews all sections in a proposal sequentially
- [x] Identifies sections scoring below 8.5 threshold
- [x] Regenerates weak sections with Gemini, injecting GPT-4o feedback as context
- [x] Re-reviews regenerated sections with GPT-4o (Round 2)
- [x] Calculates overall score as average of all section averages
- [x] Determines pass/fail based on 9.0 threshold
- [x] Stores complete quality_review JSONB with correct structure
- [x] Logs remediation entries (original score, issues, new score)
- [x] Sets status to "completed" when done

#### Bad Path

- [x] Handles proposal with 0 sections (sets status "completed" with empty sections array)
- [x] Handles GPT-4o failure mid-review (marks status "failed", stores partial results)
- [x] Handles Gemini regeneration failure (keeps original content, logs error in remediation)
- [x] Handles proposal not found (throws, caller handles)
- [x] Handles database write failure (retries once, then fails)
- [x] Handles all sections failing review (still completes, all in remediation log)

#### Edge Cases

- [x] Proposal with exactly 1 section
- [x] All sections pass first review (no remediation needed, 0 entries)
- [x] All sections fail first review (all regenerated)
- [x] Regenerated section scores worse than original (keeps new score, logs regression)
- [x] Section barely below threshold (8.4 → triggers regen)
- [x] Section exactly at threshold (8.5 → no regen)
- [x] Overall score exactly 9.0 (pass = true)

#### Security

- [x] Only processes sections belonging to the specified proposal
- [x] Regeneration uses same auth context as original generation
- [x] Cannot trigger review on another org's proposal

#### Data Leak

- [x] Quality review JSONB doesn't contain raw GPT-4o prompts
- [x] Remediation log doesn't expose internal scoring rubric
- [x] Failed review status doesn't leak error details to frontend

#### Data Damage

- [x] Regenerated content properly updates the section's `generated_content`
- [x] Original content is preserved if regeneration fails
- [x] Concurrent review requests on same proposal are prevented (status check)
- [x] Partial completion stores what was reviewed (doesn't lose progress)
- [x] Version snapshot created after remediation (tracks changes)

### E2E Gate

```bash
# Run full test suite
cd /Users/robroyhobbs/projects/capgemini-proposal-generator
pnpm test -- --grep "quality-overseer"

# Verify JSONB structure matches spec
node -e "
const schema = require('./src/lib/ai/quality-overseer');
// Validate output structure against Zod schema
"
```

### Acceptance Criteria

- [ ] `runQualityReview(proposalId, trigger)` function in `quality-overseer.ts`
- [ ] Reviews all sections → remediates weak ones → stores results
- [ ] Proper status transitions: reviewing → completed/failed
- [ ] Remediation injects GPT-4o feedback into Gemini regeneration prompt
- [ ] Version snapshot created after remediation changes
- [ ] Concurrent review prevention (check status before starting)
- [ ] All tests pass
- [ ] Code committed

---

## Phase 3: API Endpoints (POST Trigger + GET Results)

### Description

Create the two API endpoints: POST to trigger async quality review, GET to poll results. Follows the same fire-and-forget + polling pattern used by the existing generation pipeline.

### Tests

#### Happy Path

- [x] POST `/api/proposals/[id]/quality-review` triggers review and returns `{ status: "reviewing" }`
- [x] POST accepts `{ trigger: "manual" }` and `{ trigger: "auto_post_generation" }`
- [x] Background process runs quality review to completion
- [x] GET `/api/proposals/[id]/quality-review` returns current quality_review JSONB
- [x] GET returns null/empty when no review has been run
- [x] GET returns partial results while review is in progress (status: "reviewing")

#### Bad Path

- [x] POST returns 404 when proposal doesn't exist
- [x] POST returns 401 when user is not authenticated
- [x] POST returns 403 when user doesn't own the proposal
- [x] POST returns 409 when review is already in progress
- [x] POST returns 400 with invalid trigger value
- [x] GET returns 404 when proposal doesn't exist
- [x] GET returns 401/403 for unauthorized access
- [x] Background process failure sets status to "failed" (not stuck on "reviewing")

#### Edge Cases

- [x] POST on proposal with no sections (completes immediately)
- [x] Rapid POST requests (second request gets 409)
- [x] GET during transition from reviewing → completed (returns latest state)
- [x] POST after a previous review exists (overwrites with new review)
- [x] Very long review process (Vercel timeout handling with maxDuration)

#### Security

- [x] Auth check on both endpoints (Supabase session)
- [x] Organization-scoped access (user can only review their org's proposals)
- [x] Rate limiting consideration (manual trigger shouldn't be spammable)
- [x] POST body validated with Zod schema
- [x] No SQL injection via proposal ID parameter

#### Data Leak

- [x] 404 response doesn't reveal whether proposal exists for other orgs
- [x] Error responses don't expose internal architecture
- [x] API responses don't include server-side-only fields

#### Data Damage

- [x] POST is idempotent when review is already running (409, doesn't start second)
- [x] Background failure doesn't leave proposal in permanent "reviewing" state
- [x] GET is read-only (no side effects)

### E2E Gate

```bash
# Test API endpoints (requires running dev server)
cd /Users/robroyhobbs/projects/capgemini-proposal-generator

# POST trigger
curl -X POST http://localhost:3000/api/proposals/TEST_ID/quality-review \
  -H "Content-Type: application/json" \
  -H "Cookie: $AUTH_COOKIE" \
  -d '{"trigger":"manual"}' | jq .

# GET results (poll)
curl http://localhost:3000/api/proposals/TEST_ID/quality-review \
  -H "Cookie: $AUTH_COOKIE" | jq .

# Run unit tests
pnpm test -- --grep "quality-review.*route"
```

### Acceptance Criteria

- [ ] `src/app/api/proposals/[id]/quality-review/route.ts` with POST and GET handlers
- [ ] POST triggers async review, returns immediately
- [ ] GET returns quality_review JSONB
- [ ] Auth + org-scoping on both endpoints
- [ ] 409 conflict for concurrent reviews
- [ ] Zod validation on POST body
- [ ] All tests pass
- [ ] Code committed

---

## Phase 4: Frontend — Quality Report Panel

### Description

Build the Quality Report panel component and integrate it into the proposal edit page. Collapsible panel below version history with score display, section breakdown, remediation log, and manual re-run button. Polls during active review.

### Tests

#### Happy Path

- [x] Panel renders in "Not run" state with "Run Quality Review" button
- [x] Clicking button triggers POST and switches to "Reviewing" state with spinner
- [x] Polls GET endpoint every 3 seconds during review
- [x] Displays overall score (large number) when completed
- [x] Shows green badge for pass (>= 9.0), amber for fail (< 9.0)
- [x] Lists all sections with individual scores
- [x] Expanding a section shows 4 dimension scores + feedback
- [x] Shows remediation log (before/after scores) for auto-improved sections
- [x] "Re-evaluate" button triggers new review

#### Bad Path

- [x] Handles review failure (shows error state with retry button)
- [x] Handles network error during polling (shows error, allows retry)
- [x] Handles 409 conflict (shows "review already in progress")
- [x] Handles empty sections array (shows "no sections to review" message)

#### Edge Cases

- [x] Panel collapsed by default (doesn't overwhelm page)
- [x] Toggling collapse preserves review state
- [x] Navigating away and back preserves latest review results
- [x] Review completes while panel is collapsed (badge updates)
- [x] Very long feedback text (truncated with "show more")
- [x] Score display rounds to 1 decimal place

#### Security

- [x] Button only visible to users who can edit the proposal
- [x] Polling respects auth (doesn't leak to logged-out state)

#### Data Leak

- [x] No sensitive scoring logic exposed in frontend code
- [x] Error states don't show internal API details

#### Data Damage

- [x] Re-evaluate button shows confirmation if previous review exists
- [x] Polling cleanup on unmount (no memory leaks)
- [x] Concurrent UI actions don't cause duplicate triggers

### E2E Gate

```bash
# Build check (no TypeScript errors)
cd /Users/robroyhobbs/projects/capgemini-proposal-generator
pnpm build 2>&1 | tail -5

# Component test
pnpm test -- --grep "quality-report"

# Visual verification (dev server)
# Open http://localhost:3000/proposals/[test-id] and verify panel renders
```

### Acceptance Criteria

- [x] `src/components/proposals/quality-report.tsx` — full panel component
- [x] Integrated into proposal edit page (`proposals/[id]/page.tsx`)
- [x] 4 states: not-run, reviewing, completed-pass, completed-fail
- [x] Polling during active review
- [x] Collapsible panel with section breakdown
- [x] Remediation log display
- [x] Manual trigger + re-evaluate buttons
- [x] All tests pass
- [x] Code committed

---

## Phase 5: Pipeline Integration (Auto-Trigger)

### Description

Wire the quality review to auto-trigger when proposal generation completes. Add the trigger call at the end of the existing generation pipeline. Also handle the regeneration prompt enhancement — when a section is regenerated by the overseer, inject GPT-4o's feedback into the Gemini prompt.

### Tests

#### Happy Path

- [x] After full proposal generation completes, quality review auto-triggers
- [x] Auto-trigger uses `trigger: "auto_post_generation"`
- [x] Regeneration prompt includes GPT-4o feedback (issues + improvement suggestions)
- [x] Regenerated section content replaces original in `generated_content`
- [x] Frontend sees generation complete → review starts → review completes

#### Bad Path

- [x] Generation failure doesn't trigger quality review
- [x] Quality review failure doesn't affect proposal status (stays "review")
- [x] Regeneration failure during remediation doesn't crash the review
- [x] Auto-trigger on proposal with failed sections (reviews only completed sections)

#### Edge Cases

- [x] User triggers manual review while auto-review is pending (409)
- [x] User starts editing before auto-review completes (edits preserved)
- [x] Generation of new version while review is running (review uses sections at trigger time)

#### Security

- [x] Auto-trigger runs with same auth context as generation
- [x] Regeneration uses same organization-scoped prompts

#### Data Leak

- [x] GPT-4o feedback in regeneration prompt doesn't leak to user-visible prompt field
- [x] Auto-trigger doesn't expose review details in generation logs

#### Data Damage

- [x] User edits (`edited_content`) are never overwritten by regeneration
- [x] Regeneration only updates `generated_content`
- [x] Version snapshot distinguishes generation vs. remediation changes

### E2E Gate

```bash
# Full flow test: generate → auto-review → check results
cd /Users/robroyhobbs/projects/capgemini-proposal-generator

# Trigger generation on test proposal
curl -X POST http://localhost:3000/api/proposals/TEST_ID/generate \
  -H "Cookie: $AUTH_COOKIE" | jq .

# Wait for generation + review to complete
sleep 60

# Check quality review results
curl http://localhost:3000/api/proposals/TEST_ID/quality-review \
  -H "Cookie: $AUTH_COOKIE" | jq '.status, .overall_score, .pass'

# Run full test suite
pnpm test
```

### Acceptance Criteria

- [x] Generation pipeline calls POST quality-review on completion
- [x] Regeneration prompt enhancement with GPT-4o feedback
- [x] `edited_content` never overwritten
- [x] Version snapshot for remediation changes
- [x] End-to-end flow: generate → auto-review → remediate → complete
- [x] All tests pass
- [x] Code committed

---

## Final E2E Verification

```bash
cd /Users/robroyhobbs/projects/capgemini-proposal-generator

# 1. Full build (no errors)
pnpm build

# 2. Full test suite
pnpm test

# 3. Lint
pnpm lint

# 4. Manual flow verification:
#    a. Create new proposal with intake data
#    b. Generate all sections
#    c. Verify auto quality review triggers
#    d. Check Quality Report panel shows scores
#    e. Edit a section, click "Re-evaluate"
#    f. Verify new review runs and reflects changes

# 5. Check database state
# SELECT id, quality_review->>'status', quality_review->>'overall_score', quality_review->>'pass'
# FROM proposals WHERE quality_review IS NOT NULL LIMIT 5;
```

## Risk Mitigation

| Risk                               | Mitigation                                   | Contingency                             |
| ---------------------------------- | -------------------------------------------- | --------------------------------------- |
| GPT-4o API costs per review        | 2-round max, batch sections efficiently      | Add cost estimate before manual trigger |
| GPT-4o latency (10+ sections)      | Async pattern, frontend polling              | Show per-section progress in panel      |
| Vercel function timeout            | Use `maxDuration` config (60s+)              | Split into per-section background jobs  |
| GPT-4o returns inconsistent scores | Structured JSON mode, Zod validation         | Retry once with stricter prompt         |
| Remediation makes content worse    | Log before/after, never overwrite user edits | Show regression warning in panel        |
| Concurrent review race condition   | Check status before starting, 409 response   | Frontend disables button during review  |

## References

- [Quality Overseer Intent](./quality-overseer.intent.md)
- [Existing Pipeline](../src/lib/ai/pipeline.ts)
- [Proposal Edit Page](<../src/app/(dashboard)/proposals/[id]/page.tsx>)
- [Generation API](../src/app/api/proposals/[id]/generate/route.ts)
