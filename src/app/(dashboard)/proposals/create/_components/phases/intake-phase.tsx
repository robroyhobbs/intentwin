"use client";

import { useCallback, useRef, useState } from "react";
import { useCreateFlow } from "../create-provider";
import { StepIndicator } from "../shared/step-indicator";
import {
  filterValidFiles,
  uploadAndExtract,
  getExtractionSummary,
} from "./intake-helpers";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { logger } from "@/lib/utils/logger";

// ── Small presentational pieces ─────────────────────────────────────────────

function UploadIcon() {
  return (
    <svg
      className="h-10 w-10 text-muted-foreground"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775
           5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118
           19.5H6.75z"
      />
    </svg>
  );
}

function IntakeHeader() {
  return (
    <div>
      <h2 className="text-lg font-semibold">Upload RFP Documents</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Upload your RFP or solicitation documents and we will automatically
        extract key details to kickstart your proposal.
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
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
      <span className="text-destructive text-lg leading-none mt-0.5">!</span>
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

function submitValidFiles(
  source: FileList | null | undefined,
  onFiles: (f: File[]) => void,
) {
  if (!source) return;
  const valid = filterValidFiles(source);
  if (valid.length > 0) onFiles(valid);
}

function DropZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const openPicker = () => inputRef.current?.click();

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      submitValidFiles(e.dataTransfer.files, onFiles);
    },
    [onFiles],
  );

  const border = dragOver
    ? "border-primary bg-primary/5"
    : "border-border hover:border-primary/50";

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={openPicker}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") openPicker();
      }}
      className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-12 cursor-pointer transition-colors ${border}`}
    >
      <UploadIcon />
      <p className="text-sm font-medium">
        Drag and drop your RFP files here, or click to browse
      </p>
      <p className="text-xs text-muted-foreground">
        Supported: PDF, DOCX, TXT, XLSX
      </p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.txt,.xlsx"
        className="hidden"
        onChange={() => submitValidFiles(inputRef.current?.files, onFiles)}
      />
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

// ── Phase view renderers (keep IntakePhase under 50 lines) ──────────────────

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

// ── Main component ──────────────────────────────────────────────────────────

export function IntakePhase() {
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

  const handleRetry = useCallback(() => {
    if (state.files.length > 0)
      void uploadAndExtract(state.files, dispatch, authFetch);
  }, [state.files, dispatch, authFetch]);

  const handleContinue = useCallback(() => {
    dispatch({ type: "COMPLETE_PHASE", phase: "intake" });
    dispatch({ type: "SET_PHASE", phase: "strategy" });
  }, [dispatch]);

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
        <DropZone onFiles={handleFiles} />
      </div>
    );
  }

  if (state.extractedData) {
    return <IntakeSuccessView onContinue={handleContinue} />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <IntakeHeader />
      <DropZone onFiles={handleFiles} />
    </div>
  );
}
