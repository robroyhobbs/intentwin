# Coach & Generation Resilience Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix generation partial-failure handling, replace meaningless numeric scores with gap/strength analysis, deduplicate coach content, and polish the coach UI.

**Architecture:** Frontend-only changes. The existing `BidEvaluation` response already contains factor scores + rationales + recommendation + intelligence data. We restructure how the coach presents this data (verdict + gaps + strengths instead of radar + scores) and make the draft polling loop handle partial success. No API or backend changes.

**Tech Stack:** React, TypeScript, Tailwind CSS, lucide-react icons

---

### Task 1: Create VerdictCard Component

**Files:**
- Create: `src/app/(dashboard)/proposals/create/_components/shared/verdict-card.tsx`

**Context:** This replaces the radar chart + score bars as the primary bid evaluation display. Uses the existing `BidEvaluation.recommendation` field (`bid` | `evaluate` | `pass`) to show a qualitative go/no-go verdict instead of a numeric score.

**Step 1: Create the component**

```tsx
"use client";

import { ThumbsUp, Scale, ThumbsDown } from "lucide-react";

type Verdict = "bid" | "evaluate" | "pass";

interface VerdictCardProps {
  verdict: Verdict;
}

const VERDICT_CONFIG: Record<
  Verdict,
  {
    icon: React.ElementType;
    label: string;
    description: string;
    borderColor: string;
    bgColor: string;
    iconBg: string;
    iconColor: string;
  }
> = {
  bid: {
    icon: ThumbsUp,
    label: "Pursue",
    description:
      "Strong fit — your capabilities align well with this RFP",
    borderColor: "border-l-emerald-500",
    bgColor: "bg-emerald-500/5",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
  },
  evaluate: {
    icon: Scale,
    label: "Pursue with Caution",
    description:
      "Gaps exist — review below before committing resources",
    borderColor: "border-l-amber-500",
    bgColor: "bg-amber-500/5",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
  },
  pass: {
    icon: ThumbsDown,
    label: "Consider Passing",
    description:
      "Significant gaps — may not be worth the pursuit cost",
    borderColor: "border-l-red-500",
    bgColor: "bg-red-500/5",
    iconBg: "bg-red-500/10",
    iconColor: "text-red-500",
  },
};

export function VerdictCard({ verdict }: VerdictCardProps) {
  const cfg = VERDICT_CONFIG[verdict];
  const Icon = cfg.icon;

  return (
    <div
      data-testid="verdict-card"
      className={`rounded-lg border border-border border-l-4 ${cfg.borderColor} ${cfg.bgColor} p-4 animate-fade-in`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h4 className="text-lg font-bold text-foreground">
            {cfg.label}
          </h4>
          <p className="text-sm text-muted-foreground mt-1">
            {cfg.description}
          </p>
        </div>
        <div
          className={`h-9 w-9 rounded-lg ${cfg.iconBg} flex items-center justify-center shrink-0`}
        >
          <Icon size={18} className={cfg.iconColor} />
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to verdict-card

**Step 3: Commit**

```bash
git add src/app/(dashboard)/proposals/create/_components/shared/verdict-card.tsx
git commit -m "feat: add VerdictCard component for go/no-go display"
```

---

### Task 2: Create GapCard and StrengthCard Components

**Files:**
- Create: `src/app/(dashboard)/proposals/create/_components/shared/gap-card.tsx`
- Create: `src/app/(dashboard)/proposals/create/_components/shared/strength-card.tsx`

**Context:** These replace the score bars and factor rationale insight rows. Each card shows a specific bid evaluation factor with its AI-generated rationale text.

**Step 1: Create GapCard**

```tsx
"use client";

import { AlertTriangle, XCircle } from "lucide-react";

interface GapCardProps {
  factor: string;
  rationale: string;
  score: number;
}

