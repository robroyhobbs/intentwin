# Execution Plan: bid-no-bid

## Overview

Add a bid/no-bid scoring engine to the intake flow. After RFP extraction, AI analyzes extracted requirements against L1 context and knowledge base to produce 5-factor scores with rationale. User reviews, optionally overrides scores, and proceeds or skips. Evaluation is persisted on the proposal record.

## Prerequisites

- RFP extraction flow working (intake/extract route)
- L1 context tables populated (company_context, product_contexts, evidence_library)
- `fetchL1Context()` and `buildL1ContextString()` functions in pipeline.ts
- `retrieveContext()` for KB document retrieval in pipeline.ts

## Phase 0: Backend — Scoring Engine + API

### Description

Add `bid_evaluation` JSONB column to proposals table. Create `scoreBidOpportunity()` function that fetches extracted RFP requirements and L1/KB context, calls LLM with a structured prompt for 5-factor scoring, and returns scores with rationale. Create two API routes: one to trigger scoring (POST), one to persist the user's proceed/skip decision (PATCH).

### Tests

#### Happy Path

- [x] `scoreBidOpportunity()` returns 5 factor scores (0-100) with rationale strings when proposal has extracted requirements
- [x] `scoreBidOpportunity()` returns all 5 factors: Requirement Match, Past Performance, Capability Alignment, Timeline Feasibility, Strategic Value
- [x] POST `/api/proposals/[id]/bid-evaluation` triggers scoring and stores result in `bid_evaluation` JSONB column
- [x] PATCH `/api/proposals/[id]/bid-evaluation` saves user_decision ("proceed" or "skip") alongside scores
- [x] PATCH endpoint saves user-overridden factor scores alongside AI-suggested scores
- [x] Stored bid_evaluation includes: ai_scores, user_scores (if overridden), weighted_total, recommendation, user_decision, rationale per factor

#### Bad Path

