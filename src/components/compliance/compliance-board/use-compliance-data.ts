"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import type { Requirement, RequirementType, ComplianceSummary, ComplianceAssessmentStatus } from "./types";

export function useComplianceData(proposalId: string) {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [summary, setSummary] = useState<ComplianceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [assessmentStatus, setAssessmentStatus] = useState<ComplianceAssessmentStatus | null>(null);
  const [assessing, setAssessing] = useState(false);
  const notesTimerRef = useRef<Record<string, NodeJS.Timeout>>({});
  const assessPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const authFetch = useAuthFetch();

  const fetchRequirements = useCallback(async () => {
    try {
      const res = await authFetch(`/api/proposals/${proposalId}/requirements`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRequirements(data.requirements || []);
      setSummary(data.summary || null);
    } catch {
      toast.error("Failed to load requirements");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- authFetch returns new ref each render
  }, [proposalId]);

  useEffect(() => {
    fetchRequirements();
  }, [fetchRequirements]);

  // ── Drag end handler ───────────────────────────────────────────────────

  async function handleDragEnd(
    reqId: string,
    newStatus: Requirement["compliance_status"],
  ) {
    const req = requirements.find((r) => r.id === reqId);
    if (!req || req.compliance_status === newStatus) return;

    const prevRequirements = [...requirements];
    setRequirements((prev) =>
      prev.map((r) =>
        r.id === reqId ? { ...r, compliance_status: newStatus } : r,
      ),
    );

    try {
      const res = await authFetch(`/api/proposals/${proposalId}/requirements`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: [{ id: reqId, compliance_status: newStatus }],
        }),
      });
      if (!res.ok) throw new Error("Update failed");
      fetchRequirements();
    } catch {
      setRequirements(prevRequirements);
      toast.error("Failed to update status. Reverted.");
    }
  }

  // ── Status change (for checklist view) ─────────────────────────────────

  async function handleStatusChange(
    reqId: string,
    newStatus: Requirement["compliance_status"],
  ) {
    const req = requirements.find((r) => r.id === reqId);
    if (!req || req.compliance_status === newStatus) return;

    // Optimistic update
    setRequirements((prev) =>
      prev.map((r) =>
        r.id === reqId ? { ...r, compliance_status: newStatus } : r,
      ),
    );

    try {
      const res = await authFetch(`/api/proposals/${proposalId}/requirements`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: [{ id: reqId, compliance_status: newStatus }],
        }),
      });
      if (!res.ok) throw new Error("Update failed");
      fetchRequirements();
    } catch {
      fetchRequirements(); // revert via refetch
      toast.error("Failed to update status");
    }
  }

  // ── Generic field update (type, section mapping, etc.) ─────────────────

  async function handleFieldUpdate(
    reqId: string,
    field: string,
    value: string | null,
  ) {
    // Optimistic update
    setRequirements((prev) =>
      prev.map((r) =>
        r.id === reqId ? { ...r, [field]: value } : r,
      ),
    );

    try {
      const res = await authFetch(`/api/proposals/${proposalId}/requirements`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: [{ id: reqId, [field]: value }],
        }),
      });
      if (!res.ok) throw new Error("Update failed");
      fetchRequirements();
    } catch {
      fetchRequirements();
      toast.error(`Failed to update ${field}`);
    }
  }

  // ── Add requirement ────────────────────────────────────────────────────

  async function handleAdd(
    text: string,
    category: "mandatory" | "desirable" | "informational",
    requirementType?: RequirementType,
  ): Promise<boolean> {
    if (!text.trim()) {
      toast.error("Requirement text is required");
      return false;
    }

    try {
      const res = await authFetch(`/api/proposals/${proposalId}/requirements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirement_text: text.trim(),
          category,
          requirement_type: requirementType || "content",
        }),
      });
      if (!res.ok) throw new Error("Failed to add");
      toast.success("Requirement added");
      fetchRequirements();
      return true;
    } catch {
      toast.error("Failed to add requirement");
      return false;
    }
  }

  // ── Notes (debounced) ──────────────────────────────────────────────────

  function handleNotesChange(reqId: string, notes: string) {
    if (notesTimerRef.current[reqId]) {
      clearTimeout(notesTimerRef.current[reqId]);
    }
    notesTimerRef.current[reqId] = setTimeout(async () => {
      try {
        await authFetch(`/api/proposals/${proposalId}/requirements`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updates: [{ id: reqId, notes }] }),
        });
      } catch {
        toast.error("Failed to save notes");
      }
    }, 800);
  }

  // ── Assessment ──────────────────────────────────────────────────────────

  const fetchAssessmentStatus = useCallback(async () => {
    try {
      const res = await authFetch(`/api/proposals/${proposalId}/compliance-assessment`);
      if (res.ok) {
        const data = await res.json();
        setAssessmentStatus(data.assessment || null);
        return data.assessment as ComplianceAssessmentStatus | null;
      }
    } catch {
      // Non-critical
    }
    return null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalId]);

  // Fetch assessment status on mount
  useEffect(() => {
    fetchAssessmentStatus();
  }, [fetchAssessmentStatus]);

  // Cleanup poll on unmount
  useEffect(() => {
    return () => {
      if (assessPollRef.current) clearInterval(assessPollRef.current);
    };
  }, []);

  async function handleRunAssessment() {
    if (assessing) return;
    setAssessing(true);

    try {
      const res = await authFetch(`/api/proposals/${proposalId}/compliance-assessment`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Assessment failed");
      }

      toast.success("Auto-assessment started...");
      setAssessmentStatus({ status: "assessing" });

      // Poll for completion
      if (assessPollRef.current) clearInterval(assessPollRef.current);
      assessPollRef.current = setInterval(async () => {
        const status = await fetchAssessmentStatus();
        if (status && status.status !== "assessing") {
          if (assessPollRef.current) {
            clearInterval(assessPollRef.current);
            assessPollRef.current = null;
          }
          setAssessing(false);
          if (status.status === "completed") {
            toast.success(`Auto-assessment complete: ${status.results_applied || 0} requirements updated`);
            fetchRequirements(); // Refresh to show updated statuses
          } else if (status.status === "failed") {
            toast.error(`Assessment failed: ${status.error || "Unknown error"}`);
          }
        }
      }, 3000);
    } catch (err) {
      setAssessing(false);
      toast.error(err instanceof Error ? err.message : "Assessment failed");
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────

  async function handleDelete(reqId: string) {
    if (deleteConfirm !== reqId) {
      setDeleteConfirm(reqId);
      return;
    }

    try {
      const res = await authFetch(
        `/api/proposals/${proposalId}/requirements?reqId=${reqId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Requirement deleted");
      setDeleteConfirm(null);
      setExpandedCard(null);
      fetchRequirements();
    } catch {
      toast.error("Failed to delete requirement");
    }
  }

  return {
    requirements,
    summary,
    loading,
    expandedCard,
    setExpandedCard,
    deleteConfirm,
    setDeleteConfirm,
    handleDragEnd,
    handleAdd,
    handleNotesChange,
    handleDelete,
    handleStatusChange,
    handleFieldUpdate,
    assessmentStatus,
    assessing,
    handleRunAssessment,
  };
}
