"use client";

import { useCallback, useState } from "react";
import { useCreateFlow } from "../create-provider";
import { StepIndicator } from "../shared/step-indicator";
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
    <div>
      <h2 className="text-lg font-semibold">Upload RFP Documents</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Upload your RFP documents or paste a solicitation URL and we will
        automatically extract key details to kickstart your proposal.
      </p>
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
  const rows = [
    { label: "Client / Agency", value: summary.clientName },
    { label: "Solicitation Type", value: summary.solicitationType },
    { label: "Requirements", value: String(summary.requirementsCount) },
    { label: "Budget Range", value: summary.budgetRange },
    { label: "Critical Gaps", value: String(summary.criticalGaps) },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-sm font-semibold mb-4">Extraction Summary</h3>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <dt className="text-xs text-muted-foreground">{r.label}</dt>
            <dd className="text-sm font-medium mt-0.5">{r.value}</dd>
          </div>
        ))}
      </dl>
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
