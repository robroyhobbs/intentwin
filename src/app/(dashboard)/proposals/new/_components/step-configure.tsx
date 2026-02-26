"use client";

/**
 * StepConfigure — Step 3 of the proposal wizard.
 *
 * - Template dropdown (auto-detected from solicitation type, fetched from API)
 * - Tone selector (Professional, Conversational, Technical, Executive)
 * - Section checklist (required sections locked, optional toggleable)
 * - Advanced options (competitive intel, compliance, must-include)
 * - Win strategy sub-phase: triggered by "Generate Proposal" button,
 *   generates strategy via API, user reviews before advancing to Step 4
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Settings2,
  Lightbulb,
  Plus,
  X,
} from "lucide-react";
import type { WinStrategyData } from "@/types/outcomes";
import type { RfpSectionRequirement, RfpEvaluationCriterion } from "@/types/intake";
import { OUTCOME_CATEGORIES } from "@/types/outcomes";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { useWizard } from "./wizard-provider";
import { logger } from "@/lib/utils/logger";

// ────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────

interface SectionTemplate {
  type: string;
  title: string;
  order: number;
  required: boolean;
  defaultEnabled: boolean;
  /** RFP-derived requirement level — overrides static required/defaultEnabled */
  rfpRequirementLevel?: "mandatory" | "recommended" | "optional";
  /** Why the RFP requires this section */
  rfpRationale?: string;
  /** Specific RFP requirements this section must address */
  rfpRequirements?: string[];
  /** For custom sections: what the section should contain */
  customDescription?: string;
}

interface TemplateResponse {
  solicitation_type: string;
  label: string;
  sections: SectionTemplate[];
}

const TONE_OPTIONS: { value: WizardTone; label: string; description: string; when: string }[] = [
  {
    value: "professional",
    label: "Professional",
    description: "Formal, business-appropriate tone",
    when: "Best for most government and enterprise RFPs. Use when the evaluator is a procurement officer or contracting official.",
  },
  {
    value: "conversational",
    label: "Conversational",
    description: "Approachable, friendly while professional",
    when: "Best for commercial clients, startups, or small business RFPs where the evaluator is also the decision-maker.",
  },
  {
    value: "technical",
    label: "Technical",
    description: "Detailed, precise, specification-focused",
    when: "Best when evaluators are engineers or architects. Use for IT infrastructure, cybersecurity, or engineering RFPs with a technical review panel.",
  },
  {
    value: "executive",
    label: "Executive",
    description: "High-level, strategic, outcome-focused",
    when: "Best for C-suite or board-level audiences. Use when the proposal will be read by a CIO, CEO, or executive steering committee who cares about ROI and outcomes, not implementation details.",
  },
];

type WizardTone = "professional" | "conversational" | "technical" | "executive";

const SOLICITATION_TYPES = ["RFP", "RFI", "RFQ", "SOW", "Proactive"];

// ────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────

function SectionChecklist({
  sections,
  selectedTypes,
  onToggle,
}: {
  sections: SectionTemplate[];
  selectedTypes: Set<string>;
  onToggle: (type: string) => void;
}) {
  return (
    <div className="space-y-1">
      {sections.map((section) => {
        const isMandatory = section.rfpRequirementLevel === "mandatory" || section.required;
        const isRecommended = section.rfpRequirementLevel === "recommended";
        const hasRfpContext = !!section.rfpRationale;

        return (
          <div key={section.type}>
            <label
              className={`flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                selectedTypes.has(section.type)
                  ? "bg-[var(--accent-subtle)]"
                  : "hover:bg-[var(--background-subtle)]"
              } ${isMandatory ? "cursor-default" : ""}`}
            >
              <input
                type="checkbox"
                checked={selectedTypes.has(section.type)}
                onChange={() => onToggle(section.type)}
                disabled={isMandatory}
                className="w-4 h-4 mt-0.5 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] disabled:opacity-60"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--foreground)]">
                    {section.title}
                  </span>
                  {isMandatory && (
                    <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] uppercase tracking-wide font-semibold">
                      {hasRfpContext ? "RFP Required" : "Required"}
                    </span>
                  )}
                  {isRecommended && (
                    <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 uppercase tracking-wide font-semibold">
                      Recommended
                    </span>
                  )}
                  {!isMandatory && !isRecommended && !section.defaultEnabled && (
                    <span className="shrink-0 text-[10px] text-[var(--foreground-subtle)] uppercase tracking-wide">
                      Optional
                    </span>
                  )}
                </div>
                {hasRfpContext && (
                  <p className="text-xs text-[var(--foreground-muted)] mt-0.5 leading-relaxed">
                    {section.rfpRationale}
                  </p>
                )}
              </div>
            </label>
          </div>
        );
      })}
    </div>
  );
}

