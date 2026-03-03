# Coach & Generation Resilience Redesign — Design Document

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix three interconnected problems — generation gets stuck on partial failure, bid scores are inconsistent and meaningless, and the Decision Coach shows redundant/unhelpful content.

**Approach:** Frontend-only changes. No API or data model modifications. Restructure how the coach presents existing BidEvaluation data (gaps/strengths instead of scores) and make the polling loop handle partial success gracefully.

**Constraint:** Same backend, same BidEvaluation response, same CreateFlowState. This is a presentation + resilience upgrade.

---

## 1. Generation Resilience

**Problem:** When one section hangs during generation, the frontend polls for 10 minutes then shows "Proposal generation failed" — even though other sections completed successfully. The user loses all progress and must retry everything.

**Root cause:** The polling loop in `draft-helpers.ts` only checks if ALL sections are terminal. It ignores `proposal.status` (which Inngest sets to `REVIEW`/`DRAFT` when its finalize step runs). On timeout, it dispatches `GENERATION_FAIL` regardless of how many sections succeeded.

### Changes

**`draft-helpers.ts`:**
- `pollSections()`: Check `data.proposal.status` each cycle. If status is `review` or `draft`, generation is done — dispatch `GENERATION_COMPLETE`.
- On timeout: if any sections completed, dispatch `GENERATION_COMPLETE` (partial success) instead of `GENERATION_FAIL`. Mark still-generating sections as `failed` so they get retry buttons.
- Track elapsed time in a ref and pass it to the UI via dispatch.

**`draft-phase.tsx`:**
- Replace generic `ErrorBanner` with per-section status visibility. Failed/stuck sections show a red badge + individual "Retry" button (uses existing `regenerateSection`).
- Add "Retry all failed" button when multiple sections failed.
- Show elapsed time during generation (e.g., "Generating... 45s") so the user knows it's still working.
- Progress bar gets accent glow pulse animation while generating.

**No backend changes.** The Inngest function already handles partial success and sets proposal status correctly. The fix is entirely in the frontend's interpretation of poll results.

---

## 2. Ditch the Score, Show the Gaps

**Problem:** The numeric bid score (0-100) varies between runs due to Gemini non-determinism, the radar chart is meaningless without benchmarks, and "Moderate alignment" in "Attention Needed" is confusing.

**Solution:** Replace numeric scores with a qualitative go/no-go verdict and specific gap/strength cards parsed from the AI's existing rationale text.

### What Gets Removed
- Radar chart component and tests
- Confidence ring component and tests
- Score bars in coach panel
- Numeric bid score in coach header
- "Moderate alignment" / "Low bid score" risk flags

### What Replaces It

**Verdict Card** (new component: `shared/verdict-card.tsx`):
- Uses existing `BidEvaluation.recommendation` field (`bid` / `evaluate` / `pass`)
- Visual treatment:
  - **Pursue** (green gradient border + `bg-emerald-500/5`): "Strong fit — your capabilities align well with this RFP"
  - **Pursue with caution** (amber gradient border + `bg-amber-500/5`): "Gaps exist — review below before committing"
  - **Consider passing** (red gradient border + `bg-red-500/5`): "Significant gaps — may not be worth the pursuit cost"
- Large verdict text `text-lg font-bold` + supporting sentence `text-sm text-muted-foreground`
- Icon badge top-right: `ThumbsUp` / `Scale` / `ThumbsDown` in matching color bg
- `animate-fade-in` on mount

**Gap Cards** (new component: `shared/gap-card.tsx`):
- One card per factor with score < 60
- 4px red/amber left border + `bg-red-500/5` or `bg-amber-500/5` background tint
- Factor name as title in `font-semibold`
- AI rationale text in `text-sm` (already cites specific evidence)
- `shadow-glow` on hover
- Icon: `AlertTriangle` (amber) or `XCircle` (red) tinted to match

**Strength Cards** (new component: `shared/strength-card.tsx`):
- One card per factor with score >= 70
- 4px green left border + `bg-emerald-500/5` background tint
- Same layout as gap cards but with `CheckCircle` icon in green
- Shows what you're strong on with the AI's specific reasoning

**Market Intelligence Stats** (new component: `shared/intel-stats.tsx`):
- Horizontal stat row using `stat-value` / `stat-label` pattern
- Stats: Avg Competing Offers, Avg Award Amount, Historical Win Rate
- Only rendered when intelligence data exists
- Collapsible, closed by default

### Data Flow (unchanged)
```
BidEvaluation.recommendation → VerdictCard
BidEvaluation.ai_scores[key].score < 60 → GapCard (with rationale)
BidEvaluation.ai_scores[key].score >= 70 → StrengthCard (with rationale)
BidEvaluation.intelligence → IntelStats
```

No new API calls. No changes to `BidEvaluation` type. Pure presentation restructuring.

---

## 3. Coach Content — One Focused Section Per Phase

**Problem:** The coach shows "Attention Needed" + "Information Needed" + "Detailed Analysis" simultaneously, with overlapping content. In intake, the same gaps appear as both risk flags AND prompts.

