"use client";

import { useCallback, useState } from "react";
import { useCreateFlow } from "../create-provider";
import { StepIndicator } from "../shared/step-indicator";
import { PhaseIcon } from "../shared/phase-icon";
import { StatBlock } from "../shared/stat-block";
import {
  uploadAndExtract,
  fetchUrlAndExtract,
  getExtractionSummary,
} from "./intake-helpers";
import {
  InputModeTabs,
  DropZone,
  UrlInput,
  type InputMode,
} from "./intake-input";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { logger } from "@/lib/utils/logger";

// ── Small presentational pieces ─────────────────────────────────────────────

function IntakeHeader() {
  return (
    <div className="flex items-center gap-3">
      <PhaseIcon phase="intake" state="active" />
      <div>
        <h2 className="text-xl font-bold">Upload RFP Documents</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Upload your RFP or paste a URL — we extract requirements, criteria,
          and gaps automatically.
        </p>
      </div>
    </div>
  );
}

function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3"
    >
      <span
        className="text-destructive text-lg leading-none mt-0.5"
        aria-hidden="true"
      >
        !
      </span>
      <div className="flex-1">
        <p className="text-sm text-destructive">{message}</p>
        <button
          onClick={onRetry}
          className="mt-2 text-xs font-medium text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

// ── Extraction summary ──────────────────────────────────────────────────────

function ExtractionSummary({
  summary,
}: {
  summary: ReturnType<typeof getExtractionSummary>;
}) {
  return (
    <div className="card p-6">
      <h3 className="text-sm font-semibold mb-4">Extraction Summary</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
        <StatBlock label="Client" value={summary.clientName} />
        <StatBlock label="Type" value={summary.solicitationType} />
        <StatBlock
          label="Requirements"
          value={String(summary.requirementsCount)}
        />
        <StatBlock label="Budget" value={summary.budgetRange} />
        <StatBlock
          label="Critical Gaps"
          value={String(summary.criticalGaps)}
          color={summary.criticalGaps > 0 ? "danger" : "success"}
        />
      </div>
    </div>
  );
}

// ── Buyer goal ──────────────────────────────────────────────────────────────

function BuyerGoalInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mt-4">
      <label htmlFor="buyer-goal" className="block text-sm font-medium mb-1.5">
        Buyer Goal{" "}
        <span className="text-muted-foreground font-normal">(optional)</span>
      </label>
      <textarea
        id="buyer-goal"
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What is the buyer trying to achieve? Any context to help shape the proposal..."
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}

// ── Shared input selector ───────────────────────────────────────────────────

function InputSelector({
  mode,
  onSwitch,
  onFiles,
  onUrl,
}: {
  mode: InputMode;
  onSwitch: (m: InputMode) => void;
  onFiles: (files: File[]) => void;
  onUrl: (url: string) => void;
}) {
  return (
    <>
      <InputModeTabs mode={mode} onSwitch={onSwitch} />
      {mode === "upload" ? (
        <DropZone onFiles={onFiles} />
      ) : (
        <UrlInput onSubmit={onUrl} />
      )}
    </>
  );
}

// ── Success view ────────────────────────────────────────────────────────────

function IntakeSuccessView({ onContinue }: { onContinue: () => void }) {
  const { state, dispatch } = useCreateFlow();
  const summary = getExtractionSummary(state.extractedData!);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <IntakeHeader />
      <ExtractionSummary summary={summary} />
      <BuyerGoalInput
        value={state.buyerGoal}
        onChange={(v) => dispatch({ type: "SET_BUYER_GOAL", goal: v })}
      />
      <div className="flex justify-end">
        <button
          onClick={onContinue}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Continue to Strategy
        </button>
      </div>
    </div>
  );
}

// ── Handlers hook ───────────────────────────────────────────────────────────

function useIntakeHandlers() {
  const { state, dispatch } = useCreateFlow();
  const authFetch = useAuthFetch();

  const handleFiles = useCallback(
    (files: File[]) => {
      dispatch({ type: "SET_FILES", files });
      logger.info("Intake: files selected", { count: files.length });
      void uploadAndExtract(files, dispatch, authFetch);
    },
    [dispatch, authFetch],
  );

  const handleUrl = useCallback(
    (url: string) => {
      logger.info("Intake: URL submitted", { url });
      void fetchUrlAndExtract(url, dispatch, authFetch);
    },
    [dispatch, authFetch],
  );

  const handleRetry = useCallback(() => {
    if (state.files.length > 0)
      void uploadAndExtract(state.files, dispatch, authFetch);
  }, [state.files, dispatch, authFetch]);

  const handleContinue = useCallback(() => {
    dispatch({ type: "COMPLETE_PHASE", phase: "intake" });
    dispatch({ type: "SET_PHASE", phase: "strategy" });
  }, [dispatch]);

  return { state, handleFiles, handleUrl, handleRetry, handleContinue };
}

// ── Main component ──────────────────────────────────────────────────────────

export function IntakePhase() {
  const { state, handleFiles, handleUrl, handleRetry, handleContinue } =
    useIntakeHandlers();
  const [inputMode, setInputMode] = useState<InputMode>("upload");

  if (state.isExtracting) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <IntakeHeader />
        <StepIndicator current={state.extractionStep} />
      </div>
    );
  }

  if (state.extractionError) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <IntakeHeader />
        <ErrorBanner message={state.extractionError} onRetry={handleRetry} />
        <InputSelector
          mode={inputMode}
          onSwitch={setInputMode}
          onFiles={handleFiles}
          onUrl={handleUrl}
        />
      </div>
    );
  }

  if (state.extractedData) {
    return <IntakeSuccessView onContinue={handleContinue} />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <IntakeHeader />
      <InputSelector
        mode={inputMode}
        onSwitch={setInputMode}
        onFiles={handleFiles}
        onUrl={handleUrl}
      />
    </div>
  );
}
