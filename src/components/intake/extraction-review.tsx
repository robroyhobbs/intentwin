"use client";

import { useState } from "react";
import {
  Check,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Building2,
  ArrowRight,
} from "lucide-react";
import type { ExtractedIntake, ClientResearch, ExtractedField } from "@/types/intake";

interface ExtractionReviewProps {
  extracted: ExtractedIntake;
  research: ClientResearch | null;
  onConfirm: (data: Record<string, unknown>) => void;
  onBack: () => void;
}

function ConfidenceIndicator({ confidence }: { confidence: number }) {
  if (confidence >= 0.8) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[var(--success)]">
        <span className="w-2 h-2 rounded-full bg-[var(--success)]" />
        High
      </span>
    );
  }
  if (confidence >= 0.5) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[var(--warning)]">
        <span className="w-2 h-2 rounded-full bg-[var(--warning)]" />
        Medium
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-[var(--danger)]">
      <span className="w-2 h-2 rounded-full bg-[var(--danger)]" />
      Low
    </span>
  );
}

interface EditableFieldProps {
  label: string;
  field: ExtractedField<string | string[]> | undefined;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  isArray?: boolean;
}

function EditableField({ label, field, value, onChange, isArray }: EditableFieldProps) {
  const [showSource, setShowSource] = useState(false);

  if (!field && !value) return null;

  const confidence = field?.confidence ?? 0.5;
  const source = field?.source;

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        confidence >= 0.8
          ? "border-[var(--success-muted)] bg-[var(--success-subtle)]"
          : confidence >= 0.5
            ? "border-[var(--warning-muted)] bg-[var(--warning-subtle)]"
            : "border-[var(--danger-muted)] bg-[var(--danger-subtle)]"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-[var(--foreground)]">{label}</label>
        {field && <ConfidenceIndicator confidence={confidence} />}
      </div>

      {isArray ? (
        <div className="space-y-2">
          {(value as string[]).map((item, idx) => (
            <input
              key={idx}
              type="text"
              value={item}
              onChange={(e) => {
                const newValue = [...(value as string[])];
                newValue[idx] = e.target.value;
                onChange(newValue);
              }}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-sm"
            />
          ))}
          <button
            onClick={() => onChange([...(value as string[]), ""])}
            className="text-xs text-[var(--accent)] hover:underline"
          >
            + Add another
          </button>
        </div>
      ) : (
        <input
          type="text"
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-sm"
        />
      )}

      {source && (
        <button
          onClick={() => setShowSource(!showSource)}
          className="mt-2 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] flex items-center gap-1"
        >
          {showSource ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          Source
        </button>
      )}
      {showSource && source && (
        <p className="mt-2 text-xs text-[var(--foreground-muted)] italic bg-[var(--background-tertiary)] p-2 rounded">
          &quot;{source}&quot;
        </p>
      )}
    </div>
  );
}

