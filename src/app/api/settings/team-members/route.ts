import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext } from "@/lib/supabase/auth-api";
import { unauthorized, notFound, badRequest, serverError, ok, created } from "@/lib/api/response";
import { sanitizeTitle, sanitizeString } from "@/lib/security/sanitize";
import { clearL1Cache } from "@/lib/ai/pipeline/context";
import { generateText } from "@/lib/ai/gemini";
import { buildResumeExtractionPrompt } from "@/lib/ai/prompts/extract-resume";
import { logger } from "@/lib/utils/logger";

const SELECT_FIELDS =
  "id, name, role, title, email, skills, certifications, clearance_level, years_experience, project_history, bio, is_verified, created_at, updated_at";

/**
 * GET /api/settings/team-members
 * List all team members for the current organization
 */
export async function GET(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    if (!context) {
      return unauthorized();
    }

    const adminClient = createAdminClient();
    const { data: teamMembers, error } = await adminClient
      .from("team_members")
      .select(SELECT_FIELDS)
      .eq("organization_id", context.organizationId)
      .order("name", { ascending: true });

    if (error) {
      return serverError("Failed to fetch team members", error);
    }

    return ok({ teamMembers: teamMembers || [] });
  } catch (error) {
    return serverError("Failed to fetch team members", error);
  }
}

/**
 * POST /api/settings/team-members
 * Create a new team member
 */
export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    if (!context) {
      return unauthorized();
    }

    const body = await request.json();

    // Resume extraction path: parse resume document via AI
    if (body.extract_from_resume && body.source_document_id) {
      return handleResumeExtraction(body.source_document_id, context);
    }

    const {
      name,
      role,
      title,
      email,
      skills,
      certifications,
      clearance_level,
      years_experience,
      project_history,
      bio,
    } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return badRequest("name is required");
    }

    if (!role || typeof role !== "string" || !role.trim()) {
      return badRequest("role is required");
    }

    // Validate JSONB arrays
    if (skills !== undefined && !Array.isArray(skills)) {
      return badRequest("skills must be an array of strings");
    }
    if (certifications !== undefined && !Array.isArray(certifications)) {
      return badRequest("certifications must be an array of strings");
    }
    if (project_history !== undefined && !Array.isArray(project_history)) {
      return badRequest("project_history must be an array");
    }

    const adminClient = createAdminClient();
    const { data: teamMember, error } = await adminClient
      .from("team_members")
      .insert({
        organization_id: context.organizationId,
        name: sanitizeTitle(name),
        role: sanitizeTitle(role),
        title: title ? sanitizeTitle(title) : null,
        email: email ? sanitizeString(email) : null,
        skills: skills || [],
        certifications: certifications || [],
        clearance_level: clearance_level ? sanitizeString(clearance_level) : null,
        years_experience: typeof years_experience === "number" ? years_experience : null,
        project_history: project_history || [],
        bio: bio ? sanitizeString(bio) : null,
        created_by: context.user.id,
      })
      .select(SELECT_FIELDS)
      .single();

    if (error) {
      return serverError("Failed to create team member", error);
    }

    clearL1Cache();
    return created({ teamMember });
  } catch (error) {
    return serverError("Failed to create team member", error);
  }
}

/**
 * PATCH /api/settings/team-members
 * Update a team member (id in request body)
 */
export async function PATCH(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    if (!context) {
      return unauthorized();
    }

    const body = await request.json();
    const { id, ...fields } = body;

    if (!id) {
      return badRequest("id is required in request body");
    }

    // Validate JSONB arrays if provided
    if (fields.skills !== undefined && !Array.isArray(fields.skills)) {
      return badRequest("skills must be an array of strings");
    }
    if (fields.certifications !== undefined && !Array.isArray(fields.certifications)) {
      return badRequest("certifications must be an array of strings");
    }
    if (fields.project_history !== undefined && !Array.isArray(fields.project_history)) {
      return badRequest("project_history must be an array");
    }

    const updateData: Record<string, unknown> = {};
    if (fields.name !== undefined) updateData.name = sanitizeTitle(fields.name);
    if (fields.role !== undefined) updateData.role = sanitizeTitle(fields.role);
    if (fields.title !== undefined) updateData.title = fields.title ? sanitizeTitle(fields.title) : null;
    if (fields.email !== undefined) updateData.email = fields.email ? sanitizeString(fields.email) : null;
    if (fields.skills !== undefined) updateData.skills = fields.skills;
    if (fields.certifications !== undefined) updateData.certifications = fields.certifications;
    if (fields.clearance_level !== undefined) updateData.clearance_level = fields.clearance_level ? sanitizeString(fields.clearance_level) : null;
    if (fields.years_experience !== undefined) updateData.years_experience = typeof fields.years_experience === "number" ? fields.years_experience : null;
    if (fields.project_history !== undefined) updateData.project_history = fields.project_history;
    if (fields.bio !== undefined) updateData.bio = fields.bio ? sanitizeString(fields.bio) : null;
    if (fields.is_verified !== undefined) updateData.is_verified = !!fields.is_verified;

    const adminClient = createAdminClient();
    const { data: teamMember, error } = await adminClient
      .from("team_members")
      .update(updateData)
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .select(SELECT_FIELDS)
      .single();

    if (error || !teamMember) {
      if (error?.code === "PGRST116" || !teamMember) {
        return notFound("Team member not found");
      }
      return serverError("Failed to update team member", error);
    }

    clearL1Cache();
    return ok({ teamMember });
  } catch (error) {
    return serverError("Failed to update team member", error);
  }
}

