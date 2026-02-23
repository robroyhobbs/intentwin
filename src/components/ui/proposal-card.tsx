"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Play, Download, ArrowUpRight, Trash2, Loader2 } from "lucide-react";
import { SectionStatusBadge } from "./section-status-badge";
import { ProposalStatus } from "@/lib/constants/statuses";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { toast } from "sonner";

interface ProposalCardProps {
  id: string;
  title: string;
  status: string;
  clientName: string;
  opportunityType: string;
  createdAt: string;
  sectionCount?: number;
  completedSections?: number;
}

const QUICK_ACTIONS: Record<string, { label: string; icon: typeof Play }> = {
  [ProposalStatus.INTAKE]: { label: "Continue", icon: Play },
  [ProposalStatus.DRAFT]: { label: "Generate", icon: Play },
  [ProposalStatus.REVIEW]: { label: "Export", icon: Download },
  [ProposalStatus.EXPORTED]: { label: "View", icon: FileText },
};

export function ProposalCard({
  id,
  title,
  status,
  clientName,
  opportunityType,
  createdAt,
  sectionCount = 0,
  completedSections = 0,
}: ProposalCardProps) {
  const progress = sectionCount > 0 ? (completedSections / sectionCount) * 100 : 0;
  const action = QUICK_ACTIONS[status];
  const [deleting, setDeleting] = useState(false);
  const authFetch = useAuthFetch();
  const router = useRouter();

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Delete "${title}"? This will permanently remove the proposal and all its sections. This cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await authFetch(`/api/proposals/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to delete");
      }

      toast.success("Proposal deleted");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete proposal");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Link
      href={`/proposals/${id}`}
      className="group relative block rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm transition-all duration-200 hover:border-[var(--accent)] hover:shadow-[var(--shadow-glow)] hover:-translate-y-1"
    >
      {/* Top accent line */}
      <div className="h-0.5 rounded-t-xl bg-[var(--accent)]" />

      {/* Delete button — visible on hover */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="absolute top-3 right-3 z-10 rounded-lg p-1.5 text-[var(--foreground-subtle)] opacity-0 group-hover:opacity-100 hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-all disabled:opacity-50"
        title="Delete proposal"
      >
        {deleting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
      </button>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-semibold text-[var(--foreground)] truncate group-hover:text-[var(--accent)] transition-colors">
              {title}
            </h3>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              {clientName}
              {opportunityType && (
                <span className="ml-2 text-[var(--foreground-subtle)]">
                  &middot; {opportunityType.replace(/_/g, " ")}
                </span>
              )}
            </p>
          </div>

          <SectionStatusBadge generationStatus={status as "pending" | "generating" | "completed" | "failed"} />
        </div>

        {/* Progress bar */}
        {sectionCount > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[var(--foreground-muted)]">
                {completedSections}/{sectionCount} sections
              </span>
              <span className="font-medium text-[var(--accent)]">{Math.round(progress)}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
          <span className="text-xs text-[var(--foreground-muted)]">
            {new Date(createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          {action && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity">
              {action.label}
              <ArrowUpRight className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