export function ExtractionReview({
  extracted,
  research,
  onConfirm,
  onBack,
}: ExtractionReviewProps) {
  const [showResearch, setShowResearch] = useState(false);

  // Initialize editable state from extracted data
  const [editedData, setEditedData] = useState<Record<string, string | string[]>>(() => {
    const data: Record<string, string | string[]> = {};
    const ext = extracted.extracted || {};

    // Populate from extracted fields (with null checks)
    if (ext.client_name?.value) {
      data.client_name = ext.client_name.value;
    }
    if (ext.client_industry?.value) {
      data.client_industry = ext.client_industry.value;
    }
    if (ext.client_size?.value) {
      data.client_size = ext.client_size.value;
    }
    if (ext.opportunity_type?.value) {
      data.opportunity_type = ext.opportunity_type.value;
    }
    if (ext.scope_description?.value) {
      data.scope_description = ext.scope_description.value;
    }
    if (ext.key_requirements?.value) {
      data.key_requirements = ext.key_requirements.value;
    }
    if (ext.budget_range?.value) {
      data.budget_range = ext.budget_range.value;
    }
    if (ext.timeline?.value) {
      data.timeline_expectation = ext.timeline.value;
    }
    if (ext.current_state_pains?.value) {
      data.current_state_pains = ext.current_state_pains.value;
    }
    if (ext.desired_outcomes?.value) {
      data.desired_outcomes = ext.desired_outcomes.value;
    }
    if (ext.compliance_requirements?.value) {
      data.compliance_requirements = ext.compliance_requirements.value;
    }
    if (ext.technical_environment?.value) {
      data.technical_environment = ext.technical_environment.value;
    }

    // Add inferred fields (with null checks)
    if (extracted.inferred?.industry?.value && !data.client_industry) {
      data.client_industry = extracted.inferred.industry.value;
    }
    if (extracted.inferred?.client_size?.value && !data.client_size) {
      data.client_size = extracted.inferred.client_size.value;
    }
    if (extracted.inferred?.opportunity_type?.value && !data.opportunity_type) {
      data.opportunity_type = extracted.inferred.opportunity_type.value;
    }

    return data;
  });

  const updateField = (key: string, value: string | string[]) => {
    setEditedData((prev) => ({ ...prev, [key]: value }));
  };

  const handleConfirm = () => {
    // Convert to the format expected by the proposal creation flow
    const intakeData = {
      client_name: editedData.client_name || "",
      client_industry: editedData.client_industry || "",
      client_size: editedData.client_size || "",
      opportunity_type: editedData.opportunity_type || "other",
      scope_description: editedData.scope_description || "",
      key_requirements: editedData.key_requirements || [],
      budget_range: editedData.budget_range || "",
      timeline_expectation: editedData.timeline_expectation || "",
      current_state_pains: editedData.current_state_pains || [],
      desired_outcomes: editedData.desired_outcomes || [],
      compliance_requirements: editedData.compliance_requirements || [],
      technical_environment: editedData.technical_environment || "",
    };

    onConfirm(intakeData);
  };

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="p-4 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent-muted)]">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-[var(--accent)] mt-0.5" />
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

      {/* Research Panel */}
      {research && (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          <button
            onClick={() => setShowResearch(!showResearch)}
            className="w-full flex items-center justify-between p-4 bg-[var(--background-tertiary)] hover:bg-[var(--background-secondary)] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-[var(--info)]" />
              <span className="font-medium">Client Research: {editedData.client_name}</span>
            </div>
            {showResearch ? (
              <ChevronUp className="h-5 w-5 text-[var(--foreground-muted)]" />
            ) : (
              <ChevronDown className="h-5 w-5 text-[var(--foreground-muted)]" />
            )}
          </button>

          {showResearch && (
            <div className="p-4 space-y-4 bg-[var(--card-bg)]">
              <div>
                <h4 className="text-sm font-medium text-[var(--foreground-muted)] mb-2">
                  Company Overview
                </h4>
                <p className="text-sm text-[var(--foreground)]">{research.company_overview}</p>
              </div>

              {research.strategic_priorities.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-[var(--foreground-muted)] mb-2">
                    Strategic Priorities
                  </h4>
                  <ul className="space-y-1">
                    {research.strategic_priorities.map((priority, idx) => (
                      <li key={idx} className="text-sm text-[var(--foreground)] flex items-start gap-2">
                        <span className="text-[var(--accent)]">•</span>
                        {priority}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {research.recommended_angles.length > 0 && (
                <div className="p-3 rounded-lg bg-[var(--info-subtle)] border border-[var(--info-muted)]">
                  <h4 className="text-sm font-medium text-[var(--info)] mb-2">
                    Recommended Angles
                  </h4>
                  <ul className="space-y-1">
                    {research.recommended_angles.map((angle, idx) => (
                      <li key={idx} className="text-sm text-[var(--foreground)]">
                        → {angle}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Extracted Fields */}
      <div className="grid grid-cols-2 gap-4">
        <EditableField
          label="Client Name"
          field={extracted.extracted?.client_name}
          value={editedData.client_name || ""}
          onChange={(v) => updateField("client_name", v)}
        />
        <EditableField
          label="Industry"
          field={extracted.extracted?.client_industry}
          value={editedData.client_industry || ""}
          onChange={(v) => updateField("client_industry", v)}
        />
        <EditableField
          label="Company Size"
          field={extracted.extracted?.client_size}
          value={editedData.client_size || ""}
          onChange={(v) => updateField("client_size", v)}
        />
        <EditableField
          label="Opportunity Type"
          field={extracted.extracted?.opportunity_type}
          value={editedData.opportunity_type || ""}
          onChange={(v) => updateField("opportunity_type", v)}
        />
      </div>

      <EditableField
        label="Scope Description"
        field={extracted.extracted?.scope_description}
        value={editedData.scope_description || ""}
        onChange={(v) => updateField("scope_description", v)}
      />

      <div className="grid grid-cols-2 gap-4">
        <EditableField
          label="Budget Range"
          field={extracted.extracted?.budget_range}
          value={editedData.budget_range || ""}
          onChange={(v) => updateField("budget_range", v)}
        />
        <EditableField
          label="Timeline"
          field={extracted.extracted?.timeline}
          value={editedData.timeline_expectation || ""}
          onChange={(v) => updateField("timeline_expectation", v)}
        />
      </div>

      <EditableField
        label="Current Challenges / Pain Points"
        field={extracted.extracted?.current_state_pains}
        value={editedData.current_state_pains || []}
        onChange={(v) => updateField("current_state_pains", v)}
        isArray
      />

      <EditableField
        label="Desired Outcomes"
        field={extracted.extracted?.desired_outcomes}
        value={editedData.desired_outcomes || []}
        onChange={(v) => updateField("desired_outcomes", v)}
        isArray
      />

      <EditableField
        label="Key Requirements"
        field={extracted.extracted?.key_requirements}
        value={editedData.key_requirements || []}
        onChange={(v) => updateField("key_requirements", v)}
        isArray
      />

      {/* Gaps */}
      {extracted.gaps.length > 0 && (
        <div className="p-4 rounded-xl bg-[var(--warning-subtle)] border border-[var(--warning-muted)]">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-[var(--warning)] mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">
                Missing Information
              </p>
              <ul className="mt-2 space-y-2">
                {extracted.gaps.map((gap, idx) => (
                  <li key={idx} className="text-sm">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium mr-2 ${
                        gap.importance === "critical"
                          ? "bg-[var(--danger)] text-white"
                          : gap.importance === "helpful"
                            ? "bg-[var(--warning)] text-black"
                            : "bg-[var(--foreground-muted)] text-white"
                      }`}
                    >
                      {gap.importance}
                    </span>
                    <span className="text-[var(--foreground)]">{gap.field}</span>
                    {gap.suggested_question && (
                      <span className="block mt-1 text-[var(--foreground-muted)] italic">
                        Ask: &quot;{gap.suggested_question}&quot;
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Inferred Fields Notice */}
      {extracted.inferred && Object.keys(extracted.inferred).length > 0 && (
        <div className="p-4 rounded-xl bg-[var(--info-subtle)] border border-[var(--info-muted)]">
          <div className="flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-[var(--info)] mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">Inferred Values</p>
              <p className="text-xs text-[var(--foreground-muted)] mt-1">
                These values were inferred by AI and may need verification.
              </p>
              <ul className="mt-2 space-y-1">
                {extracted.inferred.industry && (
                  <li className="text-sm text-[var(--foreground)]">
                    <strong>Industry:</strong> {extracted.inferred.industry.value}
                    <span className="text-[var(--foreground-muted)]">
                      {" "}— {extracted.inferred.industry.reasoning}
                    </span>
                  </li>
                )}
                {extracted.inferred.client_size && (
                  <li className="text-sm text-[var(--foreground)]">
                    <strong>Size:</strong> {extracted.inferred.client_size.value}
                    <span className="text-[var(--foreground-muted)]">
                      {" "}— {extracted.inferred.client_size.reasoning}
                    </span>
                  </li>
                )}
                {extracted.inferred.opportunity_type && (
                  <li className="text-sm text-[var(--foreground)]">
                    <strong>Type:</strong> {extracted.inferred.opportunity_type.value}
                    <span className="text-[var(--foreground-muted)]">
                      {" "}— {extracted.inferred.opportunity_type.reasoning}
                    </span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t border-[var(--border)]">
        <button onClick={onBack} className="btn-secondary">
          Back
        </button>
        <button onClick={handleConfirm} className="btn-primary">
          <Check className="h-4 w-4" />
          Confirm & Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
