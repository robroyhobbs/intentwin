# Create Flow UI Redesign — Design Document

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring the proposal create flow to visual parity with the IntentBid dashboard, making the Decision Coach a contextual guide/advisor with data visualizations.

**Approach:** Brand Parity (Approach A) + radar chart from Approach B. Apply the existing design system (icon badges, glows, semantic colors, animations, stat displays) consistently across phase strip, content panels, and Decision Coach. No layout restructuring.

**Constraint:** Same component structure, same data flow. This is a visual + coach intelligence upgrade, not an architectural change.

---

## 1. Phase Strip Redesign

**Files:** `phase-strip.tsx`

### Current
Plain numbered circles (1-4) with text labels, muted colors, static connecting lines.

### New
Each phase gets an icon badge in a rounded square with accent background and glow shadow:
- **Intake:** `FileText` icon
- **Strategy:** `Target` icon
- **Draft:** `PenTool` icon
- **Finalize:** `CheckCircle` icon

**States:**
| State | Badge | Connector | Label |
|-------|-------|-----------|-------|
| Not reached | Muted bg, muted icon | Dashed, muted | muted-foreground |
| Active | Accent bg, `shadow-glow`, white icon, `animate-glow-pulse` | Solid, accent | foreground, font-bold |
| Completed | Success bg, check overlay | Solid, success color | primary color |

Connecting lines fill progressively with accent color as phases complete.

Progress percentage uses `.badge` component with accent variant.

---

## 2. Phase Content Panels

**Files:** `intake-phase.tsx`, `strategy-phase.tsx`, `draft-phase.tsx`, `finalize-phase.tsx`

### Consistent Pattern (all phases)
- **Phase header:** Icon badge (same as phase strip) + title `text-xl font-bold` + description in muted. Matches proposals list page header.
- **Content groups:** Wrapped in `.card` containers with dashboard border/shadow treatment.
- **Key data points:** Use `stat-value` / `stat-label` pattern (large accent number + small uppercase label).
- **Loading states:** Skeleton shimmer placeholders matching card shapes. Replace plain spinners.

### Intake Phase
- File upload: Dashed-border dropzone with accent hover and upload icon.
- Extraction progress: Skeleton shimmer over summary card.
- Extracted data: 2-column stat grid (client, budget, timeline, type).

### Strategy Phase
- Bid score: Large `stat-value` with semantic color (green >70, amber 40-70, red <40).
- Factor scores: Horizontal mini-bars (colored fill in muted track) with label + score.
- Win themes: Selectable `.badge` pills with accent borders.

### Draft Phase
- Section cards: Visual card per section with status badges (shimmer=generating, check=complete, warning=failed).
- Bulk generation: Staggered skeleton animation across cards.

### Finalize Phase
- Blocker items: Semantic border colors (red blocking, amber warning).
- Export: Prominent `btn-primary` with glow effect.
- Approval: Styled switch component, not plain checkbox.

---

## 3. Decision Coach Redesign

**Files:** `decision-coach.tsx`, `coach-content.ts`, `coach-insights.ts`, `coach-insights-finalize.ts`, new shared components

### Visual Foundation (all phases)

**Header:**
- "Decision Coach" with sparkle icon badge in accent bg.
- Finalize phase: "Proposal Summary" with clipboard icon.

**Confidence Ring:**
- Subtle glow shadow matching its color (CSS `filter: drop-shadow`).
- Smooth CSS transition on score changes (`transition-all duration-700`).

**Risk Flags (upgraded):**
- Card-style alerts with left-border accent in semantic color.
- Icon per severity: `XCircle` (high/red), `AlertTriangle` (medium/amber), `Info` (low/blue).
- One-line description text.
- Stacked vertically with `gap-2`.

**Insights (upgraded):**
- Replace tiny severity dots with icons: `CheckCircle` (green), `AlertTriangle` (amber), `XCircle` (red).
- Structured row layout: icon + label + value right-aligned.
- Detail text on separate line with consistent `text-xs`.

### Phase-Adaptive Behavior

#### Intake & Strategy — Guide Mode

**"Next Step" card** at top of coach panel:
- Accent left-border card with `ArrowRight` icon.
- Contextual directive text:
  - No files: "Upload your RFP document to begin"
  - Extracting: "Processing your document..."
  - Extracted: "Review the extraction and fill any gaps below"
  - Strategy loaded: "Select win themes that emphasize your strengths"
