import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getUserContext,
  checkPlanLimit,
  incrementUsage,
} from "@/lib/supabase/auth-api";
import { nanoid } from "nanoid";
import { inngest } from "@/inngest/client";
import { unauthorized, forbidden, badRequest, ok, serverError } from "@/lib/api/response";

const ALLOWED_TYPES: Record<string, string> = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "pptx",
  "text/plain": "txt",
  "text/markdown": "md",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-excel": "xls",
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Magic byte signatures for file type verification
const MAGIC_BYTES: Record<string, { offset: number; bytes: number[] }[]> = {
  pdf: [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }], // %PDF
  docx: [{ offset: 0, bytes: [0x50, 0x4b, 0x03, 0x04] }], // PK (ZIP)
  pptx: [{ offset: 0, bytes: [0x50, 0x4b, 0x03, 0x04] }], // PK (ZIP)
};

function verifyMagicBytes(buffer: ArrayBuffer, fileType: string): boolean {
  const signatures = MAGIC_BYTES[fileType];
  if (!signatures) return true; // txt/md don't have magic bytes
  const view = new Uint8Array(buffer);
  return signatures.some((sig) =>
    sig.bytes.every((byte, i) => view[sig.offset + i] === byte),
  );
}

export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext(request);

    if (!context) {
      return unauthorized();
    }

    // Check plan limits
    const limitCheck = await checkPlanLimit(
      context.organizationId,
      "max_documents",
    );
    if (!limitCheck.allowed) {
      return forbidden(limitCheck.message || "Document limit reached");
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const documentType =
      (formData.get("document_type") as string) || "proposal";
    const industry = formData.get("industry") as string | null;
    const serviceLine = formData.get("service_line") as string | null;
    const clientName = formData.get("client_name") as string | null;
    const winStatus = formData.get("win_status") as string | null;
    const description = formData.get("description") as string | null;

    if (!file) {
      return badRequest("No file provided");
    }

    if (!title) {
      return badRequest("Title is required");
    }

    // Validate file type
    const fileType = ALLOWED_TYPES[file.type];
    if (!fileType) {
      return badRequest(
        "Unsupported file type. Please upload DOCX, PDF, PPTX, TXT, or MD.",
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return badRequest("File too large. Maximum size is 50MB.");
    }

    // Verify magic bytes match claimed file type
    const fileBuffer = await file.arrayBuffer();
    if (!verifyMagicBytes(fileBuffer, fileType)) {
      return badRequest("File content does not match its declared type.");
    }

    const adminClient = createAdminClient();
    // Use organization_id in storage path for proper isolation
    const storagePath = `${context.organizationId}/${documentType}/${nanoid()}-${file.name}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await adminClient.storage
      .from("knowledge-base-documents")
      .upload(storagePath, Buffer.from(fileBuffer), {
        contentType: file.type,
      });

    if (uploadError) {
      return serverError("Upload failed", uploadError);
    }

    // Create document record with organization scoping
    const { data: document, error: dbError } = await adminClient
      .from("documents")
      .insert({
        title,
        description,
        file_name: file.name,
        file_type: fileType,
        file_size_bytes: file.size,
        storage_path: storagePath,
        mime_type: file.type,
        document_type: documentType,
        industry,
        service_line: serviceLine,
        client_name: clientName,
        win_status: winStatus,
        uploaded_by: context.user.id,
        organization_id: context.organizationId,
        team_id: context.teamId,
        processing_status: "pending",
      })
      .select()
      .single();

    if (dbError || !document) {
      return serverError("Failed to save document record", dbError);
    }

    // Increment usage counter
    await incrementUsage(context.organizationId, "documents_uploaded");

    // Send event to Inngest for durable document processing.
    // Handles parsing, chunking, embedding generation with per-batch retries.
    await inngest.send({
      name: "document/process.requested",
      data: { documentId: document.id },
    });

    return ok({
      documentId: document.id,
      status: "pending",
      message: "Document uploaded and processing started.",
    });
  } catch (error) {
    return serverError("Internal server error", error);
  }
}
