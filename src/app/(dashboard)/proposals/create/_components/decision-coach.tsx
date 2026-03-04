"use client";

import { useMemo, useCallback } from "react";
import { Sparkles, Clipboard } from "lucide-react";
import { useCreateFlow } from "./create-provider";
import { getCoachContent } from "./coach-content";
import { NextStepCard } from "./shared/next-step-card";
import { ReadinessChecklist } from "./shared/readiness-checklist";
import { ExpandableText } from "./coach-sections/expandable-text";
import { RisksSection } from "./coach-sections/risk-flags";
import { InsightsSection } from "./coach-sections/insights-section";
import { PromptsSection } from "./coach-sections/prompts-section";
import { BidAnalysis } from "./coach-sections/bid-analysis";
import type {
  CoachContent,
  CreateFlowState,
  CreatePhase,
} from "./create-types";

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

// ── Quick Actions ───────────────────────────────────────────────────────────

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
      (s) =>
        s.generationStatus === "failed" ||
        s.generationStatus === "pending" ||
        s.generationStatus === "generating",
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

// ── Main Component ──────────────────────────────────────────────────────────

export function DecisionCoach() {
  const { state, dispatch } = useCreateFlow();
  const content = useMemo(() => getCoachContent(state), [state]);
  const quickActions = useMemo(
    () => buildQuickActions(state, content),
    [state, content],
  );
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