function WinStrategyReview({
  strategy,
  onUpdate,
  onRegenerate,
  isRegenerating,
  competitiveIntel,
  onCompetitiveIntelChange,
}: {
  strategy: WinStrategyData;
  onUpdate: (strategy: WinStrategyData) => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
  competitiveIntel: string;
  onCompetitiveIntelChange: (value: string) => void;
}) {
  const [newTheme, setNewTheme] = useState("");

  const addTheme = () => {
    const trimmed = newTheme.trim();
    if (!trimmed || strategy.win_themes.includes(trimmed)) return;
    onUpdate({ ...strategy, win_themes: [...strategy.win_themes, trimmed] });
    setNewTheme("");
  };

  return (
    <div className="space-y-6 mt-6 pt-6 border-t border-[var(--border)]">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--info-subtle)] border border-[var(--info-muted)]">
        <Lightbulb className="h-5 w-5 text-[var(--info)] mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">AI-Generated Win Strategy</p>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">
            Review and edit these themes before generating your proposal. They guide the AI&apos;s
            tone, emphasis, and differentiation across all sections.
          </p>
        </div>
      </div>

      {/* Win Themes */}
      <div>
        <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3">Win Themes</h4>
        <div className="flex flex-wrap gap-2 mb-3">
          {strategy.win_themes.map((theme, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent-muted)] text-sm text-[var(--accent)]"
            >
              {theme}
              <button
                onClick={() => onUpdate({ ...strategy, win_themes: strategy.win_themes.filter((_, i) => i !== idx) })}
                className="hover:text-[var(--danger)]"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTheme}
            onChange={(e) => setNewTheme(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTheme(); } }}
            placeholder="Add a win theme..."
            className="flex-1 px-3 py-2 rounded-lg text-sm border border-[var(--border)] bg-[var(--input-bg)]"
          />
          <button
            onClick={addTheme}
            disabled={!newTheme.trim()}
            className="flex items-center gap-1 px-3 py-2 text-sm text-[var(--accent)] hover:bg-[var(--accent-subtle)] rounded-lg disabled:opacity-30"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
      </div>

      {/* Target Outcomes */}
      {strategy.target_outcomes.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3">Target Outcomes</h4>
          <div className="space-y-2">
            {strategy.target_outcomes.map((outcome) => (
              <div key={outcome.id} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)]">
                <div className="flex-1">
                  <p className="text-sm text-[var(--foreground)]">{outcome.outcome}</p>
                  <span className="text-xs text-[var(--foreground-subtle)]">
                    {OUTCOME_CATEGORIES.find((c) => c.value === outcome.category)?.label || outcome.category}
                  </span>
                </div>
                <select
                  value={outcome.priority}
                  onChange={(e) => {
                    onUpdate({
                      ...strategy,
                      target_outcomes: strategy.target_outcomes.map((o) =>
                        o.id === outcome.id ? { ...o, priority: e.target.value as "high" | "medium" | "low" } : o,
                      ),
                    });
                  }}
                  className="text-xs font-medium rounded px-2 py-1 border border-[var(--border)] bg-[var(--input-bg)]"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Differentiators */}
      {strategy.differentiators.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3">Key Differentiators</h4>
          <div className="grid grid-cols-2 gap-2">
            {strategy.differentiators.map((diff, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--background-tertiary)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                <span className="text-sm text-[var(--foreground-muted)]">{diff}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitive Intel */}
      <div>
        <h4 className="text-sm font-semibold text-[var(--foreground)] mb-2">
          Competitive Intelligence
          <span className="ml-1 text-xs font-normal text-[var(--foreground-muted)]">(optional)</span>
        </h4>
        <textarea
          value={competitiveIntel}
          onChange={(e) => onCompetitiveIntelChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-sm resize-none focus:border-[var(--accent)] focus:outline-none"
          placeholder="Known competitors, incumbent vendors, decision influencers..."
        />
      </div>

      {/* Regenerate */}
      <button
        onClick={onRegenerate}
        disabled={isRegenerating}
        className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors disabled:opacity-50"
      >
        {isRegenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        Regenerate Strategy
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────

export function StepConfigure() {
  const { state, dispatch } = useWizard();
  const authFetch = useAuthFetch();

  // Local state for template fetching
  const [templateData, setTemplateData] = useState<TemplateResponse | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);

  // Win strategy sub-phase
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [strategyError, setStrategyError] = useState<string | null>(null);
  const [showStrategy, setShowStrategy] = useState(!!state.winStrategy);

  // Derive selected sections Set from wizard state (single source of truth)
  const selectedSections = useMemo(
    () => new Set(state.selectedSections),
    [state.selectedSections],
  );

  // Determine solicitation type for template fetch
  const solicitationType = state.solicitationType || "RFP";

  // Track which solicitation type we've already fetched to prevent double-fetch
  const fetchedTypeRef = useRef<string | null>(null);

  // Get RFP analysis from extraction data (if available)
  const rfpAnalysis = state.extractedData?.rfp_analysis ?? null;
  const rfpSections = rfpAnalysis?.sections ?? [];
  const rfpEvalCriteria = rfpAnalysis?.evaluation_criteria ?? [];

  // ── Fetch templates and merge with RFP analysis ──
  const fetchTemplates = useCallback(async (solType: string, resetSections: boolean) => {
    setTemplateLoading(true);
    setTemplateError(null);
    fetchedTypeRef.current = solType;
    try {
      const response = await authFetch(`/api/templates?solicitation_type=${encodeURIComponent(solType)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch templates: ${response.status}`);
      }
      const data: TemplateResponse = await response.json();

      // Merge RFP analysis into template sections
      if (rfpSections.length > 0) {
        // Build a lookup of RFP requirements by section_type
        const rfpByType = new Map<string, RfpSectionRequirement>();
        const customSections: RfpSectionRequirement[] = [];

        for (const rfpSec of rfpSections) {
          if (rfpSec.section_type === "custom") {
            customSections.push(rfpSec);
          } else {
            rfpByType.set(rfpSec.section_type, rfpSec);
          }
        }

        // Enhance existing sections with RFP data
        data.sections = data.sections.map((section) => {
          const rfpReq = rfpByType.get(section.type);
          if (rfpReq) {
            return {
              ...section,
              // RFP mandatory sections override static defaults
              required: rfpReq.requirement_level === "mandatory" || section.required,
              defaultEnabled: rfpReq.requirement_level !== "optional",
              rfpRequirementLevel: rfpReq.requirement_level,
              rfpRationale: rfpReq.rationale,
              rfpRequirements: rfpReq.rfp_requirements,
            };
          }
          return section;
        });

        // Add custom sections from RFP that don't map to standard types
        let nextOrder = Math.max(...data.sections.map(s => s.order)) + 1;
        for (const custom of customSections) {
          data.sections.push({
            type: `custom_${custom.title.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 40)}`,
            title: custom.title,
            order: nextOrder++,
            required: custom.requirement_level === "mandatory",
            defaultEnabled: custom.requirement_level !== "optional",
            rfpRequirementLevel: custom.requirement_level,
            rfpRationale: custom.rationale,
            rfpRequirements: custom.rfp_requirements,
            customDescription: custom.custom_description,
          });
        }

        // Sort by order
        data.sections.sort((a, b) => a.order - b.order);
      }

      setTemplateData(data);

      // Initialize selected sections:
      // - If RFP analysis is present, select all mandatory + recommended sections
      // - Otherwise, use static defaults
      if (resetSections || state.selectedSections.length === 0) {
        let defaultEnabled: string[];
        if (rfpSections.length > 0) {
          // RFP-driven: select mandatory and recommended, skip optional
          defaultEnabled = data.sections
            .filter((s) => s.required || s.rfpRequirementLevel === "mandatory" || s.rfpRequirementLevel === "recommended" || s.defaultEnabled)
            .map((s) => s.type);
        } else {
          // Static defaults
          defaultEnabled = data.sections
            .filter((s) => s.defaultEnabled || s.required)
            .map((s) => s.type);
        }
        dispatch({
          type: "UPDATE_CONFIG",
          payload: { selectedSections: defaultEnabled },
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load templates";
      setTemplateError(message);
      logger.error("Template fetch error", undefined, { message });
    } finally {
      setTemplateLoading(false);
    }
  }, [authFetch, dispatch, state.selectedSections.length, rfpSections]);

  // Fetch on mount only (not on every solicitationType change — that's handled by handleSolicitationTypeChange)
  useEffect(() => {
    if (fetchedTypeRef.current !== solicitationType) {
      fetchTemplates(solicitationType, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Section toggle ──
  const handleSectionToggle = (type: string) => {
    // Don't allow unchecking required or RFP-mandatory sections
    const section = templateData?.sections.find((s) => s.type === type);
    if (section?.required || section?.rfpRequirementLevel === "mandatory") return;

    const next = new Set(selectedSections);
    if (next.has(type)) {
      next.delete(type);
    } else {
      next.add(type);
    }
    dispatch({
      type: "UPDATE_CONFIG",
      payload: { selectedSections: [...next] },
    });
  };

  // ── Tone change ──
  const handleToneChange = (tone: WizardTone) => {
    dispatch({ type: "UPDATE_CONFIG", payload: { tone } });
  };

  // ── Solicitation type change (re-fetches template with section reset) ──
  const handleSolicitationTypeChange = (newType: string) => {
    dispatch({ type: "UPDATE_FORM_FIELDS", payload: { solicitationType: newType } });
    fetchTemplates(newType, true);
  };

  // ── Win strategy generation ──
  const generateWinStrategy = useCallback(async () => {
    setStrategyLoading(true);
    setStrategyError(null);
    try {
      const intakeData = {
        client_name: state.clientName,
        client_industry: state.clientIndustry,
        client_size: state.clientSize,
        solicitation_type: state.solicitationType,
        opportunity_type: state.opportunityType,
        scope_description: state.scopeDescription,
        current_state_pains: state.currentStatePains.filter((p) => p.trim()),
        desired_outcomes: state.desiredOutcomes.filter((o) => o.trim()),
        budget_range: state.budgetRange,
        timeline_expectation: state.timelineExpectation,
        technical_environment: state.technicalEnvironment,
        competitive_intel: state.competitiveIntel,
      };

      const response = await authFetch("/api/proposals/temp/outcomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intake_data: intakeData }),
      });

      if (!response.ok) throw new Error("Failed to generate strategy");

      const data = await response.json();
      const strategy: WinStrategyData = data.win_strategy || {
        win_themes: ["Value-driven transformation", "Proven methodology", "Accelerated delivery"],
        success_metrics: [],
        differentiators: [],
        target_outcomes: [],
        generated_at: new Date().toISOString(),
      };
      dispatch({ type: "SET_WIN_STRATEGY", winStrategy: strategy });
      setShowStrategy(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Strategy generation failed";
      setStrategyError(message);
      // Provide fallback strategy so user can still proceed
      const fallback: WinStrategyData = {
        win_themes: ["Value-driven transformation", "Proven methodology", "Accelerated delivery"],
        success_metrics: [],
        differentiators: [],
        target_outcomes: [],
        generated_at: new Date().toISOString(),
      };
      dispatch({ type: "SET_WIN_STRATEGY", winStrategy: fallback });
      setShowStrategy(true);
    } finally {
      setStrategyLoading(false);
    }
  }, [authFetch, dispatch, state]);

  // ── Advanced options ──
  const handleAdvancedToggle = () => {
    dispatch({ type: "UPDATE_CONFIG", payload: { showAdvanced: !state.showAdvanced } });
  };

  const hasSelectedSections = selectedSections.size > 0;

  return (
    <div className="space-y-6">
      {/* Template Selector */}
      <div>
        <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
          Template
        </label>
        <div className="relative">
          <select
            value={solicitationType}
            onChange={(e) => handleSolicitationTypeChange(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-sm text-[var(--foreground)] appearance-none focus:border-[var(--accent)] focus:outline-none"
          >
            {SOLICITATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type === solicitationType && templateData
                  ? `${templateData.label} (auto-detected)`
                  : type === "RFP" ? "Standard RFP Response"
                  : type === "RFI" ? "Request for Information"
                  : type === "RFQ" ? "Request for Quotation"
                  : type === "SOW" ? "Statement of Work"
                  : "Proactive Proposal"}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground-muted)] pointer-events-none" />
        </div>
      </div>

      {/* Tone Selector */}
      <div>
        <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
          Tone
        </label>
        <div className="grid grid-cols-2 gap-2">
          {TONE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleToneChange(option.value)}
              className={`text-left px-4 py-3 rounded-xl border transition-all ${
                state.tone === option.value
                  ? "border-[var(--accent)] bg-[var(--accent-subtle)]"
                  : "border-[var(--border)] hover:border-[var(--border-focus)]"
              }`}
            >
              <p className={`text-sm font-medium ${state.tone === option.value ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`}>
                {option.label}
              </p>
              <p className="text-xs text-[var(--foreground-muted)] mt-0.5">{option.description}</p>
              {state.tone === option.value && (
                <p className="text-xs text-[var(--accent)] mt-1.5 leading-relaxed">{option.when}</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* RFP Analysis Summary (if available) */}
      {rfpSections.length > 0 && (
        <div className="rounded-xl border border-[var(--accent-muted)] bg-[var(--accent-subtle)] p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-[var(--accent)] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                RFP-Driven Configuration
              </p>
              <p className="text-xs text-[var(--foreground-muted)] mt-1">
                Sections and requirements were auto-configured from your RFP analysis.
                {rfpSections.filter(s => s.requirement_level === "mandatory").length > 0 && (
                  <> <strong>{rfpSections.filter(s => s.requirement_level === "mandatory").length} mandatory</strong> sections identified.</>
                )}
                {rfpEvalCriteria.length > 0 && (
                  <> {rfpEvalCriteria.length} evaluation criteria mapped.</>
                )}
              </p>
              {rfpAnalysis?.page_limit && (
                <p className="text-xs text-[var(--foreground-muted)] mt-1">
                  Page limit: <strong>{rfpAnalysis.page_limit}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Evaluation Criteria (collapsed by default) */}
          {rfpEvalCriteria.length > 0 && (
            <details className="mt-3">
              <summary className="text-xs font-semibold text-[var(--accent)] cursor-pointer hover:underline">
                View Evaluation Criteria ({rfpEvalCriteria.length})
              </summary>
              <div className="mt-2 space-y-1.5">
                {rfpEvalCriteria.map((criterion, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-[var(--foreground-muted)]">
                    <span className="shrink-0 font-semibold text-[var(--foreground)]">
                      {criterion.weight || "N/A"}
                    </span>
                    <span>{criterion.name}: {criterion.description}</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Section Checklist */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-[var(--foreground)]">
            Sections
          </label>
          <span className="text-xs text-[var(--foreground-muted)]">
            {selectedSections.size} selected
            {rfpSections.length > 0 && (
              <> &middot; {templateData?.sections.filter(s => s.rfpRequirementLevel === "mandatory" || s.required).length ?? 0} required by RFP</>
            )}
          </span>
        </div>

        {templateLoading ? (
          <div className="flex items-center justify-center py-8 gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
            <span className="text-sm text-[var(--foreground-muted)]">Loading sections...</span>
          </div>
        ) : templateError ? (
          <div className="p-4 rounded-lg border border-[var(--danger-muted)] bg-[var(--danger-subtle)] text-sm text-[var(--foreground)]">
            {templateError}
            <button onClick={() => fetchTemplates(solicitationType, false)} className="ml-2 text-[var(--accent)] hover:underline">
              Retry
            </button>
          </div>
        ) : templateData ? (
          <div className="rounded-xl border border-[var(--border)] p-2">
            <SectionChecklist
              sections={templateData.sections}
              selectedTypes={selectedSections}
              onToggle={handleSectionToggle}
            />
          </div>
        ) : null}
      </div>

      {/* Advanced Options */}
      <div className="rounded-xl border border-[var(--border)]">
        <button
          onClick={handleAdvancedToggle}
          className="w-full flex items-center justify-between p-4 hover:bg-[var(--background-subtle)] transition-colors rounded-xl"
        >
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-[var(--foreground-muted)]" />
            <span className="text-sm font-medium text-[var(--foreground)]">Advanced Options</span>
          </div>
          {state.showAdvanced ? (
            <ChevronUp className="h-4 w-4 text-[var(--foreground-muted)]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[var(--foreground-muted)]" />
          )}
        </button>

        {state.showAdvanced && (
          <div className="px-4 pb-4 space-y-4">
            {/* Competitive Intel */}
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
                Competitive Intelligence
              </label>
              <textarea
                value={state.competitiveIntel}
                onChange={(e) => dispatch({ type: "UPDATE_FORM_FIELDS", payload: { competitiveIntel: e.target.value } })}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-sm resize-none focus:border-[var(--accent)] focus:outline-none"
                placeholder="Known competitors, incumbent vendors..."
              />
            </div>

            {/* Compliance Requirements */}
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
                Compliance Requirements
              </label>
              <textarea
                value={state.complianceRequirements}
                onChange={(e) => dispatch({ type: "UPDATE_FORM_FIELDS", payload: { complianceRequirements: e.target.value } })}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-sm resize-none focus:border-[var(--accent)] focus:outline-none"
                placeholder="SOC 2, FedRAMP, HIPAA, etc."
              />
            </div>

            {/* Budget & Timeline */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
                  Budget Range
                </label>
                <input
                  type="text"
                  value={state.budgetRange}
                  onChange={(e) => dispatch({ type: "UPDATE_FORM_FIELDS", payload: { budgetRange: e.target.value } })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-sm focus:border-[var(--accent)] focus:outline-none"
                  placeholder="e.g. $500K-$1M"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-1">
                  Timeline
                </label>
                <input
                  type="text"
                  value={state.timelineExpectation}
                  onChange={(e) => dispatch({ type: "UPDATE_FORM_FIELDS", payload: { timelineExpectation: e.target.value } })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-sm focus:border-[var(--accent)] focus:outline-none"
                  placeholder="e.g. 6 months"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Win Strategy: Loading */}
      {strategyLoading && (
        <div className="flex flex-col items-center py-12 gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center shadow-lg animate-pulse">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <p className="text-lg font-bold text-[var(--foreground)]">Generating Win Strategy</p>
          <p className="text-sm text-[var(--foreground-muted)]">Analyzing your context and building win themes...</p>
          <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
        </div>
      )}

      {/* Win Strategy: Error */}
      {strategyError && !strategyLoading && (
        <div className="p-4 rounded-lg border border-[var(--warning-muted)] bg-[var(--warning-subtle)] text-sm">
          <p className="text-[var(--foreground)]">Strategy generation encountered an issue: {strategyError}</p>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">A default strategy has been provided. You can edit it or regenerate.</p>
        </div>
      )}

      {/* Win Strategy: Review */}
      {showStrategy && state.winStrategy && !strategyLoading && (
        <WinStrategyReview
          strategy={state.winStrategy}
          onUpdate={(s) => dispatch({ type: "SET_WIN_STRATEGY", winStrategy: s })}
          onRegenerate={generateWinStrategy}
          isRegenerating={strategyLoading}
          competitiveIntel={state.competitiveIntel}
          onCompetitiveIntelChange={(v) => dispatch({ type: "UPDATE_FORM_FIELDS", payload: { competitiveIntel: v } })}
        />
      )}

      {/* Generate Proposal trigger (only if strategy not yet generated) */}
      {!showStrategy && !strategyLoading && (
        <div className="pt-4">
          <button
            onClick={generateWinStrategy}
            disabled={!hasSelectedSections || strategyLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] px-6 py-4 text-sm font-bold text-white hover:shadow-lg disabled:opacity-50 transition-all"
          >
            <Sparkles className="h-5 w-5" />
            Generate Win Strategy
          </button>
          {!hasSelectedSections && (
            <p className="text-xs text-[var(--danger)] text-center mt-2">
              Select at least one section to continue
            </p>
          )}
        </div>
      )}
    </div>
  );
}