export function GapCard({ factor, rationale, score }: GapCardProps) {
  const isHigh = score < 40;
  const Icon = isHigh ? XCircle : AlertTriangle;
  const borderColor = isHigh ? "border-l-red-500" : "border-l-amber-500";
  const bgColor = isHigh ? "bg-red-500/5" : "bg-amber-500/5";
  const iconColor = isHigh ? "text-red-500" : "text-amber-500";

  return (
    <div
      data-testid="gap-card"
      className={`rounded-lg border border-border border-l-4 ${borderColor} ${bgColor} p-3 transition-shadow hover:shadow-[var(--shadow-glow)]`}
    >
      <div className="flex items-start gap-2.5">
        <Icon size={16} className={`${iconColor} shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <h5 className="text-sm font-semibold text-foreground">{factor}</h5>
          <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">
            {rationale}
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Create StrengthCard**

```tsx
"use client";

import { CheckCircle } from "lucide-react";

interface StrengthCardProps {
  factor: string;
  rationale: string;
}

export function StrengthCard({ factor, rationale }: StrengthCardProps) {
  return (
    <div
      data-testid="strength-card"
      className="rounded-lg border border-border border-l-4 border-l-emerald-500 bg-emerald-500/5 p-3 transition-shadow hover:shadow-[var(--shadow-glow)]"
    >
      <div className="flex items-start gap-2.5">
        <CheckCircle
          size={16}
          className="text-emerald-500 shrink-0 mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <h5 className="text-sm font-semibold text-foreground">{factor}</h5>
          <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">
            {rationale}
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to gap-card or strength-card

**Step 4: Commit**

```bash
git add src/app/(dashboard)/proposals/create/_components/shared/gap-card.tsx \
       src/app/(dashboard)/proposals/create/_components/shared/strength-card.tsx
git commit -m "feat: add GapCard and StrengthCard components"
```

---

### Task 3: Create IntelStats Component

**Files:**
- Create: `src/app/(dashboard)/proposals/create/_components/shared/intel-stats.tsx`

**Context:** Displays market intelligence data (avg offers, avg award, win rate) in a compact horizontal stat row. Uses the existing `BidIntelligenceContext` data from `BidEvaluation.intelligence`.

**Step 1: Create the component**

```tsx
"use client";

import type { BidIntelligenceContext } from "@/lib/ai/bid-scoring";

interface IntelStatsProps {
  intelligence: BidIntelligenceContext;
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 min-w-0 text-center">
      <div className="text-lg font-bold text-foreground">{value}</div>
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mt-0.5">
        {label}
      </div>
    </div>
  );
}

function formatCurrency(amount: number | null): string {
  if (amount === null) return "—";
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

export function IntelStats({ intelligence }: IntelStatsProps) {
  const hasData =
    intelligence.agency_avg_offers !== null ||
    intelligence.agency_avg_amount !== null ||
    intelligence.win_probability !== null;

  if (!hasData) return null;

  const stats: { value: string; label: string }[] = [];

  if (intelligence.agency_avg_offers !== null) {
    stats.push({
      value: String(intelligence.agency_avg_offers),
      label: "Avg Offers",
    });
  }
  if (intelligence.agency_avg_amount !== null) {
    stats.push({
      value: formatCurrency(intelligence.agency_avg_amount),
      label: "Avg Award",
    });
  }
  if (intelligence.win_probability !== null) {
    const pct = Math.round(intelligence.win_probability.probability * 100);
    stats.push({ value: `${pct}%`, label: "Win Rate" });
  }
  if (intelligence.agency_total_awards !== null && stats.length < 4) {
    stats.push({
      value: String(intelligence.agency_total_awards),
      label: "Awards Tracked",
    });
  }

  return (
    <div
      data-testid="intel-stats"
      className="rounded-lg border border-border bg-card p-3"
    >
      <div className="flex items-center divide-x divide-border">
        {stats.map((s) => (
          <StatItem key={s.label} value={s.value} label={s.label} />
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 3: Commit**

```bash
git add src/app/(dashboard)/proposals/create/_components/shared/intel-stats.tsx
git commit -m "feat: add IntelStats component for market intelligence display"
```

---

### Task 4: Update CoachContent Types

**Files:**
- Modify: `src/app/(dashboard)/proposals/create/_components/create-types.ts`

**Context:** Add new types for verdict, gaps, and strengths. Remove always-empty fields (`signals`, `citations`, `actions`). The `CoachContent` interface drives all coach rendering.

**Step 1: Add new types and update CoachContent**

In `create-types.ts`, add these types after `CoachPrompt`:

```typescript
/** A specific capability gap identified from bid evaluation. */
export interface GapItem {
  id: string;
  factor: string;
  rationale: string;
  score: number;
}

/** A specific strength identified from bid evaluation. */
export interface StrengthItem {
  id: string;
  factor: string;
  rationale: string;
  score: number;
}
```

Replace the `CoachContent` interface with:

```typescript
export interface CoachContent {
  whyItMatters: string;
  riskFlags: RiskFlag[];
  /** Detailed insights grouped by topic. */
  insights?: CoachInsight[];
  /** Gap-filling prompts suggesting what info the user should add. */
  prompts?: CoachPrompt[];
  /** Contextual directive text for the "Next Step" card. */
  nextStep?: string;
  /** Readiness checklist items (finalize phase only). */
  readinessItems?: ReadinessItem[];
  /** Go/no-go verdict from bid evaluation (strategy + finalize). */
  verdict?: "bid" | "evaluate" | "pass";
  /** Specific capability gaps (strategy + finalize). */
  gaps?: GapItem[];
  /** Specific strengths (strategy + finalize). */
  strengths?: StrengthItem[];
}
```

**Step 2: Fix references to removed fields**

Search for `signals`, `citations`, `actions` in coach-content.ts and remove them from the `emptyCoach()` helper and from `buildExtractionCompleteCoach()`. The `emptyCoach` function becomes:

```typescript
function emptyCoach(): CoachContent {
  return {
    whyItMatters: "",
    riskFlags: [],
  };
}
```

And `buildExtractionCompleteCoach()` return becomes:

```typescript
return {
  whyItMatters: advisory,
  riskFlags,
  insights: buildIntakeInsights(data),
  prompts: buildIntakePrompts(data),
  nextStep: "Review the extraction and fill any gaps below",
};
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Fix any remaining references to removed fields.

**Step 4: Commit**

```bash
git add src/app/(dashboard)/proposals/create/_components/create-types.ts \
       src/app/(dashboard)/proposals/create/_components/coach-content.ts
git commit -m "refactor: update CoachContent types with verdict, gaps, strengths"
```

---

### Task 5: Update Coach Content Generators

**Files:**
- Modify: `src/app/(dashboard)/proposals/create/_components/coach-content.ts`
- Modify: `src/app/(dashboard)/proposals/create/_components/coach-insights.ts`

**Context:** Replace score-based risk flags with verdict/gaps/strengths. Remove gap-based risk flags from intake (dedup fix). Build gap and strength items from `BidEvaluation.ai_scores`.

**Step 1: Add gap/strength builders to `coach-insights.ts`**

Add these functions to `coach-insights.ts`, replacing `buildFactorRationales`:

```typescript
import type { GapItem, StrengthItem } from "./create-types";

export function buildGapItems(
  ev: NonNullable<CreateFlowState["bidEvaluation"]>,
): GapItem[] {
  return SCORING_FACTORS.filter(
    (f) => (ev.ai_scores[f.key]?.score ?? 100) < 60,
  ).map((f) => ({
    id: `gap-${f.key}`,
    factor: f.label,
    rationale: ev.ai_scores[f.key]?.rationale ?? "",
    score: ev.ai_scores[f.key]?.score ?? 0,
  }));
}

export function buildStrengthItems(
  ev: NonNullable<CreateFlowState["bidEvaluation"]>,
): StrengthItem[] {
  return SCORING_FACTORS.filter(
    (f) => (ev.ai_scores[f.key]?.score ?? 0) >= 70,
  ).map((f) => ({
    id: `str-${f.key}`,
    factor: f.label,
    rationale: ev.ai_scores[f.key]?.rationale ?? "",
    score: ev.ai_scores[f.key]?.score ?? 0,
  }));
}
```

Remove the `buildFactorRationales` function (no longer needed).

Update `buildStrategyInsights` to return ONLY intelligence insights (remove factor rationales since those are now in gap/strength cards):

```typescript
export function buildStrategyInsights(state: CreateFlowState): CoachInsight[] {
  const ev = state.bidEvaluation;
  if (!ev) return [];
  return ev.intelligence ? buildIntelInsights(ev.intelligence) : [];
}
```

**Step 2: Update strategy coach in `coach-content.ts`**

Replace `getStrategyCoach` with:

```typescript
function getStrategyCoach(state: CreateFlowState): CoachContent {
  if (!state.bidEvaluation) {
    return {
      ...emptyCoach(),
      whyItMatters:
        "Analyzing your opportunity against your firm's capabilities and past performance...",
      nextStep: "Analyzing your opportunity...",
    };
  }

  const ev = state.bidEvaluation;
  const gaps = buildGapItems(ev);
  const strengths = buildStrengthItems(ev);

  let whyItMatters: string;
  if (ev.recommendation === "pass") {
    whyItMatters =
      "This opportunity has weak alignment with your capabilities. Review the gaps below — consider passing, teaming with a partner, or identifying a unique differentiator before proceeding.";
  } else if (ev.recommendation === "evaluate") {
    whyItMatters =
      "Some gaps exist but the opportunity is winnable with the right strategy. Review gaps and strengths below, then select win themes that compensate for weaker areas.";
  } else {
    whyItMatters =
      "Strong fit. Focus on selecting win themes that emphasize your best differentiators. Your strengths are shown below.";
  }

  return {
    whyItMatters,
    riskFlags: [],
    insights: buildStrategyInsights(state),
    verdict: ev.recommendation,
    gaps,
    strengths,
    nextStep: "Select win themes that emphasize your strengths",
  };
}
```

Add imports at top of `coach-content.ts`:

```typescript
import { buildGapItems, buildStrengthItems } from "./coach-insights";
```

**Step 3: Fix intake deduplication**

In `buildExtractionCompleteCoach`, remove the gap-based `riskFlags` generation. Change:

```typescript
const riskFlags: RiskFlag[] = criticalGaps.map((g) => ({
  id: `gap-${g.field}`,
  label: `Missing: ${g.field.replace(/_/g, " ")}`,
  severity: "high" as const,
}));
```

To:

```typescript
const riskFlags: RiskFlag[] = [];
```

Update `advisory` and `nextStep` to mention gaps only via prompts:

```typescript
const advisory =
  criticalGaps.length > 0
    ? "Extraction complete but critical information is missing. Fill in the gaps below or re-upload a more complete document."
    : "Extraction looks good. Review the summary and add any context via the Buyer Goal field before moving to Strategy.";

const nextStep =
  criticalGaps.length > 0
    ? "Critical information missing — fill in gaps below"
    : "Review extraction, then continue to Strategy";
```

**Step 4: Update finalize coach to include verdict/gaps/strengths**

In `getFinalizeCoach`, add verdict/gaps/strengths from bidEvaluation:

```typescript
function getFinalizeCoach(state: CreateFlowState): CoachContent {
  const unresolvedBlockers = state.blockers.filter((b) => !b.resolved);
  const insights = buildFinalizeInsights(state);

  const riskFlags: RiskFlag[] = unresolvedBlockers.map((b) => ({
    id: b.id,
    label: b.label,
    severity: "high" as const,
  }));

  const whyItMatters = buildFinalizeSummary(state);
  const ev = state.bidEvaluation;

  let nextStep: string;
  if (unresolvedBlockers.length > 0) {
    nextStep = `Resolve ${unresolvedBlockers.length} blocker(s) before approving`;
  } else if (!state.finalApproved) {
    nextStep = "Approve and export your proposal";
  } else {
    nextStep = "Ready to export — download as DOCX or PDF";
  }

  return {
    whyItMatters,
    riskFlags,
    insights,
    nextStep,
    readinessItems: buildReadinessItems(state),
    verdict: ev?.recommendation,
    gaps: ev ? buildGapItems(ev) : undefined,
    strengths: ev ? buildStrengthItems(ev) : undefined,
  };
}
```

**Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 6: Lint**

Run: `npx eslint src/app/\(dashboard\)/proposals/create/_components/coach-content.ts src/app/\(dashboard\)/proposals/create/_components/coach-insights.ts`

**Step 7: Commit**

```bash
git add src/app/(dashboard)/proposals/create/_components/coach-content.ts \
       src/app/(dashboard)/proposals/create/_components/coach-insights.ts
git commit -m "refactor: replace score-based coach with verdict and gap/strength cards"
```

---

### Task 6: Rewrite Decision Coach Component

**Files:**
- Modify: `src/app/(dashboard)/proposals/create/_components/decision-coach.tsx`

**Context:** This is the main coach panel component. Remove radar chart, confidence ring, and score bars. Replace with verdict card, gap cards, strength cards, and intel stats. Simplify the section layout — primary content is always visible, secondary is collapsible.

**Step 1: Rewrite decision-coach.tsx**

Replace the entire file with the new layout. Key changes:
- Remove imports: `ConfidenceRing`, `RadarChart`, `ScoreBar`, `SCORING_FACTORS`
- Add imports: `VerdictCard`, `GapCard`, `StrengthCard`, `IntelStats`
- Remove: `BidVisualization`, `CoachHeader` (simplified inline), `InsightRow` severity icons for factor rationales
- Keep: `CollapsibleSection`, `AdvisorySection`, `RisksSection`, `PromptsSection`, `ReadinessChecklist`
- New: `GapsSection`, `StrengthsSection`, `BidAnalysis` (verdict + gaps + strengths + intel)

The new main component structure:

```tsx
export function DecisionCoach() {
  const { state } = useCreateFlow();
  const content = useMemo(() => getCoachContent(state), [state]);
  const isFinalize = state.phase === "finalize";

  return (
    <div className="space-y-6">
      <CoachHeader isFinalize={isFinalize} />
      {content.nextStep && <NextStepCard text={content.nextStep} />}
      <AdvisorySection text={content.whyItMatters} />
      {content.verdict && <BidAnalysis content={content} intelligence={state.bidEvaluation?.intelligence} />}
      {content.riskFlags.length > 0 && <RisksSection flags={content.riskFlags} />}
      {content.prompts && content.prompts.length > 0 && (
        <PromptsSection prompts={content.prompts} />
      )}
      {content.insights && content.insights.length > 0 && (
        <CollapsibleSection title="Details" defaultOpen={false}>
          <div className="divide-y divide-border/50">
            {content.insights.map((ins) => (
              <InsightRow key={ins.id} insight={ins} />
            ))}
          </div>
        </CollapsibleSection>
      )}
      {isFinalize && content.readinessItems && content.readinessItems.length > 0 && (
        <ReadinessChecklist items={content.readinessItems} />
      )}
    </div>
  );
}
```

**CoachHeader** simplified (no confidence ring, no score):

```tsx
function CoachHeader({ isFinalize }: { isFinalize: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-8 w-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
        {isFinalize ? (
          <Clipboard size={14} className="text-white" />
        ) : (
          <Sparkles size={14} className="text-white" />
        )}
      </div>
      <h3 className="text-sm font-semibold">
        {isFinalize ? "Proposal Summary" : "Decision Coach"}
      </h3>
    </div>
  );
}
```

**BidAnalysis** — primary content block for strategy + finalize:

```tsx
function BidAnalysis({
  content,
  intelligence,
}: {
  content: CoachContent;
  intelligence?: BidIntelligenceContext | null;
}) {
  return (
    <div className="space-y-3">
      {content.verdict && <VerdictCard verdict={content.verdict} />}
      {content.gaps && content.gaps.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Gaps to Address
          </h4>
          {content.gaps.map((g) => (
            <GapCard key={g.id} factor={g.factor} rationale={g.rationale} score={g.score} />
          ))}
        </div>
      )}
      {content.strengths && content.strengths.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Your Strengths
          </h4>
          {content.strengths.map((s) => (
            <StrengthCard key={s.id} factor={s.factor} rationale={s.rationale} />
          ))}
        </div>
      )}
      {intelligence && (
        <CollapsibleSection title="Market Intelligence" defaultOpen={false}>
          <IntelStats intelligence={intelligence} />
        </CollapsibleSection>
      )}
    </div>
  );
}
```

**PromptsSection** — updated with pill badges:

```tsx
function PromptsSection({ prompts }: { prompts: CoachPrompt[] }) {
  if (prompts.length === 0) return null;
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        What&apos;s Missing
      </h4>
      {prompts.map((p) => (
        <div
          key={p.id}
          className={`rounded-lg p-3 ${IMPORTANCE_COLORS[p.importance]}`}
        >
          <div className="flex items-start gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${IMPORTANCE_PILLS[p.importance]}`}
            >
              {IMPORTANCE_LABELS[p.importance]}
            </span>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed mt-1.5">
            {p.question}
          </p>
        </div>
      ))}
    </div>
  );
}
```

With pill styles:

```tsx
const IMPORTANCE_PILLS: Record<string, string> = {
  critical: "bg-red-500/10 text-red-500",
  helpful: "bg-amber-500/10 text-amber-500",
  nice_to_have: "bg-muted text-muted-foreground",
};
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 3: Lint**

