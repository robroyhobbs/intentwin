# Create Flow UI Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring the proposal create flow to visual parity with the IntentBid dashboard — icon badges, glows, semantic colors, stat displays, radar chart, and contextual Decision Coach guidance.

**Architecture:** Pure visual + coach intelligence upgrade. Same component structure (`_components/`), same data flow (`CreateFlowState` + reducer), same API routes. 7 new shared components, modifications to 4 phase panels, phase strip, and decision coach.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, lucide-react icons, SVG for radar chart, CSS custom properties from `globals.css`

**Design doc:** `docs/plans/2026-03-02-create-flow-ui-redesign-design.md`

---

## Task 1: PhaseIcon shared component

**Files:**
- Create: `src/app/(dashboard)/proposals/create/_components/shared/phase-icon.tsx`
- Test: `src/app/(dashboard)/proposals/create/_components/shared/__tests__/phase-icon.test.tsx`

**Context:** Every phase (intake, strategy, draft, finalize) needs an icon badge — a rounded square with accent background and glow shadow. Used by the phase strip and phase content panel headers. Icons from lucide-react: `FileText` (intake), `Target` (strategy), `PenTool` (draft), `CheckCircle` (finalize).

**Step 1: Write the test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PhaseIcon } from "../phase-icon";

describe("PhaseIcon", () => {
  it("renders the correct icon for each phase", () => {
    const { rerender } = render(<PhaseIcon phase="intake" state="active" />);
    expect(screen.getByTestId("phase-icon")).toBeInTheDocument();

    rerender(<PhaseIcon phase="strategy" state="active" />);
    expect(screen.getByTestId("phase-icon")).toBeInTheDocument();
  });

  it("applies active glow classes", () => {
    render(<PhaseIcon phase="intake" state="active" />);
    const el = screen.getByTestId("phase-icon");
    expect(el.className).toContain("shadow-glow");
  });

  it("applies muted classes for inactive state", () => {
    render(<PhaseIcon phase="intake" state="inactive" />);
    const el = screen.getByTestId("phase-icon");
    expect(el.className).toContain("bg-muted");
  });

  it("applies success classes for completed state", () => {
    render(<PhaseIcon phase="intake" state="completed" />);
    const el = screen.getByTestId("phase-icon");
    expect(el.className).toContain("bg-emerald");
  });
});
```

**Step 2: Run test, verify it fails**

```bash
npx vitest run src/app/\(dashboard\)/proposals/create/_components/shared/__tests__/phase-icon.test.tsx
```

Expected: FAIL — module not found

**Step 3: Implement PhaseIcon**

```tsx
import { FileText, Target, PenTool, CheckCircle } from "lucide-react";
import type { CreatePhase } from "../../create-types";

const PHASE_ICONS: Record<CreatePhase, React.ElementType> = {
  intake: FileText,
  strategy: Target,
  draft: PenTool,
  finalize: CheckCircle,
};

type PhaseIconState = "inactive" | "active" | "completed";

const STATE_CLASSES: Record<PhaseIconState, string> = {
  inactive: "bg-muted text-muted-foreground",
  active:
    "bg-[var(--accent)] text-white shadow-[var(--shadow-glow)] animate-glow",
  completed: "bg-emerald-600 text-white",
};

interface PhaseIconProps {
  phase: CreatePhase;
  state: PhaseIconState;
  size?: "sm" | "md";
}

export function PhaseIcon({ phase, state, size = "md" }: PhaseIconProps) {
  const Icon = PHASE_ICONS[phase];
  const sizeClass = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const iconSize = size === "sm" ? 14 : 18;

  return (
    <div
      data-testid="phase-icon"
      className={`${sizeClass} rounded-lg flex items-center justify-center shrink-0 transition-all ${STATE_CLASSES[state]}`}
    >
      {state === "completed" ? (
        <CheckCircle size={iconSize} />
      ) : (
        <Icon size={iconSize} />
      )}
    </div>
  );
}
```

**Step 4: Run test, verify it passes**

```bash
npx vitest run src/app/\(dashboard\)/proposals/create/_components/shared/__tests__/phase-icon.test.tsx
```

**Step 5: Lint**

```bash
npx eslint src/app/\(dashboard\)/proposals/create/_components/shared/phase-icon.tsx
```

**Step 6: Commit**

```bash
git add src/app/\(dashboard\)/proposals/create/_components/shared/phase-icon.tsx src/app/\(dashboard\)/proposals/create/_components/shared/__tests__/phase-icon.test.tsx
git commit -m "feat: add PhaseIcon shared component with glow states"
```

---

## Task 2: StatBlock shared component

**Files:**
- Create: `src/app/(dashboard)/proposals/create/_components/shared/stat-block.tsx`
- Test: `src/app/(dashboard)/proposals/create/_components/shared/__tests__/stat-block.test.tsx`

**Context:** Dashboard-style stat display (large accent number + small uppercase label). Used by intake extraction summary, finalize proposal summary, and strategy score display. Matches the `.stat-value` / `.stat-label` pattern from `globals.css`.

**Step 1: Write the test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatBlock } from "../stat-block";

describe("StatBlock", () => {
  it("renders label and value", () => {
    render(<StatBlock label="Budget" value="$2.5M" />);
    expect(screen.getByText("Budget")).toBeInTheDocument();
    expect(screen.getByText("$2.5M")).toBeInTheDocument();
  });

  it("applies semantic color class", () => {
    render(<StatBlock label="Score" value="82" color="success" />);
    const val = screen.getByText("82");
    expect(val.className).toContain("text-emerald");
  });

  it("uses accent color by default", () => {
    render(<StatBlock label="Count" value="5" />);
    const val = screen.getByText("5");
    expect(val.className).toContain("text-[var(--accent)]");
  });
});
```

**Step 2: Run test, verify it fails**

**Step 3: Implement StatBlock**

```tsx
type StatColor = "accent" | "success" | "warning" | "danger" | "muted";

const COLOR_MAP: Record<StatColor, string> = {
  accent: "text-[var(--accent)]",
  success: "text-emerald-400",
  warning: "text-amber-400",
  danger: "text-red-400",
  muted: "text-foreground",
};

interface StatBlockProps {
  label: string;
  value: string;
  color?: StatColor;
}

export function StatBlock({ label, value, color = "accent" }: StatBlockProps) {
  return (
    <div>
      <p className={`text-2xl font-bold ${COLOR_MAP[color]}`}>{value}</p>
      <p className="stat-label">{label}</p>
    </div>
  );
}
```

