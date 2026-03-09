"use client";

import {
  Bot,
  RefreshCw,
  ShieldCheck,
  Siren,
  type LucideIcon,
} from "lucide-react";
import { InterventionsList } from "./interventions-list";
import type {
  ConsoleActionError,
  ConsoleCounts,
  CopilotIntervention,
  InterventionStatus,
  ResolutionDecision,
} from "./types";

const STATUS_OPTIONS: Array<{ label: string; value: InterventionStatus | "all" }> = [
  { label: "All statuses", value: "all" },
  { label: "Open", value: "open" },
  { label: "Awaiting approval", value: "awaiting_approval" },
  { label: "Resolved", value: "resolved" },
];

export function ConsoleHeader({
  counts,
  loading,
  onRefresh,
}: {
  counts: ConsoleCounts;
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--accent-subtle)]">
            <Bot className="size-6 text-[var(--accent)]" />
          </div>
          <ConsoleIntro />
        </div>
        <RefreshButton loading={loading} onRefresh={onRefresh} />
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        <MetricCard icon={Siren} label="Open issues" value={counts.open} tone="amber" />
        <MetricCard
          icon={ShieldCheck}
          label="Awaiting approval"
          value={counts.awaitingApproval}
          tone="accent"
        />
        <MetricCard icon={Bot} label="Resolved" value={counts.resolved} tone="emerald" />
        <MetricCard icon={RefreshCw} label="Loaded" value={counts.total} tone="zinc" />
      </div>
    </div>
  );
}

export function ConsoleFilters({
  assignedAgent,
  status,
  onAssignedAgentChange,
  onStatusChange,
}: {
  assignedAgent: string;
  status: InterventionStatus | "all";
  onAssignedAgentChange: (value: string) => void;
  onStatusChange: (value: InterventionStatus | "all") => void;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <ConsoleFilterCopy />
      <div className="grid gap-4 sm:grid-cols-2">
        <StatusFilter value={status} onChange={onStatusChange} />
        <AssignedAgentFilter value={assignedAgent} onChange={onAssignedAgentChange} />
      </div>
    </div>
  );
}

export function ConsoleContent({
  actionError,
  interventions,
  loadError,
  loading,
  onResetFilters,
  pendingAction,
  onResolve,
}: {
  actionError: ConsoleActionError | null;
  interventions: CopilotIntervention[];
  loadError: string | null;
  loading: boolean;
  onResetFilters: () => void;
  pendingAction: string | null;
  onResolve: (interventionId: string, action: ResolutionDecision) => Promise<void>;
}) {
  if (loading) {
    return <LoadingState />;
  }

  if (loadError) {
    return <LoadErrorState message={loadError} />;
  }

  return (
    <InterventionsList
      actionError={actionError}
      interventions={interventions}
      onResetFilters={onResetFilters}
      pendingAction={pendingAction}
      onResolve={onResolve}
    />
  );
}

function ConsoleIntro() {
  return (
    <div>
      <h1 className="text-balance text-2xl font-semibold text-[var(--foreground)]">
        Copilot Console
      </h1>
      <p className="mt-1 max-w-2xl text-pretty text-sm text-[var(--foreground-muted)]">
        Review reliability interventions, clear approval queues, and monitor what
        IntentBid Copilot is doing behind the scenes.
      </p>
    </div>
  );
}

function RefreshButton({
  loading,
  onRefresh,
}: {
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--background-tertiary)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <RefreshCw className="h-4 w-4" />
      Refresh
    </button>
  );
}

function ConsoleFilterCopy() {
  return (
    <div>
      <h2 className="text-balance text-lg font-semibold text-[var(--foreground)]">
        Intervention queue
      </h2>
      <p className="mt-1 text-pretty text-sm text-[var(--foreground-muted)]">
        Focus this view by status or agent to triage the highest-risk issues first.
      </p>
    </div>
  );
}

function StatusFilter({
  value,
  onChange,
}: {
  value: InterventionStatus | "all";
  onChange: (value: InterventionStatus | "all") => void;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-[var(--foreground-muted)]">
      <span>Status</span>
      <select
        aria-label="Status"
        value={value}
        onChange={(event) => onChange(event.target.value as InterventionStatus | "all")}
        className="min-w-[180px] rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function AssignedAgentFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-[var(--foreground-muted)]">
      <span>Assigned agent</span>
      <input
        aria-label="Assigned agent"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="e.g. reliability-overseer"
        className="min-w-[220px] rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--foreground-subtle)] focus:border-[var(--accent)]"
      />
    </label>
  );
}

function LoadErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-800/30 bg-red-900/10 px-4 py-6">
      <p className="text-sm font-medium text-red-300">{message}</p>
      <p className="mt-1 text-pretty text-sm text-red-200/80">
        Check your access or try refreshing the console.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
      <p className="mb-4 text-sm text-[var(--foreground-muted)]">Loading interventions…</p>
      <div className="space-y-3">
        {[0, 1, 2].map((index) => (
          <LoadingRow key={index} />
        ))}
      </div>
    </div>
  );
}

function LoadingRow() {
  return (
    <div className="grid grid-cols-12 gap-3 rounded-xl border border-[var(--border)] p-4">
      <div className="col-span-4 space-y-2">
        <div className="h-4 rounded bg-[var(--background-tertiary)]" />
        <div className="h-3 rounded bg-[var(--background-tertiary)]" />
      </div>
      <div className="col-span-2 h-8 rounded bg-[var(--background-tertiary)]" />
      <div className="col-span-2 h-8 rounded bg-[var(--background-tertiary)]" />
      <div className="col-span-2 h-8 rounded bg-[var(--background-tertiary)]" />
      <div className="col-span-2 h-8 rounded bg-[var(--background-tertiary)]" />
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone: "accent" | "amber" | "emerald" | "zinc";
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
      <div className={`inline-flex rounded-xl p-2 ${getMetricToneClassName(tone)}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-4 text-2xl font-semibold tabular-nums text-[var(--foreground)]">
        {value}
      </p>
      <p className="mt-1 text-sm text-[var(--foreground-muted)]">{label}</p>
    </div>
  );
}

function getMetricToneClassName(tone: "accent" | "amber" | "emerald" | "zinc") {
  switch (tone) {
    case "accent":
      return "bg-[var(--accent-subtle)] text-[var(--accent)]";
    case "amber":
      return "bg-amber-900/20 text-amber-400";
    case "emerald":
      return "bg-emerald-900/20 text-emerald-400";
    default:
      return "bg-[var(--background-tertiary)] text-[var(--foreground)]";
  }
}
