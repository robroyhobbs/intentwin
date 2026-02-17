"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  History,
  RotateCcw,
  Tag,
  Clock,
  ChevronDown,
  ChevronUp,
  Save,
  FileText,
  Sparkles,
  CheckCircle2,
  Download,
  AlertCircle,
  X,
  Edit3,
} from "lucide-react";
import { useAuthFetch } from "@/hooks/use-auth-fetch";

interface Version {
  id: string;
  version_number: number;
  title: string;
  status: string;
  trigger_event: string;
  change_summary: string | null;
  label: string | null;
  created_at: string;
  section_count: number;
}

interface VersionHistoryProps {
  proposalId: string;
  onRestore?: () => void;
}

const TRIGGER_ICONS: Record<string, typeof History> = {
  intent_approved: CheckCircle2,
  generation_complete: Sparkles,
  section_edited: Edit3,
  manual_save: Save,
  pre_export: Download,
  pre_restore: RotateCcw,
  restored: RotateCcw,
};

const TRIGGER_LABELS: Record<string, string> = {
  intent_approved: "Intent Approved",
  generation_complete: "Generation Complete",
  section_edited: "Section Edited",
  manual_save: "Manual Save",
  pre_export: "Pre-Export",
  pre_restore: "Pre-Restore",
  restored: "Restored",
};

export function VersionHistory({ proposalId, onRestore }: VersionHistoryProps) {
  const router = useRouter();
  const authFetch = useAuthFetch();
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [labelInput, setLabelInput] = useState("");
  const [confirmRestore, setConfirmRestore] = useState<{
    id: string;
    number: number;
  } | null>(null);

  useEffect(() => {
    fetchVersions();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch on proposalId change only
  }, [proposalId]);

  async function fetchVersions() {
    try {
      const response = await authFetch(`/api/proposals/${proposalId}/versions`);
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions || []);
      }
    } catch (error) {
      console.error("Failed to fetch versions:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveVersion() {
    setSaving(true);
    try {
      const response = await authFetch(
        `/api/proposals/${proposalId}/versions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            change_summary: "Manual checkpoint",
          }),
        },
      );

      if (response.ok) {
        toast.success("Version saved");
        fetchVersions();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save version");
      }
    } catch (_error) {
      toast.error("Failed to save version");
    } finally {
      setSaving(false);
    }
  }

  async function handleRestore(versionId: string) {
    setConfirmRestore(null);
    setRestoring(versionId);
    try {
      const response = await authFetch(
        `/api/proposals/${proposalId}/versions/${versionId}/restore`,
        { method: "POST" },
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        fetchVersions();
        onRestore?.();
        router.refresh();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to restore version");
      }
    } catch (_error) {
      toast.error("Failed to restore version");
    } finally {
      setRestoring(null);
    }
  }

  async function handleUpdateLabel(versionId: string) {
    try {
      const response = await authFetch(
        `/api/proposals/${proposalId}/versions/${versionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label: labelInput || null }),
        },
      );

      if (response.ok) {
        toast.success("Label updated");
        fetchVersions();
      } else {
        toast.error("Failed to update label");
      }
    } catch (_error) {
      toast.error("Failed to update label");
    } finally {
      setEditingLabel(null);
      setLabelInput("");
    }
  }

  const displayVersions = expanded ? versions : versions.slice(0, 3);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-[var(--brand-primary)]" />
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            Version History
          </h3>
          <span className="text-xs text-[var(--foreground-muted)] bg-[var(--background-secondary)] px-2 py-0.5 rounded-full">
            {versions.length}
          </span>
        </div>
        <button
          onClick={handleSaveVersion}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/20 transition-colors disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? "Saving..." : "Save Version"}
        </button>
      </div>

      {/* Version List */}
      <div className="divide-y divide-[var(--border-subtle)]">
        {loading ? (
          <div className="p-4 text-center text-sm text-[var(--foreground-muted)]">
            Loading versions...
          </div>
        ) : versions.length === 0 ? (
          <div className="p-6 text-center">
            <AlertCircle className="h-8 w-8 text-[var(--foreground-muted)] mx-auto mb-2" />
            <p className="text-sm text-[var(--foreground-muted)]">
              No versions yet
            </p>
            <p className="text-xs text-[var(--foreground-muted)] mt-1">
              Versions are created automatically at key milestones
            </p>
          </div>
        ) : (
          <>
            {displayVersions.map((version, index) => {
              const TriggerIcon =
                TRIGGER_ICONS[version.trigger_event] || History;
              const isLatest = index === 0;
              const isRestoring = restoring === version.id;

              return (
                <div
                  key={version.id}
                  className={`px-4 py-3 ${isLatest ? "bg-[var(--brand-primary)]/5" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        isLatest
                          ? "bg-[var(--brand-primary)]/20 text-[var(--brand-primary)]"
                          : "bg-[var(--background-secondary)] text-[var(--foreground-muted)]"
                      }`}
                    >
                      <TriggerIcon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          v{version.version_number}
                        </span>
                        {isLatest && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--brand-primary)] text-white">
                            Current
                          </span>
                        )}
                        {version.label && editingLabel !== version.id && (
                          <span
                            onClick={() => {
                              setEditingLabel(version.id);
                              setLabelInput(version.label || "");
                            }}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] cursor-pointer hover:bg-[var(--brand-accent)]/20 transition-colors"
                          >
                            <Tag className="h-2.5 w-2.5 inline mr-1" />
                            {version.label}
                          </span>
                        )}
                        {editingLabel === version.id && (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={labelInput}
                              onChange={(e) => setLabelInput(e.target.value)}
                              placeholder="Label..."
                              className="text-xs px-2 py-1 rounded border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] w-24"
                              autoFocus
                            />
                            <button
                              onClick={() => handleUpdateLabel(version.id)}
                              className="p-1 text-[var(--success)] hover:bg-[var(--success)]/10 rounded"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingLabel(null);
                                setLabelInput("");
                              }}
                              className="p-1 text-[var(--foreground-muted)] hover:bg-[var(--border)] rounded"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                        {TRIGGER_LABELS[version.trigger_event] ||
                          version.trigger_event}
                        {version.change_summary &&
                          ` - ${version.change_summary}`}
                      </p>

                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[var(--foreground-muted)]">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(version.created_at).toLocaleString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {version.section_count} sections
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    {!isLatest && (
                      <button
                        onClick={() =>
                          setConfirmRestore({
                            id: version.id,
                            number: version.version_number,
                          })
                        }
                        disabled={isRestoring}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10 transition-colors disabled:opacity-50"
                      >
                        <RotateCcw
                          className={`h-3.5 w-3.5 ${isRestoring ? "animate-spin" : ""}`}
                        />
                        {isRestoring ? "Restoring..." : "Restore"}
                      </button>
                    )}
                    {!version.label && editingLabel !== version.id && (
                      <button
                        onClick={() => {
                          setEditingLabel(version.id);
                          setLabelInput("");
                        }}
                        className="p-1.5 text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)] rounded-lg transition-colors"
                        title="Add label"
                      >
                        <Tag className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Show More/Less */}
      {versions.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-center gap-1 w-full px-4 py-2 text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-colors border-t border-[var(--border)]"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              Show {versions.length - 3} more
            </>
          )}
        </button>
      )}

      {/* Restore Confirmation Modal */}
      {confirmRestore && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setConfirmRestore(null)}
        >
          <div
            className="card p-6 max-w-sm space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-[var(--foreground)]">
              Restore to version {confirmRestore.number}? Your current changes
              will be saved as a new version first.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmRestore(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRestore(confirmRestore.id)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand-primary)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