**Step 4: Run test, verify it passes**

**Step 5: Lint + commit**

```bash
git add src/app/\(dashboard\)/proposals/create/_components/shared/stat-block.tsx src/app/\(dashboard\)/proposals/create/_components/shared/__tests__/stat-block.test.tsx
git commit -m "feat: add StatBlock shared component for dashboard-style stats"
```

---

## Task 3: ScoreBar shared component

**Files:**
- Create: `src/app/(dashboard)/proposals/create/_components/shared/score-bar.tsx`
- Test: `src/app/(dashboard)/proposals/create/_components/shared/__tests__/score-bar.test.tsx`

**Context:** Horizontal fill bar with label + score. Used in Decision Coach for score breakdown bars below the radar chart, and could replace the plain `FactorRow` in strategy-ui.tsx.

**Step 1: Write the test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScoreBar } from "../score-bar";

describe("ScoreBar", () => {
  it("renders label and score", () => {
    render(<ScoreBar label="Requirement Match" score={85} />);
    expect(screen.getByText("Requirement Match")).toBeInTheDocument();
    expect(screen.getByText("85")).toBeInTheDocument();
  });

  it("sets fill width as percentage", () => {
    const { container } = render(
      <ScoreBar label="Test" score={75} />,
    );
    const fill = container.querySelector("[data-testid='score-fill']");
    expect(fill).toHaveStyle({ width: "75%" });
  });

  it("applies green color for high scores", () => {
    const { container } = render(
      <ScoreBar label="Test" score={80} />,
    );
    const fill = container.querySelector("[data-testid='score-fill']");
    expect(fill?.className).toContain("bg-emerald");
  });

  it("applies amber color for medium scores", () => {
    const { container } = render(
      <ScoreBar label="Test" score={55} />,
    );
    const fill = container.querySelector("[data-testid='score-fill']");
    expect(fill?.className).toContain("bg-amber");
  });

  it("applies red color for low scores", () => {
    const { container } = render(
      <ScoreBar label="Test" score={25} />,
    );
    const fill = container.querySelector("[data-testid='score-fill']");
    expect(fill?.className).toContain("bg-red");
  });
});
```

**Step 2: Run test, verify it fails**

**Step 3: Implement ScoreBar**

```tsx
function getBarColor(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
}

interface ScoreBarProps {
  label: string;
  score: number;
  maxScore?: number;
}

