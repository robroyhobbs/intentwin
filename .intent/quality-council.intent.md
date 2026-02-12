# Quality Council — 3-Judge LLM Review System

## 1. Overview

**Product positioning:** Replace the single-judge GPT-4o quality review with a 3-judge LLM council that provides diverse, independent evaluations of proposal sections.

**Core concept:** Three different LLMs (GPT-4o, Llama 3.3 70B via Groq, Mistral Small via Mistral API) review each proposal section in parallel. Their scores are combined via weighted average with majority vote for pass/fail. The UI shows judge cards with a consensus indicator.

**Priority:** High — improves review quality and user confidence.

**Target user:** Proposal authors reviewing generated content before export.

**Project scope:** Modify the quality review subsystem (overseer, API, UI component). No database schema changes needed — the `quality_review` JSONB column is flexible.

## 2. Architecture

### Current Flow

```
Sections → GPT-4o reviews → Score → Weak? → Gemini remediates → Re-score → Store
```

### New Flow

```
Sections ──┬──→ GPT-4o ────────→ scores[]  ─┐
            ├──→ Groq/Llama 3.3 ─→ scores[]  ├──→ Aggregate ──→ Consensus ──→ Store
            └──→ Mistral Small ──→ scores[]  ─┘                     │
                                                                     ↓
                                                              Weak by council?
                                                                     │ yes
                                                                     ↓
                                                              Gemini remediates
                                                                     ↓
                                                              Re-score (GPT-4o)
```

### Component Structure

```
src/lib/ai/
├── quality-overseer.ts          # Orchestrator + council logic (modified)
├── openai-client.ts             # GPT-4o judge (existing)
├── groq-client.ts               # NEW: Groq/Llama judge
├── mistral-client.ts            # NEW: Mistral judge
└── prompts/
    └── quality-review.ts        # Shared prompt builder (existing)

src/components/proposals/
└── quality-report.tsx           # UI (modified for council display)
```

## 3. Detailed Behavior

### 3.1 Judge Result Type

Each `reviewWith*()` function returns the same shape (no adapter layer — each client just conforms to this):

```typescript
interface JudgeResult {
  judge_id: string; // "gpt-4o" | "llama-3.3-70b" | "mistral-small"
  judge_name: string; // "GPT-4o" | "Llama 3.3" | "Mistral Small"
  provider: string; // "openai" | "groq" | "mistral"
  scores: {
    content_quality: number; // 0-10
    client_fit: number; // 0-10
    evidence: number; // 0-10
    brand_voice: number; // 0-10
  };
  score: number; // weighted average of dimensions
  feedback: string;
  status: "completed" | "failed" | "timeout";
  error?: string; // only if status !== "completed"
}
```

### 3.2 Parallel Execution

All 3 judges run via `Promise.allSettled()` — never `Promise.all()` so one failure doesn't cancel others.

```typescript
const results = await Promise.allSettled([
  reviewWithGPT4o(prompt),
  reviewWithGroq(prompt),
  reviewWithMistral(prompt),
]);
```

### 3.3 Fault Tolerance

- If a judge fails (API error, timeout, invalid JSON), its `status` = `"failed"` with error message.
- The review continues with remaining judges (minimum 1 needed).
- The UI shows which judges participated and which were unavailable.

### 3.4 Aggregation & Consensus

```typescript
// Filter to successful judges only
const successful = results.filter((r) => r.status === "completed");

// Per-dimension scores: average across successful judges
const aggregated = {
  content_quality: avg(successful.map((r) => r.scores.content_quality)),
  client_fit: avg(successful.map((r) => r.scores.client_fit)),
  evidence: avg(successful.map((r) => r.scores.evidence)),
  brand_voice: avg(successful.map((r) => r.scores.brand_voice)),
};

// Overall score: weighted average of dimensions (same as before)
const overall = calculateSectionScore(aggregated);

// Pass/fail: majority vote (2 of 3 must individually pass)
const individualPasses = successful.filter((r) => r.score >= PASS_THRESHOLD);
const pass = individualPasses.length > successful.length / 2;

// Consensus level
const consensus = allSame
  ? "unanimous"
  : individualPasses.length >= 2 || failCount >= 2
    ? "majority"
    : "split";
```

### 3.5 Remediation Logic

Remediation triggers when the **council consensus** says a section is weak:

- At least 2 of the successful judges must score below `REGEN_THRESHOLD` (8.5)
- If only 1 judge flags it, no remediation (could be an outlier)
- Gemini (already integrated) performs the rewrite
- After remediation, GPT-4o re-reviews the section (single judge, not full council)

### 3.6 Data Structure (quality_review JSONB)

```typescript
interface QualityReviewResult {
  status: "reviewing" | "completed" | "failed";
  run_at: string;
  trigger: "auto_post_generation" | "manual";
  model: "council"; // Changed from "gpt-4o"
  judges: JudgeInfo[]; // NEW
  overall_score: number;
  pass: boolean;
  consensus: "unanimous" | "majority" | "split"; // NEW
  sections: CouncilSectionReview[]; // Enhanced
  remediation: RemediationEntry[];
}

interface JudgeInfo {
  judge_id: string;
  judge_name: string;
  provider: string;
  status: "completed" | "failed" | "timeout";
  error?: string;
}

interface CouncilSectionReview {
  section_id: string;
  section_type: string;
  score: number; // Aggregated score
  dimensions: DimensionScores; // Aggregated dimensions
  feedback: string; // Combined feedback (from all judges)
  judge_reviews: JudgeResult[]; // Individual judge results
}
```

