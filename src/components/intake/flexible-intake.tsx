"use client";

import { useState, useCallback } from "react";
import {
  Upload,
  FileText,
  MessageSquare,
  Mic,
  Edit3,
  Search,
  X,
  Loader2,
  Sparkles,
  File,
} from "lucide-react";
import type { IntakeMode, ExtractedIntake, ClientResearch } from "@/types/intake";

interface FlexibleIntakeProps {
  onExtracted: (data: ExtractedIntake, research: ClientResearch | null) => void;
  onManualEntry: () => void;
}

export function FlexibleIntake({ onExtracted, onManualEntry }: FlexibleIntakeProps) {
  const [mode, setMode] = useState<IntakeMode | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedDocIds, setUploadedDocIds] = useState<string[]>([]);
  const [pastedContent, setPastedContent] = useState("");
  const [verbalDescription, setVerbalDescription] = useState("");
  const [researchEnabled, setResearchEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const handleFileDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const droppedFiles = Array.from(e.dataTransfer.files);
      await handleFiles(droppedFiles);
    },
    []
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files);
        await handleFiles(selectedFiles);
      }
    },
    []
  );

  // Poll for document processing completion
  const pollDocumentStatus = async (docId: string, fileName: string): Promise<boolean> => {
    const maxAttempts = 30; // 30 seconds max
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`/api/documents/${docId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.document?.processing_status === "completed") {
            return true;
          }
          if (data.document?.processing_status === "failed") {
            console.error(`Document processing failed: ${fileName}`);
            return false;
          }
        }
      } catch (e) {
        console.error("Error polling document status:", e);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    return false;
  };

  const handleFiles = async (newFiles: File[]) => {
    setError(null);
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
    ];

    const validFiles = newFiles.filter((f) => validTypes.includes(f.type));
    if (validFiles.length !== newFiles.length) {
      setError("Some files were skipped. Supported formats: PDF, DOCX, PPTX, TXT");
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
        setUploadedDocIds((prev) => [...prev, data.documentId]);
        setUploadProgress((prev) => ({ ...prev, [file.name]: "processing" }));

        // Poll for processing completion
        const success = await pollDocumentStatus(data.documentId, file.name);
        if (success) {
          setUploadProgress((prev) => ({ ...prev, [file.name]: "done" }));
        } else {
          setUploadProgress((prev) => ({ ...prev, [file.name]: "error" }));
          setError(`Failed to process ${file.name}. You can still try to analyze.`);
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
      }

      // Call extraction API
      const extractResponse = await fetch("/api/intake/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          document_ids: uploadedDocIds.length > 0 ? uploadedDocIds : undefined,
          content_type: contentType,
        }),
      });

      if (!extractResponse.ok) {
        const err = await extractResponse.json();
        throw new Error(err.error || "Extraction failed");
      }

      const { extracted } = await extractResponse.json();

      // If research enabled, call research API
      let research: ClientResearch | null = null;
      if (researchEnabled && extracted.extracted?.client_name?.value) {
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
    }
  };

  // Check if all uploaded files are done processing
  const allFilesReady = files.length > 0 && files.every(
    (f) => uploadProgress[f.name] === "done" || uploadProgress[f.name] === "error"
  );
  const anyFilesProcessing = files.some(
    (f) => uploadProgress[f.name] === "uploading" || uploadProgress[f.name] === "processing"
  );

  const canAnalyze =
    (mode === "upload" && uploadedDocIds.length > 0 && allFilesReady) ||
    (mode === "paste" && pastedContent.trim().length > 50) ||
    (mode === "describe" && verbalDescription.trim().length > 20);

  if (!mode) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">
            Start a New Proposal
          </h2>
          <p className="text-[var(--foreground-muted)] mt-2">
            What do you have? We&apos;ll extract the details automatically.
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
              <p className="font-semibold text-[var(--foreground)]">Upload Files</p>
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
              <p className="font-semibold text-[var(--foreground)]">Paste Content</p>
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
              <p className="font-semibold text-[var(--foreground)]">Describe It</p>
              <p className="text-sm text-[var(--foreground-muted)]">
                Tell us about the opportunity
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
              <p className="font-semibold text-[var(--foreground)]">Manual Entry</p>
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
          <span className="text-sm text-[var(--foreground-muted)]">Research client</span>
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
                PDF, DOCX, PPTX, or TXT up to 50MB
              </p>
            </div>
            <input
              id="file-input"
              type="file"
              multiple
              accept=".pdf,.docx,.pptx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--background-tertiary)]"
                >
                  <div className="flex items-center gap-3">
                    <File className="h-5 w-5 text-[var(--foreground-muted)]" />
                    <span className="text-sm font-medium">{file.name}</span>
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
                    {uploadProgress[file.name] === "done" && (
                      <span className="text-xs text-[var(--success)]">Ready</span>
                    )}
                    {uploadProgress[file.name] === "error" && (
                      <span className="text-xs text-[var(--danger)]">Failed</span>
                    )}
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-[var(--background-secondary)] rounded"
                    >
                      <X className="h-4 w-4 text-[var(--foreground-muted)]" />
                    </button>
                  </div>
                </div>
              ))}
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
              Analyzing...
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
