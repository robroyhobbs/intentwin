import type { Dispatch } from "react";
import type { CreateAction } from "../create-types";
import type { ExtractedIntake } from "@/types/intake";
import { logger } from "@/lib/utils/logger";

type FetchFn = (url: string, options?: RequestInit) => Promise<Response>;

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt", ".xlsx"];
const POLL_INTERVAL_MS = 2_000;
const POLL_TIMEOUT_MS = 300_000; // 5 min — matches server maxDuration

// ── Response types from API routes ──────────────────────────────────────────

interface UploadResponse {
  documentId: string;
  status: string;
  message: string;
}

interface DocumentStatusResponse {
  processing_status: string;
  [key: string]: unknown;
}

interface ExtractionResponse {
  extracted: ExtractedIntake;
  assumptions: Array<{ text: string; category: string }>;
}

// ── File validation ─────────────────────────────────────────────────────────

export function filterValidFiles(files: FileList | File[]): File[] {
  return Array.from(files).filter((f) => {
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    return ACCEPTED_EXTENSIONS.includes(ext);
  });
}

// ── Upload a single file ────────────────────────────────────────────────────

async function uploadSingleFile(file: File, fetchFn: FetchFn): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", file.name);
  formData.append("document_type", "rfp");

  const res = await fetchFn("/api/documents/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const b = body as Record<string, string>;
    const msg = b.error ?? b.message ?? res.statusText;
    throw new Error(`Upload failed for ${file.name}: ${msg}`);
  }

  const data = (await res.json()) as UploadResponse;
  return data.documentId;
}

// ── Poll until document processing completes ────────────────────────────────

async function pollDocumentReady(
  docId: string,
  fetchFn: FetchFn,
): Promise<void> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const res = await fetchFn(`/api/documents/${docId}`);
    if (!res.ok) {
      throw new Error(`Failed to check document status: ${res.statusText}`);
    }

    const doc = (await res.json()) as DocumentStatusResponse;
    if (doc.processing_status === "completed") {
      if (doc.chunk_count === 0) {
        throw new Error(
          "This document was processed but no text could be extracted. " +
            "It may contain only images or unsupported formatting. " +
            "Try uploading a different file format (PDF, TXT, or DOCX with text content).",
        );
      }
      return;
    }
    if (doc.processing_status === "failed") {
      const reason =
        typeof doc.processing_error === "string" && doc.processing_error
          ? doc.processing_error
          : "Document processing failed on the server.";
      throw new Error(reason);
    }

    await delay(POLL_INTERVAL_MS);
  }

  throw new Error(
    "Document processing is taking longer than expected. Please try again.",
  );
}

// ── Trigger extraction ──────────────────────────────────────────────────────

async function runExtraction(
  docIds: string[],
  fetchFn: FetchFn,
): Promise<ExtractionResponse> {
  const res = await fetchFn("/api/intake/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_ids: docIds }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const b = body as Record<string, string>;
    const msg = b.error ?? b.message ?? res.statusText;
    throw new Error(`Extraction failed: ${msg}`);
  }

  return (await res.json()) as ExtractionResponse;
}

// ── Orchestrate the full upload → poll → extract pipeline ───────────────────

export async function uploadAndExtract(
  files: File[],
  dispatch: Dispatch<CreateAction>,
  fetchFn: FetchFn,
): Promise<void> {
  dispatch({ type: "EXTRACTION_START" });

  try {
    // 1. Upload all files sequentially
    const docIds: string[] = [];
    for (const file of files) {
      const id = await uploadSingleFile(file, fetchFn);
      docIds.push(id);
    }
    dispatch({ type: "SET_UPLOADED_DOC_IDS", ids: docIds });

    // 2. Poll each document until processing completes
    dispatch({ type: "SET_EXTRACTION_STEP", step: "processing" });
    await Promise.all(docIds.map((id) => pollDocumentReady(id, fetchFn)));

    // 3. Run extraction across all documents
    dispatch({ type: "SET_EXTRACTION_STEP", step: "extracting" });
    const result = await runExtraction(docIds, fetchFn);
    dispatch({
      type: "EXTRACTION_SUCCESS",
      payload: { extracted: result.extracted },
    });

    logger.info("Intake extraction complete", {
      docCount: docIds.length,
      gapCount: result.extracted.gaps?.length ?? 0,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Upload or extraction failed";
    logger.error("Intake upload/extract error", { error: message });
    dispatch({ type: "EXTRACTION_FAIL", error: message });
  }
}

// ── Extraction summary helpers ──────────────────────────────────────────────

export function getExtractionSummary(data: ExtractedIntake) {
  const e = data.extracted;
  return {
    clientName: e.client_name?.value ?? "Unknown",
    solicitationType:
      e.solicitation_type?.value ??
      e.opportunity_type?.value ??
      "Not specified",
    requirementsCount: e.key_requirements?.value?.length ?? 0,
    budgetRange: e.budget_range?.value ?? "Not specified",
    criticalGaps:
      data.gaps?.filter((g) => g.importance === "critical").length ?? 0,
  };
}

// ── Util ────────────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
