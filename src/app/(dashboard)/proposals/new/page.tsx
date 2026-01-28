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
  Target,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import type { WinStrategyData, TargetOutcome } from "@/types/outcomes";
import { OUTCOME_CATEGORIES } from "@/types/outcomes";
import type { OutcomeContract, IntentConstraints, SuccessMetric } from "@/types/idd";

// IDD-aligned steps
const STEPS = [
  { name: "Client Info", description: "Who is the client?" },
  { name: "Current State", description: "What are their pain points?" },
  { name: "Desired Outcomes", description: "What does success look like?" },
  { name: "Constraints", description: "What must we include/avoid?" },
  { name: "Win Strategy", description: "How will we win?" },
  { name: "Approve Intent", description: "Lock the proposal intent" },
];

export default function NewProposalPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Client Info
  const [clientName, setClientName] = useState("");
  const [clientIndustry, setClientIndustry] = useState("");
  const [clientSize, setClientSize] = useState("");
  const [opportunityType, setOpportunityType] = useState("cloud_migration");

  // Step 2: Current State (IDD - Outcome Contract)
  const [currentStatePains, setCurrentStatePains] = useState<string[]>([""]);
  const [scopeDescription, setScopeDescription] = useState("");

  // Step 3: Desired Outcomes (IDD - Outcome Contract)
  const [desiredOutcomes, setDesiredOutcomes] = useState<string[]>([""]);
  const [successMetrics, setSuccessMetrics] = useState<SuccessMetric[]>([
    { outcome: "", metric: "", target: "", measurement_method: "" },
  ]);
  const [transformation, setTransformation] = useState("");

  // Step 4: Constraints (IDD)
  const [budgetRange, setBudgetRange] = useState("");
  const [timelineExpectation, setTimelineExpectation] = useState("");
  const [technicalEnvironment, setTechnicalEnvironment] = useState("");
  const [mustInclude, setMustInclude] = useState<string[]>([""]);
  const [mustAvoid, setMustAvoid] = useState<string[]>([""]);
  const [complianceRequirements, setComplianceRequirements] = useState("");

  // Step 5: Win Strategy
  const [winStrategy, setWinStrategy] = useState<WinStrategyData | null>(null);
  const [loadingOutcomes, setLoadingOutcomes] = useState(false);
  const [competitiveIntel, setCompetitiveIntel] = useState("");
  const [editingThemeIdx, setEditingThemeIdx] = useState<number | null>(null);
  const [editingThemeVal, setEditingThemeVal] = useState("");
  const [newTheme, setNewTheme] = useState("");
  const [editingOutcome, setEditingOutcome] = useState<string | null>(null);
  const [editingOutcomeVal, setEditingOutcomeVal] = useState("");

  // Step 6: Intent Approval
  const [intentApproved, setIntentApproved] = useState(false);

  const authFetch = useAuthFetch();

  // Helper: Add item to array state
  function addToArray(setter: React.Dispatch<React.SetStateAction<string[]>>) {
    setter((prev) => [...prev, ""]);
  }

  // Helper: Update item in array state
  function updateArrayItem(
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) {
    setter((prev) => prev.map((item, i) => (i === index ? value : item)));
  }

  // Helper: Remove item from array state
  function removeFromArray(
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) {
    setter((prev) => prev.filter((_, i) => i !== index));
  }

  // Build the IDD Outcome Contract
  function buildOutcomeContract(): OutcomeContract {
    return {
      current_state: currentStatePains.filter((p) => p.trim()),
      desired_state: desiredOutcomes.filter((o) => o.trim()),
      transformation: transformation || `Capgemini will partner with ${clientName} to transform their ${opportunityType.replace(/_/g, " ")} capabilities, addressing current challenges and delivering measurable outcomes.`,
      success_metrics: successMetrics.filter((m) => m.outcome.trim() || m.metric.trim()),
    };
  }

  // Build the IDD Constraints
  function buildConstraints(): IntentConstraints {
    return {
      must_include: mustInclude.filter((i) => i.trim()),
      must_avoid: mustAvoid.filter((a) => a.trim()),
      budget_range: budgetRange ? { min: 0, max: 0, currency: "USD" } : undefined,
      timeline: timelineExpectation ? { start: "", end: timelineExpectation } : undefined,
    };
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
      compliance_requirements: complianceRequirements
        .split("\n")
        .filter((r) => r.trim()),
      competitive_intel: competitiveIntel,
      decision_criteria: [],
      additional_notes: "",
      // IDD fields
      current_state_pains: currentStatePains.filter((p) => p.trim()),
      desired_outcomes: desiredOutcomes.filter((o) => o.trim()),
      must_include: mustInclude.filter((i) => i.trim()),
      must_avoid: mustAvoid.filter((a) => a.trim()),
    };
  }

  // Auto-generate win strategy when entering step 4
  useEffect(() => {
    if (step === 4 && !winStrategy && !loadingOutcomes) {
      generateWinStrategy();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function generateWinStrategy() {
    setLoadingOutcomes(true);
    try {
      const intakeData = buildIntakeData();
      const response = await authFetch("/api/proposals/temp/outcomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intake_data: intakeData }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate win strategy");
      }

      const data = await response.json();
      setWinStrategy(data.win_strategy);
    } catch (error) {
      console.error("Win strategy generation error:", error);
      toast.error("Failed to generate win strategy. You can add items manually.");
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
    if (!intentApproved) {
      toast.error("Please approve the Intent before creating the proposal");
      return;
    }

    setSubmitting(true);
    try {
      const intakeData = buildIntakeData();
      const outcomeContract = buildOutcomeContract();
      const constraints = buildConstraints();
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
      toast.success("Proposal created with approved Intent");
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
        Define the Intent, then AI generates the proposal
      </p>

      {/* IDD Context Banner */}
      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
        <div className="flex items-start gap-2">
          <Target className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-blue-800">Intent-Driven Development</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Define outcomes first. AI generates content that delivers those outcomes.
            </p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-6 flex gap-2">
        {STEPS.map((s, i) => (
          <div key={s.name} className="flex-1">
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
              {s.name}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-5">
        {/* Step 0: Client Info */}
        {step === 0 && (
          <>
            <div className="text-xs text-gray-500 mb-4">
              Basic information about the client and opportunity type.
            </div>
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
            <div>
              <label className={labelClass}>Opportunity Type *</label>
              <select
                value={opportunityType}
                onChange={(e) => setOpportunityType(e.target.value)}
                className={fieldClass}
              >
                <option value="cloud_migration">Cloud Migration</option>
                <option value="app_modernization">Application Modernization</option>
                <option value="data_analytics">Data & Analytics</option>
                <option value="ai_ml">AI / Machine Learning</option>
                <option value="both">Migration + Modernization</option>
                <option value="other">Other</option>
              </select>
            </div>
          </>
        )}

        {/* Step 1: Current State (IDD - Pain Points) */}
        {step === 1 && (
          <>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-amber-800">Current State</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    What challenges is the client facing today? These pain points will drive the proposal narrative.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>Client Pain Points *</label>
              <p className="text-xs text-gray-500 mt-0.5 mb-2">
                What is the client struggling with? Be specific.
              </p>
              {currentStatePains.map((pain, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={pain}
                    onChange={(e) => updateArrayItem(setCurrentStatePains, idx, e.target.value)}
                    className={fieldClass}
                    placeholder={`Pain point ${idx + 1}: e.g. "Legacy systems can't scale for peak traffic"`}
                  />
                  {currentStatePains.length > 1 && (
                    <button
                      onClick={() => removeFromArray(setCurrentStatePains, idx)}
                      className="text-gray-400 hover:text-red-500 px-2"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addToArray(setCurrentStatePains)}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-3 w-3" /> Add pain point
              </button>
            </div>

            <div>
              <label className={labelClass}>Scope Description</label>
              <textarea
                value={scopeDescription}
                onChange={(e) => setScopeDescription(e.target.value)}
                rows={3}
                className={fieldClass}
                placeholder="Describe the scope of what the client needs. Can be vague ('They want to move to the cloud') or specific."
              />
            </div>
          </>
        )}

        {/* Step 2: Desired Outcomes (IDD - Success Definition) */}
        {step === 2 && (
          <>
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 mb-4">
              <div className="flex items-start gap-2">
                <Target className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-green-800">Desired Outcomes</p>
                  <p className="text-xs text-green-600 mt-0.5">
                    What does success look like? Define specific, measurable outcomes.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>Desired Business Outcomes *</label>
              <p className="text-xs text-gray-500 mt-0.5 mb-2">
                What specific outcomes should the engagement deliver?
              </p>
              {desiredOutcomes.map((outcome, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={outcome}
                    onChange={(e) => updateArrayItem(setDesiredOutcomes, idx, e.target.value)}
                    className={fieldClass}
                    placeholder={`Outcome ${idx + 1}: e.g. "Reduce infrastructure costs by 40%"`}
                  />
                  {desiredOutcomes.length > 1 && (
                    <button
                      onClick={() => removeFromArray(setDesiredOutcomes, idx)}
                      className="text-gray-400 hover:text-red-500 px-2"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addToArray(setDesiredOutcomes)}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-3 w-3" /> Add outcome
              </button>
            </div>

            <div>
              <label className={labelClass}>Success Metrics</label>
              <p className="text-xs text-gray-500 mt-0.5 mb-2">
                How will each outcome be measured?
              </p>
              {successMetrics.map((metric, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-2 mb-2">
                  <input
                    type="text"
                    value={metric.outcome}
                    onChange={(e) => {
                      const updated = [...successMetrics];
                      updated[idx] = { ...metric, outcome: e.target.value };
                      setSuccessMetrics(updated);
                    }}
                    className={fieldClass}
                    placeholder="Outcome"
                  />
                  <input
                    type="text"
                    value={metric.metric}
                    onChange={(e) => {
                      const updated = [...successMetrics];
                      updated[idx] = { ...metric, metric: e.target.value };
                      setSuccessMetrics(updated);
                    }}
                    className={fieldClass}
                    placeholder="Metric"
                  />
                  <input
                    type="text"
                    value={metric.target}
                    onChange={(e) => {
                      const updated = [...successMetrics];
                      updated[idx] = { ...metric, target: e.target.value };
                      setSuccessMetrics(updated);
                    }}
                    className={fieldClass}
                    placeholder="Target"
                  />
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={metric.measurement_method}
                      onChange={(e) => {
                        const updated = [...successMetrics];
                        updated[idx] = { ...metric, measurement_method: e.target.value };
                        setSuccessMetrics(updated);
                      }}
                      className={fieldClass}
                      placeholder="How to measure"
                    />
                    {successMetrics.length > 1 && (
                      <button
                        onClick={() => setSuccessMetrics(successMetrics.filter((_, i) => i !== idx))}
                        className="text-gray-400 hover:text-red-500 px-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                onClick={() => setSuccessMetrics([...successMetrics, { outcome: "", metric: "", target: "", measurement_method: "" }])}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-3 w-3" /> Add metric
              </button>
            </div>
          </>
        )}

        {/* Step 3: Constraints (IDD - Must Include/Avoid) */}
        {step === 3 && (
          <>
            <div className="text-xs text-gray-500 mb-4">
              Define what the proposal must include and must avoid.
            </div>

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
                <label className={labelClass}>Timeline</label>
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
                rows={2}
                className={fieldClass}
                placeholder="Current tech stack, cloud providers, key platforms..."
              />
            </div>

            <div>
              <label className={labelClass}>
                <span className="text-green-600">Must Include</span> (Required elements)
              </label>
              <p className="text-xs text-gray-500 mt-0.5 mb-2">
                Certifications, compliance, specific capabilities that must be mentioned.
              </p>
              {mustInclude.map((item, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateArrayItem(setMustInclude, idx, e.target.value)}
                    className={`${fieldClass} border-green-200 focus:border-green-500 focus:ring-green-500`}
                    placeholder={`e.g. "FedRAMP compliance", "24/7 support"`}
                  />
                  {mustInclude.length > 1 && (
                    <button
                      onClick={() => removeFromArray(setMustInclude, idx)}
                      className="text-gray-400 hover:text-red-500 px-2"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addToArray(setMustInclude)}
                className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
              >
                <Plus className="h-3 w-3" /> Add requirement
              </button>
            </div>

            <div>
              <label className={labelClass}>
                <span className="text-red-600">Must Avoid</span> (Prohibited content)
              </label>
              <p className="text-xs text-gray-500 mt-0.5 mb-2">
                Topics, claims, or content that should not appear in the proposal.
              </p>
              {mustAvoid.map((item, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateArrayItem(setMustAvoid, idx, e.target.value)}
                    className={`${fieldClass} border-red-200 focus:border-red-500 focus:ring-red-500`}
                    placeholder={`e.g. "Competitor names", "Guaranteed SLAs"`}
                  />
                  {mustAvoid.length > 1 && (
                    <button
                      onClick={() => removeFromArray(setMustAvoid, idx)}
                      className="text-gray-400 hover:text-red-500 px-2"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addToArray(setMustAvoid)}
                className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
              >
                <Plus className="h-3 w-3" /> Add restriction
              </button>
            </div>

            <div>
              <label className={labelClass}>Compliance Requirements</label>
              <textarea
                value={complianceRequirements}
                onChange={(e) => setComplianceRequirements(e.target.value)}
                rows={2}
                className={fieldClass}
                placeholder="HIPAA, SOC 2, PCI-DSS, GDPR..."
              />
            </div>
          </>
        )}

        {/* Step 4: Win Strategy */}
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
                    AI is generating win themes and differentiators based on your Intent
                  </p>
                </div>
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              </div>
            ) : winStrategy ? (
              <div className="space-y-6">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-xs text-blue-700">
                    AI-suggested strategy based on your Intent. Edit to refine.
                  </p>
                </div>

                {/* Competitive Intel */}
                <div>
                  <label className={labelClass}>Competitive Intelligence</label>
                  <textarea
                    value={competitiveIntel}
                    onChange={(e) => setCompetitiveIntel(e.target.value)}
                    rows={2}
                    className={fieldClass}
                    placeholder="Known competitors, client relationships, decision influencers..."
                  />
                </div>

                {/* Win Themes */}
                <div>
                  <label className={labelClass}>Win Themes</label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Core messages that run through the proposal
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
                            onKeyDown={(e) => e.key === "Enter" && saveThemeEdit(idx)}
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
                        <button onClick={() => removeTheme(idx)} className="ml-1 hover:text-blue-900">
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
                        <button onClick={addTheme} className="rounded-full bg-blue-600 p-0.5 text-white">
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
                    Specific outcomes the proposal should deliver
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
                                onChange={(e) => setEditingOutcomeVal(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && saveOutcomeEdit(outcome.id)}
                                className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                                autoFocus
                              />
                              <button onClick={() => saveOutcomeEdit(outcome.id)} className="text-green-600 hover:text-green-700">
                                <Check className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2">
                              <p className="text-sm text-gray-900">{outcome.outcome}</p>
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
                              {OUTCOME_CATEGORIES.find((c) => c.value === outcome.category)?.label || outcome.category}
                            </span>
                            {outcome.ai_suggested && !outcome.user_edited && (
                              <span className="text-xs text-gray-400">AI suggested</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <select
                            value={outcome.priority}
                            onChange={(e) => updateOutcomePriority(outcome.id, e.target.value as "high" | "medium" | "low")}
                            className={`rounded border px-2 py-0.5 text-xs font-medium ${priorityColors[outcome.priority]}`}
                          >
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                          <button onClick={() => removeOutcome(outcome.id)} className="text-gray-400 hover:text-red-500">
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

                {/* Differentiators */}
                <div>
                  <label className={labelClass}>Key Differentiators</label>
                  <div className="mt-2 space-y-1">
                    {winStrategy.differentiators.map((diff, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                        <span className="flex-1">{diff}</span>
                        <button onClick={() => removeDifferentiator(idx)} className="text-gray-300 hover:text-red-500">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setWinStrategy(null);
                    generateWinStrategy();
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

        {/* Step 5: Approve Intent */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-medium text-gray-900">Review & Approve Intent</h2>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 mb-6">
                <p className="text-xs text-amber-800">
                  <strong>IDD Principle:</strong> Once approved, this Intent becomes the source of truth.
                  AI will generate proposal content that delivers these specific outcomes.
                </p>
              </div>

              {/* Outcome Contract Summary */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Current State (Pain Points)
                  </h3>
                  <ul className="mt-2 space-y-1">
                    {currentStatePains.filter(p => p.trim()).map((pain, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        {pain}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-500" />
                    Desired Outcomes
                  </h3>
                  <ul className="mt-2 space-y-1">
                    {desiredOutcomes.filter(o => o.trim()).map((outcome, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                        {outcome}
                      </li>
                    ))}
                  </ul>
                </div>

                {successMetrics.some(m => m.outcome.trim()) && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Success Metrics</h3>
                    <div className="mt-2 overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-1 pr-4 font-medium text-gray-500">Outcome</th>
                            <th className="text-left py-1 pr-4 font-medium text-gray-500">Metric</th>
                            <th className="text-left py-1 pr-4 font-medium text-gray-500">Target</th>
                            <th className="text-left py-1 font-medium text-gray-500">Method</th>
                          </tr>
                        </thead>
                        <tbody>
                          {successMetrics.filter(m => m.outcome.trim()).map((m, idx) => (
                            <tr key={idx} className="border-b border-gray-100">
                              <td className="py-1 pr-4 text-gray-900">{m.outcome}</td>
                              <td className="py-1 pr-4 text-gray-600">{m.metric}</td>
                              <td className="py-1 pr-4 text-gray-600">{m.target}</td>
                              <td className="py-1 text-gray-600">{m.measurement_method}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Constraints Summary */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <h3 className="text-sm font-medium text-green-700">Must Include</h3>
                    <ul className="mt-1 space-y-0.5">
                      {mustInclude.filter(i => i.trim()).map((item, idx) => (
                        <li key={idx} className="text-xs text-gray-600">+ {item}</li>
                      ))}
                      {!mustInclude.some(i => i.trim()) && (
                        <li className="text-xs text-gray-400 italic">None specified</li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-red-700">Must Avoid</h3>
                    <ul className="mt-1 space-y-0.5">
                      {mustAvoid.filter(a => a.trim()).map((item, idx) => (
                        <li key={idx} className="text-xs text-gray-600">- {item}</li>
                      ))}
                      {!mustAvoid.some(a => a.trim()) && (
                        <li className="text-xs text-gray-400 italic">None specified</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Win Strategy Summary */}
                {winStrategy && winStrategy.win_themes.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900">Win Strategy</h3>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {winStrategy.win_themes.map((theme, idx) => (
                        <span key={idx} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                          {theme}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      {winStrategy.target_outcomes.length} outcomes, {winStrategy.differentiators.length} differentiators
                    </p>
                  </div>
                )}
              </div>

              {/* Approval Checkbox */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={intentApproved}
                    onChange={(e) => setIntentApproved(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      I approve this Intent
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      The AI will generate proposal content that delivers these outcomes.
                      Claims will be verified against company capabilities.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {intentApproved && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-sm text-green-800">
                  Intent approved. Ready to create proposal.
                </p>
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
            disabled={submitting || !clientName || !intentApproved}
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