export function ScoreBar({ label, score, maxScore = 100 }: ScoreBarProps) {
  const pct = Math.min(100, Math.max(0, (score / maxScore) * 100));

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-36 shrink-0 truncate">
        {label}
      </span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          data-testid="score-fill"
          className={`h-full rounded-full transition-all duration-500 ${getBarColor(score)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums w-8 text-right">
        {score}
      </span>
    </div>
  );
}
```

**Step 4: Run test, verify it passes**

**Step 5: Lint + commit**

```bash
git add src/app/\(dashboard\)/proposals/create/_components/shared/score-bar.tsx src/app/\(dashboard\)/proposals/create/_components/shared/__tests__/score-bar.test.tsx
git commit -m "feat: add ScoreBar shared component with semantic colors"
```

---

## Task 4: AlertCard and NextStepCard shared components

**Files:**
- Create: `src/app/(dashboard)/proposals/create/_components/shared/alert-card.tsx`
- Create: `src/app/(dashboard)/proposals/create/_components/shared/next-step-card.tsx`
- Test: `src/app/(dashboard)/proposals/create/_components/shared/__tests__/alert-card.test.tsx`
- Test: `src/app/(dashboard)/proposals/create/_components/shared/__tests__/next-step-card.test.tsx`

**Context:** AlertCard replaces the tiny severity dots in risk flags with card-style alerts having left-border accent in semantic color and severity icons (`XCircle`, `AlertTriangle`, `Info`). NextStepCard is an accent-bordered directive card shown at the top of the Decision Coach panel with an `ArrowRight` icon and contextual directive text.

**Step 1: Write AlertCard test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AlertCard } from "../alert-card";

describe("AlertCard", () => {
  it("renders text content", () => {
    render(<AlertCard severity="high" text="Missing budget info" />);
    expect(screen.getByText("Missing budget info")).toBeInTheDocument();
  });

  it("applies red border for high severity", () => {
    const { container } = render(
      <AlertCard severity="high" text="Test" />,
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("border-l-red");
  });

  it("applies amber border for medium severity", () => {
    const { container } = render(
      <AlertCard severity="medium" text="Test" />,
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("border-l-amber");
  });

  it("applies blue border for low severity", () => {
    const { container } = render(
      <AlertCard severity="low" text="Test" />,
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("border-l-blue");
  });
});
```

**Step 2: Run test, verify it fails**

**Step 3: Implement AlertCard**

```tsx
import { XCircle, AlertTriangle, Info } from "lucide-react";

type Severity = "low" | "medium" | "high";

const SEVERITY_CONFIG: Record<
  Severity,
  { border: string; icon: React.ElementType; iconColor: string }
> = {
  high: { border: "border-l-red-500", icon: XCircle, iconColor: "text-red-500" },
  medium: {
    border: "border-l-amber-500",
    icon: AlertTriangle,
    iconColor: "text-amber-500",
  },
  low: { border: "border-l-blue-500", icon: Info, iconColor: "text-blue-500" },
};

interface AlertCardProps {
  severity: Severity;
  text: string;
}

export function AlertCard({ severity, text }: AlertCardProps) {
  const cfg = SEVERITY_CONFIG[severity];
  const Icon = cfg.icon;

  return (
    <div
      className={`rounded-lg border border-border ${cfg.border} border-l-2 bg-card p-3 flex items-start gap-2.5`}
    >
      <Icon size={14} className={`${cfg.iconColor} shrink-0 mt-0.5`} />
      <p className="text-xs text-foreground/80 leading-relaxed">{text}</p>
    </div>
  );
}
```

**Step 4: Write NextStepCard test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextStepCard } from "../next-step-card";

describe("NextStepCard", () => {
  it("renders directive text", () => {
    render(<NextStepCard text="Upload your RFP document to begin" />);
    expect(
      screen.getByText("Upload your RFP document to begin"),
    ).toBeInTheDocument();
  });

  it("renders with accent left border", () => {
    const { container } = render(<NextStepCard text="Test" />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("border-l-[var(--accent)]");
  });
});
```

**Step 5: Implement NextStepCard**

```tsx
import { ArrowRight } from "lucide-react";

interface NextStepCardProps {
  text: string;
}

export function NextStepCard({ text }: NextStepCardProps) {
  return (
    <div className="rounded-lg border border-border border-l-2 border-l-[var(--accent)] bg-[var(--accent-subtle)] p-3 flex items-start gap-2.5">
      <ArrowRight
        size={14}
        className="text-[var(--accent)] shrink-0 mt-0.5"
      />
      <p className="text-sm font-medium text-foreground leading-relaxed">
        {text}
      </p>
    </div>
  );
}
```

**Step 6: Run both tests, verify they pass**

```bash
npx vitest run src/app/\(dashboard\)/proposals/create/_components/shared/__tests__/alert-card.test.tsx src/app/\(dashboard\)/proposals/create/_components/shared/__tests__/next-step-card.test.tsx
```

**Step 7: Lint + commit**

```bash
git add src/app/\(dashboard\)/proposals/create/_components/shared/alert-card.tsx src/app/\(dashboard\)/proposals/create/_components/shared/next-step-card.tsx src/app/\(dashboard\)/proposals/create/_components/shared/__tests__/
git commit -m "feat: add AlertCard and NextStepCard shared components"
```

---

## Task 5: RadarChart shared component

**Files:**
- Create: `src/app/(dashboard)/proposals/create/_components/shared/radar-chart.tsx`
- Test: `src/app/(dashboard)/proposals/create/_components/shared/__tests__/radar-chart.test.tsx`

**Context:** Pure SVG 5-point polygon for bid scoring factors. Each axis 0-100, filled area in accent color at 20% opacity with accent border. Dots at each vertex showing exact score. Subtle glow via CSS `filter: drop-shadow`. Displayed when `bidEvaluation` exists.

The 5 axes correspond to SCORING_FACTORS: Requirement Match, Past Performance, Capability Alignment, Timeline Feasibility, Strategic Value.

**Step 1: Write the test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RadarChart } from "../radar-chart";

const MOCK_SCORES = [
  { label: "Requirement Match", score: 85 },
  { label: "Past Performance", score: 72 },
  { label: "Capability Alignment", score: 60 },
  { label: "Timeline Feasibility", score: 90 },
  { label: "Strategic Value", score: 45 },
];

describe("RadarChart", () => {
  it("renders an SVG element", () => {
    const { container } = render(<RadarChart scores={MOCK_SCORES} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("renders a polygon for the filled area", () => {
    const { container } = render(<RadarChart scores={MOCK_SCORES} />);
    const polygon = container.querySelector("polygon");
    expect(polygon).toBeInTheDocument();
  });

  it("renders axis labels", () => {
    render(<RadarChart scores={MOCK_SCORES} />);
    expect(screen.getByText("Requirement Match")).toBeInTheDocument();
    expect(screen.getByText("Past Performance")).toBeInTheDocument();
  });

  it("renders 5 vertex dots", () => {
    const { container } = render(<RadarChart scores={MOCK_SCORES} />);
    const circles = container.querySelectorAll("[data-testid='vertex-dot']");
    expect(circles.length).toBe(5);
  });

  it("renders nothing when scores array is empty", () => {
    const { container } = render(<RadarChart scores={[]} />);
    expect(container.querySelector("svg")).toBeNull();
  });
});
```

**Step 2: Run test, verify it fails**

**Step 3: Implement RadarChart**

The radar chart is pure SVG math. Each axis is evenly distributed around a circle (72° apart for 5 axes). The center of the SVG is (150, 140), radius 100. Each score maps to a point along its axis at `score/100 * radius` distance from center.

```tsx
interface RadarScore {
  label: string;
  score: number;
}

interface RadarChartProps {
  scores: RadarScore[];
  size?: number;
}

const RADIUS = 100;
const CENTER_X = 150;
const CENTER_Y = 140;
const LABEL_OFFSET = 18;
const RINGS = [25, 50, 75, 100];

function polarToXY(
  angleDeg: number,
  radius: number,
): { x: number; y: number } {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CENTER_X + radius * Math.cos(angleRad),
    y: CENTER_Y + radius * Math.sin(angleRad),
  };
}

function buildPolygonPoints(scores: RadarScore[]): string {
  const step = 360 / scores.length;
  return scores
    .map((s, i) => {
      const r = (s.score / 100) * RADIUS;
      const { x, y } = polarToXY(i * step, r);
      return `${x},${y}`;
    })
    .join(" ");
}

function AxisLines({ count }: { count: number }) {
  const step = 360 / count;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const { x, y } = polarToXY(i * step, RADIUS);
        return (
          <line
            key={i}
            x1={CENTER_X}
            y1={CENTER_Y}
            x2={x}
            y2={y}
            stroke="var(--border)"
            strokeWidth={1}
          />
        );
      })}
    </>
  );
}

function RingLines({ count }: { count: number }) {
  return (
    <>
      {RINGS.map((pct) => {
        const r = (pct / 100) * RADIUS;
        const step = 360 / count;
        const pts = Array.from({ length: count }, (_, i) => {
          const { x, y } = polarToXY(i * step, r);
          return `${x},${y}`;
        }).join(" ");
        return (
          <polygon
            key={pct}
            points={pts}
            fill="none"
            stroke="var(--border)"
            strokeWidth={pct === 100 ? 1 : 0.5}
            opacity={0.5}
          />
        );
      })}
    </>
  );
}

export function RadarChart({ scores, size = 300 }: RadarChartProps) {
  if (scores.length === 0) return null;

  const step = 360 / scores.length;
  const points = buildPolygonPoints(scores);

  return (
    <svg
      viewBox="0 0 300 280"
      width={size}
      height={(size * 280) / 300}
      className="mx-auto"
    >
      <RingLines count={scores.length} />
      <AxisLines count={scores.length} />

      {/* Filled area */}
      <polygon
        points={points}
        fill="var(--accent)"
        fillOpacity={0.2}
        stroke="var(--accent)"
        strokeWidth={2}
        style={{ filter: "drop-shadow(0 0 6px var(--accent-muted))" }}
      />

      {/* Vertex dots */}
      {scores.map((s, i) => {
        const r = (s.score / 100) * RADIUS;
        const { x, y } = polarToXY(i * step, r);
        return (
          <circle
            key={s.label}
            data-testid="vertex-dot"
            cx={x}
            cy={y}
            r={4}
            fill="var(--accent)"
            stroke="var(--background)"
            strokeWidth={2}
          />
        );
      })}

      {/* Labels */}
      {scores.map((s, i) => {
        const { x, y } = polarToXY(i * step, RADIUS + LABEL_OFFSET);
        const anchor =
          x < CENTER_X - 10
            ? "end"
            : x > CENTER_X + 10
              ? "start"
              : "middle";
        return (
          <text
            key={s.label}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="central"
            className="fill-muted-foreground text-[10px]"
          >
            {s.label}
          </text>
        );
      })}
    </svg>
  );
}
```

**Step 4: Run test, verify it passes**

```bash
npx vitest run src/app/\(dashboard\)/proposals/create/_components/shared/__tests__/radar-chart.test.tsx
```

**Step 5: Lint + commit**

```bash
git add src/app/\(dashboard\)/proposals/create/_components/shared/radar-chart.tsx src/app/\(dashboard\)/proposals/create/_components/shared/__tests__/radar-chart.test.tsx
git commit -m "feat: add RadarChart SVG component for bid factor visualization"
```

---

## Task 6: ReadinessChecklist shared component

**Files:**
- Create: `src/app/(dashboard)/proposals/create/_components/shared/readiness-checklist.tsx`
- Test: `src/app/(dashboard)/proposals/create/_components/shared/__tests__/readiness-checklist.test.tsx`

**Context:** Visual checklist for the finalize phase coach panel. Items auto-check as conditions are met from `CreateFlowState`. Checked items show accent-colored checkbox with a brief scale-pulse animation. Unchecked items show muted checkbox with "what's needed" hint.

**Items:**
- All sections generated
- All sections reviewed
- No unresolved blockers
- Export format selected (always ready — user picks at export time)

**Step 1: Write the test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReadinessChecklist, type ReadinessItem } from "../readiness-checklist";

const ITEMS: ReadinessItem[] = [
  { id: "gen", label: "All sections generated", checked: true },
  { id: "rev", label: "All sections reviewed", checked: false, hint: "2 sections need review" },
  { id: "block", label: "No unresolved blockers", checked: true },
];

describe("ReadinessChecklist", () => {
  it("renders all items", () => {
    render(<ReadinessChecklist items={ITEMS} />);
    expect(screen.getByText("All sections generated")).toBeInTheDocument();
    expect(screen.getByText("All sections reviewed")).toBeInTheDocument();
    expect(screen.getByText("No unresolved blockers")).toBeInTheDocument();
  });

  it("shows hint for unchecked items", () => {
    render(<ReadinessChecklist items={ITEMS} />);
    expect(screen.getByText("2 sections need review")).toBeInTheDocument();
  });

  it("applies checked styling", () => {
    const { container } = render(<ReadinessChecklist items={ITEMS} />);
    const checkIcons = container.querySelectorAll("[data-checked='true']");
    expect(checkIcons.length).toBe(2);
  });
});
```

**Step 2: Run test, verify it fails**

**Step 3: Implement ReadinessChecklist**

```tsx
import { CheckCircle, Circle } from "lucide-react";

export interface ReadinessItem {
  id: string;
  label: string;
  checked: boolean;
  hint?: string;
}

interface ReadinessChecklistProps {
  items: ReadinessItem[];
}

function ChecklistRow({ item }: { item: ReadinessItem }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      {item.checked ? (
        <CheckCircle
          data-checked="true"
          size={16}
          className="text-[var(--accent)] shrink-0 mt-0.5 animate-fade-in"
        />
      ) : (
        <Circle
          data-checked="false"
          size={16}
          className="text-muted-foreground/40 shrink-0 mt-0.5"
        />
      )}
      <div className="flex-1 min-w-0">
        <span
          className={`text-xs ${item.checked ? "text-foreground" : "text-muted-foreground"}`}
        >
          {item.label}
        </span>
        {!item.checked && item.hint && (
          <p className="text-[11px] text-muted-foreground/60 mt-0.5">
            {item.hint}
          </p>
        )}
      </div>
    </div>
  );
}

export function ReadinessChecklist({ items }: ReadinessChecklistProps) {
  return (
    <div className="space-y-0.5">
      {items.map((item) => (
        <ChecklistRow key={item.id} item={item} />
      ))}
    </div>
  );
}
```

**Step 4: Run test, verify it passes**

**Step 5: Lint + commit**

```bash
git add src/app/\(dashboard\)/proposals/create/_components/shared/readiness-checklist.tsx src/app/\(dashboard\)/proposals/create/_components/shared/__tests__/readiness-checklist.test.tsx
git commit -m "feat: add ReadinessChecklist component with auto-check animation"
```

---

## Task 7: Phase Strip redesign

**Files:**
- Modify: `src/app/(dashboard)/proposals/create/_components/phase-strip.tsx`

**Context:** Replace plain numbered circles with `PhaseIcon` badges. Add progressive connector fill with accent color. Style the progress badge with accent variant. Keep all existing logic (isPhaseReachable, handleStartOver, handleSelect). The `PhaseItem` sub-component gets the biggest visual change.

**Reference:** Current file is 135 lines. The PHASES array, `isPhaseReachable`, and event handlers stay the same.

**Step 1: Update imports**

At the top of `phase-strip.tsx`, add:

```tsx
import { PhaseIcon } from "./shared/phase-icon";
```

**Step 2: Replace PhaseItem sub-component**

Replace lines 45-87 (the `PhaseItem` function) with:

```tsx
function PhaseItem({
  phaseKey,
  label,
  index,
  isActive,
  isCompleted,
  reachable,
  onSelect,
}: {
  phaseKey: CreatePhase;
  label: string;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  reachable: boolean;
  onSelect: (phase: CreatePhase) => void;
}) {
  const iconState = isCompleted
    ? "completed"
    : isActive
      ? "active"
      : "inactive";

  return (
    <div className="flex items-center shrink-0">
      {index > 0 && (
        <div
          className={`w-8 sm:w-12 h-0.5 transition-colors duration-500 ${
            isCompleted || isActive
              ? "bg-[var(--accent)]"
              : "bg-border border-dashed"
          }`}
        />
      )}
      <button
        onClick={() => reachable && onSelect(phaseKey)}
        disabled={!reachable}
        className={`flex items-center gap-2 sm:gap-3 transition-all ${
          !reachable ? "cursor-not-allowed opacity-40" : "cursor-pointer"
        }`}
      >
        <PhaseIcon phase={phaseKey} state={iconState} size="sm" />
        <span
          className={`text-xs sm:text-sm font-medium transition-colors ${
            isActive ? "text-foreground font-bold" : ""
          } ${isCompleted && !isActive ? "text-[var(--accent)]" : ""} ${
            !isActive && !isCompleted ? "text-muted-foreground" : ""
          }`}
        >
          {label}
        </span>
      </button>
    </div>
  );
}
```

**Step 3: Update progress badge**

In the `PhaseStrip` return JSX, replace the progress badge (line 129-131):

```tsx
{/* Old: */}
<span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">

{/* New: */}
<span className="badge badge-accent">
```

**Step 4: Remove the CheckIcon function**

Delete the `CheckIcon` function (lines 31-43) — no longer needed since `PhaseIcon` handles the check state internally.

**Step 5: Run type check + lint**

```bash
npx tsc --noEmit
npx eslint src/app/\(dashboard\)/proposals/create/_components/phase-strip.tsx
```

**Step 6: Commit**

```bash
git add src/app/\(dashboard\)/proposals/create/_components/phase-strip.tsx
git commit -m "feat: redesign phase strip with icon badges and progressive connectors"
```

---

## Task 8: Phase content panel headers + stat displays

**Files:**
- Modify: `src/app/(dashboard)/proposals/create/_components/phases/intake-phase.tsx`
- Modify: `src/app/(dashboard)/proposals/create/_components/phases/strategy-phase.tsx`
- Modify: `src/app/(dashboard)/proposals/create/_components/phases/strategy-ui.tsx`
- Modify: `src/app/(dashboard)/proposals/create/_components/phases/draft-phase.tsx`
- Modify: `src/app/(dashboard)/proposals/create/_components/phases/finalize-phase.tsx`

**Context:** Each phase header gets the same pattern: `PhaseIcon` badge + title `text-xl font-bold` + description in muted. Extraction summary and finalize proposal summary switch to `StatBlock`. This is mostly class swaps and component replacements, not logic changes.

### Intake Phase

**Step 1: Update IntakeHeader**

Add import at top:
```tsx
import { PhaseIcon } from "../shared/phase-icon";
```

Replace `IntakeHeader` function (lines 22-32):

```tsx
function IntakeHeader() {
  return (
    <div className="flex items-center gap-3">
      <PhaseIcon phase="intake" state="active" />
      <div>
        <h2 className="text-xl font-bold">Upload RFP Documents</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Upload your RFP or paste a URL — we extract requirements, criteria, and gaps automatically.
        </p>
      </div>
    </div>
  );
}
```

**Step 2: Update ExtractionSummary to use StatBlock**

Add import:
```tsx
import { StatBlock } from "../shared/stat-block";
```

Replace the `ExtractionSummary` component (lines 67-93). Change the `<dl>` grid to use `StatBlock`:

```tsx
function ExtractionSummary({
  summary,
}: {
  summary: ReturnType<typeof getExtractionSummary>;
}) {
  const stats = [
    { label: "Client", value: summary.clientName },
    { label: "Type", value: summary.solicitationType },
    { label: "Requirements", value: String(summary.requirementsCount) },
    { label: "Budget", value: summary.budgetRange },
    {
      label: "Critical Gaps",
      value: String(summary.criticalGaps),
      color: (summary.criticalGaps > 0 ? "danger" : "success") as "danger" | "success",
    },
  ];

  return (
    <div className="card p-6">
      <h3 className="text-sm font-semibold mb-4">Extraction Summary</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
        {stats.map((s) => (
          <StatBlock
            key={s.label}
            label={s.label}
            value={s.value}
            color={"color" in s ? s.color : undefined}
          />
        ))}
      </div>
    </div>
  );
}
```

### Strategy Phase

**Step 3: Update StrategyHeader in strategy-ui.tsx**

Add import at top of `strategy-ui.tsx`:
```tsx
import { PhaseIcon } from "../shared/phase-icon";
```

Replace `StrategyHeader` (lines 48-58):
```tsx
export function StrategyHeader() {
  return (
    <div className="flex items-center gap-3">
      <PhaseIcon phase="strategy" state="active" />
      <div>
        <h2 className="text-xl font-bold">Bid Strategy</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          AI-scored bid evaluation — review factors and select win themes.
        </p>
      </div>
    </div>
  );
}
```

**Step 4: Update ScoreCard to use bid score as stat-value**

In `strategy-ui.tsx`, update the score display in `ScoreCard` (lines 103-109). Replace the plain `text-4xl font-bold` with stat-value class:

```tsx
<div className={`rounded-lg border p-4 text-center ${totalBg}`}>
  <div className={`stat-value ${totalColor}`}>
    {Math.round(evaluation.weighted_total)}
  </div>
  <p className="stat-label mt-1">Weighted Score / 100</p>
</div>
```

**Step 5: Replace FactorRow with ScoreBar**

Add import at top of `strategy-ui.tsx`:
```tsx
import { ScoreBar } from "../shared/score-bar";
```

Replace the `FactorRow` function (lines 62-83) and the scoring factors map (lines 116-126) with:

```tsx
{SCORING_FACTORS.map((factor) => {
  const factorScore = evaluation.ai_scores[factor.key];
  return (
    <ScoreBar
      key={factor.key}
      label={`${factor.label} (${factor.weight}%)`}
      score={factorScore.score}
    />
  );
})}
```

Delete the `FactorRow` function entirely.

### Draft Phase

**Step 6: Update DraftHeader**

Add import at top of `draft-phase.tsx`:
```tsx
import { PhaseIcon } from "../shared/phase-icon";
```

Replace `DraftHeader` (lines 11-21):
```tsx
function DraftHeader() {
  return (
    <div className="flex items-center gap-3">
      <PhaseIcon phase="draft" state="active" />
      <div>
        <h2 className="text-xl font-bold">Proposal Draft</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Sections generate from your RFP analysis and win themes. Review each as it completes.
        </p>
      </div>
    </div>
  );
}
```

### Finalize Phase

**Step 7: Update FinalizeHeader**

Add import at top of `finalize-phase.tsx`:
```tsx
import { PhaseIcon } from "../shared/phase-icon";
import { StatBlock } from "../shared/stat-block";
```

Replace `FinalizeHeader` (lines 70-79):
```tsx
function FinalizeHeader() {
  return (
    <div className="flex items-center gap-3">
      <PhaseIcon phase="finalize" state="active" />
      <div>
        <h2 className="text-xl font-bold">Finalize Proposal</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Review blockers, approve the final package, and export.
        </p>
      </div>
    </div>
  );
}
```

**Step 8: Update ProposalSummary to use StatBlock**

Replace `ProposalSummary` stats grid (lines 108-115) with StatBlock components:
```tsx
<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
  {stats.map((s) => (
    <StatBlock key={s.label} label={s.label} value={s.value} />
  ))}
</div>
```

**Step 9: Run type check + lint on all modified files**

```bash
npx tsc --noEmit
npx eslint src/app/\(dashboard\)/proposals/create/_components/phases/intake-phase.tsx src/app/\(dashboard\)/proposals/create/_components/phases/strategy-ui.tsx src/app/\(dashboard\)/proposals/create/_components/phases/draft-phase.tsx src/app/\(dashboard\)/proposals/create/_components/phases/finalize-phase.tsx
```

**Step 10: Commit**

```bash
git add src/app/\(dashboard\)/proposals/create/_components/phases/
git commit -m "feat: brand phase panels with icon headers, stat blocks, and score bars"
```

---

## Task 9: Decision Coach visual foundation + NextStepCard

**Files:**
- Modify: `src/app/(dashboard)/proposals/create/_components/decision-coach.tsx`
- Modify: `src/app/(dashboard)/proposals/create/_components/coach-content.ts`

**Context:** This task upgrades the coach's visual foundation:
1. Header gets sparkle icon badge
2. Risk flags upgrade from chips to AlertCard
3. Insights upgrade from dots to severity icons (CheckCircle, AlertTriangle, XCircle)
4. Coach content adds a `nextStep` field for directive text
5. NextStepCard rendered at top when present

### Decision Coach visual changes

**Step 1: Add new imports to decision-coach.tsx**

Replace the import block (lines 6-11):
```tsx
import { useMemo, useState, useCallback } from "react";
import { Sparkles, CheckCircle, AlertTriangle, XCircle, Clipboard } from "lucide-react";
import { useCreateFlow } from "./create-provider";
import { getCoachContent } from "./coach-content";
import { ConfidenceRing } from "./shared/confidence-ring";
import { AlertCard } from "./shared/alert-card";
import { NextStepCard } from "./shared/next-step-card";
import type { CoachContent, CoachInsight, CoachPrompt } from "./create-types";
```

**Step 2: Update the Header in DecisionCoach main component**

Replace lines 178-191 (header section) with:
```tsx
{/* Header with icon badge */}
<div className="flex items-start justify-between">
  <div className="flex items-center gap-2.5">
    <div className="h-8 w-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
      {isFinalize ? (
        <Clipboard size={14} className="text-white" />
      ) : (
        <Sparkles size={14} className="text-white" />
      )}
    </div>
    <div>
      <h3 className="text-sm font-semibold">
        {isFinalize ? "Proposal Summary" : "Decision Coach"}
      </h3>
      {isFinalize && state.bidEvaluation && (
        <p className="text-xs text-muted-foreground">
          Bid fit: {Math.round(state.bidEvaluation.weighted_total)}/100
        </p>
      )}
    </div>
  </div>
  <ConfidenceRing score={state.confidence} size={56} />
</div>
```

**Step 3: Add NextStepCard rendering**

After the header section, before `<AdvisorySection>`, add:
```tsx
{/* Next step directive */}
{content.nextStep && <NextStepCard text={content.nextStep} />}
```

**Step 4: Replace RisksSection to use AlertCard**

Replace the `RisksSection` function (lines 66-81):
```tsx
function RisksSection({ flags }: { flags: CoachContent["riskFlags"] }) {
  if (flags.length === 0) return null;
  return (
    <CollapsibleSection title="Attention needed" defaultOpen={true}>
      <div className="space-y-2">
        {flags.map((flag) => (
          <AlertCard
            key={flag.id}
            severity={flag.severity}
            text={flag.label}
          />
        ))}
      </div>
    </CollapsibleSection>
  );
}
```

**Step 5: Update InsightRow to use severity icons**

Replace the `SEVERITY_DOT` map and `InsightRow` (lines 85-115):
```tsx
const SEVERITY_ICON: Record<string, { icon: React.ElementType; color: string }> = {
  high: { icon: XCircle, color: "text-red-500" },
  medium: { icon: AlertTriangle, color: "text-amber-500" },
  low: { icon: CheckCircle, color: "text-emerald-500" },
};

function InsightRow({ insight }: { insight: CoachInsight }) {
  const cfg = SEVERITY_ICON[insight.severity ?? "low"];
  const Icon = cfg.icon;

  return (
    <div className="flex items-start gap-2 py-1.5">
      <Icon size={14} className={`${cfg.color} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-xs font-medium text-foreground truncate">
            {insight.label}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            {insight.value}
          </span>
        </div>
        {insight.detail && (
          <p className="text-[11px] text-muted-foreground/70 leading-snug mt-0.5">
            {insight.detail}
          </p>
        )}
      </div>
    </div>
  );
}
```

**Step 6: Update gap-filling prompts with importance-tagged cards**

Replace `IMPORTANCE_COLORS` (lines 132-138):
```tsx
const IMPORTANCE_COLORS: Record<string, string> = {
  critical: "border-l-2 border-l-red-500 border-border bg-card",
  helpful: "border-l-2 border-l-amber-500 border-border bg-card",
  nice_to_have: "border-l-2 border-l-border border-border bg-card",
};
```

### Coach content nextStep field

**Step 7: Add nextStep to CoachContent type**

In `create-types.ts`, add to the `CoachContent` interface (after `prompts?`):
```tsx
/** Contextual directive text for the "Next Step" card. */
nextStep?: string;
```

**Step 8: Add nextStep text to coach-content.ts**

In each coach function in `coach-content.ts`, add a `nextStep` field:

**Intake:**
- Empty state: `"Upload your RFP document to begin"`
- Extracting: `"Processing your document..."`
- Extracted: `"Review the extraction and fill any gaps below"`

**Strategy:**
- No evaluation: (no nextStep)
- Has evaluation: `"Select win themes that emphasize your strengths"`

**Draft:**
- Generating: `"Review each section as it generates"`
- Post-generation with unreviewed: `"${unreviewed} sections need review before export"`
- All reviewed: `"All sections reviewed — continue to finalize"`

**Finalize:**
- Has blockers: `"Resolve ${count} blockers before approving"`
- No blockers, not approved: `"Approve and export your proposal"`
- Approved: `"Ready to export — download as DOCX or PDF"`

**Step 9: Run type check + lint**

```bash
npx tsc --noEmit
npx eslint src/app/\(dashboard\)/proposals/create/_components/decision-coach.tsx src/app/\(dashboard\)/proposals/create/_components/coach-content.ts src/app/\(dashboard\)/proposals/create/_components/create-types.ts
```

**Step 10: Commit**

```bash
git add src/app/\(dashboard\)/proposals/create/_components/decision-coach.tsx src/app/\(dashboard\)/proposals/create/_components/coach-content.ts src/app/\(dashboard\)/proposals/create/_components/create-types.ts
git commit -m "feat: upgrade Decision Coach with icon header, alert cards, next step directives"
```

---

## Task 10: Decision Coach — Radar Chart + Score Breakdown Bars

**Files:**
- Modify: `src/app/(dashboard)/proposals/create/_components/decision-coach.tsx`
- Modify: `src/app/(dashboard)/proposals/create/_components/coach-content.ts`

**Context:** When `bidEvaluation` exists (strategy + finalize phases), the Decision Coach shows a radar chart and score breakdown bars. These appear after the NextStepCard and before the risk flags section.

**Step 1: Add radar chart section to Decision Coach**

In `decision-coach.tsx`, add imports:
```tsx
import { RadarChart } from "./shared/radar-chart";
import { ScoreBar } from "./shared/score-bar";
import { SCORING_FACTORS } from "@/lib/ai/bid-scoring";
```

After the `<AdvisorySection>` and before the `<RisksSection>`, add:

```tsx
{/* Radar chart + score breakdown (strategy + finalize only) */}
{state.bidEvaluation && (
  <BidVisualization evaluation={state.bidEvaluation} />
)}
```

**Step 2: Create BidVisualization sub-component**

Add a new function (keep it under 50 lines):

```tsx
function BidVisualization({
  evaluation,
}: {
  evaluation: NonNullable<CreateFlowState["bidEvaluation"]>;
}) {
  const radarScores = SCORING_FACTORS.map((f) => ({
    label: f.label,
    score: evaluation.ai_scores[f.key]?.score ?? 0,
  }));

  return (
    <CollapsibleSection title="Bid Factor Analysis" defaultOpen={true}>
      <div className="space-y-4">
        <RadarChart scores={radarScores} size={240} />
        <div className="space-y-2">
          {SCORING_FACTORS.map((f) => (
            <ScoreBar
              key={f.key}
              label={f.label}
              score={evaluation.ai_scores[f.key]?.score ?? 0}
            />
          ))}
        </div>
      </div>
    </CollapsibleSection>
  );
}
```

**Step 3: Add strengths/concerns cards**

After the BidVisualization, add strengths and concerns sections. These use data from `coach-insights-finalize.ts`:

```tsx
{/* Strengths & concerns (when evaluation exists) */}
{content.insights && content.insights.length > 0 && (
  <InsightsSection insights={content.insights} />
)}
```

The existing `InsightsSection` with the updated `InsightRow` (from Task 9) already handles the severity-icon display for strengths (low severity = green CheckCircle) and concerns (high severity = red XCircle).

**Step 4: Import CreateFlowState type**

Add to imports in decision-coach.tsx:
```tsx
import type { CoachContent, CoachInsight, CoachPrompt, CreateFlowState } from "./create-types";
```

**Step 5: Run type check + lint**

```bash
npx tsc --noEmit
npx eslint src/app/\(dashboard\)/proposals/create/_components/decision-coach.tsx
```

**Step 6: Commit**

```bash
git add src/app/\(dashboard\)/proposals/create/_components/decision-coach.tsx
git commit -m "feat: add radar chart and score breakdown bars to Decision Coach"
```

---

## Task 11: Decision Coach — Readiness Checklist (finalize phase)

**Files:**
- Modify: `src/app/(dashboard)/proposals/create/_components/decision-coach.tsx`
- Modify: `src/app/(dashboard)/proposals/create/_components/coach-content.ts` (or `coach-insights-finalize.ts`)

**Context:** In the finalize phase, the coach panel shows a readiness checklist computed from `CreateFlowState`. Items auto-check as conditions are met. No manual user input needed.

**Step 1: Create readiness items builder**

In `coach-insights-finalize.ts`, add a new exported function:

```tsx
import type { ReadinessItem } from "../shared/readiness-checklist";