/**
 * DELETE /api/settings/team-members?id=[id]
 * Delete a team member by ID
 */
export async function DELETE(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    if (!context) {
      return unauthorized();
    }

    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return badRequest("id query parameter is required");
    }

    const adminClient = createAdminClient();

    // Verify team member exists in this org
    const { data: existing } = await adminClient
      .from("team_members")
      .select("id")
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .single();

    if (!existing) {
      return notFound("Team member not found");
    }

    const { error } = await adminClient
      .from("team_members")
      .delete()
      .eq("id", id)
      .eq("organization_id", context.organizationId);

    if (error) {
      return serverError("Failed to delete team member", error);
    }

    clearL1Cache();
    return ok({ deleted: true });
  } catch (error) {
    return serverError("Failed to delete team member", error);
  }
}

// ── Resume extraction helper ────────────────────────────────────────────────

async function handleResumeExtraction(
  documentId: string,
  context: { organizationId: string; user: { id: string } },
) {
  const adminClient = createAdminClient();
  const log = logger;

  // Fetch document chunks to get the resume text
  const { data: chunks, error: chunkError } = await adminClient
    .from("document_chunks")
    .select("content")
    .eq("document_id", documentId)
    .order("chunk_index", { ascending: true });

  if (chunkError || !chunks?.length) {
    return badRequest("Could not read document content for resume extraction");
  }

  const resumeText = chunks.map((c) => c.content).join("\n\n");
  if (resumeText.trim().length < 50) {
    return badRequest("Document content too short for resume extraction");
  }

  // Call AI to extract structured team member data
  let extracted: Record<string, unknown>;
  try {
    const prompt = buildResumeExtractionPrompt(resumeText);
    const response = await generateText(prompt, { temperature: 0.2, maxTokens: 2048 });

    // Strip markdown code fences if present
    const cleaned = response.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    extracted = JSON.parse(cleaned);
  } catch (aiError) {
    log.error("Resume extraction AI call failed", aiError);
    return serverError("Failed to extract team member from resume", aiError);
  }

  // Validate required fields from AI response
  const extractedName = extracted.name as string;
  const extractedRole = extracted.role as string;
  if (!extractedName || !extractedRole) {
    return serverError("AI could not extract name and role from resume");
  }

  // Insert the extracted team member, linking back to the source document
  const { data: teamMember, error: insertError } = await adminClient
    .from("team_members")
    .insert({
      organization_id: context.organizationId,
      name: sanitizeTitle(extractedName),
      role: sanitizeTitle(extractedRole),
      title: extracted.title ? sanitizeTitle(extracted.title as string) : null,
      email: extracted.email ? sanitizeString(extracted.email as string) : null,
      skills: Array.isArray(extracted.skills) ? extracted.skills : [],
      certifications: Array.isArray(extracted.certifications) ? extracted.certifications : [],
      clearance_level: extracted.clearance_level ? sanitizeString(extracted.clearance_level as string) : null,
      years_experience: typeof extracted.years_experience === "number" ? extracted.years_experience : null,
      project_history: Array.isArray(extracted.project_history) ? extracted.project_history : [],
      bio: extracted.bio ? sanitizeString(extracted.bio as string) : null,
      resume_document_id: documentId,
      is_verified: false,
      created_by: context.user.id,
    })
    .select(SELECT_FIELDS)
    .single();

  if (insertError) {
    return serverError("Failed to create team member from resume", insertError);
  }

  clearL1Cache();
  return created({ teamMember, extractedFromResume: true });
}
