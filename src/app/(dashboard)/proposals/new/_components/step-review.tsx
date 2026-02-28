"use client";

/**
 * StepReview -- Step 2 of the proposal wizard.
 *
 * Slim review focused on what matters:
 * 1. Summary card (what was detected)
 * 2. Client research (if available)
 * 3. Gaps as a task checklist (critical/helpful missing info)
 * 4. AI-inferred fields that need verification
 * 5. Collapsed "All extracted fields" section for optional deep review
 *
 * Bid evaluation has been moved to Step 3 (StepBidDecision).
 */

import { useState, createRef, useMemo } from "react";
import {
  Lightbulb,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  CheckCircle2,
  Circle,
  Building2,
  Eye,
} from "lucide-react";
import type { ExtractedField } from "@/types/intake";
import { useWizard } from "./wizard-provider";

// ────────────────────────────────────────────────────────
// Field Group Definitions
// ────────────────────────────────────────────────────────

interface FieldDef {
  key: string;
  label: string;
  extractedKey: string;
  inferredKey?: string;
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
// Sub-components
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
      <HelpCircle className="h-3 w-3" onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)} />
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
// Editable Field Row (reused in both inferred section and full view)
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

function EditableFieldRow({ fieldDef, value, extractedField, inferredReasoning, isGap, onChange, fieldRef }: EditableFieldRowProps) {
  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/20 transition-all";

  if (fieldDef.isArray) {
    const items = Array.isArray(value) ? value : [];
    return (
      <div ref={fieldRef} className={`p-3 rounded-lg ${isGap ? "bg-[var(--warning-subtle)] border border-[var(--warning-muted)]" : ""}`}>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-[var(--foreground)]">{fieldDef.label}</label>
          <div className="flex items-center gap-2">
            {extractedField && <ConfidenceBadge confidence={extractedField.confidence} />}
            {inferredReasoning && <InferredBadge reasoning={inferredReasoning} />}
            {isGap && <span className="text-xs text-[var(--warning)] font-medium">Gap</span>}
          </div>
        </div>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input type="text" value={item} onChange={(e) => { const u = [...items]; u[idx] = e.target.value; onChange(fieldDef.key, u); }} className={inputClass} placeholder={`${fieldDef.label} ${idx + 1}`} />
              {items.length > 1 && (
                <button onClick={() => onChange(fieldDef.key, items.filter((_, i) => i !== idx))} className="p-1 rounded hover:bg-[var(--background-subtle)] text-[var(--foreground-muted)]" aria-label={`Remove ${fieldDef.label} ${idx + 1}`}>
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
          <button onClick={() => onChange(fieldDef.key, [...items, ""])} className="flex items-center gap-1 text-xs text-[var(--accent)] hover:underline mt-1">
            <Plus className="h-3 w-3" />
            Add {fieldDef.label.toLowerCase().replace(/s$/, "")}
          </button>
        </div>
      </div>
    );
  }

  const strValue = typeof value === "string" ? value : "";
  return (
    <div ref={fieldRef} className={`p-3 rounded-lg ${isGap ? "bg-[var(--warning-subtle)] border border-[var(--warning-muted)]" : ""}`}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-[var(--foreground)]">{fieldDef.label}</label>
        <div className="flex items-center gap-2">
          {extractedField && <ConfidenceBadge confidence={extractedField.confidence} />}
          {inferredReasoning && <InferredBadge reasoning={inferredReasoning} />}
          {isGap && <span className="text-xs text-[var(--warning)] font-medium">Gap</span>}
        </div>
      </div>
      {fieldDef.key === "scope_description" ? (
        <textarea value={strValue} onChange={(e) => onChange(fieldDef.key, e.target.value)} rows={3} className={`${inputClass} resize-none`} placeholder={`Enter ${fieldDef.label.toLowerCase()}`} />
      ) : (
        <input type="text" value={strValue} onChange={(e) => onChange(fieldDef.key, e.target.value)} className={inputClass} placeholder={`Enter ${fieldDef.label.toLowerCase()}`} />
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
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-4 bg-[var(--background-tertiary)] hover:bg-[var(--background-secondary)] transition-colors">
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-[var(--info)]" />
          <span className="font-semibold text-sm text-[var(--foreground)]">Client Research</span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-[var(--foreground-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--foreground-muted)]" />}
      </button>
      {expanded && (
        <div className="p-4 space-y-3">
          <p className="text-sm text-[var(--foreground)]">{research.company_overview}</p>
          {research.strategic_priorities.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-[var(--foreground-muted)] uppercase mb-1">Strategic Priorities</h4>
              <ul className="space-y-1">{research.strategic_priorities.map((p, i) => <li key={i} className="text-sm text-[var(--foreground)]">{"\u2022"} {p}</li>)}</ul>
            </div>
          )}
          {research.recommended_angles.length > 0 && (
            <div className="p-3 rounded-lg bg-[var(--info-subtle)] border border-[var(--info-muted)]">
              <h4 className="text-xs font-semibold text-[var(--info)] mb-1">Recommended Angles</h4>
              <ul className="space-y-1">{research.recommended_angles.map((a, i) => <li key={i} className="text-sm text-[var(--foreground)]">{"\u2192"} {a}</li>)}</ul>
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
  const [dismissedGaps, setDismissedGaps] = useState<Set<string>>(new Set());
  const [showAllFields, setShowAllFields] = useState(false);

  // Field refs for gap click scrolling
  const fieldRefs = useMemo(() => {
    const refs: Record<string, React.RefObject<HTMLDivElement | null>> = {};
    for (const group of FIELD_GROUPS) {
      for (const field of group.fields) {
        refs[field.key] = createRef<HTMLDivElement>();
      }
    }
    return refs;
  }, []);

  // No extracted data
  if (!state.extractedData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="h-12 w-12 text-[var(--warning)] mb-4" />
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">No Extracted Data</h2>
        <p className="text-sm text-[var(--foreground-muted)] max-w-md">
          There&apos;s no extracted data to review. Go back to Step 1 to upload or paste content, or use manual entry.
        </p>
      </div>
    );
  }

  const extracted = state.extractedData;
  const editedFields = state.editedFields;

  // Field value helpers
  const getFieldValue = (fieldDef: FieldDef): string | string[] => {
    if (editedFields[fieldDef.key] !== undefined) return editedFields[fieldDef.key];
    const ext = extracted.extracted as Record<string, ExtractedField<string | string[]> | undefined>;
    if (ext[fieldDef.extractedKey]?.value !== undefined) return ext[fieldDef.extractedKey]!.value;
    if (fieldDef.inferredKey && extracted.inferred) {
      const inf = extracted.inferred as Record<string, { value: string; reasoning: string } | undefined>;
      if (inf[fieldDef.inferredKey]?.value !== undefined) return inf[fieldDef.inferredKey]!.value;
    }
    return fieldDef.isArray ? [] : "";
  };

  const getExtractedField = (fieldDef: FieldDef): ExtractedField<string | string[]> | undefined => {
    const ext = extracted.extracted as Record<string, ExtractedField<string | string[]> | undefined>;
    return ext[fieldDef.extractedKey];
  };

  const getInferredReasoning = (fieldDef: FieldDef): string | null => {
    if (!fieldDef.inferredKey || !extracted.inferred) return null;
    const inf = extracted.inferred as Record<string, { value: string; reasoning: string } | undefined>;
    return inf[fieldDef.inferredKey]?.reasoning ?? null;
  };

  const isFieldGap = (fieldDef: FieldDef): boolean => {
    if (!extracted.gaps) return false;
    return extracted.gaps.some(
      (g) => g.field === fieldDef.key || g.field === fieldDef.extractedKey || g.field === fieldDef.label,
    );
  };

  const handleFieldChange = (key: string, value: string | string[]) => {
    dispatch({ type: "UPDATE_EDITED_FIELDS", payload: { [key]: value } });
  };

  // Collect AI-inferred fields (fields with inferredKey that have a value)
  const inferredFields: FieldDef[] = [];
  for (const group of FIELD_GROUPS) {
    for (const field of group.fields) {
      if (getInferredReasoning(field)) {
        inferredFields.push(field);
      }
    }
  }

  // Gaps
  const allGaps = extracted.gaps || [];
  const relevantGaps = allGaps.filter((g) => g.importance === "critical" || g.importance === "helpful");
  const activeGaps = relevantGaps.filter((g) => !dismissedGaps.has(g.field));
  const resolvedCount = dismissedGaps.size;

  // Build a quick summary line
  const clientName = (getFieldValue(FIELD_GROUPS[0].fields[0]) as string) || "Unknown Client";
  const solType = (getFieldValue(FIELD_GROUPS[1].fields[2]) as string) || "Document";
  const reqCount = (getFieldValue(FIELD_GROUPS[2].fields[0]) as string[])?.length || 0;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="p-5 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent-muted)]">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-[var(--accent)] mt-0.5 flex-shrink-0" />
          <div className="flex-1">
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
            {/* Quick stats */}
            <div className="flex flex-wrap gap-3 mt-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--background)] text-xs font-medium text-[var(--foreground)]">
                {clientName}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--background)] text-xs font-medium text-[var(--foreground-muted)]">
                {solType}
              </span>
              {reqCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--background)] text-xs font-medium text-[var(--foreground-muted)]">
                  {reqCount} requirement{reqCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Research panel */}
      {state.researchData && <ResearchPanel research={state.researchData} />}

      {/* Gaps as Task Checklist */}
      {relevantGaps.length > 0 && (
        <div className="rounded-xl border border-[var(--warning-muted)] bg-[var(--warning-subtle)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[var(--warning)]" />
              <span className="text-sm font-semibold text-[var(--foreground)]">
                Missing Information
              </span>
            </div>
            <span className="text-xs text-[var(--foreground-muted)]">
              {resolvedCount}/{relevantGaps.length} resolved
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full bg-[var(--border)] mb-4">
            <div
              className="h-1.5 rounded-full bg-[var(--success)] transition-all"
              style={{ width: `${relevantGaps.length > 0 ? (resolvedCount / relevantGaps.length) * 100 : 0}%` }}
            />
          </div>
          <ul className="space-y-2">
            {relevantGaps.map((gap, idx) => {
              const isDismissed = dismissedGaps.has(gap.field);
              return (
                <li key={idx}>
                  <button
                    onClick={() => {
                      if (isDismissed) {
                        setDismissedGaps((prev) => { const next = new Set(prev); next.delete(gap.field); return next; });
                      } else {
                        setDismissedGaps((prev) => new Set(prev).add(gap.field));
                      }
                    }}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                      isDismissed ? "opacity-50" : "hover:bg-[var(--background)]/50"
                    }`}
                  >
                    {isDismissed ? (
                      <CheckCircle2 className="h-4 w-4 text-[var(--success)] mt-0.5 flex-shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-[var(--foreground-muted)] mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          gap.importance === "critical"
                            ? "bg-[var(--danger)] text-white"
                            : "bg-[var(--warning)] text-black"
                        }`}>
                          {gap.importance}
                        </span>
                        <span className={`text-sm font-medium ${isDismissed ? "line-through text-[var(--foreground-muted)]" : "text-[var(--foreground)]"}`}>
                          {gap.field.replace(/_/g, " ")}
                        </span>
                      </div>
                      {gap.suggested_question && !isDismissed && (
                        <p className="mt-1 text-xs text-[var(--foreground-muted)] italic">
                          Ask: &quot;{gap.suggested_question}&quot;
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* AI-Inferred Fields (need verification) */}
      {inferredFields.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
            <HelpCircle className="h-3.5 w-3.5 text-[var(--info)]" />
            AI-Inferred Fields — Please Verify
          </h3>
          <div className="space-y-2">
            {inferredFields.map((fieldDef) => (
              <EditableFieldRow
                key={fieldDef.key}
                fieldDef={fieldDef}
                value={getFieldValue(fieldDef)}
                extractedField={getExtractedField(fieldDef)}
                inferredReasoning={getInferredReasoning(fieldDef)}
                isGap={isFieldGap(fieldDef)}
                onChange={handleFieldChange}
                fieldRef={fieldRefs[fieldDef.key]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Collapsible full field view */}
      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        <button
          onClick={() => setShowAllFields(!showAllFields)}
          className="w-full flex items-center justify-between p-4 bg-[var(--background-tertiary)] hover:bg-[var(--background-secondary)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Eye className="h-4 w-4 text-[var(--foreground-muted)]" />
            <span className="text-sm font-medium text-[var(--foreground)]">
              View All Extracted Fields
            </span>
          </div>
          {showAllFields ? <ChevronUp className="h-4 w-4 text-[var(--foreground-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--foreground-muted)]" />}
        </button>
        {showAllFields && (
          <div className="p-4 space-y-6">
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
                      fieldRef={fieldRefs[fieldDef.key]}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
