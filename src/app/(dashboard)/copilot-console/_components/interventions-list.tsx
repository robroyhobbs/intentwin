"use client";

import { ShieldAlert } from "lucide-react";
import { InterventionStatusBadge } from "./intervention-status-badge";
import type {
  ConsoleActionError,
  CopilotIntervention,
  ResolutionDecision,
} from "./types";

interface Props {
  interventions: CopilotIntervention[];
  pendingAction: string | null;
  actionError: ConsoleActionError | null;
  onResolve: (interventionId: string, action: ResolutionDecision) => Promise<void>;
  onResetFilters: () => void;
}

export function InterventionsList({
  interventions,
  pendingAction,
  actionError,
  onResolve,
  onResetFilters,
}: Props) {
  if (interventions.length === 0) {
    return <EmptyState onResetFilters={onResetFilters} />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-bg)]">
      <div className="grid grid-cols-12 gap-3 border-b border-[var(--border)] px-5 py-3 text-xs font-semibold uppercase text-[var(--foreground-subtle)]">
        <span className="col-span-4">Intervention</span>
        <span className="col-span-2">Assigned agent</span>
        <span className="col-span-2">Mode</span>
        <span className="col-span-2">Status</span>
        <span className="col-span-2 text-right">Actions</span>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {interventions.map((intervention) => (
          <InterventionRow
            key={intervention.id}
            intervention={intervention}
            actionError={actionError}
            pendingAction={pendingAction}
            onResolve={onResolve}
          />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ onResetFilters }: { onResetFilters: () => void }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-8 text-center">
      <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-[var(--background-tertiary)]">
        <ShieldAlert className="h-5 w-5 text-[var(--foreground-muted)]" />
      </div>
      <h2 className="text-balance text-base font-semibold text-[var(--foreground)]">
        No interventions found
      </h2>
      <p className="mt-2 text-pretty text-sm text-[var(--foreground-muted)]">
        Reset the current filters or wait for new copilot events to arrive.
      </p>
      <button
        type="button"
        onClick={onResetFilters}
        className="mt-4 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--background-tertiary)]"
      >
        Reset filters
      </button>
    </div>
  );
}

function InterventionRow({
  intervention,
  actionError,
  pendingAction,
  onResolve,
}: {
  intervention: CopilotIntervention;
  actionError: ConsoleActionError | null;
  pendingAction: string | null;
  onResolve: (interventionId: string, action: ResolutionDecision) => Promise<void>;
}) {
  const isPending = pendingAction === intervention.id;
  const rowError =
    actionError?.interventionId === intervention.id ? actionError.message : null;

  return (
    <div className="grid grid-cols-12 gap-3 px-5 py-4 text-sm">
      <InterventionDetails intervention={intervention} />
      <AgentCell assignedAgent={intervention.assignedAgent} />
      <ModeCell actionMode={intervention.actionMode} />
      <div className="col-span-2 flex items-start">
        <InterventionStatusBadge status={intervention.status} />
      </div>
      <InterventionActionCell
        intervention={intervention}
        isPending={isPending}
        rowError={rowError}
        onResolve={onResolve}
      />
    </div>
  );
}

function InterventionDetails({
  intervention,
}: {
  intervention: CopilotIntervention;
}) {
  return (
    <div className="col-span-4 min-w-0">
      <p className="font-medium text-[var(--foreground)]">
        {intervention.userSafeTitle ?? "Copilot intervention"}
      </p>
      <p className="mt-1 text-pretty text-sm text-[var(--foreground-muted)]">
        {intervention.userSafeMessage ?? intervention.internalReason}
      </p>
      <InterventionMetadata intervention={intervention} />
    </div>
  );
}

function InterventionMetadata({
  intervention,
}: {
  intervention: CopilotIntervention;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-3 text-xs tabular-nums text-[var(--foreground-subtle)]">
      <span>ID {intervention.id}</span>
      {intervention.proposalId ? <span>Proposal {intervention.proposalId}</span> : null}
      {intervention.opportunityId ? (
        <span>Opportunity {intervention.opportunityId}</span>
      ) : null}
    </div>
  );
}

function AgentCell({ assignedAgent }: { assignedAgent: string }) {
  return (
    <div className="col-span-2 flex items-start">
      <span className="rounded-full bg-[var(--background-tertiary)] px-3 py-1 text-xs capitalize text-[var(--foreground)]">
        {assignedAgent.replaceAll("-", " ")}
      </span>
    </div>
  );
}

function ModeCell({ actionMode }: { actionMode: string }) {
  return (
    <div className="col-span-2 flex items-start">
      <span className="capitalize text-[var(--foreground-muted)]">
        {actionMode.replaceAll("_", " ")}
      </span>
    </div>
  );
}

function InterventionActionCell({
  intervention,
  isPending,
  rowError,
  onResolve,
}: {
  intervention: CopilotIntervention;
  isPending: boolean;
  rowError: string | null;
  onResolve: (interventionId: string, action: ResolutionDecision) => Promise<void>;
}) {
  return (
    <div className="col-span-2 flex flex-col items-end gap-2">
      {intervention.status === "awaiting_approval" ? (
        <ApprovalActions
          interventionId={intervention.id}
          pending={isPending}
          onResolve={onResolve}
        />
      ) : (
        <span className="text-xs text-[var(--foreground-subtle)]">No action needed</span>
      )}
      {rowError ? (
        <p className="max-w-[180px] text-right text-xs text-red-300">{rowError}</p>
      ) : null}
    </div>
  );
}

function ApprovalActions({
  interventionId,
  pending,
  onResolve,
}: {
  interventionId: string;
  pending: boolean;
  onResolve: (interventionId: string, action: ResolutionDecision) => Promise<void>;
}) {
  return (
    <>
      <button
        type="button"
        onClick={() => void onResolve(interventionId, "reject")}
        disabled={pending}
        className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--foreground-muted)] transition hover:bg-[var(--background-tertiary)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        Reject
      </button>
      <button
        type="button"
        onClick={() => void onResolve(interventionId, "approve")}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Working" : "Approve"}
      </button>
    </>
  );
}
