import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext } from "@/lib/supabase/auth-api";
import { generateDocx } from "@/lib/export/docx-generator";
import { generatePptx } from "@/lib/export/pptx-generator";
import { generateHtml } from "@/lib/export/html-generator";
import { generateSlides } from "@/lib/export/slides-generator";
import { generatePdf } from "@/lib/export/pdf-generator";
import { createProposalVersion } from "@/lib/versioning/create-version";
import { nanoid } from "nanoid";
import { format } from "date-fns";
import { ProposalStatus, GenerationStatus } from "@/lib/constants/statuses";

export const maxDuration = 120; // PDF generation with Chromium can take 30-60s

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const formatType = body.format as
      | "docx"
      | "pptx"
      | "html"
      | "slides"
      | "pdf";

    if (!["docx", "pptx", "html", "slides", "pdf"].includes(formatType)) {
      return NextResponse.json(
        { error: 'Format must be "docx", "pptx", "html", "slides", or "pdf"' },
        { status: 400 },
      );
    }

    const adminClient = createAdminClient();

    // Fetch proposal with organization data for branding (with org verification)
    const { data: proposal } = await adminClient
      .from("proposals")
      .select(
        `
        id, title, status, intake_data, created_at,
        organization:organizations(id, name, settings)
      `,
      )
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .single();

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 },
      );
    }

    // Get organization name and branding for exports
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase FK join type inference returns array; runtime is single object via .single()
    const org = (proposal as any).organization as { id: string; name: string; settings: Record<string, any> } | null;
    const organizationName = org?.name || "IntentBid";
    const orgSettings = org?.settings || {};
    const branding = {
      logo_url: orgSettings.branding?.logo_url,
      primary_color: orgSettings.branding?.primary_color || "#0070AD",
      secondary_color: orgSettings.branding?.secondary_color || "#1B365D",
      accent_color: orgSettings.branding?.accent_color || "#12ABDB",
      font_family: orgSettings.branding?.font_family || "Arial",
      header_text: orgSettings.branding?.header_text || organizationName,
      footer_text: orgSettings.branding?.footer_text || "Confidential",
    };

    const { data: sections } = await adminClient
      .from("proposal_sections")
      .select("id, proposal_id, section_type, section_order, title, generated_content, edited_content, is_edited, generation_status, review_status, review_notes, diagram_image, created_at, updated_at")
      .eq("proposal_id", id)
      .eq("generation_status", GenerationStatus.COMPLETED)
      .order("section_order", { ascending: true });

    if (!sections || sections.length === 0) {
      return NextResponse.json(
        { error: "No completed sections to export" },
        { status: 400 },
      );
    }

    // Create a version snapshot before export (non-blocking)
    try {
      await createProposalVersion({
        proposalId: id,
        triggerEvent: "pre_export",
        changeSummary: `Exported as ${formatType.toUpperCase()}`,
        userId: context.user.id,
      });
    } catch (versionError) {
      console.warn("Version snapshot failed (non-blocking):", versionError);
    }

    const intakeData = proposal.intake_data as Record<string, string>;
    const proposalData = {
      title: proposal.title,
      client_name: intakeData.client_name || "Client",
      company_name: organizationName,
      date: format(new Date(), "MMMM d, yyyy"),
      sections: sections.map((s) => ({
        title: s.title,
        content: s.edited_content || s.generated_content || "",
        section_type: s.section_type,
        diagram_image: s.diagram_image || null,
      })),
      branding,
    };

    // Generate the document
    let fileBuffer: Buffer;
    let mimeType: string;
    let extension: string;

    if (formatType === "slides") {
      const html = await generateSlides(proposalData);
      fileBuffer = Buffer.from(html, "utf-8");
      mimeType = "text/html";
      extension = "html";
    } else if (formatType === "html") {
      const html = await generateHtml(proposalData);
      fileBuffer = Buffer.from(html, "utf-8");
      mimeType = "text/html";
      extension = "html";
    } else if (formatType === "pdf") {
      fileBuffer = await generatePdf(proposalData);
      mimeType = "application/pdf";
      extension = "pdf";
    } else if (formatType === "docx") {
      fileBuffer = generateDocx(proposalData);
      mimeType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      extension = "docx";
    } else {
      fileBuffer = await generatePptx(proposalData);
      mimeType =
        "application/vnd.openxmlformats-officedocument.presentationml.presentation";
      extension = "pptx";
    }

    // Upload to Supabase Storage (org-scoped path)
    const fileName = `${proposal.title.replace(/[^a-zA-Z0-9]/g, "_")}_${nanoid(6)}.${extension}`;
    const storagePath = `${context.organizationId}/${id}/${fileName}`;

    const { error: uploadError } = await adminClient.storage
      .from("exported-proposals")
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Export upload failed: ${uploadError.message}` },
        { status: 500 },
      );
    }

    // Generate signed URL (1 hour expiry)
    const { data: signedUrl } = await adminClient.storage
      .from("exported-proposals")
      .createSignedUrl(storagePath, 3600);

    // Update proposal status
    await adminClient
      .from("proposals")
      .update({ status: ProposalStatus.EXPORTED })
      .eq("id", id);

    return NextResponse.json({
      downloadUrl: signedUrl?.signedUrl,
      fileName,
      format: formatType,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown export error";
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("Export error:", message, stack);
    return NextResponse.json(
      { error: `Export failed: ${message}` },
      { status: 500 },
    );
  }
}