- Bold, encouraging, action-oriented tone.

**Gap-filling prompts:**
- Importance-tagged cards with left-border color:
  - Critical = `border-red-500`, red accent
  - Helpful = `border-amber-500`, amber accent
  - Optional = `border-border`, muted
- Question text prominently displayed in `text-sm`.
- Importance label as uppercase badge.

#### Draft & Finalize — Advisor Mode

**"Next Step" card** shifts to validation:
- "Review each section as it generates" (during generation)
- "3 sections need review before export" (post-generation)
- "Approve and export your proposal" (finalize, all reviewed)

**Radar Chart** (new component):
- Pure SVG, 5-point polygon for bid scoring factors:
  - Past Performance, Capability Alignment, Requirement Match, Timeline Feasibility, Strategic Value
- Each axis 0-100, filled area in accent color at 20% opacity with accent border.
- Dots at each vertex showing exact score.
- Subtle glow on filled area (`filter: drop-shadow`).
- Displayed when `bidEvaluation` exists (Strategy + Finalize phases).

**Score Breakdown Bars:**
- Below radar chart, one row per factor.
- Horizontal bar: colored fill (semantic by score range) in muted track.
- Label left, score number right.
- Provides detailed numbers after the radar gives the visual shape.

**Strengths & Concerns Cards:**
- Strengths: Success left-border card, `CheckCircle` icon, factor name + score + rationale excerpt.
- Concerns: Danger left-border card, `AlertTriangle` icon, same layout.
- Grouped under "Your Strengths" / "Areas of Concern" headings.

**"For Next Time" Tips:**
- Info-border card with `Lightbulb` icon.
- Separated from current-proposal analysis with heading.
- Actionable text (e.g., "Add more case studies to your evidence library").

### Readiness Checklist (Finalize phase only)

Visual checklist in the coach panel:
- [ ] All sections generated
- [ ] All sections reviewed
- [ ] No unresolved blockers
- [ ] Signatory info available (from L1 team members)
- [ ] Export format selected

Items auto-check as conditions are met. Checked items: accent-colored checkbox with brief scale pulse animation. Unchecked: muted checkbox with "what's needed" hint text.

Computed from `CreateFlowState` — no manual user input needed.

---

## 4. New Shared Components

| Component | File | Purpose |
|-----------|------|---------|
| `PhaseIcon` | `shared/phase-icon.tsx` | Icon badge with glow states for phase strip |
| `NextStepCard` | `shared/next-step-card.tsx` | Accent-bordered directive card at top of coach |
| `RadarChart` | `shared/radar-chart.tsx` | Pure SVG 5-axis radar for bid factor scores |
| `ScoreBar` | `shared/score-bar.tsx` | Horizontal fill bar with label + score |
| `AlertCard` | `shared/alert-card.tsx` | Left-bordered card with severity icon for risk flags |
| `ReadinessChecklist` | `shared/readiness-checklist.tsx` | Auto-computed checklist with animated checkboxes |
| `StatBlock` | `shared/stat-block.tsx` | Large number + label in dashboard stat style |

---

## 5. Design Tokens Used

All from existing `globals.css` — no new tokens needed:

- **Colors:** `--accent`, `--accent-foreground`, `--success`, `--warning`, `--danger`, `--info`
- **Shadows:** `--shadow-glow`, `--shadow-glow-intense`
- **Animations:** `animate-fade-in`, `animate-glow-pulse`, `animate-shimmer`
- **Components:** `.card`, `.badge`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`
- **Typography:** `stat-value`, `stat-label`, `text-xl font-bold`, `text-xs text-muted-foreground`

---

## 6. What's NOT Changing

- Component file structure (same `_components/` layout)
- Data flow (same `CreateFlowState`, same reducer, same persistence)
- API routes (no backend changes)
- Phase logic (same phase transitions, same validation)
- Overall page layout (main content + sidebar)

---

## 7. Success Criteria

- Create flow visually matches dashboard page quality (icon badges, glows, cards, stats)
- Decision Coach provides contextual "next step" guidance per phase
- Radar chart visualizes bid factor scores at a glance
- Readiness checklist in finalize gives clear path to export
- All existing functionality preserved (no regressions)
- 0 ESLint errors, 0 new warnings on changed files
- TypeScript compiles cleanly
