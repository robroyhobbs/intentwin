"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Send,
  Sparkles,
  FileText,
  Zap,
  RotateCcw,
  X,
} from "lucide-react";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { useWizardAutoSave } from "@/hooks/use-wizard-auto-save";
import type { WinStrategyData } from "@/types/outcomes";
import type { OutcomeContract, SuccessMetric } from "@/types/idd";
import type { ExtractedIntake, ClientResearch } from "@/types/intake";
import { FlexibleIntake } from "@/components/intake/flexible-intake";
import { ExtractionReview } from "@/components/intake/extraction-review";
import type { BidEvaluation, FactorKey } from "@/lib/ai/bid-scoring";
import { SCORING_FACTORS } from "@/lib/ai/bid-scoring";

import { PHASES, PhaseProgressBar } from "./_components/phase-progress";
import { BidEvaluationScreen } from "./_components/bid-evaluation-screen";
import { ContextPhase } from "./_components/context-phase";
import { WinStrategyPhase } from "./_components/win-strategy-phase";
import { ReviewPhase } from "./_components/review-phase";
import { ProposalSidebar } from "./_components/proposal-sidebar";

export default function NewProposalPage() {
  const router = useRouter();
  const [phase, setPhase] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Intake mode
  const [intakeMode, setIntakeMode] = useState<
    "select" | "extracting" | "review" | "bid-evaluation" | "form"
  >("select");
  const [extractedData, setExtractedData] = useState<ExtractedIntake | null>(
    null,
  );
  const [researchData, setResearchData] = useState<ClientResearch | null>(null);

  // Bid evaluation state
  const [bidEvaluation, setBidEvaluation] = useState<BidEvaluation | null>(
    null,
  );
  const [bidScoring, setBidScoring] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);
  const [bidOverrides, setBidOverrides] = useState<
    Partial<Record<FactorKey, number>>
  >({});

  // Phase 1: Context (combined from original steps 0-3)
  const [clientName, setClientName] = useState("");
  const [clientIndustry, setClientIndustry] = useState("");
  const [clientSize, setClientSize] = useState("");
  const [solicitationType, setSolicitationType] = useState("RFP");
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

  // --- Draft auto-save ---
  interface WizardDraftState {
    phase: number;
    clientName: string;
    clientIndustry: string;
    clientSize: string;
    solicitationType: string;
    opportunityType: string;
    currentStatePains: string[];
    scopeDescription: string;
    desiredOutcomes: string[];
    budgetRange: string;
    timelineExpectation: string;
    technicalEnvironment: string;
    complianceRequirements: string;
    mustInclude: string[];
    competitiveIntel: string;
  }

  const draftState = useMemo<WizardDraftState>(
    () => ({
      phase,
      clientName,
      clientIndustry,
      clientSize,
      solicitationType,
      opportunityType,
      currentStatePains,
      scopeDescription,
      desiredOutcomes,
      budgetRange,
      timelineExpectation,
      technicalEnvironment,
      complianceRequirements,
      mustInclude,
      competitiveIntel,
    }),
    [
      phase,
      clientName,
      clientIndustry,
      clientSize,
      solicitationType,
      opportunityType,
      currentStatePains,
      scopeDescription,
      desiredOutcomes,
      budgetRange,
      timelineExpectation,
      technicalEnvironment,
      complianceRequirements,
      mustInclude,
      competitiveIntel,
    ],
  );

  const { hasDraft, restoreDraft, dismissDraft, clearDraft } =
    useWizardAutoSave<WizardDraftState>(draftState, {
      storageKey: "proposal-wizard-draft",
      enabled: intakeMode === "form",
    });

  const handleRestoreDraft = useCallback(() => {
    const draft = restoreDraft();
    if (!draft) return;
    setPhase(draft.phase);
    setClientName(draft.clientName);
    setClientIndustry(draft.clientIndustry);
    setClientSize(draft.clientSize);
    setSolicitationType(draft.solicitationType);
    setOpportunityType(draft.opportunityType);
    setCurrentStatePains(draft.currentStatePains);
    setScopeDescription(draft.scopeDescription);
    setDesiredOutcomes(draft.desiredOutcomes);
    setBudgetRange(draft.budgetRange);
    setTimelineExpectation(draft.timelineExpectation);
    setTechnicalEnvironment(draft.technicalEnvironment);
    setComplianceRequirements(draft.complianceRequirements);
    setMustInclude(draft.mustInclude);
    setCompetitiveIntel(draft.competitiveIntel);
    setIntakeMode("form");
    toast.success("Draft restored successfully");
  }, [restoreDraft]);

  // Pre-fill from opportunity feed (sessionStorage)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("opportunity-prefill");
      if (!raw) return;
      sessionStorage.removeItem("opportunity-prefill");
      const prefill = JSON.parse(raw) as Record<string, unknown>;
      if (prefill.client_name) setClientName(prefill.client_name as string);
      if (prefill.scope_description)
        setScopeDescription(prefill.scope_description as string);
      if (prefill.solicitation_type)
        setSolicitationType(prefill.solicitation_type as string);
      if (prefill.timeline_expectation)
        setTimelineExpectation(prefill.timeline_expectation as string);
      setIntakeMode("form");
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Helper functions
  function addToArray(setter: React.Dispatch<React.SetStateAction<string[]>>) {
    setter((prev) => [...prev, ""]);
  }

  function updateArrayItem(
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string,
  ) {
    setter((prev) => prev.map((item, i) => (i === index ? value : item)));
  }

  function removeFromArray(
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
  ) {
    setter((prev) => prev.filter((_, i) => i !== index));
  }

  // Build intake data for API
  function buildIntakeData() {
    return {
      client_name: clientName,
      client_industry: clientIndustry,
      client_size: clientSize,
      solicitation_type: solicitationType,
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
      success_metrics: successMetrics.filter(
        (m) => m.outcome.trim() || m.metric.trim(),
      ),
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
        win_themes: [
          "Value-driven transformation",
          "Proven methodology",
          "Accelerated delivery",
        ],
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
  function handleExtracted(
    data: ExtractedIntake,
    research: ClientResearch | null,
  ) {
    // Ensure required sub-objects exist before setting state
    if (!data.extracted) data.extracted = {} as ExtractedIntake["extracted"];
    if (!data.inferred) data.inferred = {} as ExtractedIntake["inferred"];
    if (!data.gaps) data.gaps = [];
    setExtractedData(data);
    setResearchData(research);
    setIntakeMode("review");
  }

  // Handle extraction confirmation
  function handleExtractionConfirmed(intakeData: Record<string, unknown>) {
    if (intakeData.client_name) setClientName(intakeData.client_name as string);
    if (intakeData.client_industry)
      setClientIndustry(intakeData.client_industry as string);
    if (intakeData.client_size) setClientSize(intakeData.client_size as string);
    if (intakeData.opportunity_type)
      setOpportunityType(intakeData.opportunity_type as string);
    if (intakeData.scope_description)
      setScopeDescription(intakeData.scope_description as string);
    if (intakeData.budget_range)
      setBudgetRange(intakeData.budget_range as string);
    if (intakeData.timeline_expectation)
      setTimelineExpectation(intakeData.timeline_expectation as string);
    if (intakeData.technical_environment)
      setTechnicalEnvironment(intakeData.technical_environment as string);

    // Normalize solicitation_type from AI extraction to dropdown values
    if (intakeData.solicitation_type) {
      const raw = (intakeData.solicitation_type as string).toUpperCase().trim();
      const solicitationMap: Record<string, string> = {
        RFP: "RFP",
        "REQUEST FOR PROPOSAL": "RFP",
        "REQUEST FOR PROPOSALS": "RFP",
        RFI: "RFI",
        "REQUEST FOR INFORMATION": "RFI",
        RFQ: "RFQ",
        "REQUEST FOR QUOTE": "RFQ",
        "REQUEST FOR QUOTATION": "RFQ",
        SOW: "SOW",
        "STATEMENT OF WORK": "SOW",
        "SCOPE OF WORK": "SOW",
        PROACTIVE: "Proactive",
        "PROACTIVE PITCH": "Proactive",
        "UNSOLICITED PROPOSAL": "Proactive",
      };
      const normalized = solicitationMap[raw];
      if (normalized) setSolicitationType(normalized);
    }

    if (
      Array.isArray(intakeData.current_state_pains) &&
      intakeData.current_state_pains.length > 0
    ) {
      setCurrentStatePains(intakeData.current_state_pains as string[]);
    }
    if (
      Array.isArray(intakeData.desired_outcomes) &&
      intakeData.desired_outcomes.length > 0
    ) {
      setDesiredOutcomes(intakeData.desired_outcomes as string[]);
    }
    if (
      Array.isArray(intakeData.key_requirements) &&
      intakeData.key_requirements.length > 0
    ) {
      setMustInclude(intakeData.key_requirements as string[]);
    }

    // Route to bid evaluation if we have extracted RFP data
    if (extractedData) {
      setIntakeMode("bid-evaluation");
      triggerBidScoring(intakeData);
    } else {
      setIntakeMode("form");
    }
    toast.success("Data extracted! Review and complete the form.");
  }

  async function triggerBidScoring(intakeData: Record<string, unknown>) {
    setBidScoring(true);
    setBidError(null);
    try {
      // Normalize ExtractedIntake structure into flat format for bid-scoring
      const ext = extractedData?.extracted;
      const rfpRequirements = {
        title: extractedData?.input_summary,
        agency: ext?.client_name?.value,
        deadline: ext?.timeline?.value,
        budget_range: ext?.budget_range?.value,
        scope: ext?.scope_description?.value,
        requirements: ext?.key_requirements?.value,
        evaluation_criteria: ext?.decision_criteria?.value,
        compliance_requirements: ext?.compliance_requirements?.value,
        technical_environment: ext?.technical_environment?.value,
        source_text: extractedData?.source_text ? String(extractedData.source_text).slice(0, 4000) : undefined,
      };

      const response = await authFetch("/api/intake/bid-evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfp_requirements: rfpRequirements,
          service_line: intakeData.opportunity_type,
          industry: intakeData.client_industry,
        }),
      });

      if (!response.ok) {
        // Read the actual error body from the server
        let serverMessage = `Server returned ${response.status}`;
        try {
          const errorBody = await response.json();
          serverMessage = errorBody.error || errorBody.message || serverMessage;
        } catch {
          // Response body wasn't JSON — use status text
          serverMessage = `${response.status} ${response.statusText}`;
        }
        console.error("Bid scoring API error:", {
          status: response.status,
          message: serverMessage,
          rfpFields: Object.keys(rfpRequirements).filter(k => rfpRequirements[k as keyof typeof rfpRequirements] != null),
        });
        throw new Error(serverMessage);
      }

      const data = await response.json();
      setBidEvaluation(data.evaluation);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Bid scoring error:", message);
      // Show a more helpful error: include the reason if available
      const isAuth = message.includes("401") || message.toLowerCase().includes("unauthorized");
      const isRateLimit = message.includes("429") || message.toLowerCase().includes("rate limit");
      const userMessage = isAuth
        ? "Session expired. Please refresh the page and try again."
        : isRateLimit
          ? "Rate limit reached. Please wait a few minutes and retry."
          : `Failed to score opportunity: ${message}. You can skip or retry.`;
      setBidError(userMessage);
    } finally {
      setBidScoring(false);
    }
  }

  function handleBidDecision(decision: "proceed" | "skip") {
    if (bidEvaluation) {
      const finalEvaluation: BidEvaluation = {
        ...bidEvaluation,
        user_decision: decision,
        decided_at: new Date().toISOString(),
        ...(Object.keys(bidOverrides).length > 0
          ? {
              user_scores: bidOverrides,
              weighted_total: computeWeightedTotalClient(
                bidEvaluation.ai_scores,
                bidOverrides,
              ),
            }
          : {}),
      };
      finalEvaluation.recommendation = getRecommendationClient(
        finalEvaluation.weighted_total,
      );
      setBidEvaluation(finalEvaluation);
    }
    setIntakeMode("form");
  }

  function computeWeightedTotalClient(
    aiScores: Record<string, { score: number }>,
    overrides: Partial<Record<string, number>>,
  ): number {
    let total = 0;
    for (const factor of SCORING_FACTORS) {
      const score = overrides[factor.key] ?? aiScores[factor.key]?.score ?? 50;
      total += score * (factor.weight / 100);
    }
    return Math.round(total * 100) / 100;
  }

  function getRecommendationClient(total: number): "bid" | "evaluate" | "pass" {
    if (total > 70) return "bid";
    if (total >= 40) return "evaluate";
    return "pass";
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
          bid_evaluation: bidEvaluation || undefined,
          client_research: researchData || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create proposal");
      }

      const { proposal } = await response.json();
      clearDraft();
      toast.success("Proposal created successfully!");
      router.push(`/proposals/${proposal.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create proposal",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Validate current phase
  const canProceed =
    phase === 0
      ? clientName.trim() &&
        currentStatePains.some((p) => p.trim()) &&
        desiredOutcomes.some((o) => o.trim())
      : phase === 1
        ? winStrategy !== null
        : intentApproved;

  const fieldClass =
    "w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] transition-all focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 hover:border-[var(--border-focus)]";
  const labelClass =
    "block text-sm font-semibold text-[var(--foreground)] mb-2";

  // Intake selection screen
  if (intakeMode === "select") {
    return (
      <div className="h-full flex flex-col">
        {/* Draft resume banner */}
        {hasDraft && (
          <div className="flex-shrink-0 mb-4 flex items-center gap-3 rounded-xl border border-[var(--accent-muted)] bg-[var(--accent-subtle)] px-4 py-3">
            <RotateCcw className="h-4 w-4 text-[var(--accent)] flex-shrink-0" />
            <span className="text-sm text-[var(--foreground)]">
              You have an unsaved draft. Resume where you left off?
            </span>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={handleRestoreDraft}
                className="btn-primary text-xs px-3 py-1.5"
              >
                Resume Draft
              </button>
              <button
                onClick={dismissDraft}
                className="p-1 rounded-lg hover:bg-[var(--hover)] text-[var(--foreground-muted)]"
                aria-label="Dismiss draft"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

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
            We found the following information. Confirm or edit before
            proceeding.
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

  // Bid evaluation screen
  if (intakeMode === "bid-evaluation") {
    return (
      <BidEvaluationScreen
        bidEvaluation={bidEvaluation}
        bidScoring={bidScoring}
        bidError={bidError}
        bidOverrides={bidOverrides}
        setBidOverrides={setBidOverrides}
        triggerBidScoring={triggerBidScoring}
        handleBidDecision={handleBidDecision}
        buildIntakeData={buildIntakeData}
        computeWeightedTotalClient={computeWeightedTotalClient}
        getRecommendationClient={getRecommendationClient}
      />
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
            <span className="text-sm font-semibold text-[var(--accent)]">
              Intent-Driven
            </span>
          </div>
        </div>

        {/* Phase progress bar */}
        <PhaseProgressBar phase={phase} onPhaseClick={setPhase} />
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-6">
        {/* Main form area */}
        <div className="col-span-8 overflow-y-auto pr-4 custom-scrollbar">
          <div className="card p-6 animate-fade-in">
            {/* Phase 1: Context */}
            {phase === 0 && (
              <ContextPhase
                clientName={clientName}
                setClientName={setClientName}
                clientIndustry={clientIndustry}
                setClientIndustry={setClientIndustry}
                solicitationType={solicitationType}
                setSolicitationType={setSolicitationType}
                opportunityType={opportunityType}
                setOpportunityType={setOpportunityType}
                currentStatePains={currentStatePains}
                setCurrentStatePains={setCurrentStatePains}
                desiredOutcomes={desiredOutcomes}
                setDesiredOutcomes={setDesiredOutcomes}
                scopeDescription={scopeDescription}
                setScopeDescription={setScopeDescription}
                showAdvanced={showAdvanced}
                setShowAdvanced={setShowAdvanced}
                budgetRange={budgetRange}
                setBudgetRange={setBudgetRange}
                timelineExpectation={timelineExpectation}
                setTimelineExpectation={setTimelineExpectation}
                technicalEnvironment={technicalEnvironment}
                setTechnicalEnvironment={setTechnicalEnvironment}
                complianceRequirements={complianceRequirements}
                setComplianceRequirements={setComplianceRequirements}
                fieldClass={fieldClass}
                labelClass={labelClass}
                addToArray={addToArray}
                updateArrayItem={updateArrayItem}
                removeFromArray={removeFromArray}
              />
            )}

            {/* Phase 2: Win Strategy */}
            {phase === 1 && (
              <WinStrategyPhase
                loadingStrategy={loadingStrategy}
                winStrategy={winStrategy}
                setWinStrategy={setWinStrategy}
                competitiveIntel={competitiveIntel}
                setCompetitiveIntel={setCompetitiveIntel}
                generateWinStrategy={generateWinStrategy}
                fieldClass={fieldClass}
                labelClass={labelClass}
              />
            )}

            {/* Phase 3: Review & Approve */}
            {phase === 2 && (
              <ReviewPhase
                clientName={clientName}
                clientIndustry={clientIndustry}
                solicitationType={solicitationType}
                opportunityType={opportunityType}
                scopeDescription={scopeDescription}
                budgetRange={budgetRange}
                timelineExpectation={timelineExpectation}
                currentStatePains={currentStatePains}
                desiredOutcomes={desiredOutcomes}
                winStrategy={winStrategy}
                intentApproved={intentApproved}
                setIntentApproved={setIntentApproved}
              />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <ProposalSidebar
          clientName={clientName}
          clientIndustry={clientIndustry}
          opportunityType={opportunityType}
          currentStatePains={currentStatePains}
          desiredOutcomes={desiredOutcomes}
          phase={phase}
        />
      </div>

      {/* Navigation footer */}
      <div className="flex-shrink-0 mt-6 pt-6 border-t border-[var(--border)] flex justify-between items-center">
        <button
          onClick={() =>
            phase > 0 ? setPhase(phase - 1) : setIntakeMode("select")
          }
          className="btn-secondary inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="text-sm text-[var(--foreground-muted)]">
          Phase {phase + 1} of {PHASES.length}
        </div>

        {phase < 2 ? (
          <div className="flex items-center gap-3">
            {!canProceed && phase === 0 && (
              <p className="text-xs text-[var(--danger)]">
                {!clientName.trim()
                  ? "Client name is required"
                  : !currentStatePains.some((p) => p.trim())
                    ? "Add at least one pain point"
                    : "Add at least one desired outcome"}
              </p>
            )}
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
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || !intentApproved}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] px-6 py-3 text-sm font-bold text-white hover:shadow-lg disabled:opacity-40 transition-all"
          >
                        {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Engineering Proposal...
              </span>
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
