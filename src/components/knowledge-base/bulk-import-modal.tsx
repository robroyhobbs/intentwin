"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
} from "lucide-react";
import { BulkImportReview, type ExtractedItems } from "./bulk-import-review";
import { BulkImportSummary, type ImportCounts } from "./bulk-import-summary";

// ── Types ──────────────────────────────────────────────────────────────────

type Step = "upload" | "processing" | "review" | "summary";

interface FileEntry {
  file: File;
  status: "pending" | "uploading" | "extracting" | "done" | "failed";
  error?: string;
  extractedItems?: ExtractedItems;
}

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

// ── Constants ──────────────────────────────────────────────────────────────

const MAX_FILES = 20;
const CONCURRENT_LIMIT = 3;

const ACCEPTED_TYPES = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [
    ".pptx",
  ],
  "text/plain": [".txt"],
  "text/markdown": [".md"],
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function mergeExtractedItems(entries: FileEntry[]): ExtractedItems {
  const merged: ExtractedItems = {
    company_context: [],
    product_contexts: [],
    evidence_library: [],
  };

  for (const entry of entries) {
    if (entry.extractedItems) {
      merged.company_context.push(...entry.extractedItems.company_context);
      merged.product_contexts.push(...entry.extractedItems.product_contexts);
      merged.evidence_library.push(...entry.extractedItems.evidence_library);
    }
  }

  // Deduplicate
  const seenCC = new Set<string>();
  merged.company_context = merged.company_context.filter((item) => {
    const key = `${item.category}:${item.key}`;
    if (seenCC.has(key)) return false;
    seenCC.add(key);
    return true;
  });

  const seenPC = new Set<string>();
  merged.product_contexts = merged.product_contexts.filter((item) => {
    const key = `${item.product_name}:${item.service_line}`;
    if (seenPC.has(key)) return false;
    seenPC.add(key);
    return true;
  });

  const seenEL = new Set<string>();
  merged.evidence_library = merged.evidence_library.filter((item) => {
    if (seenEL.has(item.title)) return false;
    seenEL.add(item.title);
    return true;
  });

  return merged;
}

const statusIcon: Record<FileEntry["status"], React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-[var(--foreground-subtle)]" />,
  uploading: <Loader2 className="h-4 w-4 text-[var(--info)] animate-spin" />,
  extracting: <Loader2 className="h-4 w-4 text-[var(--accent)] animate-spin" />,
  done: <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />,
  failed: <AlertCircle className="h-4 w-4 text-[var(--danger)]" />,
};

const statusLabel: Record<FileEntry["status"], string> = {
  pending: "Pending",
  uploading: "Uploading...",
  extracting: "Extracting...",
  done: "Done",
  failed: "Failed",
};

// ── Component ──────────────────────────────────────────────────────────────

