# Quality Overseer — Intent Specification (Post-Critique)

## 1. Overview

**Problem:** AI-generated proposal sections vary in quality. No automated check ensures every section meets a high standard before the user reviews or exports.

**Solution:** An automated Quality Overseer that reviews every generated section using GPT-4o (different model than Gemini). Scores each section against 4 quality dimensions, auto-regenerates weak sections once, logs findings, and displays a Quality Report panel.

**Priority:** High — build first.
**Target User:** Proposal author using IntentWin.
**Scope:** Post-generation quality review with single-pass remediation.

## 2. Architecture

### Data Layer

**Add JSONB column to existing `proposals` table:**
```sql
ALTER TABLE proposals ADD COLUMN quality_review jsonb;
```

**quality_review JSONB structure:**
```json
{
  "status": "reviewing" | "completed" | "failed",
  "run_at": "ISO timestamp",
  "trigger": "auto_post_generation" | "manual",
  "model": "gpt-4o",
  "overall_score": 8.7,
  "pass": false,
  "sections": [
    {
      "section_id": "uuid",
      "section_type": "executive_summary",
      "score": 9.2,
      "dimensions": {
        "content_quality": 9,
        "client_fit": 10,
        "evidence": 8,
        "brand_voice": 9
      },
      "feedback": "Strong summary. Could cite specific metrics."
    }
  ],
  "remediation": [
    {
      "section_id": "uuid",
      "round": 1,
      "original_score": 6.5,
      "issues": ["Lacks specificity", "No evidence cited"],
      "new_score": 9.1
    }
  ]
}
```

### AI Layer

**Review Model:** GPT-4o via OpenAI SDK (`OPENAI_API_KEY` in env)
**Generation Model:** Gemini (existing)

**4 Scoring Dimensions (each 1-10):**
1. **Content Quality** — Persuasive, clear, specific, actionable
2. **Client Fit** — Addresses their pains, outcomes, aligns with win strategy
3. **Evidence** — Cites case studies, metrics, testimonials from knowledge base
4. **Brand Voice** — Matches tone settings, uses/avoids correct terminology

**Overall Score** = average of all section averages
**Pass Threshold** = 9.0 overall
**Section regeneration trigger** = section avg < 8.5

### Flow (2 rounds max)

```
All sections finish generating
        ↓
[Auto-trigger] POST /api/proposals/[id]/quality-review
  → Sets quality_review.status = "reviewing"
  → Returns immediately (async)
        ↓
Round 1: Review all sections with GPT-4o
  → Score each section (4 dimensions + feedback)
  → Identify sections scoring < 8.5
        ↓
If weak sections exist:
  → Regenerate each with Gemini (inject GPT-4o feedback)
  → Re-review regenerated sections with GPT-4o (Round 2)
  → Log remediation (original score → new score)
        ↓
Calculate overall score
Store in proposals.quality_review (status = "completed")
        ↓
Frontend polls and displays Quality Report
```

## 3. API Endpoints

### POST `/api/proposals/[id]/quality-review`
- Triggers async quality review
- Body: `{ trigger: "manual" | "auto_post_generation" }`
- Returns immediately: `{ status: "reviewing" }`
- Background process: reviews sections, regenerates weak ones, stores result
- Uses `waitUntil()` or Vercel `maxDuration` for background execution

### GET `/api/proposals/[id]/quality-review`
- Returns `proposals.quality_review` JSONB
- Frontend polls this until `status !== "reviewing"`

## 4. Frontend — Quality Report Panel

**Location:** Proposal edit page, collapsible panel below version history

**States:**
- **Reviewing:** Spinner + "Quality review in progress..."
- **Completed (pass):** Green badge, overall score, section breakdown
- **Completed (fail):** Amber badge, overall score, sections that still need work
- **Not run:** "No quality review yet" with manual trigger button

**Panel contents:**
- Overall score (large number) + pass/fail indicator
- Per-section list: section name, score, expandable dimension breakdown + feedback
- Remediation log: which sections were auto-improved, before/after scores
- "Re-evaluate" button for manual re-run after user edits

## 5. Technical Implementation

### New files:
- `src/lib/ai/quality-overseer.ts` — Core review + remediation logic
- `src/lib/ai/prompts/quality-review.ts` — GPT-4o review prompt builder
- `src/app/api/proposals/[id]/quality-review/route.ts` — API endpoints
- `src/components/proposals/quality-report.tsx` — Frontend panel
- `supabase/migrations/00025_add_quality_review_column.sql` — Add column

### Modified files:
- `src/app/(dashboard)/proposals/[id]/page.tsx` — Add Quality Report panel + polling
- `src/app/api/proposals/[id]/sections/generate/route.ts` — Auto-trigger after generation

### Dependencies:
- `openai` npm package

## 6. Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Review model | GPT-4o | True second opinion from different model |
| Scoring | 4 dimensions | Covers all angles without overlap (post-critique) |
| Remediation | 2 rounds max | Review → regen weak → final review. Avoids API explosion (post-critique) |
| Storage | JSONB on proposals | No new table, no new RLS. Simpler (post-critique) |
| API pattern | Async polling | Avoids Vercel timeout. Same pattern as generation (post-critique) |
| Trigger | Auto + manual re-run | User arrives to reviewed content, can re-check after edits |
| Threshold | 9.0 overall avg | High bar for enterprise proposals |

## 7. MVP Scope

**In:**
- GPT-4o review of all sections (4 dimensions)
- Single remediation pass for weak sections
- Quality Report panel with scores + remediation log
- Auto-trigger after generation + manual re-run
- Brand voice compliance checking

**Out:**
- Review history (only latest stored)
- Custom rubric editing
- Export-time quality gate
- Per-section inline badges
- Email notifications
