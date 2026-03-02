import type { Dispatch } from "react";
import type { CreateAction } from "../create-types";
import type { ExtractedIntake } from "@/types/intake";
import { logger } from "@/lib/utils/logger";

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt", ".xlsx"];
const POLL_INTERVAL_MS = 2_000;
const POLL_TIMEOUT_MS = 60_000;

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

async function uploadSingleFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", file.name);
  formData.append("document_type", "rfp");

  const res = await fetch("/api/documents/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (body as Record<string, string>).message ?? res.statusText;
    throw new Error(`Upload failed for ${file.name}: ${msg}`);
  }

  const data = (await res.json()) as UploadResponse;
  return data.documentId;
}

// ── Poll until document processing completes ────────────────────────────────

async function pollDocumentReady(docId: string): Promise<void> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const res = await fetch(`/api/documents/${docId}`);
    if (!res.ok) {
      throw new Error(`Failed to check document status: ${res.statusText}`);
    }

    const doc = (await res.json()) as DocumentStatusResponse;
    if (doc.processing_status === "completed") return;
    if (doc.processing_status === "failed") {
      throw new Error("Document processing failed on the server.");
    }

    await delay(POLL_INTERVAL_MS);
  }

  throw new Error("Document processing timed out after 60 seconds.");
}

// ── Trigger extraction ──────────────────────────────────────────────────────

async function runExtraction(
  docIds: string[],
): Promise<ExtractionResponse> {
  const res = await fetch("/api/intake/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_ids: docIds }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (body as Record<string, string>).message ?? res.statusText;
    throw new Error(`Extraction failed: ${msg}`);
  }

  return (await res.json()) as ExtractionResponse;
}

// ── Orchestrate the full upload → poll → extract pipeline ───────────────────

export async function uploadAndExtract(
  files: File[],
  dispatch: Dispatch<CreateAction>,
): Promise<void> {
  dispatch({ type: "EXTRACTION_START" });

  try {
    // 1. Upload all files sequentially
    const docIds: string[] = [];
    for (const file of files) {
      const id = await uploadSingleFile(file);
      docIds.push(id);
    }
    dispatch({ type: "SET_UPLOADED_DOC_IDS", ids: docIds });

    // 2. Poll each document until processing completes
    await Promise.all(docIds.map(pollDocumentReady));

    // 3. Run extraction across all documents
    const result = await runExtraction(docIds);
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
    solicitationType: e.solicitation_type?.value ?? e.opportunity_type?.value ?? "Not specified",
    requirementsCount: e.key_requirements?.value?.length ?? 0,
    budgetRange: e.budget_range?.value ?? "Not specified",
    criticalGaps: data.gaps?.filter((g) => g.importance === "critical").length ?? 0,
  };
}

// ── Util ────────────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
