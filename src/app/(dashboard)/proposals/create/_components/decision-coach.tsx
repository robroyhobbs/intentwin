"use client";

import { useMemo, useState, useCallback, type CSSProperties } from "react";
import {
  Sparkles,
  Clipboard,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { useCreateFlow } from "./create-provider";
import { getCoachContent } from "./coach-content";
import { AlertCard } from "./shared/alert-card";
import { NextStepCard } from "./shared/next-step-card";
import { VerdictCard } from "./shared/verdict-card";
import { GapCard } from "./shared/gap-card";
import { StrengthCard } from "./shared/strength-card";
import { IntelStats } from "./shared/intel-stats";
import { ReadinessChecklist } from "./shared/readiness-checklist";
import type { BidIntelligenceContext } from "@/lib/ai/bid-scoring";
import type {
  CoachContent,
  CoachInsight,
  CoachPrompt,
  CreateFlowState,
  CreatePhase,
} from "./create-types";
import { cn } from "@/lib/utils/cn";

// ── Collapsible wrapper ─────────────────────────────────────────────────────

function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const toggle = useCallback(() => setOpen((p) => !p), []);
  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        className="flex items-center justify-between w-full group"
      >
        <h4 className="text-xs font-semibold text-muted-foreground uppercase">
          {title}
        </h4>
        <svg
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

// ── Coach Header ────────────────────────────────────────────────────────────

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

// ── Advisory text ───────────────────────────────────────────────────────────

function AdvisorySection({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="rounded-lg bg-[var(--accent-subtle)] border border-[var(--accent-muted)] p-3">
      <ExpandableText
        text={text}
        lines={3}
        className="text-sm text-foreground/80 leading-relaxed text-pretty"
      />
    </div>
  );
}

function ExpandableText({
  text,
  lines = 2,
  className,
}: {
  text: string;
  lines?: number;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = text.length > 150;
  const clampedStyle: CSSProperties | undefined =
    canExpand && !expanded
      ? {
          display: "-webkit-box",
          WebkitLineClamp: lines,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }
      : undefined;

  return (
    <div>
      <p className={className} style={clampedStyle}>
        {text}
      </p>
      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs font-medium text-primary hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

// ── Risk flags ──────────────────────────────────────────────────────────────

function RisksSection({ flags }: { flags: CoachContent["riskFlags"] }) {
  if (flags.length === 0) return null;
  return (
    <CollapsibleSection title="Attention needed" defaultOpen={true}>
      <div className="space-y-2">
        {flags.map((flag) => (
          <AlertCard key={flag.id} severity={flag.severity} text={flag.label} />
        ))}
      </div>
    </CollapsibleSection>
  );
}

// ── Insights ────────────────────────────────────────────────────────────────

const SEVERITY_ICON: Record<
  string,
  { icon: React.ElementType; color: string }
> = {
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
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {insight.value}
          </span>
        </div>
        {insight.detail && (
          <ExpandableText
            text={insight.detail}
            lines={2}
            className="mt-0.5 text-xs text-muted-foreground/70 leading-snug text-pretty"
          />
        )}
      </div>
    </div>
  );
}

function InsightsSection({ insights }: { insights: CoachInsight[] }) {
  if (insights.length === 0) return null;
  return (
    <CollapsibleSection title="Details" defaultOpen={false}>
      <div className="divide-y divide-border/50">
        {insights.map((ins) => (
          <InsightRow key={ins.id} insight={ins} />
        ))}
      </div>
    </CollapsibleSection>
  );
}

// ── Prompts ─────────────────────────────────────────────────────────────────

const IMPORTANCE_COLORS: Record<string, string> = {
  critical: "border-l-2 border-l-red-500 border border-border bg-card",
  helpful: "border-l-2 border-l-amber-500 border border-border bg-card",
  nice_to_have: "border-l-2 border-l-border border border-border bg-card",
};

const IMPORTANCE_PILLS: Record<string, string> = {
  critical: "bg-red-500/10 text-red-500",
  helpful: "bg-amber-500/10 text-amber-500",
  nice_to_have: "bg-muted text-muted-foreground",
};

const IMPORTANCE_LABELS: Record<string, string> = {
  critical: "Critical",
  helpful: "Helpful",
  nice_to_have: "Optional",
};

function PromptsSection({ prompts }: { prompts: CoachPrompt[] }) {
  if (prompts.length === 0) return null;
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase">
        What&apos;s Missing
      </h4>
      {prompts.map((p) => (
        <div
          key={p.id}
          className={cn("rounded-lg p-3", IMPORTANCE_COLORS[p.importance])}
        >
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
              IMPORTANCE_PILLS[p.importance],
            )}
          >
            {IMPORTANCE_LABELS[p.importance]}
          </span>
          <div className="mt-1.5">
            <ExpandableText
              text={p.question}
              lines={2}
              className="text-sm text-foreground/80 leading-relaxed text-pretty"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

interface QuickAction {
  id: string;
  label: string;
  type: "goto" | "apply-prompts" | "review-all";
  phase?: CreatePhase;
}

function hasSectionGenerationIssues(state: CreateFlowState): boolean {
  return (
    state.sections.length === 0 ||
    state.sections.some(
      (s) => s.generationStatus === "failed" || s.generationStatus === "pending" || s.generationStatus === "generating",
    )
  );
}

function buildQuickActions(
  state: CreateFlowState,
  content: CoachContent,
): QuickAction[] {
  const actions: QuickAction[] = [];

  if (state.phase === "intake" && (content.prompts?.length ?? 0) > 0) {
    actions.push({
      id: "apply-prompts",
      label: "Add missing questions to Buyer Goal",
      type: "apply-prompts",
    });
  }

  if (state.phase === "draft") {
    const unreviewed = state.sections.filter(
      (s) => s.generationStatus === "complete" && !s.reviewed,
    ).length;
    if (unreviewed > 0) {
      actions.push({
        id: "review-all",
        label: `Mark ${unreviewed} section(s) as reviewed`,
        type: "review-all",
      });
    }
  }

  if (state.phase === "finalize") {
    const unresolved = state.blockers.filter((b) => !b.resolved);
    const phases = new Set(unresolved.map((b) => b.phase));

    if (phases.has("intake")) {
      actions.push({
        id: "goto-intake",
        label: "Go to Intake and fix missing details",
        type: "goto",
        phase: "intake",
      });
    }
    if (phases.has("strategy")) {
      actions.push({
        id: "goto-strategy",
        label: "Go to Strategy and confirm your plan",
        type: "goto",
        phase: "strategy",
      });
    }
    if (phases.has("draft") || hasSectionGenerationIssues(state)) {
      actions.push({
        id: "goto-draft",
        label: "Go to Draft and resolve section issues",
        type: "goto",
        phase: "draft",
      });
    }
  }

  return actions;
}

function QuickActions({
  actions,
  onAction,
}: {
  actions: QuickAction[];
  onAction: (action: QuickAction) => void;
}) {
  if (actions.length === 0) return null;
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase">
        Quick Actions
      </h4>
      <div className="space-y-2">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => onAction(action)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Bid Analysis ────────────────────────────────────────────────────────────

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
          <h4 className="text-xs font-semibold text-muted-foreground uppercase">
            Gaps to Address
          </h4>
          {content.gaps.map((g) => (
            <GapCard
              key={g.id}
              factor={g.factor}
              rationale={g.rationale}
              score={g.score}
            />
          ))}
        </div>
      )}
      {content.strengths && content.strengths.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase">
            Your Strengths
          </h4>
          {content.strengths.map((s) => (
            <StrengthCard
              key={s.id}
              factor={s.factor}
              rationale={s.rationale}
            />
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

// ── Main Component ──────────────────────────────────────────────────────────

export function DecisionCoach() {
  const { state, dispatch } = useCreateFlow();
  const content = useMemo(() => getCoachContent(state), [state]);
  const quickActions = useMemo(() => buildQuickActions(state, content), [state, content]);
  const isFinalize = state.phase === "finalize";
  const handleAction = useCallback(
    (action: QuickAction) => {
      if (action.type === "goto" && action.phase) {
        dispatch({ type: "SET_PHASE", phase: action.phase });
        return;
      }

      if (action.type === "review-all") {
        dispatch({ type: "REVIEW_ALL_SECTIONS" });
        return;
      }

      if (action.type === "apply-prompts") {
        const promptText = (content.prompts ?? [])
          .map((prompt) => `- ${prompt.question}`)
          .join("\n");
        if (!promptText) return;

        const nextGoal = state.buyerGoal.trim()
          ? `${state.buyerGoal.trim()}\n${promptText}`
          : promptText;

        dispatch({ type: "SET_BUYER_GOAL", goal: nextGoal });
        if (state.phase !== "intake") {
          dispatch({ type: "SET_PHASE", phase: "intake" });
        }
      }
    },
    [content.prompts, dispatch, state.buyerGoal, state.phase],
  );

  return (
    <div className="space-y-4 animate-fade-in-up">
      <CoachHeader isFinalize={isFinalize} />
      {content.nextStep && <NextStepCard text={content.nextStep} />}
      <QuickActions actions={quickActions} onAction={handleAction} />
      <AdvisorySection text={content.whyItMatters} />
      {content.verdict && (
        <BidAnalysis
          content={content}
          intelligence={state.bidEvaluation?.intelligence}
        />
      )}
      {content.riskFlags.length > 0 && (
        <RisksSection flags={content.riskFlags} />
      )}
      {content.prompts && content.prompts.length > 0 && (
        <PromptsSection prompts={content.prompts} />
      )}
      {content.insights && content.insights.length > 0 && (
        <InsightsSection insights={content.insights} />
      )}
      {isFinalize &&
        content.readinessItems &&
        content.readinessItems.length > 0 && (
          <ReadinessChecklist items={content.readinessItems} />
        )}
    </div>
  );
}
