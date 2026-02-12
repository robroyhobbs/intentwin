# Execution Plan: quality-council

## Overview

Replace the single-judge GPT-4o quality review with a 3-judge LLM council (GPT-4o, Llama 3.3 via Groq, Mistral Small). Judges review in parallel, scores are aggregated via weighted average with majority vote, and the UI shows judge cards with consensus indicators.

## Prerequisites

- OpenAI SDK installed and `OPENAI_API_KEY` configured (existing)
- Gemini SDK installed and `GEMINI_API_KEY` configured (existing)
- `GROQ_API_KEY` — free tier from console.groq.com
- `MISTRAL_API_KEY` — free tier from console.mistral.ai

---

## Phase 0: Groq & Mistral Client Setup

### Description

Install the Groq and Mistral SDKs, create client files that export `reviewWithGroq()` and `reviewWithMistral()` functions matching the same return shape as the existing `reviewWithGPT4o()`. Each function must return structured JSON scores across the 4 quality dimensions + feedback.

### Tests

#### Happy Path

- [ ] `reviewWithGroq()` returns valid JudgeResult with all 4 dimension scores and feedback
- [ ] `reviewWithMistral()` returns valid JudgeResult with all 4 dimension scores and feedback
- [ ] Both functions return scores in the 0-10 range
- [ ] Both functions include judge_id, judge_name, and provider metadata

#### Bad Path

- [ ] `reviewWithGroq()` throws descriptive error when GROQ_API_KEY is missing
- [ ] `reviewWithMistral()` throws descriptive error when MISTRAL_API_KEY is missing
- [ ] `reviewWithGroq()` returns status "failed" when API returns malformed JSON
- [ ] `reviewWithMistral()` returns status "failed" when API returns malformed JSON
- [ ] Both handle HTTP 429 (rate limit) gracefully with descriptive error
- [ ] Both handle network timeout (>30s) with status "timeout"

#### Edge Cases

- [ ] Handles empty prompt input without crashing
- [ ] Handles very long prompt (>10K chars) without truncation errors
- [ ] Groq client is singleton (same instance returned on repeated calls)
- [ ] Mistral client is singleton (same instance returned on repeated calls)

#### Security

- [ ] API keys are not logged or included in error messages
- [ ] API keys are read from environment only, never hardcoded

#### Data Leak

- [ ] Error messages from failed API calls don't expose API keys
- [ ] Error messages don't expose internal prompt content

#### Data Damage

- [ ] Malformed API response doesn't corrupt the return object (defaults to 0 scores)
- [ ] Missing fields in JSON response default to safe values (0 for scores, "" for feedback)

### E2E Gate

```bash
# Verify both SDKs are installed
node -e "require('groq-sdk'); console.log('groq-sdk OK')"
node -e "require('@mistralai/mistralai'); console.log('mistral OK')"

# Verify both client files compile
npx tsc --noEmit

# Run unit tests for both clients
npx jest --testPathPattern="groq-client|mistral-client" --passWithNoTests
```

### Acceptance Criteria

- [ ] `groq-sdk` and `@mistralai/mistralai` installed
- [ ] `src/lib/ai/groq-client.ts` exports `reviewWithGroq()`
- [ ] `src/lib/ai/mistral-client.ts` exports `reviewWithMistral()`
- [ ] Both return JudgeResult shape with status/error handling
- [ ] TypeScript compiles with no errors
- [ ] All 6 test categories pass

---

## Phase 1: Council Orchestration in Quality Overseer

### Description

Modify `quality-overseer.ts` to orchestrate all 3 judges in parallel via `Promise.allSettled()`. Add the `runCouncilReview()` function, update the aggregation/consensus logic, update remediation to require council consensus (2+ judges agree section is weak), and change post-remediation re-review to GPT-4o only.

### Tests

#### Happy Path

- [ ] `runCouncilReview()` calls all 3 judges in parallel and returns aggregated CouncilSectionReview
- [ ] Overall score is the average of all successful judges' aggregated section scores
- [ ] Consensus is "unanimous" when all judges agree on pass/fail
- [ ] Consensus is "majority" when 2 of 3 judges agree
- [ ] `judge_reviews` array contains individual JudgeResult entries
- [ ] `judges` top-level array contains JudgeInfo with status for each judge
- [ ] `model` field is set to "council" instead of "gpt-4o"
- [ ] Combined feedback concatenates all judges' feedback with judge attribution

#### Bad Path

- [ ] When 1 judge fails, review continues with 2 judges and judge shows status "failed"
- [ ] When 2 judges fail, review continues with 1 judge
- [ ] When all 3 judges fail, overall review status is "failed"
- [ ] Failed judge's error message is captured in JudgeInfo.error
- [ ] Remediation does NOT trigger when only 1 judge scores below threshold
- [ ] Remediation DOES trigger when 2+ judges score below threshold

#### Edge Cases

- [ ] Works correctly with 0 completed sections (returns score 0, pass false)
- [ ] Handles sections where judges return wildly different scores (e.g., 3 vs 9)
- [ ] When exactly 2 judges participate (1 failed), majority = both must agree
- [ ] Post-remediation re-review uses only GPT-4o (not full council)
- [ ] Consensus computed only from successful judges (failed judges excluded)