export function buildReadinessItems(state: CreateFlowState): ReadinessItem[] {
  const completeSections = state.sections.filter(
    (s) => s.generationStatus === "complete",
  );
  const reviewedSections = state.sections.filter((s) => s.reviewed);
  const unresolvedBlockers = state.blockers.filter((b) => !b.resolved);
  const totalSections = state.sections.length;

  return [
    {
      id: "all-generated",
      label: "All sections generated",
      checked: completeSections.length === totalSections && totalSections > 0,
      hint:
        completeSections.length < totalSections
          ? `${totalSections - completeSections.length} section(s) pending`
          : undefined,
    },
    {
      id: "all-reviewed",
      label: "All sections reviewed",
      checked:
        reviewedSections.length === totalSections && totalSections > 0,
      hint:
        reviewedSections.length < totalSections
          ? `${totalSections - reviewedSections.length} section(s) need review`
          : undefined,
    },
    {
      id: "no-blockers",
      label: "No unresolved blockers",
      checked: unresolvedBlockers.length === 0,
      hint:
        unresolvedBlockers.length > 0
          ? `${unresolvedBlockers.length} blocker(s) remaining`
          : undefined,
    },
    {
      id: "approved",
      label: "Final package approved",
      checked: state.finalApproved,
      hint: !state.finalApproved ? "Approve to enable export" : undefined,
    },
  ];
}
```

**Step 2: Add checklist to coach content**

In `coach-content.ts`, update `CoachContent` type usage. In `create-types.ts`, add:

```tsx
import type { ReadinessItem } from "./shared/readiness-checklist";