## 4. User Experience

### 4.1 Council Header

```
┌──────────────────────────────────────────────────────────┐
│ ✅ Quality Council                PASS — 8.7/10          │
│ 🟢 Unanimous                    3/3 judges agree        │
│                                                          │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│ │ 🤖 GPT-4o   │ │ 🦙 Llama 3.3│ │ 🌀 Mistral  │        │
│ │ Score: 8.8  │ │ Score: 8.5  │ │ Score: 8.9  │        │
│ │ ✅ Pass     │ │ ✅ Pass     │ │ ✅ Pass     │        │
│ └─────────────┘ └─────────────┘ └─────────────┘        │
└──────────────────────────────────────────────────────────┘
```

### 4.2 Consensus Indicators

- **Unanimous** (green): All judges agree on pass/fail
- **Majority** (amber): 2 of 3 agree
- **Split** (red): No clear consensus (possible with 2 judges if 1 failed)

### 4.3 Failed Judge Display

```
┌─────────────┐
│ 🌀 Mistral  │
│ ⚠️ Unavail. │
│ API timeout  │
└─────────────┘
```

### 4.4 Section-Level Detail (Expanded)

Each section shows the aggregated score, then expandable per-judge breakdown:

- Aggregated dimension bars (as today)
- Per-judge feedback tabs or stacked cards
- Highlight disagreements (where judges differ by > 2 points)

## 5. Technical Implementation Guide

### 5.1 New Files

**`src/lib/ai/groq-client.ts`**

- Singleton Groq client using `GROQ_API_KEY`
- `reviewWithGroq(prompt)` → same JSON schema as GPT-4o
- Model: `llama-3.3-70b-versatile`
- Uses Groq's JSON mode (`response_format: { type: "json_object" }`)

**`src/lib/ai/mistral-client.ts`**

- Singleton Mistral client using `MISTRAL_API_KEY`
- `reviewWithMistral(prompt)` → same JSON schema
- Model: `mistral-small-latest`
- Uses Mistral's JSON mode

### 5.2 Modified Files

**`src/lib/ai/quality-overseer.ts`**

- Add `runCouncilReview()` function (orchestrates all 3 judges via `Promise.allSettled`)
- Replace single `reviewWithGPT4o()` calls with `runCouncilReview()`
- Update types to `CouncilSectionReview`
- Update remediation logic: council consensus (2+ judges) required to trigger
- After remediation, re-review with GPT-4o only (single judge re-score)

**`src/components/proposals/quality-report.tsx`**

- Add judge cards display
- Add consensus indicator
- Per-section: show individual judge details in expanded view
- Handle partial judge results (1-2 judges failed)

### 5.3 Environment Variables (New)

```
GROQ_API_KEY=gsk_...
MISTRAL_API_KEY=...
```

### 5.4 Dependencies (New)

```
groq-sdk          # Groq official SDK
@mistralai/mistralai  # Mistral official SDK
```

## 6. Decisions Summary

| Decision            | Choice                                    | Rationale                                           |
| ------------------- | ----------------------------------------- | --------------------------------------------------- |
| Judge panel         | GPT-4o + Llama 3.3 (Groq) + Mistral Small | Maximum model diversity across 3 different families |
| Score aggregation   | Weighted avg + majority vote              | Shows consensus, robust against one outlier         |
| Execution           | Parallel (Promise.allSettled)             | 3x faster, independent blind review                 |
| Fault tolerance     | Continue with 2 judges                    | Graceful degradation, doesn't block review          |
| Remediation trigger | Council consensus (2+ judges agree weak)  | Prevents over-remediation from one outlier          |
| Remediation engine  | Gemini (existing)                         | Already integrated, separate from judges            |
| UI presentation     | Judge cards + consensus indicator         | Clear, informative, shows the multi-judge benefit   |
| Data storage        | Same JSONB column, enhanced schema        | No migration needed                                 |

## 7. MVP Scope

### Included

- 3 parallel judges (GPT-4o, Llama 3.3, Mistral Small)
- Unified scoring with weighted average + majority vote
- Consensus tracking (unanimous/majority/split)
- Fault-tolerant execution (continue with 2 if 1 fails)
- Council-based remediation trigger
- Judge cards UI with consensus indicator
- Per-section judge breakdown
- Backward-compatible data structure

### Excluded

- Configurable judge weights (all equal for now)
- User-selectable judges
- Judge calibration/benchmarking
- Historical judge accuracy tracking
- More than 3 judges

## 8. Risks

| Risk                                           | Mitigation                                                             |
| ---------------------------------------------- | ---------------------------------------------------------------------- |
| Groq/Mistral free tier rate limits             | Judges run in parallel; if rate-limited, graceful fallback to 2 judges |
| Different models interpret scoring differently | Same prompt + JSON schema for all; scores may naturally vary           |
| Increased latency (3 API calls)                | Parallel execution; slowest judge determines total time (~5-10s)       |
| New API keys required                          | Document in README; app works with 1 judge if keys missing             |

## 9. Open Items

None — all decisions resolved.
