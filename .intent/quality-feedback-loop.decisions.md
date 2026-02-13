# Interview Decisions: Quality Review Feedback Loop

> Anchor: Make section regeneration and auto-fix incorporate quality council feedback so rewrites address specific judge concerns instead of starting blind.

## Decisions

### 1. Regeneration behavior when quality scores exist
- **Question**: When user clicks Regenerate on a section that has quality review scores, what should happen?
- **Decision**: Feedback-aware rewrite — if quality scores exist for the section, inject all judge feedback into the regeneration prompt. Falls back to standard regen if no scores exist.
- **Rationale**: The whole point of the quality council is wasted if regeneration ignores their feedback. This is the simplest path — no extra clicks, just smarter output.

### 2. AI Auto-Fix should combine judge + manual feedback
- **Question**: Should AI Auto-Fix combine judge feedback with manual review comments?
- **Decision**: Combine both — Auto-Fix prompt includes quality judge feedback AND user's manual highlight comments in one pass.
- **Rationale**: The user shouldn't have to click two different buttons to address two sources of feedback. One action, all feedback addressed.

### 3. No auto re-check after feedback-aware regen
- **Question**: After a feedback-aware regeneration, should it auto-run a quality re-check?
- **Decision**: No auto re-check. User manually runs quality review again when ready.
- **Rationale**: Keeps things simple, avoids surprise API costs, gives user control over when to re-evaluate.

### 4. UI indication of feedback-aware regeneration
- **Question**: How should the UI indicate that a Regenerate will use judge feedback vs standard?
- **Decision**: Subtle label change — button says "Regenerate with Feedback" when quality scores exist, plain "Regenerate" otherwise. No extra clicks.
- **Rationale**: User should know what's happening without needing to read tooltips or guess.

### 5. Include all judge feedback, not just failing
- **Question**: Should the feedback-aware prompt include ALL judge comments or just failing judges?
- **Decision**: Include feedback from all judges — even passing ones may have useful suggestions.
- **Rationale**: A judge scoring 8.7 (passing) might still have actionable improvement suggestions. More context = better rewrite.

## Open Items
- None

## Out of Scope
- Re-running full council review automatically after regen
- Adding a separate "Fix Judge Issues" button
- Changing the auto-remediation flow (already works correctly)
