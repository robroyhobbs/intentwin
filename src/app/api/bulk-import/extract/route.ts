/**
 * POST /api/bulk-import/extract
 *
 * Accepts a file upload (FormData), parses it server-side using existing
 * document parsers, sends parsed text to Gemini for L1 extraction,
 * then checks existing L1 data for conflicts before returning results.
 */

import { NextRequest } from "next/server";
import { extractL1FromText } from "@/lib/ai/l1-extractor";
import { parseDocument } from "@/lib/documents/parser";
import { processDocument } from "@/lib/documents/pipeline";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext, incrementUsage } from "@/lib/supabase/auth-api";
import { nanoid } from "nanoid";
import { unauthorized, badRequest, ok, serverError } from "@/lib/api/response";
import { logger } from "@/lib/utils/logger";

export const maxDuration = 300; // 5 min for large document parsing + AI extraction

function getFileType(fileName: string): string | null {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  const supported = ["md", "txt", "pdf", "docx", "pptx"];
  return supported.includes(ext) ? ext : null;
}

export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    if (!context || !context.organizationId) {
      return unauthorized();
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || !(file instanceof File) || file.size === 0) {
      return badRequest("A non-empty file is required");
    }

    const fileName = file.name;
    const fileType = getFileType(fileName);

    if (!fileType) {
      return badRequest(`Unsupported file type: ${fileName}`);
    }

    // Parse file into sections using existing document parsers
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let parsedText: string;
    try {
      const sections = await parseDocument(buffer, fileType);
      parsedText = sections
        .map((s) => (s.heading ? `${s.heading}\n${s.content}` : s.content))
        .join("\n\n");
    } catch {
      return badRequest("Failed to parse document");
    }

    if (!parsedText.trim()) {
      return badRequest("Document contains no extractable text");
    }

    // Extract L1 data from parsed text via Gemini
    const result = await extractL1FromText(parsedText, fileName);

    if (result.error) {
      return serverError("Failed to extract data from document");
    }

    // Save file as a document record (so it appears in Uploaded Documents)
    const supabase = createAdminClient();
    const orgId = context.organizationId;

    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      txt: "text/plain",
      md: "text/markdown",
    };

    const storagePath = `${orgId}/bulk-import/${nanoid()}-${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from("knowledge-base-documents")
      .upload(storagePath, buffer, {
        contentType: mimeTypes[fileType] || "application/octet-stream",
      });

    if (!uploadError) {
      const { data: document } = await supabase
        .from("documents")
        .insert({
          title: fileName.replace(/\.[^.]+$/, ""),
          file_name: fileName,
          file_type: fileType,
          file_size_bytes: file.size,
          storage_path: storagePath,
          mime_type: mimeTypes[fileType] || "application/octet-stream",
          document_type: "reference",
          uploaded_by: context.user.id,
          organization_id: orgId,
          team_id: context.teamId,
          processing_status: "pending",
        })
        .select("id")
        .single();

      if (document) {
        await incrementUsage(orgId, "documents_uploaded");
        // Process chunks in background
        processDocument(document.id).catch((err) => {
          logger.error(`Failed to process document ${document.id}`, err);
        });
      }
    } else {
      logger.error("Bulk import file storage failed", uploadError);
    }

    // Fetch existing L1 data for conflict detection

    const { data: existingCC } = await supabase
      .from("company_context")
      .select("category, key, title, content")
      .eq("organization_id", orgId);

    const { data: existingPC } = await supabase
      .from("product_contexts")
      .select("product_name, service_line, description")
      .eq("organization_id", orgId);

    const { data: existingEL } = await supabase
      .from("evidence_library")
      .select("title, summary")
      .eq("organization_id", orgId);

    // Add conflict flags to extracted items
    const company_context = result.data.company_context.map((item) => {
      const existing = (existingCC || []).find(
        (e: Record<string, unknown>) =>
          e.category === item.category && e.key === item.key,
      );
      return {
        ...item,
        isConflict: !!existing,
        existingValue: existing
          ? {
              title: (existing as Record<string, unknown>).title,
              content: (existing as Record<string, unknown>).content,
            }
          : undefined,
      };
    });

    const product_contexts = result.data.product_contexts.map((item) => {
      const existing = (existingPC || []).find(
        (e: Record<string, unknown>) =>
          e.product_name === item.product_name &&
          e.service_line === item.service_line,
      );
      return {
        ...item,
        isConflict: !!existing,
        existingValue: existing
          ? {
              description: (existing as Record<string, unknown>).description,
            }
          : undefined,
      };
    });

    const evidence_library = result.data.evidence_library.map((item) => {
      const existing = (existingEL || []).find(
        (e: Record<string, unknown>) => e.title === item.title,
      );
      return {
        ...item,
        isConflict: !!existing,
        existingValue: existing
          ? { summary: (existing as Record<string, unknown>).summary }
          : undefined,
      };
    });

    return ok({
      company_context,
      product_contexts,
      evidence_library,
    });
  } catch {
    return serverError("Internal server error");
  }
}