Run: `npx eslint src/app/\(dashboard\)/proposals/create/_components/decision-coach.tsx`

**Step 4: Commit**

```bash
git add src/app/(dashboard)/proposals/create/_components/decision-coach.tsx
git commit -m "feat: rewrite Decision Coach with verdict, gaps, and strengths layout"
```

---

### Task 7: Clean Up Removed Components

**Files:**
- Delete: `src/app/(dashboard)/proposals/create/_components/shared/radar-chart.tsx`
- Delete: `src/app/(dashboard)/proposals/create/_components/shared/__tests__/radar-chart.test.tsx`
- Modify: `src/app/(dashboard)/proposals/create/_components/phases/finalize-phase.tsx` (remove ConfidenceRing from coach — keep it in finalize phase content panel where it shows workflow progress)

**Context:** RadarChart is no longer imported anywhere. ConfidenceRing stays in finalize-phase.tsx (it shows workflow completion %, not bid score) but is removed from the coach header.

**Step 1: Delete radar chart files**

```bash
rm src/app/(dashboard)/proposals/create/_components/shared/radar-chart.tsx
rm src/app/(dashboard)/proposals/create/_components/shared/__tests__/radar-chart.test.tsx
```

**Step 2: Verify no remaining imports**

Run: `grep -r "RadarChart\|radar-chart" src/ --include="*.ts" --include="*.tsx"`
Expected: No matches (all imports were in decision-coach.tsx which was already updated)

