"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import type {
  ConsoleActionError,
  ConsoleCounts,
  CopilotIntervention,
  InterventionStatus,
  ResolutionDecision,
} from "./types";

const LIMIT = 25;

type SetActionError = Dispatch<SetStateAction<ConsoleActionError | null>>;

export function useCopilotConsole() {
  const authFetch = useAuthFetch();
  const [status, setStatus] = useState<InterventionStatus | "all">("all");
  const [assignedAgent, setAssignedAgent] = useState("");
  const [actionError, setActionError] = useState<ConsoleActionError | null>(null);
  const queryString = useMemo(
    () => buildInterventionsQuery(status, assignedAgent),
    [assignedAgent, status],
  );
  const { interventions, loading, loadError, loadInterventions } =
    useInterventionLoader(authFetch, queryString, setActionError);
  const { pendingAction, resolveIntervention } = useInterventionResolver(
    authFetch,
    loadInterventions,
    setActionError,
  );
  const counts = useMemo(() => countInterventions(interventions), [interventions]);
  const resetFilters = useCallback(() => {
    setStatus("all");
    setAssignedAgent("");
  }, []);

  return {
    actionError,
    assignedAgent,
    counts,
    interventions,
    loadError,
    loading,
    pendingAction,
    resetFilters,
    resolveIntervention,
    setAssignedAgent,
    setStatus,
    status,
    refreshInterventions: () => void loadInterventions(),
  };
}

function useInterventionLoader(
  authFetch: ReturnType<typeof useAuthFetch>,
  queryString: string,
  setActionError: SetActionError,
) {
  const [interventions, setInterventions] = useState<CopilotIntervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadInterventions = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setActionError(null);

    try {
      const response = await authFetch(`/api/copilot/interventions?${queryString}`);
      const payload = (await response.json()) as
        | { interventions?: CopilotIntervention[]; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to load interventions");
      }

      setInterventions(payload?.interventions ?? []);
    } catch (error) {
      setInterventions([]);
      setLoadError(getErrorMessage(error, "Failed to load interventions"));
    } finally {
      setLoading(false);
    }
  }, [authFetch, queryString, setActionError]);

  useEffect(() => {
    void loadInterventions();
  }, [loadInterventions]);

  return { interventions, loading, loadError, loadInterventions };
}

function useInterventionResolver(
  authFetch: ReturnType<typeof useAuthFetch>,
  loadInterventions: () => Promise<void>,
  setActionError: SetActionError,
) {
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const resolveIntervention = useCallback(
    async (interventionId: string, action: ResolutionDecision) => {
      if (shouldCancelResolution(action)) {
        return;
      }

      setPendingAction(interventionId);
      setActionError(null);

      try {
        const response = await authFetch(
          `/api/copilot/interventions/${interventionId}/approve`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
          },
        );
        const payload = (await response.json()) as { error?: string } | null;

        if (!response.ok) {
          throw new Error(payload?.error || "Failed to resolve intervention");
        }

        toast.success(
          action === "approve" ? "Intervention approved" : "Intervention rejected",
        );
        await loadInterventions();
      } catch (error) {
        const message = getErrorMessage(error, "Failed to resolve intervention");
        setActionError({ interventionId, message });
        toast.error(message);
      } finally {
        setPendingAction(null);
      }
    },
    [authFetch, loadInterventions, setActionError],
  );

  return { pendingAction, resolveIntervention };
}

function buildInterventionsQuery(
  status: InterventionStatus | "all",
  assignedAgent: string,
) {
  const params = new URLSearchParams();

  if (status !== "all") {
    params.set("status", status);
  }

  const trimmedAgent = assignedAgent.trim();
  if (trimmedAgent) {
    params.set("assignedAgent", trimmedAgent);
  }

  params.set("limit", String(LIMIT));
  return params.toString();
}

function countInterventions(interventions: CopilotIntervention[]): ConsoleCounts {
  return interventions.reduce(
    (acc, intervention) => {
      acc.total += 1;
      if (intervention.status === "awaiting_approval") {
        acc.awaitingApproval += 1;
      }
      if (intervention.status === "open") {
        acc.open += 1;
      }
      if (intervention.status === "resolved") {
        acc.resolved += 1;
      }
      return acc;
    },
    { total: 0, open: 0, awaitingApproval: 0, resolved: 0 },
  );
}

function shouldCancelResolution(action: ResolutionDecision) {
  return (
    action === "reject" &&
    typeof window !== "undefined" &&
    !window.confirm("Reject this copilot intervention?")
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
