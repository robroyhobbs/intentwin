"use client";

/**
 * StepReview — Step 2 of the proposal wizard.
 *
 * Displays extracted data grouped into 4 categories with inline editing,
 * confidence badges, inferred field indicators, and a gaps panel.
 * Bid evaluation is embedded as a collapsible sub-section.
 *
 * On "Continue to Configure", dispatches POPULATE_FROM_EXTRACTION to copy
 * edited fields into the wizard form state used by Step 3.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Lightbulb,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Target,
  Loader2,
  Building2,
} from "lucide-react";
import type { ExtractedField } from "@/types/intake";
import type { BidEvaluation, FactorKey } from "@/lib/ai/bid-scoring";
import { SCORING_FACTORS } from "@/lib/ai/bid-scoring";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { useWizard } from "./wizard-provider";

// ────────────────────────────────────────────────────────
// Field Group Definitions
// ────────────────────────────────────────────────────────

interface FieldDef {
  key: string;
  label: string;
  extractedKey: string; // key in extractedData.extracted
  inferredKey?: string; // key in extractedData.inferred
  isArray?: boolean;
}

const FIELD_GROUPS: { title: string; fields: FieldDef[] }[] = [
  {
    title: "Client Information",
    fields: [
      { key: "client_name", label: "Client Name", extractedKey: "client_name" },
      { key: "client_industry", label: "Industry", extractedKey: "client_industry", inferredKey: "industry" },
      { key: "client_size", label: "Company Size", extractedKey: "client_size", inferredKey: "client_size" },
    ],
  },
  {
    title: "Project Details",
    fields: [
      { key: "scope_description", label: "Scope Description", extractedKey: "scope_description" },
      { key: "opportunity_type", label: "Opportunity Type", extractedKey: "opportunity_type", inferredKey: "opportunity_type" },
      { key: "solicitation_type", label: "Solicitation Type", extractedKey: "solicitation_type", inferredKey: "solicitation_type" },
      { key: "budget_range", label: "Budget Range", extractedKey: "budget_range" },
      { key: "timeline", label: "Timeline", extractedKey: "timeline" },
    ],
  },
  {
    title: "Requirements",
    fields: [
      { key: "key_requirements", label: "Key Requirements", extractedKey: "key_requirements", isArray: true },
      { key: "decision_criteria", label: "Decision Criteria", extractedKey: "decision_criteria", isArray: true },
      { key: "compliance_requirements", label: "Compliance Requirements", extractedKey: "compliance_requirements", isArray: true },
    ],
  },
  {
    title: "Technical Context",
    fields: [
      { key: "technical_environment", label: "Technical Environment", extractedKey: "technical_environment" },
      { key: "current_state_pains", label: "Current Challenges", extractedKey: "current_state_pains", isArray: true },
      { key: "desired_outcomes", label: "Desired Outcomes", extractedKey: "desired_outcomes", isArray: true },
    ],
  },
];

// ────────────────────────────────────────────────────────
// Confidence Badge
// ────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }: { confidence: number }) {
  if (confidence >= 0.8) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[var(--success)] font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
        High
      </span>
    );
  }
  if (confidence >= 0.5) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[var(--warning)] font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--warning)]" />
        Medium
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-[var(--danger)] font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--danger)]" />
      Low
    </span>
  );
}

function InferredBadge({ reasoning }: { reasoning: string }) {
  const [showTip, setShowTip] = useState(false);

  return (
    <span className="relative inline-flex items-center gap-1 text-xs text-[var(--info)] font-medium cursor-help">
      <HelpCircle
        className="h-3 w-3"
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
      />
      AI inferred
      {showTip && (
        <span className="absolute bottom-full left-0 mb-1 z-10 w-56 rounded-lg bg-[var(--foreground)] text-[var(--background)] text-xs p-2 shadow-lg">
          {reasoning}
        </span>
      )}
    </span>
  );
}

// ────────────────────────────────────────────────────────
// Editable Field Row
// ────────────────────────────────────────────────────────

interface EditableFieldRowProps {
  fieldDef: FieldDef;
  value: string | string[];
  extractedField: ExtractedField<string | string[]> | undefined;
  inferredReasoning: string | null;
  isGap: boolean;
  onChange: (key: string, value: string | string[]) => void;
  fieldRef?: React.RefObject<HTMLDivElement | null>;
}

function EditableFieldRow({
  fieldDef,
  value,
  extractedField,
  inferredReasoning,
  isGap,
  onChange,
  fieldRef,
}: EditableFieldRowProps) {
  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/20 transition-all";

  if (fieldDef.isArray) {
    const items = Array.isArray(value) ? value : [];
    return (
      <div ref={fieldRef} className={`p-3 rounded-lg ${isGap ? "bg-[var(--warning-subtle)] border border-[var(--warning-muted)]" : ""}`}>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-[var(--foreground)]">
            {fieldDef.label}
          </label>
          <div className="flex items-center gap-2">
            {extractedField && <ConfidenceBadge confidence={extractedField.confidence} />}
            {inferredReasoning && <InferredBadge reasoning={inferredReasoning} />}
            {isGap && <span className="text-xs text-[var(--warning)] font-medium">Gap</span>}
          </div>
        </div>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const updated = [...items];
                  updated[idx] = e.target.value;
                  onChange(fieldDef.key, updated);
                }}
                className={inputClass}
                placeholder={`${fieldDef.label} ${idx + 1}`}
              />
              {items.length > 1 && (
                <button
                  onClick={() => {
                    const updated = items.filter((_, i) => i !== idx);
                    onChange(fieldDef.key, updated);
                  }}
                  className="p-1 rounded hover:bg-[var(--background-subtle)] text-[var(--foreground-muted)]"
                  aria-label={`Remove ${fieldDef.label} ${idx + 1}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => onChange(fieldDef.key, [...items, ""])}
            className="flex items-center gap-1 text-xs text-[var(--accent)] hover:underline mt-1"
          >
            <Plus className="h-3 w-3" />
            Add {fieldDef.label.toLowerCase().replace(/s$/, "")}
          </button>
        </div>
      </div>
    );
  }

  // Scalar field
  const strValue = typeof value === "string" ? value : "";
  return (
    <div ref={fieldRef} className={`p-3 rounded-lg ${isGap ? "bg-[var(--warning-subtle)] border border-[var(--warning-muted)]" : ""}`}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-[var(--foreground)]">
          {fieldDef.label}
        </label>
        <div className="flex items-center gap-2">
          {extractedField && <ConfidenceBadge confidence={extractedField.confidence} />}
          {inferredReasoning && <InferredBadge reasoning={inferredReasoning} />}
          {isGap && <span className="text-xs text-[var(--warning)] font-medium">Gap</span>}
        </div>
      </div>
      {fieldDef.key === "scope_description" ? (
        <textarea
          value={strValue}
          onChange={(e) => onChange(fieldDef.key, e.target.value)}
          rows={3}
          className={`${inputClass} resize-none`}
          placeholder={`Enter ${fieldDef.label.toLowerCase()}`}
        />
      ) : (
        <input
          type="text"
          value={strValue}
          onChange={(e) => onChange(fieldDef.key, e.target.value)}
          className={inputClass}
          placeholder={`Enter ${fieldDef.label.toLowerCase()}`}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────
// Gaps Panel
// ────────────────────────────────────────────────────────

interface GapsPanelProps {
  gaps: { field: string; importance: "critical" | "helpful" | "nice_to_have"; suggested_question?: string }[];
  onGapClick: (field: string) => void;
}

function GapsPanel({ gaps, onGapClick }: GapsPanelProps) {
  const criticalGaps = gaps.filter((g) => g.importance === "critical");
  const helpfulGaps = gaps.filter((g) => g.importance === "helpful");
  const relevantGaps = [...criticalGaps, ...helpfulGaps];

  if (relevantGaps.length === 0) return null;

  return (
    <div className="rounded-xl border border-[var(--warning-muted)] bg-[var(--warning-subtle)] p-4 max-h-[500px] overflow-y-auto">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-[var(--warning)]" />
        <span className="text-sm font-semibold text-[var(--foreground)]">
          Missing Information ({relevantGaps.length})
        </span>
      </div>
      <ul className="space-y-3">
        {relevantGaps.map((gap, idx) => (
          <li key={idx}>
            <button
              onClick={() => onGapClick(gap.field)}
              className="w-full text-left p-2 rounded-lg hover:bg-[var(--background)]/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    gap.importance === "critical"
                      ? "bg-[var(--danger)] text-white"
                      : "bg-[var(--warning)] text-black"
                  }`}
                >
                  {gap.importance}
                </span>
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {gap.field.replace(/_/g, " ")}
                </span>
              </div>
              {gap.suggested_question && (
                <p className="mt-1 text-xs text-[var(--foreground-muted)] italic ml-[calc(1.5rem+0.5rem)]">
                  Ask: &quot;{gap.suggested_question}&quot;
                </p>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ────────────────────────────────────────────────────────
// Bid Evaluation Collapsible Section
// ────────────────────────────────────────────────────────

interface BidEvalSectionProps {
  evaluation: BidEvaluation | null;
  isScoring: boolean;
  scoringError: string | null;
  overrides: Partial<Record<FactorKey, number>>;
  onOverrideChange: (key: FactorKey, value: number | undefined) => void;
  onRetryScoring: () => void;
  onDecision: (decision: "proceed" | "skip") => void;
}

function BidEvalSection({
  evaluation,
  isScoring,
  scoringError,
  overrides,
  onOverrideChange,
  onRetryScoring,
  onDecision,
}: BidEvalSectionProps) {
  const [expanded, setExpanded] = useState(false);

  // Compute current total factoring in overrides
  const computeTotal = useCallback((): number => {
    if (!evaluation) return 0;
    let total = 0;
    for (const factor of SCORING_FACTORS) {
      const score = overrides[factor.key] ?? evaluation.ai_scores[factor.key]?.score ?? 50;
      total += score * (factor.weight / 100);
    }
    return Math.round(total * 100) / 100;
  }, [evaluation, overrides]);

  const currentTotal = computeTotal();
  const recommendation: "bid" | "evaluate" | "pass" =
    currentTotal > 70 ? "bid" : currentTotal >= 40 ? "evaluate" : "pass";

  const recColors = {
    bid: { text: "text-[var(--success)]", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800" },
    evaluate: { text: "text-[var(--warning)]", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800" },
    pass: { text: "text-[var(--danger)]", bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800" },
  };
  const recLabels = { bid: "Recommended to Bid", evaluate: "Evaluate Further", pass: "Recommended to Pass" };

  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-[var(--background-tertiary)] hover:bg-[var(--background-secondary)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Target className="h-5 w-5 text-[var(--accent)]" />
          <span className="font-semibold text-sm text-[var(--foreground)]">
            Bid / No-Bid Evaluation
          </span>
          {evaluation && !isScoring && (
            <span className={`text-xs font-medium ${recColors[recommendation].text}`}>
              {currentTotal.toFixed(0)}/100 — {recLabels[recommendation]}
            </span>
          )}
          {isScoring && (
            <span className="text-xs text-[var(--foreground-muted)] flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Scoring...
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-[var(--foreground-muted)]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[var(--foreground-muted)]" />
        )}
      </button>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Loading */}
          {isScoring && (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
              <p className="text-sm text-[var(--foreground-muted)]">
                Analyzing opportunity against your capabilities...
              </p>
            </div>
          )}

          {/* Error */}
          {scoringError && !isScoring && (
            <div className="p-4 rounded-lg border border-[var(--danger-muted)] bg-[var(--danger-subtle)] text-center space-y-3">
              <p className="text-sm text-[var(--foreground)]">{scoringError}</p>
              <div className="flex justify-center gap-3">
                <button onClick={onRetryScoring} className="btn-primary text-sm">
                  Retry
                </button>
                <button onClick={() => onDecision("skip")} className="btn-secondary text-sm">
                  Skip
                </button>
              </div>
            </div>
          )}

          {/* Scores */}
          {evaluation && !isScoring && (
            <>
              {/* Recommendation banner */}
              <div className={`rounded-lg border ${recColors[recommendation].border} ${recColors[recommendation].bg} p-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold" style={{ color: `var(--${recommendation === "bid" ? "success" : recommendation === "evaluate" ? "warning" : "danger"})` }}>
                      {currentTotal.toFixed(1)}
                      <span className="text-sm font-normal text-[var(--foreground-muted)]"> / 100</span>
                    </p>
                  </div>
                  <span className={`text-sm font-bold ${recColors[recommendation].text}`}>
                    {recLabels[recommendation]}
                  </span>
                </div>
              </div>

              {/* Factor scores */}
              <div className="space-y-3">
                {SCORING_FACTORS.map((factor) => {
                  const aiScore = evaluation.ai_scores[factor.key]?.score ?? 50;
                  const rationale = evaluation.ai_scores[factor.key]?.rationale ?? "";
                  const overrideValue = overrides[factor.key];
                  const displayScore = overrideValue ?? aiScore;

                  return (
                    <div key={factor.key} className="p-3 rounded-lg border border-[var(--border)]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          {factor.label}
                          <span className="ml-1 text-xs text-[var(--foreground-muted)]">({factor.weight}%)</span>
                        </span>
                        <div className="flex items-center gap-2">
                          {overrideValue !== undefined && (
                            <button
                              onClick={() => onOverrideChange(factor.key, undefined)}
                              className="text-xs text-[var(--accent)] hover:underline"
                            >
                              Reset
                            </button>
                          )}
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={displayScore}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                              onOverrideChange(factor.key, val);
                            }}
                            className="w-14 rounded border border-[var(--border)] bg-[var(--input-bg)] px-2 py-1 text-center text-xs font-bold"
                          />
                        </div>
                      </div>
                      {/* Score bar */}
                      <div className="w-full h-1.5 rounded-full bg-[var(--border)] mb-2">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            width: `${displayScore}%`,
                            backgroundColor:
                              displayScore > 70 ? "var(--success)" : displayScore >= 40 ? "var(--warning)" : "var(--danger)",
                          }}
                        />
                      </div>
                      {rationale && (
                        <p className="text-xs text-[var(--foreground-muted)]">{rationale}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-2">
                <button
                  onClick={() => onDecision("skip")}
                  className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                >
                  Skip Evaluation
                </button>
                <button
                  onClick={() => onDecision("proceed")}
                  className="btn-primary text-sm"
                >
                  Confirm Score
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────
// Research Panel (collapsible)
// ────────────────────────────────────────────────────────

function ResearchPanel({ research }: { research: import("@/types/intake").ClientResearch }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-[var(--background-tertiary)] hover:bg-[var(--background-secondary)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-[var(--info)]" />
          <span className="font-semibold text-sm text-[var(--foreground)]">
            Client Research
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-[var(--foreground-muted)]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[var(--foreground-muted)]" />
        )}
      </button>
      {expanded && (
        <div className="p-4 space-y-3">
          <p className="text-sm text-[var(--foreground)]">{research.company_overview}</p>
          {research.strategic_priorities.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-[var(--foreground-muted)] uppercase mb-1">Strategic Priorities</h4>
              <ul className="space-y-1">
                {research.strategic_priorities.map((p, i) => (
                  <li key={i} className="text-sm text-[var(--foreground)]">• {p}</li>
                ))}
              </ul>
            </div>
          )}
          {research.recommended_angles.length > 0 && (
            <div className="p-3 rounded-lg bg-[var(--info-subtle)] border border-[var(--info-muted)]">
              <h4 className="text-xs font-semibold text-[var(--info)] mb-1">Recommended Angles</h4>
              <ul className="space-y-1">
                {research.recommended_angles.map((a, i) => (
                  <li key={i} className="text-sm text-[var(--foreground)]">→ {a}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────
// Main StepReview Component
// ────────────────────────────────────────────────────────

export function StepReview() {
  const { state, dispatch } = useWizard();
  const authFetch = useAuthFetch();

  // Bid evaluation local state
  const [bidScoring, setBidScoring] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);
  const [bidOverrides, setBidOverrides] = useState<Partial<Record<FactorKey, number>>>({});

  // Field refs for gap click scrolling
  const fieldRefs = useRef<Record<string, React.RefObject<HTMLDivElement | null>>>({});

  // Initialize field refs
  useEffect(() => {
    const refs: Record<string, React.RefObject<HTMLDivElement | null>> = {};
    for (const group of FIELD_GROUPS) {
      for (const field of group.fields) {
        refs[field.key] = { current: null };
      }
    }
    fieldRefs.current = refs;
  }, []);

  // No extracted data — show fallback
  if (!state.extractedData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="h-12 w-12 text-[var(--warning)] mb-4" />
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
          No Extracted Data
        </h2>
        <p className="text-sm text-[var(--foreground-muted)] max-w-md">
          There&apos;s no extracted data to review. Go back to Step 1 to upload
          or paste content, or use manual entry.
        </p>
      </div>
    );
  }

  const extracted = state.extractedData;
  const editedFields = state.editedFields;

  // Get field value: edited > extracted > inferred > empty
  const getFieldValue = (fieldDef: FieldDef): string | string[] => {
    // Check edited fields first
    if (editedFields[fieldDef.key] !== undefined) {
      return editedFields[fieldDef.key];
    }

    // Check extracted
    const ext = extracted.extracted as Record<string, ExtractedField<string | string[]> | undefined>;
    if (ext[fieldDef.extractedKey]?.value !== undefined) {
      return ext[fieldDef.extractedKey]!.value;
    }

    // Check inferred
    if (fieldDef.inferredKey && extracted.inferred) {
      const inf = extracted.inferred as Record<string, { value: string; reasoning: string } | undefined>;
      if (inf[fieldDef.inferredKey]?.value !== undefined) {
        return inf[fieldDef.inferredKey]!.value;
      }
    }

    // Empty default
    return fieldDef.isArray ? [] : "";
  };

  // Get extracted field metadata (for confidence badge)
  const getExtractedField = (fieldDef: FieldDef): ExtractedField<string | string[]> | undefined => {
    const ext = extracted.extracted as Record<string, ExtractedField<string | string[]> | undefined>;
    return ext[fieldDef.extractedKey];
  };

  // Get inferred reasoning (for inferred badge)
  const getInferredReasoning = (fieldDef: FieldDef): string | null => {
    if (!fieldDef.inferredKey || !extracted.inferred) return null;
    const inf = extracted.inferred as Record<string, { value: string; reasoning: string } | undefined>;
    return inf[fieldDef.inferredKey]?.reasoning ?? null;
  };

  // Check if field is a gap
  const isFieldGap = (fieldDef: FieldDef): boolean => {
    if (!extracted.gaps) return false;
    return extracted.gaps.some(
      (g) => g.field === fieldDef.key || g.field === fieldDef.extractedKey || g.field === fieldDef.label,
    );
  };

  // Handle field edit
  const handleFieldChange = (key: string, value: string | string[]) => {
    dispatch({
      type: "UPDATE_EDITED_FIELDS",
      payload: { [key]: value },
    });
  };

  // Handle gap click — scroll to field
  const handleGapClick = (gapField: string) => {
    // Try exact match, then fuzzy match
    const normalizedGap = gapField.replace(/\s+/g, "_").toLowerCase();
    for (const group of FIELD_GROUPS) {
      for (const field of group.fields) {
        const normalizedKey = field.key.toLowerCase();
        const normalizedLabel = field.label.replace(/\s+/g, "_").toLowerCase();
        if (normalizedKey === normalizedGap || normalizedLabel === normalizedGap) {
          const ref = fieldRefs.current[field.key];
          if (ref?.current) {
            ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
            // Flash highlight
            ref.current.classList.add("ring-2", "ring-[var(--warning)]");
            setTimeout(() => {
              ref.current?.classList.remove("ring-2", "ring-[var(--warning)]");
            }, 2000);
            return;
          }
        }
      }
    }
  };

  // Bid evaluation trigger
  const triggerBidScoring = async () => {
    if (!extracted) return;
    setBidScoring(true);
    setBidError(null);

    try {
      const ext = extracted.extracted;
      const rfpRequirements = {
        title: extracted.input_summary,
        agency: ext?.client_name?.value,
        deadline: ext?.timeline?.value,
        budget_range: ext?.budget_range?.value,
        scope: ext?.scope_description?.value,
        requirements: ext?.key_requirements?.value,
        evaluation_criteria: ext?.decision_criteria?.value,
        compliance_requirements: ext?.compliance_requirements?.value,
        technical_environment: ext?.technical_environment?.value,
        source_text: extracted.source_text ? String(extracted.source_text).slice(0, 4000) : undefined,
      };

      const response = await authFetch("/api/intake/bid-evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfp_requirements: rfpRequirements,
          service_line: ext?.opportunity_type?.value || "other",
          industry: ext?.client_industry?.value,
        }),
      });

      if (!response.ok) {
        let serverMessage = `Server returned ${response.status}`;
        try {
          const errorBody = await response.json();
          serverMessage = errorBody.error || errorBody.message || serverMessage;
        } catch {
          serverMessage = `${response.status} ${response.statusText}`;
        }
        throw new Error(serverMessage);
      }

      const data = await response.json();
      dispatch({
        type: "BID_EVALUATION_UPDATE",
        payload: { bidEvaluation: data.evaluation, bidPhase: "review" },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setBidError(message);
    } finally {
      setBidScoring(false);
    }
  };

  // Auto-trigger bid evaluation on mount if we have extracted data and no evaluation yet
  useEffect(() => {
    if (extracted && !state.bidEvaluation && !bidScoring && !bidError) {
      triggerBidScoring();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBidOverrideChange = (key: FactorKey, value: number | undefined) => {
    if (value === undefined) {
      const next = { ...bidOverrides };
      delete next[key];
      setBidOverrides(next);
    } else {
      setBidOverrides((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleBidDecision = (decision: "proceed" | "skip") => {
    if (state.bidEvaluation) {
      let finalEvaluation = { ...state.bidEvaluation };
      finalEvaluation.user_decision = decision;
      finalEvaluation.decided_at = new Date().toISOString();
      if (Object.keys(bidOverrides).length > 0) {
        finalEvaluation = {
          ...finalEvaluation,
          user_scores: bidOverrides,
        };
      }
      dispatch({
        type: "BID_EVALUATION_UPDATE",
        payload: { bidEvaluation: finalEvaluation, bidPhase: "decided" },
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="p-4 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent-muted)]">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-[var(--accent)] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">
              {extracted.input_type === "formal_rfp"
                ? "Formal RFP Detected"
                : extracted.input_type === "email"
                  ? "Email Thread Analyzed"
                  : extracted.input_type === "meeting_notes"
                    ? "Meeting Notes Parsed"
                    : "Content Analyzed"}
            </p>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">
              {extracted.input_summary}
            </p>
          </div>
        </div>
      </div>

      {/* Research panel (if available) */}
      {state.researchData && <ResearchPanel research={state.researchData} />}

      {/* Main content: Fields + Gaps side by side */}
      <div className="grid grid-cols-12 gap-6">
        {/* Field groups */}
        <div className="col-span-8 space-y-6">
          {FIELD_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mb-3">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.fields.map((fieldDef) => (
                  <EditableFieldRow
                    key={fieldDef.key}
                    fieldDef={fieldDef}
                    value={getFieldValue(fieldDef)}
                    extractedField={getExtractedField(fieldDef)}
                    inferredReasoning={getInferredReasoning(fieldDef)}
                    isGap={isFieldGap(fieldDef)}
                    onChange={handleFieldChange}
                    fieldRef={fieldRefs.current[fieldDef.key]}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Gaps panel */}
        <div className="col-span-4">
          <div className="sticky top-4">
            <GapsPanel
              gaps={extracted.gaps || []}
              onGapClick={handleGapClick}
            />
          </div>
        </div>
      </div>

      {/* Bid Evaluation (collapsible) */}
      {extracted && (
        <BidEvalSection
          evaluation={state.bidEvaluation}
          isScoring={bidScoring}
          scoringError={bidError}
          overrides={bidOverrides}
          onOverrideChange={handleBidOverrideChange}
          onRetryScoring={triggerBidScoring}
          onDecision={handleBidDecision}
        />
      )}
    </div>
  );
}