**Step 3: Verify ConfidenceRing still used in finalize-phase only**

Run: `grep -r "ConfidenceRing\|confidence-ring" src/ --include="*.ts" --include="*.tsx"`
Expected: Only `finalize-phase.tsx` and `confidence-ring.tsx` itself

**Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove RadarChart component (replaced by verdict + gap cards)"
```

---

### Task 8: Simplify Finalize Insights

**Files:**
- Modify: `src/app/(dashboard)/proposals/create/_components/coach-insights-finalize.ts`

**Context:** The finalize insights currently include verbose eval insights (strengths/concerns as insight rows) that are now redundant — gaps and strengths are shown as proper cards via CoachContent. Simplify to just checklist stats and tips.

**Step 1: Remove redundant eval insights**

Remove `buildStrengths`, `buildConcerns`, and `buildEvalInsights` functions. These are replaced by the gap/strength cards from Task 5.

Update `buildFinalizeInsights`:

```typescript
export function buildFinalizeInsights(state: CreateFlowState): CoachInsight[] {
  const checklist = buildChecklistInsights(state);
  const tips = buildNextTimeTips(state);
  return [...checklist, ...tips];
}
```

Keep `buildChecklistInsights`, `buildNextTimeTips`, and `buildReadinessItems` unchanged.

Remove the now-unused `SCORING_FACTORS` import if it's no longer used in this file (check — `buildNextTimeTips` still uses it via `weakest` detection).

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 3: Lint**

Run: `npx eslint src/app/\(dashboard\)/proposals/create/_components/coach-insights-finalize.ts`

**Step 4: Commit**

```bash
git add src/app/(dashboard)/proposals/create/_components/coach-insights-finalize.ts
git commit -m "refactor: simplify finalize insights (gaps/strengths now in cards)"
```

---

### Task 9: Fix Generation Polling for Partial Success

**Files:**
- Modify: `src/app/(dashboard)/proposals/create/_components/phases/draft-helpers.ts`

**Context:** The polling loop currently fails if ANY section is still generating after 10 minutes. Fix: check `proposal.status` (set by Inngest finalize step), and on timeout treat partial success as success with failed-section retry buttons.

**Step 1: Update pollSections**

Key changes to `pollSections()`:

1. Check `data.proposal.status` — if `review` or `draft`, generation is done:

```typescript
const proposalDone =
  data.proposal.status === "review" || data.proposal.status === "draft";