### Simplified Layout (all phases)

1. **Coach Header** — Sparkles icon badge + "Decision Coach" (no confidence ring, no score)
2. **NextStepCard** — Single directive, always visible
3. **Advisory text** — One paragraph of context (`text-sm` not `text-xs`)
4. **Primary content** — The ONE section that matters for this phase (not collapsible)
5. **Secondary content** — Optional, collapsible, closed by default

### Phase-Specific Content

**Intake:**
- Primary: Gap prompts only in a "What's Missing" section. Deduplicated — gaps no longer appear as both risk flags AND prompts. Critical gaps get pill-style importance badges.
- Secondary: None at intake (eval criteria too early to show).
- NextStepCard adjusts: "Critical information missing — fill in gaps below" or "Extraction looks good — review before continuing"

**Strategy:**
- Primary: Verdict card + gap cards + strength cards (non-collapsible)
- Secondary: Market intelligence stats (collapsible, closed)
- NextStepCard: "Select win themes that emphasize your strengths"

**Draft:**
- Primary: Per-section progress with elapsed time + criteria coverage
- Secondary: Word count / page estimate (collapsible)
- NextStepCard: "Review each section as it generates" → "N sections need review"

**Finalize:**
- Primary: Readiness checklist with animated check transitions
- Secondary: None
- NextStepCard: "Resolve N blockers" → "Approve and export"

### Deduplication Fix (intake)
- Remove: `riskFlags` generation from `buildExtractionCompleteCoach()` — gaps showed as risk flags
- Keep: `buildIntakePrompts()` — gaps show ONLY as prompts in "What's Missing"
- Result: Each gap appears exactly once

### Collapsible Behavior
- Primary content: always visible, NOT collapsible
- Secondary content: collapsible, closed by default
- Remove `CollapsibleSection` from primary content areas

---

## 4. Visual Polish (all phases)

**Coach panel overall:**
- Subtle top-to-bottom gradient background (`from-card to-card/50`)
- `space-y-6` between sections (up from `space-y-5`)
- Advisory text `text-sm` (up from `text-xs`)

**Cards:**
- Gap/strength/verdict cards get `shadow-glow` on hover
- Background tints use `bg-{color}-500/5` for dark theme compatibility
- 4px left borders with matching color
- `animate-fade-in` on mount

**Intake prompts:**
- Pill-style importance badges (rounded-full, colored bg) replacing tiny uppercase labels

**Draft progress:**
- Progress bar accent color with `animate-glow-pulse` while generating

**Finalize readiness:**
- Check animation with scale + color transition on completion

---

## 5. File Changes Summary

### Modify

| File | Changes |
|------|---------|
| `draft-helpers.ts` | Poll checks `proposal.status`; partial success on timeout; elapsed time tracking |
| `draft-phase.tsx` | Per-section retry, "Retry all failed", elapsed time, progress glow |
| `decision-coach.tsx` | Remove radar/confidence/score-bars. New layout: verdict, gaps, strengths, intel stats. Better spacing/gradients |
| `coach-content.ts` | Remove gap-based risk flags (intake). Remove score-based risk flags (strategy). Add verdict/gaps/strengths to coach content |
| `coach-insights.ts` | New `buildGapCards()` and `buildStrengthCards()` replacing factor rationale rows. Remove low-confidence field insights |
| `coach-insights-finalize.ts` | Remove verbose summary builder |
| `create-types.ts` | Add `verdict`, `GapCard[]`, `StrengthCard[]` to `CoachContent`. Remove `signals`, `citations`, `actions` (always empty) |

### Create

| File | Purpose |
|------|---------|
| `shared/verdict-card.tsx` | Go/no-go hero card with gradient border + icon badge |
| `shared/gap-card.tsx` | Red/amber capability gap card with factor name + rationale |
| `shared/strength-card.tsx` | Green strength card with factor name + rationale |
| `shared/intel-stats.tsx` | Horizontal stat row for market intelligence |

### Remove

| File | Reason |
|------|--------|
| `shared/radar-chart.tsx` + test | Replaced by verdict + gap/strength cards |
| `shared/confidence-ring.tsx` + test | Score not shown anymore |

---

## 6. What's NOT Changing

- Backend API routes (no changes to `/api/intake/bid-evaluation` or `/api/proposals/[id]/generate`)
- `BidEvaluation` type and scoring logic in `bid-scoring.ts`
- `CreateFlowState` data model
- Inngest generation functions
- Phase transitions and validation logic
- Overall page layout (main content + sidebar)

---

## 7. Success Criteria

- Generation partial failure shows completed sections + retry buttons for failed ones (not a generic error)
- No numeric bid score visible anywhere in the coach
- Verdict card clearly communicates go/no-go with specific reasoning
- Gap cards cite specific missing capabilities from the AI rationale
- No duplicate information between coach sections
- Each phase shows exactly ONE primary content section
- Visual polish: gradient borders, background tints, hover glows, animations
- All existing functionality preserved (no regressions)
- 0 ESLint errors, 0 new warnings on changed files
- TypeScript compiles cleanly
