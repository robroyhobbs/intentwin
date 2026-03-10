"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Upload,
  FileText,
  MessageSquare,
  Edit3,
  Search,
  X,
  Loader2,
  Sparkles,
  File,
  CheckCircle2,
  Circle,
  Link2,
} from "lucide-react";
import type {
  IntakeMode,
  ExtractedIntake,
  ClientResearch,
} from "@/types/intake";
import {
  DOCUMENT_ROLES,
  DOCUMENT_ROLE_LABELS,
  DOCUMENT_ROLE_DESCRIPTIONS,
  type DocumentRole,
} from "@/types/proposal-documents";
import { ProcessingStatus } from "@/lib/constants/statuses";
import { logger } from "@/lib/utils/logger";

interface FlexibleIntakeProps {
  onExtracted: (data: ExtractedIntake, research: ClientResearch | null) => void;
  onManualEntry: () => void;
}

export function FlexibleIntake({
  onExtracted,
  onManualEntry,
}: FlexibleIntakeProps) {
  const [mode, setMode] = useState<IntakeMode | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedDocIds, setUploadedDocIds] = useState<string[]>([]);
  const [pastedContent, setPastedContent] = useState("");
  const [verbalDescription, setVerbalDescription] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [urlFetching, setUrlFetching] = useState(false);
  const [urlFetched, setUrlFetched] = useState(false);
  const [researchEnabled, setResearchEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<
    "extracting" | "researching" | null
  >(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Elapsed timer — ticks every second while processing
  useEffect(() => {
    if (isProcessing) {
      setElapsedSeconds(0);
      elapsedRef.current = setInterval(
        () => setElapsedSeconds((s) => s + 1),
        1000,
      );
    } else if (elapsedRef.current) {
      clearInterval(elapsedRef.current);
      elapsedRef.current = null;
    }
    return () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, [isProcessing]);

  const [uploadProgress, setUploadProgress] = useState<Record<string, string>>(
    {},
  );
  // documentRoles maps file.name → { docId, role }
  // Auto-assigns primary_rfp to the first successfully uploaded file, supplemental to the rest.
  const [documentRoles, setDocumentRoles] = useState<
    Record<string, { docId: string; role: DocumentRole }>
  >({});
  const [error, setError] = useState<string | null>(null);

  const handleFileDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const droppedFiles = Array.from(e.dataTransfer.files);
      await handleFiles(droppedFiles);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleFiles is stable
    [],
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files);
        await handleFiles(selectedFiles);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleFiles is stable
    [],
  );

  // Poll for document processing completion
  // Returns { success, error? } so the caller can surface server-side messages
  // Uses progressive backoff: 1s intervals for first 30s, then 2s for next 90s
  const pollDocumentStatus = async (
    docId: string,
    fileName: string,
  ): Promise<{ success: boolean; error?: string }> => {
    const MAX_POLL_MS = 120_000; // 2 minutes max
    const startedAt = Date.now();

    while (Date.now() - startedAt < MAX_POLL_MS) {
      try {
        const response = await fetch(`/api/documents/${docId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.processing_status === ProcessingStatus.COMPLETED) {
            return { success: true };
          }
          if (data.processing_status === ProcessingStatus.FAILED) {
            logger.error("Document processing failed", undefined, {
              fileName,
              processingError: data.processing_error,
            });
            return {
              success: false,
              error: data.processing_error || undefined,
            };
          }
        }
      } catch (e) {
        logger.error("Error polling document status", e);
      }
      // Progressive backoff: 1s for first 30s, then 2s after
      const elapsed = Date.now() - startedAt;
      const delay = elapsed < 30_000 ? 1000 : 2000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    return {
      success: false,
      error:
        "Processing timed out. Large documents may take longer — please refresh the page in a minute to check.",
    };
  };

  const handleFiles = async (newFiles: File[]) => {
    setError(null);
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];

    const validFiles = newFiles.filter((f) => validTypes.includes(f.type));
    if (validFiles.length !== newFiles.length) {
      setError(
        "Some files were skipped. Supported formats: PDF, DOCX, PPTX, XLSX, TXT",
      );
    }

    setFiles((prev) => [...prev, ...validFiles]);

    // Upload each file
    for (const file of validFiles) {
      setUploadProgress((prev) => ({ ...prev, [file.name]: "uploading" }));

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", file.name);
        formData.append("document_type", "rfp");

        const response = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const data = await response.json();
        setUploadedDocIds((prev) => {
          // First successfully uploaded file gets primary_rfp; subsequent get supplemental
          const isFirst = prev.length === 0;
          setDocumentRoles((roles) => ({
            ...roles,
            [file.name]: {
              docId: data.documentId,
              role: isFirst ? "primary_rfp" : "supplemental",
            },
          }));
          return [...prev, data.documentId];
        });
        setUploadProgress((prev) => ({ ...prev, [file.name]: "processing" }));

        // Poll for processing completion
        const result = await pollDocumentStatus(data.documentId, file.name);
        if (result.success) {
          setUploadProgress((prev) => ({ ...prev, [file.name]: "done" }));
        } else {
          setUploadProgress((prev) => ({ ...prev, [file.name]: "error" }));
          const detail = result.error
            ? `${file.name}: ${result.error}`
            : `Failed to process ${file.name}. Try pasting the content directly or using a different file.`;
          setError(detail);
        }
      } catch {
        setUploadProgress((prev) => ({ ...prev, [file.name]: "error" }));
        setError(`Failed to upload ${file.name}`);
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    // Note: We don't remove from uploadedDocIds to keep uploaded files available
  };

  const handleAnalyze = async () => {
    setIsProcessing(true);
    setProcessingStep("extracting");
    setError(null);

    try {
      // Determine content and type
      let content = "";
      let contentType: "file" | "pasted" | "verbal" = "pasted";

      if (mode === "upload" && uploadedDocIds.length > 0) {
        contentType = "file";
      } else if (mode === "paste") {
        content = pastedContent;
        contentType = "pasted";
      } else if (mode === "describe") {
        content = verbalDescription;
        contentType = "verbal";
      } else if (mode === "url") {
        content = pastedContent; // already fetched and stored in pastedContent
        contentType = "pasted";
      }

      // Build document_roles map when multiple files uploaded (enables role-aware extraction)
      const roleMap: Record<string, DocumentRole> | undefined =
        uploadedDocIds.length > 1
          ? Object.fromEntries(
              Object.values(documentRoles).map(({ docId, role }) => [
                docId,
                role,
              ]),
            )
          : undefined;

      // Call extraction API
      const extractResponse = await fetch("/api/intake/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          document_ids: uploadedDocIds.length > 0 ? uploadedDocIds : undefined,
          document_roles: roleMap,
          content_type: contentType,
        }),
      });

      if (!extractResponse.ok) {
        let errorMessage = "Extraction failed";
        try {
          const err = await extractResponse.json();
          errorMessage = err.error || errorMessage;
        } catch {
          // Non-JSON response (e.g., Vercel timeout HTML page)
          if (
            extractResponse.status === 504 ||
            extractResponse.status === 502
          ) {
            errorMessage =
              "The analysis timed out. Please try again — large documents may take a moment.";
          }
        }
        throw new Error(errorMessage);
      }

      const { extracted } = await extractResponse.json();

      // Validate extracted structure (AI may return partial data for non-RFP docs)
      if (!extracted || typeof extracted !== "object") {
        throw new Error("Extraction returned invalid data");
      }
      if (!extracted.extracted) extracted.extracted = {};
      if (!extracted.inferred) extracted.inferred = {};
      if (!extracted.gaps) extracted.gaps = [];
      if (!extracted.input_type) extracted.input_type = "other";
      if (!extracted.input_summary)
        extracted.input_summary = "Document analyzed";

      // If research enabled, call research API
      let research: ClientResearch | null = null;
      if (researchEnabled && extracted.extracted?.client_name?.value) {
        setProcessingStep("researching");
        const researchResponse = await fetch("/api/intake/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_name: extracted.extracted.client_name.value,
            industry_hint: extracted.extracted?.client_industry?.value,
          }),
        });

        if (researchResponse.ok) {
          const researchData = await researchResponse.json();
          research = researchData.research;
        }
      }

      onExtracted(extracted, research);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsProcessing(false);
      setProcessingStep(null);
    }
  };

  // Check if all uploaded files are done processing
  const allFilesReady =
    files.length > 0 &&
    files.every(
      (f) =>
        uploadProgress[f.name] === "done" || uploadProgress[f.name] === "error",
    );
  const anyFileSucceeded = files.some((f) => uploadProgress[f.name] === "done");
  const anyFilesProcessing = files.some(
    (f) =>
      uploadProgress[f.name] === "uploading" ||
      uploadProgress[f.name] === "processing",
  );

  const canAnalyze =
    (mode === "upload" &&
      uploadedDocIds.length > 0 &&
      allFilesReady &&
      anyFileSucceeded) ||
    (mode === "paste" && pastedContent.trim().length > 50) ||
    (mode === "describe" && verbalDescription.trim().length > 20) ||
    (mode === "url" && urlFetched && pastedContent.trim().length > 50);

  if (!mode) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">
            How would you like to start?
          </h2>
          <p className="text-[var(--foreground-muted)] mt-2">
            Upload a document, paste content, or describe the opportunity.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setMode("upload")}
            className="group flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-all"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--background-tertiary)] group-hover:bg-[var(--accent-subtle)] transition-colors">
              <Upload className="h-8 w-8 text-[var(--foreground-muted)] group-hover:text-[var(--accent)]" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-[var(--foreground)]">
                Upload Files
              </p>
              <p className="text-sm text-[var(--foreground-muted)]">
                RFP, brief, email, or any document
              </p>
            </div>
          </button>

          <button
            onClick={() => setMode("paste")}
            className="group flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-all"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--background-tertiary)] group-hover:bg-[var(--accent-subtle)] transition-colors">
              <FileText className="h-8 w-8 text-[var(--foreground-muted)] group-hover:text-[var(--accent)]" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-[var(--foreground)]">
                Paste Content
              </p>
              <p className="text-sm text-[var(--foreground-muted)]">
                Email thread, notes, or brief
              </p>
            </div>
          </button>

          <button
            onClick={() => setMode("describe")}
            className="group flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-all"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--background-tertiary)] group-hover:bg-[var(--accent-subtle)] transition-colors">
              <MessageSquare className="h-8 w-8 text-[var(--foreground-muted)] group-hover:text-[var(--accent)]" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-[var(--foreground)]">
                Describe It
              </p>
              <p className="text-sm text-[var(--foreground-muted)]">
                Tell us about the opportunity
              </p>
            </div>
          </button>

          <button
            onClick={() => setMode("url")}
            className="group flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-all"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--background-tertiary)] group-hover:bg-[var(--accent-subtle)] transition-colors">
              <Link2 className="h-8 w-8 text-[var(--foreground-muted)] group-hover:text-[var(--accent)]" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-[var(--foreground)]">
                Import from URL
              </p>
              <p className="text-sm text-[var(--foreground-muted)]">
                SAM.gov, agency portal, or any link
              </p>
            </div>
          </button>

          <button
            onClick={onManualEntry}
            className="group flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-[var(--foreground-muted)] transition-all"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--background-tertiary)] transition-colors">
              <Edit3 className="h-8 w-8 text-[var(--foreground-muted)]" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-[var(--foreground)]">
                Manual Entry
              </p>
              <p className="text-sm text-[var(--foreground-muted)]">
                Fill in the form yourself
              </p>
            </div>
          </button>
        </div>

        <div className="flex items-center justify-center gap-3 pt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={researchEnabled}
              onChange={(e) => setResearchEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
            />
            <Search className="h-4 w-4 text-[var(--foreground-muted)]" />
            <span className="text-sm text-[var(--foreground-muted)]">
              Also research the client (AI gathers company intel)
            </span>
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMode(null)}
          className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          <X className="h-4 w-4" />
          Back
        </button>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={researchEnabled}
            onChange={(e) => setResearchEnabled(e.target.checked)}
            className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
          />
          <Search className="h-4 w-4 text-[var(--foreground-muted)]" />
          <span className="text-sm text-[var(--foreground-muted)]">
            Research client
          </span>
        </label>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-[var(--danger-subtle)] border border-[var(--danger-muted)] text-[var(--danger)] text-sm">
          {error}
        </div>
      )}

      {mode === "upload" && (
        <div className="space-y-4">
          <div
            onDrop={handleFileDrop}
            onDragOver={(e) => e.preventDefault()}
            className="flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] transition-colors cursor-pointer"
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <Upload className="h-12 w-12 text-[var(--foreground-muted)]" />
            <div className="text-center">
              <p className="font-semibold text-[var(--foreground)]">
                Drop files here or click to browse
              </p>
              <p className="text-sm text-[var(--foreground-muted)] mt-1">
                PDF, DOCX, PPTX, XLSX, or TXT up to 50MB
              </p>
            </div>
            <input
              id="file-input"
              type="file"
              multiple
              accept=".pdf,.docx,.pptx,.xlsx,.xls,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file, index) => {
                const fileRole = documentRoles[file.name];
                const isDone = uploadProgress[file.name] === "done";
                const showRoleSelector = files.length > 1 && isDone && fileRole;

                return (
                  <div
                    key={index}
                    className="rounded-lg bg-[var(--background-tertiary)] overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3">
                        <File className="h-5 w-5 text-[var(--foreground-muted)] shrink-0" />
                        <span className="text-sm font-medium truncate max-w-[200px]">
                          {file.name}
                        </span>
                        <span className="text-xs text-[var(--foreground-muted)]">
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {uploadProgress[file.name] === "uploading" && (
                          <span className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Uploading...
                          </span>
                        )}
                        {uploadProgress[file.name] === "processing" && (
                          <span className="flex items-center gap-1 text-xs text-[var(--warning)]">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Processing...
                          </span>
                        )}
                        {isDone && (
                          <span className="text-xs text-[var(--success)]">
                            Ready
                          </span>
                        )}
                        {uploadProgress[file.name] === "error" && (
                          <span className="text-xs text-[var(--danger)]">
                            Failed
                          </span>
                        )}
                        <button
                          onClick={() => removeFile(index)}
                          className="p-1 hover:bg-[var(--background-secondary)] rounded"
                        >
                          <X className="h-4 w-4 text-[var(--foreground-muted)]" />
                        </button>
                      </div>
                    </div>

                    {/* Role selector — shown per-file when multiple files uploaded */}
                    {showRoleSelector && (
                      <div className="px-3 pb-3 pt-0">
                        <select
                          value={fileRole.role}
                          onChange={(e) =>
                            setDocumentRoles((prev) => ({
                              ...prev,
                              [file.name]: {
                                ...prev[file.name],
                                role: e.target.value as DocumentRole,
                              },
                            }))
                          }
                          className="w-full text-xs px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
                          title={
                            fileRole.role in DOCUMENT_ROLE_DESCRIPTIONS
                              ? DOCUMENT_ROLE_DESCRIPTIONS[fileRole.role]
                              : undefined
                          }
                        >
                          {DOCUMENT_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {DOCUMENT_ROLE_LABELS[r]}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Role legend — shown when multiple ready files have roles assigned */}
              {files.length > 1 && anyFileSucceeded && (
                <p className="text-xs text-[var(--foreground-muted)] pt-1">
                  Label each document so the AI knows how to prioritize them
                  during extraction. Amendments override the Primary RFP;
                  Q&amp;A Addenda are authoritative for any questions they
                  address.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {mode === "paste" && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--foreground-muted)]">
            Paste your content
          </label>
          <textarea
            value={pastedContent}
            onChange={(e) => setPastedContent(e.target.value)}
            placeholder="Paste an email thread, meeting notes, RFP text, or any content that describes the opportunity..."
            rows={12}
            className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:border-[var(--accent)] focus:outline-none resize-none"
          />
          <p className="text-xs text-[var(--foreground-muted)]">
            {pastedContent.length} characters
          </p>
        </div>
      )}

      {mode === "describe" && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--foreground-muted)]">
            Describe the opportunity
          </label>
          <textarea
            value={verbalDescription}
            onChange={(e) => setVerbalDescription(e.target.value)}
            placeholder="Tell us about the opportunity in your own words. For example: 'I just got off a call with the CTO of Acme Corp. They're looking to migrate their on-prem infrastructure to AWS...'"
            rows={8}
            className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:border-[var(--accent)] focus:outline-none resize-none"
          />
        </div>
      )}

      {mode === "url" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--foreground-muted)]">
              Paste the solicitation URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setUrlFetched(false);
                }}
                placeholder="https://sam.gov/opp/... or any public solicitation page"
                className="flex-1 px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:border-[var(--accent)] focus:outline-none text-sm"
              />
              <button
                onClick={async () => {
                  if (!urlInput.trim()) return;
                  setUrlFetching(true);
                  setError(null);
                  try {
                    const res = await fetch("/api/intake/fetch-url", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ url: urlInput.trim() }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      setError(data.error || "Failed to fetch URL");
                      return;
                    }
                    setPastedContent(data.content);
                    setUrlFetched(true);
                    if (data.truncated) {
                      setError(
                        "Page was very large — content was trimmed to the first 100,000 characters.",
                      );
                    }
                  } catch {
                    setError(
                      "Failed to fetch URL. Check the link and try again.",
                    );
                  } finally {
                    setUrlFetching(false);
                  }
                }}
                disabled={urlFetching || !urlInput.trim()}
                className="btn-primary px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
              >
                {urlFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                {urlFetching ? "Fetching..." : "Fetch"}
              </button>
            </div>
            <p className="text-xs text-[var(--foreground-muted)]">
              Works with public SAM.gov pages, agency portals, and any publicly
              accessible solicitation page. For login-protected or PDF-only
              pages, download the file and use Upload instead.
            </p>
          </div>

          {urlFetched && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-[var(--foreground-muted)]">
                  Extracted content — review and edit if needed
                </label>
                <span className="text-xs text-[var(--foreground-muted)]">
                  {pastedContent.length.toLocaleString()} chars
                </span>
              </div>
              <textarea
                value={pastedContent}
                onChange={(e) => setPastedContent(e.target.value)}
                rows={10}
                className="w-full px-4 py-3 rounded-xl border border-[var(--accent-muted)] bg-[var(--input-bg)] text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none resize-none text-sm"
              />
            </div>
          )}
        </div>
      )}

      {/* Processing progress indicator */}
      {isProcessing && (
        <div className="rounded-xl border border-[var(--accent-muted)] bg-[var(--accent-subtle)] p-5">
          {/* Progress bar */}
          <div className="mb-4">
            <div
              className="h-2 rounded-full bg-[var(--background-tertiary)] overflow-hidden"
              role="progressbar"
              aria-valuenow={processingStep === "researching" ? 66 : 33}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Extraction progress: ${processingStep === "researching" ? "Researching client" : "Extracting fields"}`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-emerald-500 transition-all duration-700 ease-out"
                style={{
                  width: processingStep === "researching" ? "66%" : "33%",
                }}
              />
            </div>
          </div>

          <div className="space-y-3">
            <ExtractionStep
              label="Reading & parsing document content"
              status={processingStep === "extracting" ? "active" : "done"}
            />
            <ExtractionStep
              label="Extracting structured fields with AI"
              status={
                processingStep === "extracting"
                  ? "active"
                  : processingStep === "researching"
                    ? "done"
                    : "pending"
              }
            />
            {researchEnabled && (
              <ExtractionStep
                label="Researching client background"
                status={processingStep === "researching" ? "active" : "pending"}
              />
            )}
          </div>

          <p className="mt-4 text-xs text-[var(--foreground-subtle)]">
            {elapsedSeconds >= 30
              ? `Still working... ${elapsedSeconds}s elapsed`
              : "This typically takes 15-45 seconds depending on document complexity."}
          </p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <button onClick={() => setMode(null)} className="btn-secondary">
          Cancel
        </button>
        <button
          onClick={handleAnalyze}
          disabled={!canAnalyze || isProcessing || anyFilesProcessing}
          className="btn-primary"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {processingStep === "researching"
                ? "Researching client..."
                : "Extracting..."}
            </>
          ) : anyFilesProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing files...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Analyze & Extract
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Extraction Progress Step ────────────────────────────────────────────────

function ExtractionStep({
  label,
  status,
}: {
  label: string;
  status: "pending" | "active" | "done";
}) {
  return (
    <div className="flex items-center gap-3">
      {status === "done" && (
        <CheckCircle2 className="h-4 w-4 text-[var(--success)] shrink-0" />
      )}
      {status === "active" && (
        <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)] shrink-0" />
      )}
      {status === "pending" && (
        <Circle className="h-4 w-4 text-[var(--foreground-subtle)] shrink-0" />
      )}
      <span
        className={`text-sm ${
          status === "active"
            ? "text-[var(--foreground)] font-medium"
            : status === "done"
              ? "text-[var(--foreground-muted)]"
              : "text-[var(--foreground-subtle)]"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