export function BulkImportModal({
  isOpen,
  onClose,
  onComplete,
}: BulkImportModalProps) {
  const authFetch = useAuthFetch();
  const [step, setStep] = useState<Step>("upload");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [processing, setProcessing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [mergedItems, setMergedItems] = useState<ExtractedItems | null>(null);
  const [importCounts, setImportCounts] = useState<ImportCounts | null>(null);

  // ── Drop zone ──

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const currentCount = files.length;
      const remaining = MAX_FILES - currentCount;

      if (remaining <= 0) {
        toast.error(`Maximum ${MAX_FILES} files allowed`);
        return;
      }

      const toAdd = acceptedFiles.slice(0, remaining);
      if (toAdd.length < acceptedFiles.length) {
        toast.error(
          `Only ${remaining} more file(s) can be added (max ${MAX_FILES})`,
        );
      }

      // Filter empty files
      const validFiles = toAdd.filter((f) => {
        if (f.size === 0) {
          toast.error(`${f.name}: File is empty`);
          return false;
        }
        return true;
      });

      setFiles((prev) => [
        ...prev,
        ...validFiles.map((file) => ({ file, status: "pending" as const })),
      ]);
    },
    [files.length],
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: ACCEPTED_TYPES,
      maxFiles: MAX_FILES,
      disabled: processing,
    });

  // Show file rejection errors
  if (fileRejections.length > 0) {
    fileRejections.forEach((rej) => {
      const msg =
        rej.errors[0]?.message || `${rej.file.name}: Unsupported file type`;
      toast.error(msg);
    });
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Processing ──

  async function processFile(
    entry: FileEntry,
    index: number,
  ): Promise<FileEntry> {
    try {
      // Step 1: Upload as L2 document
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: "uploading" as const } : f,
        ),
      );

      const formData = new FormData();
      formData.append("file", entry.file);
      formData.append(
        "title",
        entry.file.name.replace(/\.(docx|pdf|pptx|txt|md)$/i, ""),
      );
      formData.append("document_type", "other");

      const uploadRes = await authFetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Upload failed");
      }

      // Consume the upload response (we don't need parsedText from it)
      await uploadRes.json();

      // Step 2: Extract L1 data — send the file directly to the extract endpoint
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: "extracting" as const } : f,
        ),
      );

      const extractFormData = new FormData();
      extractFormData.append("file", entry.file);

      const extractRes = await authFetch("/api/bulk-import/extract", {
        method: "POST",
        body: extractFormData,
      });

      if (!extractRes.ok) {
        // L2 still saved, but L1 extraction failed — show as failed so user knows
        const err = await extractRes.json().catch(() => ({}));
        const errMsg = (err as { error?: string }).error || "Extraction failed";
        const displayMsg = `${errMsg} (file saved, but no L1 data extracted)`;
        setFiles((prev) =>
          prev.map((f, i) =>
            i === index
              ? { ...f, status: "failed" as const, error: displayMsg }
              : f,
          ),
        );
        return { ...entry, status: "failed", error: displayMsg };
      }

      const extractedItems = (await extractRes.json()) as ExtractedItems;

      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: "done" as const, extractedItems } : f,
        ),
      );

      return { ...entry, status: "done", extractedItems };
    } catch (error) {
      const errMsg =
        error instanceof Error ? error.message : "Processing failed";
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: "failed" as const, error: errMsg } : f,
        ),
      );
      return { ...entry, status: "failed", error: errMsg };
    }
  }

  async function startProcessing() {
    setProcessing(true);
    setStep("processing");

    const results: FileEntry[] = [...files];
    let hitPlanLimit = false;

    // Sliding window: process CONCURRENT_LIMIT files at a time
    for (let i = 0; i < files.length; i += CONCURRENT_LIMIT) {
      if (hitPlanLimit) {
        // Mark remaining files as failed with plan limit message
        for (let j = i; j < files.length; j++) {
          results[j] = {
            ...files[j],
            status: "failed",
            error: "Skipped — document limit reached",
          };
        }
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx >= i
              ? {
                  ...f,
                  status: "failed" as const,
                  error: "Skipped — document limit reached",
                }
              : f,
          ),
        );
        break;
      }

      const batch = files.slice(i, i + CONCURRENT_LIMIT);
      const batchResults = await Promise.all(
        batch.map((entry, batchIdx) => processFile(entry, i + batchIdx)),
      );
      batchResults.forEach((result, batchIdx) => {
        results[i + batchIdx] = result;
        if (
          result.error?.toLowerCase().includes("limit") ||
          result.error?.toLowerCase().includes("upgrade")
        ) {
          hitPlanLimit = true;
        }
      });
    }

    if (hitPlanLimit) {
      toast.error(
        "Document limit reached on your current plan. Upgrade your plan to import more files.",
      );
    }

    // Merge all extracted items
    const merged = mergeExtractedItems(results);
    setMergedItems(merged);
    setProcessing(false);
    setStep("review");
  }

  // ── Commit ──

  async function handleAccept(selected: ExtractedItems) {
    setCommitting(true);
    try {
      const res = await authFetch("/api/bulk-import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_context: selected.company_context.map(
            ({ isConflict: _, existingValue: __, ...rest }) => rest,
          ),
          product_contexts: selected.product_contexts.map(
            ({ isConflict: _, existingValue: __, ...rest }) => rest,
          ),
          evidence_library: selected.evidence_library.map(
            ({ isConflict: _, existingValue: __, ...rest }) => rest,
          ),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error || "Failed to save items",
        );
      }

      const data = (await res.json()) as { counts: ImportCounts };
      setImportCounts(data.counts);
      setStep("summary");
      toast.success("Items imported successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save items",
      );
    } finally {
      setCommitting(false);
    }
  }

  // ── Close/Reset ──

  function handleClose() {
    if (processing) {
      if (
        !confirm("Processing is in progress. Are you sure you want to close?")
      ) {
        return;
      }
    }
    setStep("upload");
    setFiles([]);
    setMergedItems(null);
    setImportCounts(null);
    setProcessing(false);
    setCommitting(false);
    onClose();
    if (step === "summary") {
      onComplete?.();
    }
  }

  if (!isOpen) return null;

  // ── Render ──

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleClose}
    >
      <div
        className="relative bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-subtle)] border border-[var(--accent-muted)]">
              <Layers className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--foreground)]">
                Bulk Import
              </h2>
              <p className="text-xs text-[var(--foreground-muted)]">
                {step === "upload" && "Select files to import"}
                {step === "processing" && "Processing files..."}
                {step === "review" && "Review extracted items"}
                {step === "summary" && "Import complete"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 hover:bg-[var(--background-tertiary)] transition-colors"
          >
            <X className="h-5 w-5 text-[var(--foreground-muted)]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* STEP: Upload */}
          {step === "upload" && (
            <div className="space-y-4">
              {/* Drop zone */}
              <div
                {...getRootProps()}
                className={`rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-[var(--accent)] bg-[var(--accent-subtle)]"
                    : "border-[var(--border)] hover:border-[var(--foreground-subtle)]"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-10 w-10 text-[var(--foreground-subtle)]" />
                <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                  {isDragActive
                    ? "Drop files here"
                    : "Drag and drop files, or click to browse"}
                </p>
                <p className="mt-1 text-xs text-[var(--foreground-subtle)]">
                  DOCX, PDF, PPTX, TXT, MD (max {MAX_FILES} files)
                </p>
              </div>

              {/* File list */}
              {files.length > 0 && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] divide-y divide-[var(--border)]">
                  {files.map((entry, i) => (
                    <div
                      key={`${entry.file.name}-${i}`}
                      className="flex items-center justify-between px-4 py-2.5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-4 w-4 flex-shrink-0 text-[var(--foreground-subtle)]" />
                        <div className="min-w-0">
                          <p className="text-sm text-[var(--foreground)] truncate">
                            {entry.file.name}
                          </p>
                          <p className="text-xs text-[var(--foreground-muted)]">
                            {formatFileSize(entry.file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(i)}
                        className="flex-shrink-0 rounded-full p-1 hover:bg-[var(--background-tertiary)]"
                      >
                        <X className="h-3.5 w-3.5 text-[var(--foreground-muted)]" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              {files.length > 0 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-[var(--foreground-muted)]">
                    {files.length} file{files.length !== 1 ? "s" : ""} selected
                  </p>
                  <button
                    onClick={startProcessing}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Import {files.length} File{files.length !== 1 ? "s" : ""}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP: Processing */}
          {step === "processing" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <Loader2 className="h-4 w-4 text-[var(--accent)] animate-spin" />
                <p className="text-sm text-[var(--foreground-muted)]">
                  Processing {files.length} files ({CONCURRENT_LIMIT} at a
                  time)...
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] divide-y divide-[var(--border)]">
                {files.map((entry, i) => (
                  <div
                    key={`${entry.file.name}-${i}`}
                    className="flex items-center justify-between px-4 py-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {statusIcon[entry.status]}
                      <p className="text-sm text-[var(--foreground)] truncate">
                        {entry.file.name}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        entry.status === "done"
                          ? "text-[var(--success)]"
                          : entry.status === "failed"
                            ? "text-[var(--danger)]"
                            : "text-[var(--foreground-muted)]"
                      }`}
                    >
                      {entry.error || statusLabel[entry.status]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP: Review */}
          {step === "review" && mergedItems && (
            <BulkImportReview
              items={mergedItems}
              onAccept={handleAccept}
              onCancel={handleClose}
              committing={committing}
            />
          )}

          {/* STEP: Summary */}
          {step === "summary" && importCounts && (
            <BulkImportSummary counts={importCounts} onClose={handleClose} />
          )}
        </div>
      </div>
    </div>
  );
}