#### Security

- [ ] No API keys in any logged error messages during council execution
- [ ] All judge API calls respect per-judge timeout (30s max)

#### Data Leak

- [ ] Failed judge error in stored result doesn't include raw API response bodies
- [ ] Console logs during council review don't expose prompt content

#### Data Damage

- [ ] Partial judge failure doesn't corrupt the overall quality_review JSONB
- [ ] If storage fails after council completes, error is properly caught
- [ ] Remediation failure for one section doesn't prevent scoring other sections

### E2E Gate

```bash
# TypeScript compilation
npx tsc --noEmit

# Run quality overseer tests
npx jest --testPathPattern="quality-overseer" --passWithNoTests

# Verify council review types are exported
node -e "const q = require('./src/lib/ai/quality-overseer'); console.log(typeof q.runQualityReview)"
```

### Acceptance Criteria

- [ ] `runCouncilReview()` orchestrates 3 judges via `Promise.allSettled()`
- [ ] `runQualityReview()` uses council for initial review
- [ ] Post-remediation re-review uses GPT-4o only
- [ ] Remediation requires 2+ judges consensus
- [ ] Fault-tolerant: works with 1-3 judges
- [ ] Updated QualityReviewResult type with judges[], consensus, council sections
- [ ] All 6 test categories pass

---

## Phase 2: Council UI — Judge Cards & Consensus Display

### Description

Update `quality-report.tsx` to display the 3-judge council results: judge cards showing each judge's name, score, and pass/fail status; a consensus indicator (unanimous/majority/split); per-section expandable judge breakdown. Must be backward-compatible with old single-judge data format.

### Tests

#### Happy Path

- [x] Renders 3 judge cards when all judges succeed
- [x] Each card shows judge name, score, and pass/fail icon
- [x] Consensus indicator shows "Unanimous" (green) when all judges agree
- [x] Consensus indicator shows "Majority" (amber) when 2 of 3 agree
- [x] Consensus shows "Split" (red) when no majority
- [x] Judge count indicator shows "3/3 judges" (or "2/3" on partial)
- [x] Expanded section view shows per-judge feedback
- [x] Overall score and pass/fail displayed in header

#### Bad Path

- [x] Renders gracefully when 1 judge has status "failed" (shows unavailable card)
- [x] Failed judge card shows error reason (e.g., "API timeout")
- [x] Handles old single-judge data format (backward compatibility) — renders as single card
- [x] Handles null/undefined quality_review data without crashing

#### Edge Cases

- [x] Works with only 1 successful judge (shows 1 card, no consensus line)
- [x] Works with 2 successful judges (shows 2 cards + 1 unavailable)
- [x] Very long judge feedback doesn't break layout (truncated/scrollable)
- [x] Section with no judge_reviews array falls back to aggregated-only display

#### Security

- [x] No API keys or internal details rendered in UI
- [x] Judge error messages sanitized before display

#### Data Leak

- [x] Raw API error details not shown to user (only "Unavailable" + brief reason)

#### Data Damage

- [x] Re-evaluate button passes correct proposalId (no data mixup)
- [x] Triggering new review while viewing old results doesn't corrupt display

### E2E Gate

```bash
# TypeScript compilation
npx tsc --noEmit

# Build passes (component renders without runtime errors)
npx next build 2>&1 | tail -5

# Verify component exports
node -e "console.log('QualityReport component compiles OK')"
```

### Acceptance Criteria

- [x] Judge cards display with name, score, pass/fail
- [x] Consensus indicator at top (unanimous/majority/split)
- [x] Failed judge shown as unavailable card
- [x] Per-section expandable judge breakdown
- [x] Backward-compatible with old single-judge format
- [x] All 6 test categories pass
- [x] Production build succeeds

---

## Final E2E Verification

```bash
# Full TypeScript check
npx tsc --noEmit

# Run all tests
npx jest --passWithNoTests

# Production build
npx next build

# Verify environment vars are documented
grep -q "GROQ_API_KEY" .env.example 2>/dev/null || echo "Add GROQ_API_KEY to .env.example"
grep -q "MISTRAL_API_KEY" .env.example 2>/dev/null || echo "Add MISTRAL_API_KEY to .env.example"
```

## Risk Mitigation

| Risk                                        | Mitigation                                                               | Contingency                                             |
| ------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------- |
| Groq free tier rate limit hit               | Parallel execution minimizes window; 1000 req/day generous for proposals | Graceful fallback to 2 judges                           |
| Mistral API key requires phone verification | Document clearly in setup                                                | App works with 1-2 judges if key missing                |
| Models score on different scales            | Same prompt + JSON schema enforces consistency                           | Scores naturally vary ±1; aggregation smooths           |
| Increased review latency                    | Parallel execution; bottleneck is slowest judge (~5-10s)                 | Still faster than sequential single-judge + remediation |

## References

- [Intent](./quality-council.intent.md)