// Add to CoachContent interface:
readinessItems?: ReadinessItem[];
```

In `coach-content.ts`, import and call in `getFinalizeCoach`:
```tsx
import { buildReadinessItems } from "./coach-insights-finalize";

// Inside getFinalizeCoach, add:
readinessItems: buildReadinessItems(state),
```

**Step 3: Render ReadinessChecklist in decision-coach.tsx**

Import:
```tsx
import { ReadinessChecklist } from "./shared/readiness-checklist";
```

In the DecisionCoach return, after insights section (only for finalize):
```tsx
{/* Readiness checklist (finalize only) */}
{isFinalize && content.readinessItems && content.readinessItems.length > 0 && (
  <CollapsibleSection title="Export Readiness" defaultOpen={true}>
    <ReadinessChecklist items={content.readinessItems} />
  </CollapsibleSection>
)}
```

**Step 4: Run type check + lint**

```bash
npx tsc --noEmit
npx eslint src/app/\(dashboard\)/proposals/create/_components/decision-coach.tsx src/app/\(dashboard\)/proposals/create/_components/coach-content.ts src/app/\(dashboard\)/proposals/create/_components/coach-insights-finalize.ts src/app/\(dashboard\)/proposals/create/_components/create-types.ts
```

**Step 5: Commit**

```bash
git add src/app/\(dashboard\)/proposals/create/_components/decision-coach.tsx src/app/\(dashboard\)/proposals/create/_components/coach-content.ts src/app/\(dashboard\)/proposals/create/_components/coach-insights-finalize.ts src/app/\(dashboard\)/proposals/create/_components/create-types.ts
git commit -m "feat: add readiness checklist to finalize phase Decision Coach"
```

---

## Task 12: Final verification + cleanup

**Files:**
- All modified files from Tasks 1-11

**Context:** Verify everything compiles, lints, and no regressions.

**Step 1: TypeScript compile check**

```bash
npx tsc --noEmit
```

Expected: 0 errors

**Step 2: ESLint on all changed files**

```bash
npx eslint \
  src/app/\(dashboard\)/proposals/create/_components/shared/phase-icon.tsx \
  src/app/\(dashboard\)/proposals/create/_components/shared/stat-block.tsx \
  src/app/\(dashboard\)/proposals/create/_components/shared/score-bar.tsx \
  src/app/\(dashboard\)/proposals/create/_components/shared/alert-card.tsx \
  src/app/\(dashboard\)/proposals/create/_components/shared/next-step-card.tsx \
  src/app/\(dashboard\)/proposals/create/_components/shared/radar-chart.tsx \
  src/app/\(dashboard\)/proposals/create/_components/shared/readiness-checklist.tsx \
  src/app/\(dashboard\)/proposals/create/_components/phase-strip.tsx \
  src/app/\(dashboard\)/proposals/create/_components/decision-coach.tsx \
  src/app/\(dashboard\)/proposals/create/_components/coach-content.ts \
  src/app/\(dashboard\)/proposals/create/_components/coach-insights-finalize.ts \
  src/app/\(dashboard\)/proposals/create/_components/create-types.ts \
  src/app/\(dashboard\)/proposals/create/_components/phases/intake-phase.tsx \
  src/app/\(dashboard\)/proposals/create/_components/phases/strategy-ui.tsx \
  src/app/\(dashboard\)/proposals/create/_components/phases/draft-phase.tsx \
  src/app/\(dashboard\)/proposals/create/_components/phases/finalize-phase.tsx
