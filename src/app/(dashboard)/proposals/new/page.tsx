"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Send,
  Sparkles,
  X,
  Plus,
  Pencil,
  Check,
} from "lucide-react";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import type { WinStrategyData, TargetOutcome } from "@/types/outcomes";
import { OUTCOME_CATEGORIES } from "@/types/outcomes";

const STEPS = [
  "Client Info",
  "Opportunity",
  "Constraints",
  "Competitive Intel",
  "Win Strategy",
  "Review",
];

export default function NewProposalPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [clientName, setClientName] = useState("");
  const [clientIndustry, setClientIndustry] = useState("");
  const [clientSize, setClientSize] = useState("");
  const [opportunityType, setOpportunityType] = useState("cloud_migration");
  const [scopeDescription, setScopeDescription] = useState("");
  const [keyRequirements, setKeyRequirements] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [timelineExpectation, setTimelineExpectation] = useState("");
  const [technicalEnvironment, setTechnicalEnvironment] = useState("");
  const [complianceRequirements, setComplianceRequirements] = useState("");
  const [competitiveIntel, setCompetitiveIntel] = useState("");
  const [decisionCriteria, setDecisionCriteria] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Win Strategy state
  const [winStrategy, setWinStrategy] = useState<WinStrategyData | null>(null);
  const [loadingOutcomes, setLoadingOutcomes] = useState(false);
  const [editingThemeIdx, setEditingThemeIdx] = useState<number | null>(null);
  const [editingThemeVal, setEditingThemeVal] = useState("");
  const [newTheme, setNewTheme] = useState("");
  const [editingOutcome, setEditingOutcome] = useState<string | null>(null);
  const [editingOutcomeVal, setEditingOutcomeVal] = useState("");

  const authFetch = useAuthFetch();

  function buildIntakeData() {
    return {
      client_name: clientName,
      client_industry: clientIndustry,
      client_size: clientSize,
      opportunity_type: opportunityType,
      scope_description: scopeDescription,
      key_requirements: keyRequirements.split("\n").filter((r) => r.trim()),
      budget_range: budgetRange,
      timeline_expectation: timelineExpectation,
      technical_environment: technicalEnvironment,
      compliance_requirements: complianceRequirements
        .split("\n")
        .filter((r) => r.trim()),
      competitive_intel: competitiveIntel,
      decision_criteria: decisionCriteria.split("\n").filter((r) => r.trim()),
      additional_notes: additionalNotes,
    };
  }

  // Auto-generate outcomes when entering step 4
  useEffect(() => {
    if (step === 4 && !winStrategy && !loadingOutcomes) {
      generateOutcomes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function generateOutcomes() {
    setLoadingOutcomes(true);
    try {
      const intakeData = buildIntakeData();
      const response = await authFetch("/api/proposals/temp/outcomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intake_data: intakeData }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate outcomes");
      }

      const data = await response.json();
      setWinStrategy(data.win_strategy);
    } catch (error) {
      console.error("Outcomes generation error:", error);
      toast.error("Failed to generate win strategy. You can add outcomes manually.");
      // Set empty strategy so user can add manually
      setWinStrategy({
        win_themes: [],
        success_metrics: [],
        differentiators: [],
        target_outcomes: [],
        generated_at: new Date().toISOString(),
      });
    } finally {
      setLoadingOutcomes(false);
    }
  }

  // Win strategy helpers
  function removeTheme(idx: number) {
    if (!winStrategy) return;
    setWinStrategy({
      ...winStrategy,
      win_themes: winStrategy.win_themes.filter((_, i) => i !== idx),
    });
  }

  function addTheme() {
    if (!winStrategy || !newTheme.trim()) return;
    setWinStrategy({
      ...winStrategy,
      win_themes: [...winStrategy.win_themes, newTheme.trim()],
    });
    setNewTheme("");
  }

  function saveThemeEdit(idx: number) {
    if (!winStrategy || !editingThemeVal.trim()) return;
    const themes = [...winStrategy.win_themes];
    themes[idx] = editingThemeVal.trim();
    setWinStrategy({ ...winStrategy, win_themes: themes });
    setEditingThemeIdx(null);
  }

  function removeOutcome(id: string) {
    if (!winStrategy) return;
    setWinStrategy({
      ...winStrategy,
      target_outcomes: winStrategy.target_outcomes.filter((o) => o.id !== id),
    });
  }

  function updateOutcomePriority(id: string, priority: "high" | "medium" | "low") {
    if (!winStrategy) return;
    setWinStrategy({
      ...winStrategy,
      target_outcomes: winStrategy.target_outcomes.map((o) =>
        o.id === id ? { ...o, priority, user_edited: true } : o
      ),
    });
  }

  function addOutcome() {
    if (!winStrategy) return;
    const newOutcome: TargetOutcome = {
      id: `outcome-${Date.now()}`,
      outcome: "New outcome - click to edit",
      category: "cost_optimization",
      priority: "medium",
      ai_suggested: false,
      user_edited: true,
    };
    setWinStrategy({
      ...winStrategy,
      target_outcomes: [...winStrategy.target_outcomes, newOutcome],
    });
    setEditingOutcome(newOutcome.id);
    setEditingOutcomeVal(newOutcome.outcome);
  }

  function saveOutcomeEdit(id: string) {
    if (!winStrategy || !editingOutcomeVal.trim()) return;
    setWinStrategy({
      ...winStrategy,
      target_outcomes: winStrategy.target_outcomes.map((o) =>
        o.id === id
          ? { ...o, outcome: editingOutcomeVal.trim(), user_edited: true }
          : o
      ),
    });
    setEditingOutcome(null);
  }

  function removeMetric(idx: number) {
    if (!winStrategy) return;
    setWinStrategy({
      ...winStrategy,
      success_metrics: winStrategy.success_metrics.filter((_, i) => i !== idx),
    });
  }

  function removeDifferentiator(idx: number) {
    if (!winStrategy) return;
    setWinStrategy({
      ...winStrategy,
      differentiators: winStrategy.differentiators.filter((_, i) => i !== idx),
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const intakeData = buildIntakeData();
      const title = `${clientName} - ${opportunityType.replace(/_/g, " ")} Proposal`;

      const response = await authFetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          intake_data: intakeData,
          win_strategy_data: winStrategy || {},
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create proposal");
      }

      const { proposal } = await response.json();
      toast.success("Proposal created successfully");
      router.push(`/proposals/${proposal.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create proposal"
      );
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass =
    "mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
  const labelClass = "block text-sm font-medium text-gray-700";
  const priorityColors = {
    high: "bg-red-100 text-red-700 border-red-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    low: "bg-green-100 text-green-700 border-green-200",
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">New Proposal</h1>
      <p className="mt-1 text-sm text-gray-500">
        Fill out the intake form to generate a proposal
      </p>

      {/* Progress bar */}
      <div className="mt-6 flex gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1">
            <div
              className={`h-1.5 rounded-full transition-colors ${
                i <= step ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
            <p
              className={`mt-1 text-xs ${
                i <= step ? "text-blue-600 font-medium" : "text-gray-400"
              }`}
            >
              {s}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-5">
        {/* Step 0: Client Info */}
        {step === 0 && (
          <>
            <div>
              <label className={labelClass}>Client Name *</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
                className={fieldClass}
                placeholder="e.g. Acme Corporation"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Industry *</label>
                <select
                  value={clientIndustry}
                  onChange={(e) => setClientIndustry(e.target.value)}
                  className={fieldClass}
                >
                  <option value="">Select...</option>
                  <option value="financial_services">Financial Services</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="retail">Retail</option>
                  <option value="energy">Energy & Utilities</option>
                  <option value="public_sector">Public Sector</option>
                  <option value="telecom">Telecom</option>
                  <option value="technology">Technology</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Company Size</label>
                <select
                  value={clientSize}
                  onChange={(e) => setClientSize(e.target.value)}
                  className={fieldClass}
                >
                  <option value="">Select...</option>
                  <option value="small">Small (&lt;1,000 employees)</option>
                  <option value="medium">Medium (1,000-10,000)</option>
                  <option value="large">Large (10,000-50,000)</option>
                  <option value="enterprise">Enterprise (50,000+)</option>
                </select>
              </div>
            </div>
          </>
        )}

        {/* Step 1: Opportunity */}
        {step === 1 && (
          <>
            <div>
              <label className={labelClass}>Opportunity Type *</label>
              <select
                value={opportunityType}
                onChange={(e) => setOpportunityType(e.target.value)}
                className={fieldClass}
              >
                <option value="cloud_migration">Cloud Migration</option>
                <option value="app_modernization">
                  Application Modernization
                </option>
                <option value="both">Both (Migration + Modernization)</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Scope Description *</label>
              <textarea
                value={scopeDescription}
                onChange={(e) => setScopeDescription(e.target.value)}
                rows={4}
                className={fieldClass}
                placeholder="Describe the scope of the engagement. Can be vague ('They want to move to the cloud') or specific."
              />
            </div>
            <div>
              <label className={labelClass}>
                Key Requirements (one per line)
              </label>
              <textarea
                value={keyRequirements}
                onChange={(e) => setKeyRequirements(e.target.value)}
                rows={3}
                className={fieldClass}
                placeholder="Migrate 50+ applications to AWS&#10;Zero downtime during migration&#10;Complete within 12 months"
              />
            </div>
          </>
        )}

        {/* Step 2: Constraints */}
        {step === 2 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Budget Range</label>
                <input
                  type="text"
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                  className={fieldClass}
                  placeholder="e.g. $2M-$5M"
                />
              </div>
              <div>
                <label className={labelClass}>Timeline Expectation</label>
                <input
                  type="text"
                  value={timelineExpectation}
                  onChange={(e) => setTimelineExpectation(e.target.value)}
                  className={fieldClass}
                  placeholder="e.g. 6-12 months"
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Technical Environment</label>
              <textarea
                value={technicalEnvironment}
                onChange={(e) => setTechnicalEnvironment(e.target.value)}
                rows={3}
                className={fieldClass}
                placeholder="Current tech stack, cloud providers, key platforms..."
              />
            </div>
            <div>
              <label className={labelClass}>
                Compliance Requirements (one per line)
              </label>
              <textarea
                value={complianceRequirements}
                onChange={(e) => setComplianceRequirements(e.target.value)}
                rows={2}
                className={fieldClass}
                placeholder="HIPAA&#10;SOC 2&#10;PCI-DSS"
              />
            </div>
          </>
        )}

        {/* Step 3: Competitive Intel */}
        {step === 3 && (
          <>
            <div>
              <label className={labelClass}>Competitive Intelligence</label>
              <textarea
                value={competitiveIntel}
                onChange={(e) => setCompetitiveIntel(e.target.value)}
                rows={3}
                className={fieldClass}
                placeholder="Known competitors bidding, client relationships, etc."
              />
            </div>
            <div>
              <label className={labelClass}>
                Decision Criteria (one per line)
              </label>
              <textarea
                value={decisionCriteria}
                onChange={(e) => setDecisionCriteria(e.target.value)}
                rows={3}
                className={fieldClass}
                placeholder="Technical expertise&#10;Price competitiveness&#10;Speed to value"
              />
            </div>
            <div>
              <label className={labelClass}>Additional Notes</label>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                rows={3}
                className={fieldClass}
                placeholder="Any other context that would help generate a better proposal..."
              />
            </div>
          </>
        )}

        {/* Step 4: Win Strategy & Outcomes */}
        {step === 4 && (
          <>
            {loadingOutcomes ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="relative">
                  <Sparkles className="h-10 w-10 text-blue-500 animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">
                    Analyzing opportunity...
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    AI is generating win themes, outcomes, and differentiators
                  </p>
                </div>
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              </div>
            ) : winStrategy ? (
              <div className="space-y-6">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-xs text-blue-700">
                    AI-suggested strategy based on your intake data. Edit, add,
                    or remove items to refine. These outcomes will guide all
                    proposal content generation.
                  </p>
                </div>

                {/* Win Themes */}
                <div>
                  <label className={labelClass}>Win Themes</label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Big ideas that run through the entire proposal
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {winStrategy.win_themes.map((theme, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
                      >
                        {editingThemeIdx === idx ? (
                          <input
                            value={editingThemeVal}
                            onChange={(e) => setEditingThemeVal(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && saveThemeEdit(idx)
                            }
                            onBlur={() => saveThemeEdit(idx)}
                            className="w-32 bg-transparent border-none text-xs focus:outline-none"
                            autoFocus
                          />
                        ) : (
                          <span
                            className="cursor-pointer"
                            onClick={() => {
                              setEditingThemeIdx(idx);
                              setEditingThemeVal(theme);
                            }}
                          >
                            {theme}
                          </span>
                        )}
                        <button
                          onClick={() => removeTheme(idx)}
                          className="ml-1 hover:text-blue-900"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <div className="inline-flex items-center gap-1">
                      <input
                        value={newTheme}
                        onChange={(e) => setNewTheme(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addTheme()}
                        placeholder="Add theme..."
                        className="w-24 rounded-full border border-dashed border-gray-300 bg-white px-3 py-1 text-xs focus:border-blue-500 focus:outline-none"
                      />
                      {newTheme && (
                        <button
                          onClick={addTheme}
                          className="rounded-full bg-blue-600 p-0.5 text-white"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Target Outcomes */}
                <div>
                  <label className={labelClass}>Target Outcomes</label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Specific, measurable outcomes the proposal should deliver
                  </p>
                  <div className="mt-2 space-y-2">
                    {winStrategy.target_outcomes.map((outcome) => (
                      <div
                        key={outcome.id}
                        className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3"
                      >
                        <div className="flex-1">
                          {editingOutcome === outcome.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                value={editingOutcomeVal}
                                onChange={(e) =>
                                  setEditingOutcomeVal(e.target.value)
                                }
                                onKeyDown={(e) =>
                                  e.key === "Enter" &&
                                  saveOutcomeEdit(outcome.id)
                                }
                                className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => saveOutcomeEdit(outcome.id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2">
                              <p className="text-sm text-gray-900">
                                {outcome.outcome}
                              </p>
                              <button
                                onClick={() => {
                                  setEditingOutcome(outcome.id);
                                  setEditingOutcomeVal(outcome.outcome);
                                }}
                                className="shrink-0 text-gray-400 hover:text-gray-600"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                          <div className="mt-1 flex items-center gap-2">
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                              {OUTCOME_CATEGORIES.find(
                                (c) => c.value === outcome.category
                              )?.label || outcome.category}
                            </span>
                            {outcome.ai_suggested && !outcome.user_edited && (
                              <span className="text-xs text-gray-400">
                                AI suggested
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <select
                            value={outcome.priority}
                            onChange={(e) =>
                              updateOutcomePriority(
                                outcome.id,
                                e.target.value as "high" | "medium" | "low"
                              )
                            }
                            className={`rounded border px-2 py-0.5 text-xs font-medium ${
                              priorityColors[outcome.priority]
                            }`}
                          >
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                          <button
                            onClick={() => removeOutcome(outcome.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={addOutcome}
                      className="flex w-full items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 py-2 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600"
                    >
                      <Plus className="h-3 w-3" /> Add Outcome
                    </button>
                  </div>
                </div>

                {/* Success Metrics */}
                <div>
                  <label className={labelClass}>Success Metrics</label>
                  <div className="mt-2 space-y-1">
                    {winStrategy.success_metrics.map((metric, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                        <span className="flex-1">{metric}</span>
                        <button
                          onClick={() => removeMetric(idx)}
                          className="text-gray-300 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Differentiators */}
                <div>
                  <label className={labelClass}>Key Differentiators</label>
                  <div className="mt-2 space-y-1">
                    {winStrategy.differentiators.map((diff, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                        <span className="flex-1">{diff}</span>
                        <button
                          onClick={() => removeDifferentiator(idx)}
                          className="text-gray-300 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Regenerate button */}
                <button
                  onClick={() => {
                    setWinStrategy(null);
                    generateOutcomes();
                  }}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                >
                  <Sparkles className="h-3 w-3" />
                  Regenerate Strategy
                </button>
              </div>
            ) : null}
          </>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-medium text-gray-900">Review</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Client:</span>{" "}
                <span className="text-gray-600">{clientName}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Industry:</span>{" "}
                <span className="text-gray-600">
                  {clientIndustry.replace(/_/g, " ")}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Type:</span>{" "}
                <span className="text-gray-600">
                  {opportunityType.replace(/_/g, " ")}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Scope:</span>{" "}
                <span className="text-gray-600">
                  {scopeDescription || "Not specified"}
                </span>
              </div>
              {budgetRange && (
                <div>
                  <span className="font-medium text-gray-700">Budget:</span>{" "}
                  <span className="text-gray-600">{budgetRange}</span>
                </div>
              )}
              {timelineExpectation && (
                <div>
                  <span className="font-medium text-gray-700">Timeline:</span>{" "}
                  <span className="text-gray-600">{timelineExpectation}</span>
                </div>
              )}
              {technicalEnvironment && (
                <div>
                  <span className="font-medium text-gray-700">
                    Tech Environment:
                  </span>{" "}
                  <span className="text-gray-600">{technicalEnvironment}</span>
                </div>
              )}
            </div>

            {/* Win Strategy Summary */}
            {winStrategy &&
              winStrategy.win_themes.length > 0 && (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-medium text-gray-900">
                    Win Strategy
                  </h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {winStrategy.win_themes.map((theme, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      {winStrategy.target_outcomes.length} target outcomes,{" "}
                      {winStrategy.success_metrics.length} success metrics,{" "}
                      {winStrategy.differentiators.length} differentiators
                    </p>
                  </div>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))}
            disabled={step === 4 && loadingOutcomes}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !clientName}
            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Create Proposal
          </button>
        )}
      </div>
    </div>
  );
}
