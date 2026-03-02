import { createAdminClient } from "@/lib/supabase/admin";
import { createProposalVersion } from "@/lib/versioning/create-version";
import { nanoid } from "nanoid";
import { format } from "date-fns";
import { ProposalStatus, GenerationStatus } from "@/lib/constants/statuses";
import { logger } from "@/lib/utils/logger";
import {
  notFound,
  badRequest,
  ok,
  serverError,
  withProposalRoute,
} from "@/lib/api/response";
import { isExportFormat } from "@/lib/export/formats";
import { generateExportFile } from "@/lib/export/runtime";
import { resolvePlaceholders } from "@/lib/export/resolve-placeholders";
import { fetchL1ContextFromDb } from "@/lib/ai/pipeline/fetch-l1-context";

export const maxDuration = 120; // PDF generation with Chromium can take 30-60s
const EXPORT_SLOW_WARN_MS = 15000;
const formatTimingMs = (value: number) => Math.max(0, Math.round(value));

export const POST = withProposalRoute(async (request, { id }, context) => {
  const startedAt = Date.now();
  let fetchDurationMs = 0;
  let generateDurationMs = 0;
  let uploadDurationMs = 0;
  let signedUrlDurationMs = 0;
  let statusUpdateDurationMs = 0;
  const body = await request.json();
  const formatType = body.format as string;

  if (!isExportFormat(formatType)) {
    return badRequest(
      'Format must be "docx", "pptx", "html", "slides", or "pdf"',
    );
  }

  const adminClient = createAdminClient();
  const fetchStartedAt = Date.now();

  // Fetch proposal, sections, user profile, and L1 sources in parallel
  const [{ data: proposal }, { data: sections }, { data: profile }, l1] =
    await Promise.all([
      adminClient
        .from("proposals")
        .select(
          `
          id, title, status, intake_data, created_at,
          organization:organizations(id, name, settings)
        `,
        )
        .eq("id", id)
        .eq("organization_id", context.organizationId)
        .single(),
      adminClient
        .from("proposal_sections")
        .select(
          "id, proposal_id, section_type, section_order, title, generated_content, edited_content, is_edited, generation_status, review_status, review_notes, diagram_image, created_at, updated_at",
        )
        .eq("proposal_id", id)
        .eq("generation_status", GenerationStatus.COMPLETED)
        .order("section_order", { ascending: true }),
      adminClient
        .from("profiles")
        .select("full_name")
        .eq("id", context.user.id)
        .single(),
      fetchL1ContextFromDb(
        adminClient,
        undefined,
        undefined,
        context.organizationId,
      ),
    ]);
  fetchDurationMs = Date.now() - fetchStartedAt;

  if (!proposal) {
    return notFound("Proposal not found");
  }

  // Get organization name and branding for exports
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase FK join type inference returns array; runtime is single object via .single()
  const org = (proposal as any).organization as {
    id: string;
    name: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- org settings is schemaless JSON
    settings: Record<string, any>;
  } | null;
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

  if (!sections || sections.length === 0) {
    return badRequest("No completed sections to export");
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
    logger.warn("Version snapshot failed (non-blocking)", {
      error:
        versionError instanceof Error
          ? versionError.message
          : String(versionError),
    });
  }

  const intakeData = proposal.intake_data as Record<string, string>;
  const exportDate = format(new Date(), "MMMM d, yyyy");
  const clientName = intakeData.client_name || "Client";

  // Pick signatory from L1 team members, fall back to user profile, then org name
  const leadMember = l1.teamMembers[0];
  const signatoryName =
    leadMember?.name || profile?.full_name || organizationName;
  const signatoryTitle = leadMember?.title || "";

  // Auto-substitute all merge fields and fill gap markers from L1 sources
  const placeholderValues = {
    date: exportDate,
    client_name: clientName,
    signatory_name: signatoryName,
    signatory_title: signatoryTitle,
  };
  const l1Sources = {
    teamMembers: l1.teamMembers,
    evidenceLibrary: l1.evidenceLibrary,
  };

  const proposalData = {
    title: proposal.title,
    client_name: clientName,
    company_name: organizationName,
    date: exportDate,
    sections: sections.map((s) => ({
      title: s.title,
      content: resolvePlaceholders(
        s.edited_content || s.generated_content || "",
        placeholderValues,
        l1Sources,
      ),
      section_type: s.section_type,
      diagram_image: s.diagram_image || null,
    })),
    branding,
  };

  let fileBuffer: Buffer;
  let mimeType: string;
  let extension: string;
  try {
    const generateStartedAt = Date.now();
    ({ fileBuffer, mimeType, extension } = await generateExportFile(
      formatType,
      proposalData,
    ));
    generateDurationMs = Date.now() - generateStartedAt;
  } catch (genError) {
    const errorMsg =
      genError instanceof Error ? genError.message : String(genError);
    logger.error(`Export generation failed (${formatType})`, {
      error: errorMsg,
      stack:
        genError instanceof Error ? genError.stack?.slice(0, 500) : undefined,
      proposalId: id,
      format: formatType,
    });
    return serverError(
      `Failed to generate ${formatType.toUpperCase()} export: ${errorMsg.slice(0, 200)}`,
      genError,
    );
  }

  // Upload to Supabase Storage (org-scoped path)
  const fileName = `${proposal.title.replace(/[^a-zA-Z0-9]/g, "_")}_${nanoid(6)}.${extension}`;
  const storagePath = `${context.organizationId}/${id}/${fileName}`;

  const uploadStartedAt = Date.now();
  const { error: uploadError } = await adminClient.storage
    .from("exported-proposals")
    .upload(storagePath, fileBuffer, {
      contentType: mimeType,
    });
  uploadDurationMs = Date.now() - uploadStartedAt;

  if (uploadError) {
    return serverError("Export upload failed", uploadError);
  }

  // Generate signed URL (1 hour expiry)
  const signedUrlStartedAt = Date.now();
  const { data: signedUrl } = await adminClient.storage
    .from("exported-proposals")
    .createSignedUrl(storagePath, 3600);
  signedUrlDurationMs = Date.now() - signedUrlStartedAt;

  // Update proposal status
  const statusUpdateStartedAt = Date.now();
  await adminClient
    .from("proposals")
    .update({ status: ProposalStatus.EXPORTED })
    .eq("id", id);
  statusUpdateDurationMs = Date.now() - statusUpdateStartedAt;

  logger.info("Proposal export completed", {
    proposalId: id,
    organizationId: context.organizationId,
    format: formatType,
    sectionCount: sections.length,
    fileSizeBytes: fileBuffer.length,
    durationMs: Date.now() - startedAt,
  });
  const exportDurationMs = Date.now() - startedAt;
  if (exportDurationMs > EXPORT_SLOW_WARN_MS) {
    logger.warn("Proposal export exceeded SLO threshold", {
      proposalId: id,
      organizationId: context.organizationId,
      format: formatType,
      durationMs: exportDurationMs,
      sloMs: EXPORT_SLOW_WARN_MS,
    });
  }

  const response = ok({
    downloadUrl: signedUrl?.signedUrl,
    fileName,
    format: formatType,
  });
  response.headers.set(
    "Server-Timing",
    [
      `fetch;dur=${formatTimingMs(fetchDurationMs)}`,
      `generate;dur=${formatTimingMs(generateDurationMs)}`,
      `upload;dur=${formatTimingMs(uploadDurationMs)}`,
      `sign;dur=${formatTimingMs(signedUrlDurationMs)}`,
      `status;dur=${formatTimingMs(statusUpdateDurationMs)}`,
      `total;dur=${formatTimingMs(exportDurationMs)}`,
    ].join(", "),
  );
  return response;
});