```

Expected: 0 errors, 0 new warnings

**Step 3: Run all new tests**

```bash
npx vitest run src/app/\(dashboard\)/proposals/create/_components/shared/__tests__/
```

Expected: All tests pass

**Step 4: Run full test suite to check for regressions**

```bash
npx vitest run
```

Expected: No new failures (pre-existing failures in quality-overseer and bulk-import are known)

**Step 5: File size compliance check**

Verify all modified/created files stay under limits:
- Source files: 300 lines max
- Phase component files: 300 lines max
- Shared components: much smaller (~30-80 lines each)

```bash
wc -l \
  src/app/\(dashboard\)/proposals/create/_components/shared/phase-icon.tsx \
  src/app/\(dashboard\)/proposals/create/_components/shared/stat-block.tsx \
  src/app/\(dashboard\)/proposals/create/_components/shared/score-bar.tsx \
  src/app/\(dashboard\)/proposals/create/_components/shared/alert-card.tsx \
  src/app/\(dashboard\)/proposals/create/_components/shared/next-step-card.tsx \
  src/app/\(dashboard\)/proposals/create/_components/shared/radar-chart.tsx \
  src/app/\(dashboard\)/proposals/create/_components/shared/readiness-checklist.tsx \
  src/app/\(dashboard\)/proposals/create/_components/phase-strip.tsx \
  src/app/\(dashboard\)/proposals/create/_components/decision-coach.tsx \
  src/app/\(dashboard\)/proposals/create/_components/coach-content.ts \
  src/app/\(dashboard\)/proposals/create/_components/coach-insights-finalize.ts \
  src/app/\(dashboard\)/proposals/create/_components/create-types.ts