- [x] POST returns 400 when proposal has no extracted RFP requirements (extraction not complete)
- [x] POST returns 404 when proposalId doesn't exist
- [x] POST returns 401 when user is not authenticated
- [x] PATCH returns 400 when user_decision is missing or not "proceed"/"skip"
- [x] PATCH returns 400 when user_scores contain values outside 0-100 range
- [x] `scoreBidOpportunity()` handles LLM returning malformed JSON gracefully (returns error, doesn't crash)
- [x] `scoreBidOpportunity()` handles missing L1 context gracefully (scores with available data, doesn't crash)

#### Edge Cases

- [x] Proposal has extracted requirements but L1 context tables are empty — scoring still works with reduced confidence
- [x] POST called twice on same proposal — overwrites previous evaluation (idempotent)
- [x] PATCH called with user_scores for only some factors — merges with AI scores for unmodified factors
- [x] Very long RFP requirements text — prompt is truncated to fit context window
- [x] Proposal has no knowledge base documents — scoring works without KB context

#### Security

- [x] POST endpoint validates proposalId belongs to authenticated user's organization
- [x] PATCH endpoint validates proposalId ownership before updating
- [x] LLM prompt does not include raw user input without sanitization
- [x] Factor scores are validated as numbers 0-100 before storage

#### Data Leak

- [x] Error responses from POST don't expose L1 context or RFP content
- [x] Error responses from PATCH don't expose existing bid_evaluation data
- [x] Logged errors don't dump full LLM prompt or response

#### Data Damage

- [x] Failed LLM call doesn't write partial bid_evaluation to database
- [x] PATCH with invalid data doesn't corrupt existing bid_evaluation
- [x] Concurrent POST requests on same proposal don't produce corrupted JSONB

### E2E Gate

```bash
# Verify migration applied (bid_evaluation column exists)
cd /Users/robroyhobbs/projects/capgemini-proposal-generator && grep -n "bid_evaluation" supabase/migrations/*.sql

# Verify scoreBidOpportunity export exists
grep -n "scoreBidOpportunity" src/lib/ai/bid-scoring.ts

# Verify API routes exist
ls -la "src/app/api/proposals/[id]/bid-evaluation/"

# Verify TypeScript compiles
npx tsc --noEmit
```

### Acceptance Criteria

- [ ] `bid_evaluation` JSONB column added to proposals table via migration
- [ ] `scoreBidOpportunity()` exported from `src/lib/ai/bid-scoring.ts`
- [ ] POST route triggers AI scoring and stores result
- [ ] PATCH route persists user_decision and optional user_scores
- [ ] All factor scores validated as 0-100 integers
- [ ] Graceful fallback when L1/KB data is sparse
- [ ] TypeScript compiles without errors

---

## Phase 1: UI — Bid Evaluation Step in Intake Flow

### Description

Insert a bid evaluation step in the intake flow between extraction review and the 3-phase form. Display the 5 factor scores with AI-generated rationale, allow user to override any score via sliders/inputs, compute weighted total client-side, show 3-tier recommendation with color coding (green/yellow/red), and provide Proceed/Skip buttons that persist the decision before allowing the user to continue.

### Tests

#### Happy Path

- [x] Bid evaluation step renders after extraction review completes
- [x] All 5 factor scores display with labels, weights, and AI rationale
- [x] Weighted total computes correctly from factor scores and fixed weights (30/25/20/15/10)
- [x] Recommendation label shows "Recommended to Bid" (green) for score > 70
- [x] Recommendation label shows "Evaluate Further" (yellow) for score 40-70
- [x] Recommendation label shows "Recommended to Pass" (red) for score < 40
- [x] User can override any factor score via input/slider
- [x] Weighted total updates dynamically when user overrides a score
- [x] "Proceed" button calls PATCH with user_decision="proceed" and advances to next step
- [x] "Skip" button calls PATCH with user_decision="skip" and advances to next step

#### Bad Path

- [x] Bid evaluation step is not accessible before extraction completes (step gating)
- [x] Loading state shown while AI scoring is in progress
- [x] Error message displayed if scoring API fails (with retry option)
- [x] User cannot proceed without clicking Proceed or Skip (gate enforced)
- [x] Override input rejects non-numeric values
- [x] Override input clamps to 0-100 range

#### Edge Cases

- [x] All 5 scores are 0 — shows "Recommended to Pass" with 0 total
- [x] All 5 scores are 100 — shows "Recommended to Bid" with 100 total
- [x] Score exactly at threshold boundaries (40 and 70) — correct tier assignment
- [x] User overrides all scores then resets — reverts to AI scores
- [x] Returning to an already-evaluated proposal shows saved scores instead of re-scoring

#### Security

- [x] Score override values are validated client-side before PATCH request
- [x] API calls include authentication headers
- [x] No proposal data exposed in URL parameters

#### Data Leak

- [x] Factor rationale doesn't leak L1 context verbatim to DOM
- [x] Error states don't expose API response details
- [x] Score values in DOM attributes don't include internal metadata

#### Data Damage

- [x] Rapid Proceed/Skip clicks don't send duplicate PATCH requests (debounce)
- [x] Browser back button doesn't corrupt evaluation state
- [x] Page refresh after scoring shows saved evaluation (not blank)

### E2E Gate

```bash
# Verify bid evaluation UI components exist
grep -rn "bid-evaluation\|BidEvaluation\|bid_evaluation" "src/app/(dashboard)/proposals/new/page.tsx"

# Verify weighted total calculation
grep -rn "weightedTotal\|weighted_total\|FACTOR_WEIGHTS" src/

# Verify Proceed/Skip buttons
grep -rn "Proceed\|Skip.*Opportunity\|user_decision" "src/app/(dashboard)/proposals/new/page.tsx"

# Type check
cd /Users/robroyhobbs/projects/capgemini-proposal-generator && npx tsc --noEmit
```

### Acceptance Criteria

- [ ] Bid evaluation step inserted after extraction review, before 3-phase form
- [ ] 5 factor scores displayed with labels, weights, rationale, and override controls
- [ ] Weighted total computed client-side with correct weights
- [ ] 3-tier recommendation with color-coded display
- [ ] User can override any score; overridden values persist via PATCH
- [ ] Proceed/Skip gate enforced — must choose one to continue
- [ ] Both decisions recorded for analytics
- [ ] TypeScript compiles without errors

---

## Final E2E Verification

```bash
# Full type check
cd /Users/robroyhobbs/projects/capgemini-proposal-generator && npx tsc --noEmit

# Verify all new/modified files
echo "=== Scoring engine ==="
grep -rn "scoreBidOpportunity" src/
echo "=== API routes ==="
ls -la "src/app/api/proposals/[id]/bid-evaluation/"
echo "=== UI integration ==="
grep -rn "BidEvaluation\|bid_evaluation" "src/app/(dashboard)/proposals/new/page.tsx"
echo "=== Migration ==="
grep -l "bid_evaluation" supabase/migrations/*.sql
echo "=== Factor weights ==="
grep -rn "FACTOR_WEIGHTS\|Capability Alignment" src/
```

## Risk Mitigation

| Risk                                              | Mitigation                                                     | Contingency                                                   |
| ------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------- |
| LLM returns inconsistent score format             | Structured prompt with JSON schema example + validation        | Fallback to all-50 scores with "scoring unavailable" message  |
| L1 context too large for prompt                   | Truncate to key sections (brand + top products + top evidence) | Score with available data, note reduced confidence            |
| Intake flow state management complexity           | Reuse existing phase/intakeMode pattern                        | Add separate `bidEvaluation` state alongside existing `phase` |
| Score computation disagreement (client vs stored) | Weights are constants, total computed client-side only         | Store both factor_scores and weighted_total for audit         |

## References

- [Intent](./bid-no-bid.intent.md)
- [Interview Decisions](./bid-no-bid.decisions.md)
