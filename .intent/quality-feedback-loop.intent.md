# Quality Review Feedback Loop Intent

> Make section regeneration and auto-fix incorporate quality council feedback so rewrites address specific judge concerns instead of starting blind.

## Responsibilities

- When "Regenerate" is clicked on a section with existing quality scores, build a feedback-aware prompt that includes all judge comments and scores
- When no quality scores exist, fall back to standard regeneration (current behavior)
- When "AI Auto-Fix" is clicked, combine quality judge feedback AND manual review comments into a single prompt
- Update button label to "Regenerate with Feedback" when quality scores exist for the section
- Fetch quality review data from the proposal's `quality_review` JSONB column for the relevant section

## Non-Goals

- Changing the auto-remediation flow in quality-overseer.ts (already works correctly)
- Auto-running quality review after regeneration
- Adding new buttons or modals
- Changing quality scoring thresholds or judge configuration

## Structure

```
User clicks "Regenerate" on section
        │
        ▼
┌─────────────────────────┐
│ Fetch latest quality     │
│ scores for this section  │
│ from Supabase            │
└────────────┬────────────┘
             │
     ┌───────┴───────┐
     │ Scores exist? │
     └───────┬───────┘
        Yes  │  No
        ▼    │  ▼
  ┌──────────┐ ┌──────────────┐
  │ Build    │ │ Standard     │
  │ feedback │ │ regen        │
  │ prompt   │ │ (no change)  │
  └────┬─────┘ └──────────────┘
       ▼
  ┌──────────────────────┐
  │ Inject into existing │
  │ section prompt:      │
  │ - All judge scores   │
  │ - All judge feedback │
  │ - Original content   │
  └──────────────────────┘

User clicks "AI Auto-Fix"
        │
        ▼
┌─────────────────────────────┐
│ Fetch:                      │
│ 1. Manual review comments   │
│ 2. Quality judge feedback   │
│ (both for this section)     │
└────────────┬────────────────┘
             ▼
┌─────────────────────────────┐
│ Build combined prompt with  │
│ both feedback sources       │
└─────────────────────────────┘
```

## Constraints

1. Regenerate endpoint must fetch and pass quality feedback when available (optional parameter for backward compatibility)
2. Auto-Fix prompt must combine both judge feedback AND manual review comments in a single prompt
3. Feedback injection must occur at prompt build time, appended to the existing section prompt
4. Button label must reflect whether feedback is available ("Regenerate with Feedback" vs "Regenerate")
5. Feedback fetch function lives in quality-overseer.ts alongside existing quality data structures (no new files)
6. Quality data is read from the proposal's `quality_review` JSONB column, filtered to the target section
