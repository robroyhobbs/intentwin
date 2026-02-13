# Execution Plan: quality-feedback-loop

## Overview

Wire quality council judge feedback into the manual "Regenerate" and "AI Auto-Fix" flows so rewrites address specific judge concerns instead of starting blind. Update the Regenerate button label to indicate when feedback is available.

## Prerequisites

- Quality council review flow working (quality-overseer.ts)
- Existing regenerate endpoint and pipeline.ts `regenerateSection()` function
- Existing auto-fix endpoint and `buildAutoFixPrompt()` prompt builder
- Proposal page UI with Regenerate and Apply AI Fixes buttons

## Phase 0: Backend — Feedback Fetch + Regenerate Pipeline

### Description

Add `getQualityFeedbackForSection()` to quality-overseer.ts that reads the `quality_review` JSONB column and extracts feedback for a specific section. Update the regenerate route to fetch and pass quality feedback, and update `regenerateSection()` in pipeline.ts to accept and inject it into the prompt.

### Tests

#### Happy Path

- [x] `getQualityFeedbackForSection()` returns judge feedback when quality_review has data for the section
- [x] `getQualityFeedbackForSection()` returns all judge comments (passing and failing) for the section
- [x] Regenerate endpoint passes quality feedback to `regenerateSection()` when scores exist
- [x] `regenerateSection()` appends feedback block to prompt when qualityFeedback is provided
- [x] Regenerated content reflects feedback-aware prompt (feedback string appears in generation_prompt column)

#### Bad Path

- [x] `getQualityFeedbackForSection()` returns null when quality_review column is null
- [x] `getQualityFeedbackForSection()` returns null when quality_review has no matching section_id
- [x] `getQualityFeedbackForSection()` returns null when quality_review status is "failed"
- [x] Regenerate works normally (no crash) when quality feedback fetch fails
- [x] Regenerate works normally when proposal has no quality_review data at all

#### Edge Cases

- [x] quality_review contains old single-judge SectionReview format (backward compat)
- [x] quality_review sections array is empty
- [x] Section was remediated (has remediation entry) — still uses latest feedback

#### Security

- [x] Quality feedback fetch respects existing proposal access control (no new auth bypass)
- [x] Feedback content is treated as untrusted input in prompt construction (no injection)

#### Data Leak

- [x] Error messages from feedback fetch don't expose quality_review internals
- [x] Logged errors don't dump full quality_review JSONB

#### Data Damage

- [x] Feedback fetch is read-only — never modifies quality_review column
- [x] Failed feedback fetch doesn't block or corrupt the regeneration flow

### E2E Gate

```bash
# Verify regenerate endpoint still works without quality data
curl -s -X POST http://localhost:3000/api/proposals/TEST_ID/sections/TEST_SEC/regenerate \
  -H "Authorization: Bearer TEST_TOKEN" | jq .status

# Verify getQualityFeedbackForSection export exists
grep -n "getQualityFeedbackForSection" src/lib/ai/quality-overseer.ts

# Verify regenerateSection accepts optional qualityFeedback parameter
grep -n "qualityFeedback" src/lib/ai/pipeline.ts

# Run type check
cd /Users/robroyhobbs/projects/capgemini-proposal-generator && npx tsc --noEmit
```

### Acceptance Criteria

- [ ] `getQualityFeedbackForSection()` exported from quality-overseer.ts
- [ ] Regenerate route fetches quality feedback and passes to pipeline
- [ ] `regenerateSection()` accepts optional `qualityFeedback?: string` parameter
- [ ] When feedback exists, prompt includes "Quality Review Feedback" section
- [ ] When no feedback, behavior is identical to current (backward compatible)
- [ ] TypeScript compiles without errors

---

## Phase 1: Auto-Fix Integration + UI Button Label

### Description

Update the auto-fix route to also fetch quality judge feedback and pass it alongside manual review comments to the prompt builder. Update `buildAutoFixPrompt()` to accept and render both feedback sources. Update the proposal page UI to show "Regenerate with Feedback" when quality scores exist for the current section.

### Tests

#### Happy Path

- [x] Auto-fix route fetches quality feedback for the section
- [x] `buildAutoFixPrompt()` includes quality judge feedback section when provided
- [x] `buildAutoFixPrompt()` still works with only manual comments (no quality feedback)
- [x] Combined prompt contains both "Reviewer Comments" and "Quality Judge Feedback" sections
- [x] Regenerate button shows "Regenerate with Feedback" when section has quality scores
- [x] Regenerate button shows "Regenerate" when section has no quality scores

#### Bad Path

- [x] Auto-fix still works when quality_review is null (only manual comments used)
- [x] Auto-fix still works when quality feedback fetch errors (graceful fallback)
- [x] Button label doesn't change while regeneration is in progress ("Regenerating..." stays)

#### Edge Cases

- [x] Section has quality scores but zero manual review comments — auto-fix uses only judge feedback
- [x] Section has both sources — combined prompt has both sections clearly separated
- [x] Quality review ran but this specific section wasn't reviewed (filtered out)

#### Security

- [x] Auto-fix prompt doesn't allow judge feedback to override system instructions
- [x] Quality feedback in prompt is clearly labeled as external input

#### Data Leak

- [x] Auto-fix error responses don't expose quality judge data
- [x] Button label logic doesn't leak score values to DOM

#### Data Damage

- [x] Auto-fix with combined feedback doesn't corrupt section content format
- [x] Resolved review status update still works correctly with combined flow

### E2E Gate

```bash
# Verify auto-fix prompt builder accepts qualityFeedback parameter
grep -n "qualityFeedback" src/lib/ai/prompts/auto-fix.ts

# Verify auto-fix route fetches quality data
grep -n "quality_review\|getQualityFeedback" src/app/api/proposals/\[id\]/auto-fix/route.ts

# Verify UI button label logic
grep -n "Regenerate with Feedback\|quality_review" "src/app/(dashboard)/proposals/[id]/page.tsx"

# Type check
cd /Users/robroyhobbs/projects/capgemini-proposal-generator && npx tsc --noEmit
```

### Acceptance Criteria

- [ ] Auto-fix route fetches and passes quality feedback to prompt builder
- [ ] `buildAutoFixPrompt()` accepts optional `qualityFeedback?: string` parameter
- [ ] Combined prompt clearly separates manual comments from judge feedback
- [ ] Regenerate button label is dynamic based on quality score existence
- [ ] All existing auto-fix behavior preserved (backward compatible)
- [ ] TypeScript compiles without errors

---

## Final E2E Verification

```bash
# Full type check
cd /Users/robroyhobbs/projects/capgemini-proposal-generator && npx tsc --noEmit

# Verify all modified files
echo "=== Modified files ==="
grep -rn "getQualityFeedbackForSection" src/
grep -rn "qualityFeedback" src/
grep -rn "Regenerate with Feedback" src/

# Verify no new files created (constraint 5)
git diff --name-only --diff-filter=A
```

## Risk Mitigation

| Risk                                                      | Mitigation                                                     | Contingency                       |
| --------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------- |
| quality_review JSONB shape varies between old/new reviews | Check for both CouncilSectionReview and SectionReview types    | Fallback to null if parse fails   |
| Prompt too long with all judge feedback                   | Feedback is already summarized by judges (1-2 paragraphs each) | Truncate to 2000 chars if needed  |
| UI re-render flicker on button label                      | Derive from proposal state already in memory (no extra fetch)  | Use useMemo for label computation |

## References

- [Intent](./quality-feedback-loop.intent.md)
- [Interview Decisions](./quality-feedback-loop.decisions.md)