```

2. If `proposalDone || allTerminal(data.sections)`, dispatch `GENERATION_COMPLETE`.

3. On timeout, if some sections completed, mark stuck sections as failed and dispatch `GENERATION_COMPLETE` (partial success) instead of `GENERATION_FAIL`:

```typescript
// Timeout — handle partial success
if (mountedRef.current) {
  const completed = latestSections.filter(
    (s) => s.generation_status === "completed",
  );
  if (completed.length > 0) {
    // Partial success — mark stuck sections as failed
    const withFallback = latestSections.map((s) =>
      s.generation_status === "generating" || s.generation_status === "pending"
        ? { ...s, generation_status: "failed" as const }
        : s,
    );
    dispatch({ type: "SET_SECTIONS", sections: withFallback.map(mapApiSection) });
    dispatch({ type: "GENERATION_COMPLETE" });
    logger.warn("Generation timed out with partial success", {
      proposalId,
      completed: completed.length,
      total: latestSections.length,
    });
  } else {
    dispatch({ type: "GENERATION_FAIL" });
    logger.error("Generation polling timed out", undefined, { proposalId });
  }
}
```

4. Track `latestSections` across poll iterations so the timeout handler has access to the most recent data.

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 3: Lint**

Run: `npx eslint src/app/\(dashboard\)/proposals/create/_components/phases/draft-helpers.ts`

**Step 4: Commit**

```bash
git add src/app/(dashboard)/proposals/create/_components/phases/draft-helpers.ts
git commit -m "fix: handle partial generation success and check proposal status in polling"
```

---

### Task 10: Update Draft Phase UI for Per-Section Retry

**Files:**
- Modify: `src/app/(dashboard)/proposals/create/_components/phases/draft-phase.tsx`

**Context:** When generation partially succeeds, the user should see which sections completed and which failed, with retry buttons for failed ones. Add "Retry all failed" button and elapsed time display.

**Step 1: Add elapsed time tracking**

Add an elapsed time display during generation:

```tsx
function ElapsedTime() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const label = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  return (
    <span className="text-xs text-muted-foreground tabular-nums">{label}</span>
  );
}
```

**Step 2: Add "Retry all failed" button**

In `DraftActions`, add a retry button for failed sections:

```tsx
function RetryFailedButton() {
  const { state, dispatch } = useCreateFlow();
  const authFetch = useAuthFetch();
  const failedSections = state.sections.filter(
    (s) => s.generationStatus === "failed",
  );

  const handleRetryAll = useCallback(() => {
    if (!state.proposalId) return;
    for (const section of failedSections) {
      void regenerateSection(state.proposalId, section.id, dispatch, authFetch);
    }
  }, [state.proposalId, failedSections, dispatch, authFetch]);

  if (failedSections.length === 0) return null;

  return (
    <button
      onClick={handleRetryAll}
      className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
    >
      Retry {failedSections.length} failed section(s)
    </button>
  );
}
```

**Step 3: Update ProgressSummary to show elapsed time and glow**

```tsx
function ProgressSummary({
  total,
  completed,
  failed,
  isGenerating,
}: {
  total: number;
  completed: number;
  failed: number;
  isGenerating: boolean;
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="font-medium">Generation Progress</span>
        <div className="flex items-center gap-2">
          {isGenerating && <ElapsedTime />}
          <span className="text-muted-foreground">
            {completed}/{total} sections
            {failed > 0 && (
              <span className="text-destructive ml-1">({failed} failed)</span>
            )}
          </span>
        </div>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full bg-primary rounded-full transition-all duration-500 ${isGenerating ? "animate-glow-pulse" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
```

**Step 4: Update DraftPhase to use new components**

Pass `isGenerating` to `ProgressSummary` and add `RetryFailedButton`:

```tsx
{state.sections.length > 0 && state.generationStatus !== "idle" && (
  <ProgressSummary
    total={state.sections.length}
    completed={completed}
    failed={failed}
    isGenerating={state.generationStatus === "generating"}
  />
)}

{/* After SectionList */}
{state.generationStatus === "complete" && failed > 0 && <RetryFailedButton />}
{state.generationStatus === "complete" && <DraftActions />}
```

**Step 5: Remove the old ErrorBanner for partial success**

Keep `ErrorBanner` only for total failure (`state.sections.length === 0`). When sections exist but some failed, `RetryFailedButton` handles it.

**Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 7: Lint**

Run: `npx eslint src/app/\(dashboard\)/proposals/create/_components/phases/draft-phase.tsx`

**Step 8: Commit**

```bash
git add src/app/(dashboard)/proposals/create/_components/phases/draft-phase.tsx
git commit -m "feat: add elapsed time, retry-failed, and partial success handling to draft phase"
```

---

### Task 11: Final Verification

**Files:** All modified files from Tasks 1-10

**Step 1: TypeScript check**

Run: `npx tsc --noEmit --pretty`
Expected: 0 errors

**Step 2: ESLint all changed files**

Run:
```bash
npx eslint \
  src/app/\(dashboard\)/proposals/create/_components/shared/verdict-card.tsx \
  src/app/\(dashboard\)/proposals/create/_components/shared/gap-card.tsx \
  src/app/\(dashboard\)/proposals/create/_components/shared/strength-card.tsx \
  src/app/\(dashboard\)/proposals/create/_components/shared/intel-stats.tsx \
  src/app/\(dashboard\)/proposals/create/_components/create-types.ts \
  src/app/\(dashboard\)/proposals/create/_components/coach-content.ts \
  src/app/\(dashboard\)/proposals/create/_components/coach-insights.ts \
  src/app/\(dashboard\)/proposals/create/_components/coach-insights-finalize.ts \
  src/app/\(dashboard\)/proposals/create/_components/decision-coach.tsx \
  src/app/\(dashboard\)/proposals/create/_components/phases/draft-helpers.ts \
  src/app/\(dashboard\)/proposals/create/_components/phases/draft-phase.tsx
```
Expected: 0 errors, 0 warnings

**Step 3: Run existing tests**

Run: `npx vitest run`
Expected: All tests pass (the radar-chart test was deleted with the component)

**Step 4: Verify file sizes**

Run: `wc -l` on all modified files.
Expected: All under 300 lines (source files)

**Step 5: Push to deploy**

```bash
git push origin main
```

**Step 6: Verify Vercel build**

Run: `vercel ls` and check that the latest deployment succeeds.
