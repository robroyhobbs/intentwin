import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext, checkPlanLimit, incrementUsage } from "@/lib/supabase/auth-api";
import { nanoid } from "nanoid";
import { processDocument } from "@/lib/documents/pipeline";

const ALLOWED_TYPES: Record<string, string> = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "pptx",
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext(request);

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check plan limits
    const limitCheck = await checkPlanLimit(context.organizationId, "max_documents");
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.message || "Document limit reached" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const documentType = (formData.get("document_type") as string) || "proposal";
    const industry = formData.get("industry") as string | null;
    const serviceLine = formData.get("service_line") as string | null;
    const clientName = formData.get("client_name") as string | null;
    const winStatus = formData.get("win_status") as string | null;
    const description = formData.get("description") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Validate file type
    const fileType = ALLOWED_TYPES[file.type];
    if (!fileType) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload DOCX, PDF, or PPTX." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 50MB." },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    // Use organization_id in storage path for proper isolation
    const storagePath = `${context.organizationId}/${documentType}/${nanoid()}-${file.name}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await adminClient.storage
      .from("knowledge-base-documents")
      .upload(storagePath, file, {
        contentType: file.type,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
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
      return NextResponse.json(
        { error: `Database error: ${dbError?.message}` },
        { status: 500 }
      );
    }

    // Increment usage counter
    await incrementUsage(context.organizationId, "documents_uploaded");

    // Trigger processing in the background (fire and forget)
    processDocument(document.id).catch((err) => {
      console.error(`Failed to process document ${document.id}:`, err);
    });

    return NextResponse.json({
      documentId: document.id,
      status: "pending",
      message: "Document uploaded and processing started.",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
