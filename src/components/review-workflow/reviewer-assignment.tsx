"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Plus, ChevronDown, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthFetch } from "@/hooks/use-auth-fetch";

// ── Types ──────────────────────────────────────────────────────────────────

interface Reviewer {
  id: string;
  reviewer_id: string;
  full_name: string;
  email: string;
  status: string;
}

interface OrgMember {
  id: string;
  full_name: string;
  email: string;
}

interface ReviewerAssignmentProps {
  stageId: string;
  proposalId: string;
  reviewers: Reviewer[];
  onUpdate: () => void;
}

// ── Status Colors ──────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; dot: string; label: string }> = {
  pending: {
    bg: "rgba(148, 163, 184, 0.12)",
    dot: "#94a3b8",
    label: "Pending",
  },
  in_progress: {
    bg: "rgba(255, 170, 0, 0.12)",
    dot: "#ffaa00",
    label: "In Progress",
  },
  completed: {
    bg: "rgba(0, 255, 136, 0.12)",
    dot: "#00ff88",
    label: "Completed",
  },
};

function getStatusStyle(status: string) {
  return STATUS_STYLES[status] ?? STATUS_STYLES.pending;
}

// ── Component ──────────────────────────────────────────────────────────────

export function ReviewerAssignment({
  stageId,
  proposalId,
  reviewers,
  onUpdate,
}: ReviewerAssignmentProps) {
  const authFetch = useAuthFetch();
  const [showDropdown, setShowDropdown] = useState(false);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  // Fetch org members when dropdown opens
  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const res = await authFetch("/api/org/members");
      if (!res.ok) throw new Error("Failed to load members");
      const data = await res.json();
      setOrgMembers(data.members ?? data ?? []);
    } catch (_err) {
      toast.error("Could not load organization members");
    } finally {
      setLoadingMembers(false);
    }
  }, [authFetch]);

  const handleToggleDropdown = () => {
    if (!showDropdown) {
      fetchMembers();
    }
    setShowDropdown((prev) => !prev);
  };

  // Assign a reviewer
  const handleAssign = async (member: OrgMember) => {
    setAssigning(member.id);
    try {
      const res = await authFetch(
        `/api/proposals/${proposalId}/review-stages/${stageId}/reviewers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviewer_id: member.id }),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to assign reviewer");
      }
      toast.success(`${member.full_name} assigned as reviewer`);
      onUpdate();
      setShowDropdown(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Assignment failed");
    } finally {
      setAssigning(null);
    }
  };

  // Remove a reviewer
  const handleRemove = async (reviewer: Reviewer) => {
    setRemoving(reviewer.id);
    try {
      const res = await authFetch(
        `/api/proposals/${proposalId}/review-stages/${stageId}/reviewers`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviewer_id: reviewer.reviewer_id }),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to remove reviewer");
      }
      toast.success(`${reviewer.full_name} removed`);
      onUpdate();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Removal failed");
    } finally {
      setRemoving(null);
    }
  };

  // Members not already assigned
  const assignedIds = new Set(reviewers.map((r) => r.reviewer_id));
  const availableMembers = orgMembers.filter((m) => !assignedIds.has(m.id));

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">
          Assigned Reviewers
        </h3>
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={handleToggleDropdown}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border transition-colors"
            style={{
              borderColor: "var(--border)",
              color: "var(--accent)",
              backgroundColor: showDropdown ? "var(--accent-subtle)" : "transparent",
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Reviewer
            <ChevronDown className="h-3 w-3" />
          </button>

          {showDropdown && (
            <div
              className="absolute right-0 top-full mt-1 w-64 rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] shadow-lg z-50 overflow-hidden"
            >
              {loadingMembers ? (
                <div className="flex items-center justify-center gap-2 py-6 text-xs text-[var(--foreground-muted)]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading members...
                </div>
              ) : availableMembers.length === 0 ? (
                <div className="py-6 text-center text-xs text-[var(--foreground-subtle)]">
                  {orgMembers.length === 0
                    ? "No members found"
                    : "All members already assigned"}
                </div>
              ) : (
                <div className="max-h-52 overflow-y-auto">
                  {availableMembers.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      disabled={assigning === member.id}
                      onClick={() => handleAssign(member)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-[var(--card-hover)] transition-colors border-b border-[var(--border-subtle)] last:border-0"
                    >
                      <div
                        className="h-7 w-7 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "var(--accent-subtle)" }}
                      >
                        <User className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-[var(--foreground)] truncate">
                          {member.full_name}
                        </div>
                        <div className="text-[10px] text-[var(--foreground-subtle)] truncate">
                          {member.email}
                        </div>
                      </div>
                      {assigning === member.id && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--accent)]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reviewer pills */}
      <div className="flex flex-wrap gap-2">
        {reviewers.length === 0 && (
          <p className="text-xs text-[var(--foreground-subtle)] py-2">
            No reviewers assigned yet. Add reviewers to begin this stage.
          </p>
        )}
        {reviewers.map((reviewer) => {
          const style = getStatusStyle(reviewer.status);
          return (
            <div
              key={reviewer.id}
              className="inline-flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full text-xs font-medium border transition-colors"
              style={{
                backgroundColor: style.bg,
                borderColor: `${style.dot}30`,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{ backgroundColor: style.dot }}
              />
              <span className="text-[var(--foreground)]">
                {reviewer.full_name}
              </span>
              <span
                className="text-[10px]"
                style={{ color: style.dot }}
              >
                {style.label}
              </span>
              <button
                type="button"
                disabled={removing === reviewer.id}
                onClick={() => handleRemove(reviewer)}
                className="ml-0.5 p-0.5 rounded-full hover:bg-[var(--danger-subtle)] transition-colors"
                aria-label={`Remove ${reviewer.full_name}`}
              >
                {removing === reviewer.id ? (
                  <Loader2 className="h-3 w-3 animate-spin text-[var(--foreground-muted)]" />
                ) : (
                  <X className="h-3 w-3 text-[var(--foreground-muted)] hover:text-[var(--danger)]" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
