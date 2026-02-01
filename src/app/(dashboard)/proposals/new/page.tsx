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
  Check,
  Target,
  AlertTriangle,
  CheckCircle2,
  Building2,
  FileText,
  Shield,
  Trophy,
  Zap,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Lightbulb,
} from "lucide-react";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import type { WinStrategyData } from "@/types/outcomes";
import { OUTCOME_CATEGORIES } from "@/types/outcomes";
import type { OutcomeContract, SuccessMetric } from "@/types/idd";
import type { ExtractedIntake, ClientResearch } from "@/types/intake";
import { FlexibleIntake } from "@/components/intake/flexible-intake";
import { ExtractionReview } from "@/components/intake/extraction-review";

// Simplified 3-phase flow
const PHASES = [
  {
    id: "context",
    name: "Define Context",
    description: "Client, challenges, and desired outcomes",
    icon: Building2,
    color: "var(--accent)",
  },
  {
    id: "strategy",
    name: "Win Strategy",
    description: "AI-generated approach based on your context",
    icon: Trophy,
    color: "var(--warning)",
  },
  {
    id: "review",
    name: "Review & Create",
    description: "Confirm intent and generate proposal",
    icon: CheckCircle2,
    color: "var(--success)",
  },
];

export default function NewProposalPage() {
  const router = useRouter();
  const [phase, setPhase] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Intake mode
  const [intakeMode, setIntakeMode] = useState<"select" | "extracting" | "review" | "form">("select");
  const [extractedData, setExtractedData] = useState<ExtractedIntake | null>(null);
  const [researchData, setResearchData] = useState<ClientResearch | null>(null);

  // Phase 1: Context (combined from original steps 0-3)
  const [clientName, setClientName] = useState("");
  const [clientIndustry, setClientIndustry] = useState("");
  const [clientSize, setClientSize] = useState("");
  const [opportunityType, setOpportunityType] = useState("cloud_migration");
  const [currentStatePains, setCurrentStatePains] = useState<string[]>([""]);
  const [scopeDescription, setScopeDescription] = useState("");
  const [desiredOutcomes, setDesiredOutcomes] = useState<string[]>([""]);

  // Advanced options (collapsed by default)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [successMetrics, _setSuccessMetrics] = useState<SuccessMetric[]>([]);
  const [budgetRange, setBudgetRange] = useState("");
  const [timelineExpectation, setTimelineExpectation] = useState("");
  const [technicalEnvironment, setTechnicalEnvironment] = useState("");
  const [mustInclude, setMustInclude] = useState<string[]>([]);
  const [mustAvoid, _setMustAvoid] = useState<string[]>([]);
  const [complianceRequirements, setComplianceRequirements] = useState("");

  // Phase 2: Win Strategy
  const [winStrategy, setWinStrategy] = useState<WinStrategyData | null>(null);
  const [loadingStrategy, setLoadingStrategy] = useState(false);
  const [competitiveIntel, setCompetitiveIntel] = useState("");

  // Phase 3: Review
  const [intentApproved, setIntentApproved] = useState(false);

  const authFetch = useAuthFetch();

  // Helper functions
  function addToArray(setter: React.Dispatch<React.SetStateAction<string[]>>) {
    setter((prev) => [...prev, ""]);
  }

  function updateArrayItem(
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) {
    setter((prev) => prev.map((item, i) => (i === index ? value : item)));
  }

  function removeFromArray(
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) {
    setter((prev) => prev.filter((_, i) => i !== index));
  }

  // Build intake data for API
  function buildIntakeData() {
    return {
      client_name: clientName,
      client_industry: clientIndustry,
      client_size: clientSize,
      opportunity_type: opportunityType,
      scope_description: scopeDescription,
      key_requirements: desiredOutcomes.filter((r) => r.trim()),
      budget_range: budgetRange,
      timeline_expectation: timelineExpectation,
      technical_environment: technicalEnvironment,
      compliance_requirements: complianceRequirements.split("\n").filter((r) => r.trim()),
      competitive_intel: competitiveIntel,
      current_state_pains: currentStatePains.filter((p) => p.trim()),
      desired_outcomes: desiredOutcomes.filter((o) => o.trim()),
      must_include: mustInclude.filter((i) => i.trim()),
      must_avoid: mustAvoid.filter((a) => a.trim()),
    };
  }

  // Build IDD structures
  function buildOutcomeContract(): OutcomeContract {
    return {
      current_state: currentStatePains.filter((p) => p.trim()),
      desired_state: desiredOutcomes.filter((o) => o.trim()),
      transformation: `We will partner with ${clientName} to transform their ${opportunityType.replace(/_/g, " ")} capabilities.`,
      success_metrics: successMetrics.filter((m) => m.outcome.trim() || m.metric.trim()),
    };
  }

  // Auto-generate strategy when entering phase 2
  useEffect(() => {
    if (phase === 1 && !winStrategy && !loadingStrategy && clientName) {
      generateWinStrategy();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  async function generateWinStrategy() {
    setLoadingStrategy(true);
    try {
      const intakeData = buildIntakeData();
      const response = await authFetch("/api/proposals/temp/outcomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intake_data: intakeData }),
      });

      if (!response.ok) throw new Error("Failed to generate strategy");

      const data = await response.json();
      setWinStrategy(data.win_strategy);
    } catch (error) {
      console.error("Strategy generation error:", error);
      toast.error("Failed to generate strategy. You can add items manually.");
      setWinStrategy({
        win_themes: ["Value-driven transformation", "Proven methodology", "Accelerated delivery"],
        success_metrics: [],
        differentiators: [],
        target_outcomes: [],
        generated_at: new Date().toISOString(),
      });
    } finally {
      setLoadingStrategy(false);
    }
  }

  // Handle extraction completion
  function handleExtracted(data: ExtractedIntake, research: ClientResearch | null) {
    setExtractedData(data);
    setResearchData(research);
    setIntakeMode("review");
  }

  // Handle extraction confirmation
  function handleExtractionConfirmed(intakeData: Record<string, unknown>) {
    if (intakeData.client_name) setClientName(intakeData.client_name as string);
    if (intakeData.client_industry) setClientIndustry(intakeData.client_industry as string);
    if (intakeData.client_size) setClientSize(intakeData.client_size as string);
    if (intakeData.opportunity_type) setOpportunityType(intakeData.opportunity_type as string);
    if (intakeData.scope_description) setScopeDescription(intakeData.scope_description as string);
    if (intakeData.budget_range) setBudgetRange(intakeData.budget_range as string);
    if (intakeData.timeline_expectation) setTimelineExpectation(intakeData.timeline_expectation as string);
    if (intakeData.technical_environment) setTechnicalEnvironment(intakeData.technical_environment as string);

    if (Array.isArray(intakeData.current_state_pains) && intakeData.current_state_pains.length > 0) {
      setCurrentStatePains(intakeData.current_state_pains as string[]);
    }
    if (Array.isArray(intakeData.desired_outcomes) && intakeData.desired_outcomes.length > 0) {
      setDesiredOutcomes(intakeData.desired_outcomes as string[]);
    }
    if (Array.isArray(intakeData.key_requirements) && intakeData.key_requirements.length > 0) {
      setMustInclude(intakeData.key_requirements as string[]);
    }

    setIntakeMode("form");
    toast.success("Data extracted! Review and complete the form.");
  }

  async function handleSubmit() {
    if (!intentApproved) {
      toast.error("Please approve the Intent before creating the proposal");
      return;
    }

    setSubmitting(true);
    try {
      const intakeData = buildIntakeData();
      const outcomeContract = buildOutcomeContract();
      const title = `${clientName} - ${opportunityType.replace(/_/g, " ")} Proposal`;

      const response = await authFetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          intake_data: intakeData,
          win_strategy_data: winStrategy || {},
          outcome_contract: outcomeContract,
          intent_status: "approved",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create proposal");
      }

      const { proposal } = await response.json();
      toast.success("Proposal created successfully!");
      router.push(`/proposals/${proposal.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create proposal");
    } finally {
      setSubmitting(false);
    }
  }

  // Validate current phase
  const canProceed = phase === 0
    ? clientName.trim() && currentStatePains.some(p => p.trim()) && desiredOutcomes.some(o => o.trim())
    : phase === 1
    ? winStrategy !== null
    : intentApproved;

  const fieldClass = "w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] transition-all focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 hover:border-[var(--border-focus)]";
  const labelClass = "block text-sm font-semibold text-[var(--foreground)] mb-2";

  // Intake selection screen
  if (intakeMode === "select") {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)] flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] text-white shadow-lg">
              <FileText className="h-6 w-6" />
            </div>
            New Proposal
          </h1>
          <p className="mt-2 text-[var(--foreground-muted)]">
            Start with documents, pasted content, or manual entry
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-2xl w-full">
            <FlexibleIntake
              onExtracted={handleExtracted}
              onManualEntry={() => setIntakeMode("form")}
            />
          </div>
        </div>
      </div>
    );
  }

  // Extraction review screen
  if (intakeMode === "review" && extractedData) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)] flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--success)] to-emerald-600 text-white shadow-lg">
              <Sparkles className="h-6 w-6" />
            </div>
            Review Extracted Data
          </h1>
          <p className="mt-2 text-[var(--foreground-muted)]">
            We found the following information. Confirm or edit before proceeding.
          </p>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <ExtractionReview
              extracted={extractedData}
              research={researchData}
              onConfirm={handleExtractionConfirmed}
              onBack={() => setIntakeMode("select")}
            />
          </div>
        </div>
      </div>
    );
  }

  // Main form flow
  return (
    <div className="h-full flex flex-col">
      {/* Header with phase progress */}
      <div className="flex-shrink-0 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              {clientName ? `${clientName} Proposal` : "New Proposal"}
            </h1>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">
              {PHASES[phase].description}
            </p>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent-muted)]">
            <Zap className="h-4 w-4 text-[var(--accent)]" />
            <span className="text-sm font-semibold text-[var(--accent)]">Intent-Driven</span>
          </div>
        </div>

        {/* Phase progress bar */}
        <div className="flex items-center gap-4">
          {PHASES.map((p, i) => {
            const Icon = p.icon;
            const isActive = i === phase;
            const isComplete = i < phase;

            return (
              <button
                key={p.id}
                onClick={() => i <= phase && setPhase(i)}
                disabled={i > phase}
                className={`flex-1 relative flex items-center gap-3 p-4 rounded-xl transition-all ${
                  isActive
                    ? "bg-[var(--background-elevated)] border-2 border-[var(--accent)] shadow-lg"
                    : isComplete
                    ? "bg-[var(--background-tertiary)] border border-[var(--success-muted)] hover:bg-[var(--background-secondary)] cursor-pointer"
                    : "bg-[var(--background-tertiary)] border border-[var(--border)] opacity-50 cursor-not-allowed"
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                    isActive
                      ? "bg-[var(--accent)] text-white"
                      : isComplete
                      ? "bg-[var(--success)] text-white"
                      : "bg-[var(--background-secondary)] text-[var(--foreground-muted)]"
                  }`}
                >
                  {isComplete ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <div className="text-left">
                  <p className={`text-sm font-semibold ${isActive ? "text-[var(--foreground)]" : "text-[var(--foreground-muted)]"}`}>
                    {p.name}
                  </p>
                  <p className="text-xs text-[var(--foreground-subtle)] hidden lg:block">
                    Phase {i + 1}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-6">
        {/* Main form area */}
        <div className="col-span-8 overflow-y-auto pr-4 custom-scrollbar">
          <div className="card p-6 animate-fade-in">
            {/* Phase 1: Context */}
            {phase === 0 && (
              <div className="space-y-8">
                {/* Essential Info */}
                <section>
                  <h3 className="text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-[var(--accent)]" />
                    Client Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className={labelClass}>
                        Client Name <span className="text-[var(--danger)]">*</span>
                      </label>
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className={fieldClass}
                        placeholder="e.g. Acme Corporation"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Industry</label>
                      <select
                        value={clientIndustry}
                        onChange={(e) => setClientIndustry(e.target.value)}
                        className={fieldClass}
                      >
                        <option value="">Select industry...</option>
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
                      <label className={labelClass}>Opportunity Type</label>
                      <select
                        value={opportunityType}
                        onChange={(e) => setOpportunityType(e.target.value)}
                        className={fieldClass}
                      >
                        <option value="cloud_migration">Cloud Migration</option>
                        <option value="app_modernization">App Modernization</option>
                        <option value="data_analytics">Data & Analytics</option>
                        <option value="ai_ml">AI / Machine Learning</option>
                        <option value="both">Migration + Modernization</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Challenges */}
                <section>
                  <h3 className="text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-[var(--warning)]" />
                    What challenges are they facing?
                    <span className="text-[var(--danger)]">*</span>
                  </h3>
                  <p className="text-sm text-[var(--foreground-muted)] mb-4">
                    Describe the pain points. These drive the proposal narrative.
                  </p>
                  <div className="space-y-3">
                    {currentStatePains.map((pain, idx) => (
                      <div key={idx} className="flex gap-3">
                        <span className="flex-shrink-0 w-8 h-10 flex items-center justify-center rounded-lg bg-[var(--warning-subtle)] text-sm font-bold text-[var(--warning)]">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={pain}
                          onChange={(e) => updateArrayItem(setCurrentStatePains, idx, e.target.value)}
                          className={`${fieldClass} flex-1`}
                          placeholder="e.g. Legacy systems causing $2M/year in downtime"
                        />
                        {currentStatePains.length > 1 && (
                          <button
                            onClick={() => removeFromArray(setCurrentStatePains, idx)}
                            className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-[var(--danger)] hover:bg-[var(--danger-subtle)] transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => addToArray(setCurrentStatePains)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm text-[var(--accent)] hover:bg-[var(--accent-subtle)] rounded-lg transition-colors"
                    >
                      <Plus className="h-4 w-4" /> Add another
                    </button>
                  </div>
                </section>

                {/* Outcomes */}
                <section>
                  <h3 className="text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5 text-[var(--accent)]" />
                    What outcomes do they want?
                    <span className="text-[var(--danger)]">*</span>
                  </h3>
                  <p className="text-sm text-[var(--foreground-muted)] mb-4">
                    Define success. Be specific about measurable results.
                  </p>
                  <div className="space-y-3">
                    {desiredOutcomes.map((outcome, idx) => (
                      <div key={idx} className="flex gap-3">
                        <span className="flex-shrink-0 w-8 h-10 flex items-center justify-center rounded-lg bg-[var(--accent-subtle)] text-sm font-bold text-[var(--accent)]">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={outcome}
                          onChange={(e) => updateArrayItem(setDesiredOutcomes, idx, e.target.value)}
                          className={`${fieldClass} flex-1`}
                          placeholder="e.g. Reduce infrastructure costs by 40% in 12 months"
                        />
                        {desiredOutcomes.length > 1 && (
                          <button
                            onClick={() => removeFromArray(setDesiredOutcomes, idx)}
                            className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-[var(--danger)] hover:bg-[var(--danger-subtle)] transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => addToArray(setDesiredOutcomes)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm text-[var(--accent)] hover:bg-[var(--accent-subtle)] rounded-lg transition-colors"
                    >
                      <Plus className="h-4 w-4" /> Add another
                    </button>
                  </div>
                </section>

                {/* Scope description */}
                <section>
                  <label className={labelClass}>
                    Scope Description
                    <span className="font-normal text-[var(--foreground-muted)] ml-2">(Optional)</span>
                  </label>
                  <textarea
                    value={scopeDescription}
                    onChange={(e) => setScopeDescription(e.target.value)}
                    rows={3}
                    className={fieldClass}
                    placeholder="Any additional context about what they need..."
                  />
                </section>

                {/* Advanced options (collapsed) */}
                <section>
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    Advanced Options
                    <span className="text-xs text-[var(--foreground-subtle)]">(budget, timeline, constraints)</span>
                  </button>

                  {showAdvanced && (
                    <div className="mt-4 p-4 rounded-xl bg-[var(--background-tertiary)] space-y-4 animate-fade-in">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-[var(--foreground-muted)] mb-1 block">Budget Range</label>
                          <input
                            type="text"
                            value={budgetRange}
                            onChange={(e) => setBudgetRange(e.target.value)}
                            className={fieldClass}
                            placeholder="e.g. $2M-$5M"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-[var(--foreground-muted)] mb-1 block">Timeline</label>
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
                        <label className="text-sm font-medium text-[var(--foreground-muted)] mb-1 block">Technical Environment</label>
                        <textarea
                          value={technicalEnvironment}
                          onChange={(e) => setTechnicalEnvironment(e.target.value)}
                          rows={2}
                          className={fieldClass}
                          placeholder="Current tech stack, cloud providers..."
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[var(--foreground-muted)] mb-1 block">Compliance Requirements</label>
                        <input
                          type="text"
                          value={complianceRequirements}
                          onChange={(e) => setComplianceRequirements(e.target.value)}
                          className={fieldClass}
                          placeholder="HIPAA, SOC 2, GDPR..."
                        />
                      </div>
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* Phase 2: Win Strategy */}
            {phase === 1 && (
              <>
                {loadingStrategy ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-6">
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center shadow-lg animate-pulse">
                      <Sparkles className="h-10 w-10 text-white" />
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-[var(--foreground)]">Generating Win Strategy</p>
                      <p className="text-[var(--foreground-muted)] mt-2">
                        AI is analyzing your context and creating themes...
                      </p>
                    </div>
                    <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
                  </div>
                ) : winStrategy ? (
                  <div className="space-y-8">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-[var(--info-subtle)] border border-[var(--info-muted)]">
                      <Lightbulb className="h-6 w-6 text-[var(--info)] mt-0.5" />
                      <div>
                        <p className="font-semibold text-[var(--foreground)]">AI-Generated Strategy</p>
                        <p className="text-sm text-[var(--foreground-muted)] mt-1">
                          Based on your context, we suggest these win themes. Edit as needed.
                        </p>
                      </div>
                    </div>

                    {/* Win Themes */}
                    <section>
                      <h3 className="text-lg font-bold text-[var(--foreground)] mb-4">Win Themes</h3>
                      <div className="flex flex-wrap gap-2">
                        {winStrategy.win_themes.map((theme, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent-muted)] text-sm font-medium text-[var(--accent)]"
                          >
                            {theme}
                            <button
                              onClick={() => {
                                setWinStrategy({
                                  ...winStrategy,
                                  win_themes: winStrategy.win_themes.filter((_, i) => i !== idx),
                                });
                              }}
                              className="hover:text-[var(--danger)]"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </section>

                    {/* Target Outcomes */}
                    <section>
                      <h3 className="text-lg font-bold text-[var(--foreground)] mb-4">Target Outcomes</h3>
                      <div className="space-y-3">
                        {winStrategy.target_outcomes.map((outcome) => (
                          <div
                            key={outcome.id}
                            className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--background-tertiary)]"
                          >
                            <div className="flex-1">
                              <p className="text-sm text-[var(--foreground)]">{outcome.outcome}</p>
                              <span className="inline-block mt-1 text-xs text-[var(--foreground-subtle)] bg-[var(--background-secondary)] px-2 py-0.5 rounded">
                                {OUTCOME_CATEGORIES.find((c) => c.value === outcome.category)?.label || outcome.category}
                              </span>
                            </div>
                            <select
                              value={outcome.priority}
                              onChange={(e) => {
                                setWinStrategy({
                                  ...winStrategy,
                                  target_outcomes: winStrategy.target_outcomes.map((o) =>
                                    o.id === outcome.id ? { ...o, priority: e.target.value as "high" | "medium" | "low" } : o
                                  ),
                                });
                              }}
                              className={`text-xs font-semibold rounded-lg px-3 py-1.5 ${
                                outcome.priority === "high"
                                  ? "bg-[var(--danger-subtle)] text-[var(--danger)]"
                                  : outcome.priority === "medium"
                                  ? "bg-[var(--warning-subtle)] text-[var(--warning)]"
                                  : "bg-[var(--success-subtle)] text-[var(--success)]"
                              }`}
                            >
                              <option value="high">High</option>
                              <option value="medium">Medium</option>
                              <option value="low">Low</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Differentiators */}
                    <section>
                      <h3 className="text-lg font-bold text-[var(--foreground)] mb-4">Key Differentiators</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {winStrategy.differentiators.map((diff, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--background-tertiary)]">
                            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                            <span className="flex-1 text-sm text-[var(--foreground-muted)]">{diff}</span>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Competitive Intel */}
                    <section>
                      <label className={labelClass}>Competitive Intelligence (Optional)</label>
                      <textarea
                        value={competitiveIntel}
                        onChange={(e) => setCompetitiveIntel(e.target.value)}
                        rows={3}
                        className={fieldClass}
                        placeholder="Known competitors, incumbent vendors, decision influencers..."
                      />
                    </section>

                    <button
                      onClick={() => {
                        setWinStrategy(null);
                        generateWinStrategy();
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors"
                    >
                      <Sparkles className="h-4 w-4" /> Regenerate Strategy
                    </button>
                  </div>
                ) : null}
              </>
            )}

            {/* Phase 3: Review & Approve */}
            {phase === 2 && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-[var(--warning-subtle)] border border-[var(--warning-muted)]">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-[var(--warning)] mt-0.5" />
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">Intent Approval Required</p>
                      <p className="text-sm text-[var(--foreground-muted)] mt-1">
                        Review the summary below. Once approved, AI will generate your proposal.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Summary Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-[var(--border)]">
                    <h4 className="text-sm font-semibold text-[var(--warning)] mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" /> Pain Points
                    </h4>
                    <ul className="space-y-1">
                      {currentStatePains.filter(p => p.trim()).map((p, i) => (
                        <li key={i} className="text-sm text-[var(--foreground-muted)] flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--warning)] mt-2" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl border border-[var(--border)]">
                    <h4 className="text-sm font-semibold text-[var(--accent)] mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4" /> Desired Outcomes
                    </h4>
                    <ul className="space-y-1">
                      {desiredOutcomes.filter(o => o.trim()).map((o, i) => (
                        <li key={i} className="text-sm text-[var(--foreground-muted)] flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] mt-2" />
                          {o}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {winStrategy && (
                  <div className="p-4 rounded-xl border border-[var(--border)]">
                    <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3">Win Strategy</h4>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {winStrategy.win_themes.map((theme, i) => (
                        <span key={i} className="px-3 py-1 text-xs font-medium bg-[var(--accent-subtle)] text-[var(--accent)] rounded-full">
                          {theme}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-[var(--foreground-subtle)]">
                      {winStrategy.target_outcomes.length} outcomes • {winStrategy.differentiators.length} differentiators
                    </p>
                  </div>
                )}

                {/* Approval checkbox */}
                <div className="p-6 rounded-xl border-2 border-[var(--border)] hover:border-[var(--accent)] transition-colors">
                  <label className="flex items-start gap-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={intentApproved}
                      onChange={(e) => setIntentApproved(e.target.checked)}
                      className="mt-1 h-5 w-5 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                    />
                    <div>
                      <span className="text-lg font-bold text-[var(--foreground)]">
                        I approve this Intent
                      </span>
                      <p className="text-sm text-[var(--foreground-muted)] mt-1">
                        AI will generate proposal content that delivers these specific outcomes,
                        verified against your company&apos;s capabilities and case studies.
                      </p>
                    </div>
                  </label>
                </div>

                {intentApproved && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--success-subtle)] border border-[var(--success-muted)] animate-fade-in">
                    <CheckCircle2 className="h-6 w-6 text-[var(--success)]" />
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">Ready to create your proposal</p>
                      <p className="text-sm text-[var(--foreground-muted)]">Click &quot;Create Proposal&quot; to proceed</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-4 space-y-4">
          {/* Context summary */}
          {clientName && (
            <div className="card p-4">
              <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-3">Summary</p>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-[var(--foreground-subtle)]">Client</p>
                  <p className="font-medium text-[var(--foreground)]">{clientName}</p>
                </div>
                {clientIndustry && (
                  <div>
                    <p className="text-[var(--foreground-subtle)]">Industry</p>
                    <p className="text-[var(--foreground-muted)]">{clientIndustry.replace(/_/g, " ")}</p>
                  </div>
                )}
                <div>
                  <p className="text-[var(--foreground-subtle)]">Opportunity</p>
                  <p className="text-[var(--foreground-muted)]">{opportunityType.replace(/_/g, " ")}</p>
                </div>
                {currentStatePains.some(p => p.trim()) && (
                  <div>
                    <p className="text-[var(--foreground-subtle)]">Pain Points</p>
                    <p className="text-[var(--warning)]">{currentStatePains.filter(p => p.trim()).length} identified</p>
                  </div>
                )}
                {desiredOutcomes.some(o => o.trim()) && (
                  <div>
                    <p className="text-[var(--foreground-subtle)]">Outcomes</p>
                    <p className="text-[var(--accent)]">{desiredOutcomes.filter(o => o.trim()).length} defined</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="card p-4 bg-[var(--background-tertiary)] border-dashed">
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="h-4 w-4 text-[var(--accent)]" />
              <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">Tips</p>
            </div>
            <ul className="space-y-2 text-xs text-[var(--foreground-muted)]">
              {phase === 0 && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent)]">•</span>
                    Be specific about pain points - they drive the narrative
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent)]">•</span>
                    Define measurable outcomes for stronger proposals
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent)]">•</span>
                    AI will find relevant case studies automatically
                  </li>
                </>
              )}
              {phase === 1 && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent)]">•</span>
                    Win themes run throughout the proposal
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent)]">•</span>
                    High priority outcomes get more emphasis
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent)]">•</span>
                    Add competitive intel for sharper positioning
                  </li>
                </>
              )}
              {phase === 2 && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent)]">•</span>
                    Review all details before approving
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent)]">•</span>
                    You can edit the proposal after generation
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent)]">•</span>
                    All claims will be verified against sources
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Navigation footer */}
      <div className="flex-shrink-0 mt-6 pt-6 border-t border-[var(--border)] flex justify-between items-center">
        <button
          onClick={() => phase > 0 ? setPhase(phase - 1) : setIntakeMode("select")}
          className="btn-secondary inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="text-sm text-[var(--foreground-muted)]">
          Phase {phase + 1} of {PHASES.length}
        </div>

        {phase < 2 ? (
          <button
            onClick={() => setPhase(phase + 1)}
            disabled={!canProceed || (phase === 1 && loadingStrategy)}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-40"
          >
            {phase === 1 && loadingStrategy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || !intentApproved}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] px-6 py-3 text-sm font-bold text-white hover:shadow-lg disabled:opacity-40 transition-all"
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