```

**Step 6: Final commit if any cleanup needed**

```bash
git add -A
git status
# Only commit if there are changes from cleanup
git commit -m "chore: cleanup lint warnings and file size compliance"
```

---

## Summary

| Task | Component | LOC Est. | Dependencies |
|------|-----------|----------|--------------|
| 1 | PhaseIcon | ~40 | None |
| 2 | StatBlock | ~25 | None |
| 3 | ScoreBar | ~35 | None |
| 4 | AlertCard + NextStepCard | ~55 | None |
| 5 | RadarChart | ~110 | None |
| 6 | ReadinessChecklist | ~50 | None |
| 7 | Phase Strip redesign | ~modify | Task 1 |
| 8 | Phase panel headers + stats | ~modify | Tasks 1, 2, 3 |
| 9 | Coach visual + NextStep | ~modify | Tasks 4 |
| 10 | Coach radar + score bars | ~modify | Tasks 3, 5 |
| 11 | Coach readiness checklist | ~modify | Task 6 |
| 12 | Final verification | ~0 new | All |

**Total new component LOC:** ~315
**Total test LOC:** ~180
**Modified files:** 8 existing files with class swaps and component integrations

**Critical constraint:** All existing functionality must be preserved. No data flow changes, no API changes, no phase logic changes. Visual + coach intelligence only.
