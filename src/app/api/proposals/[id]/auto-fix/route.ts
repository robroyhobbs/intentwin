import { createAdminClient } from "@/lib/supabase/admin";
import { generateText } from "@/lib/ai/gemini";
import { buildAutoFixPrompt } from "@/lib/ai/prompts/auto-fix";
import { getQualityFeedbackForSection } from "@/lib/ai/quality-overseer";
import { ReviewStatus } from "@/lib/constants/statuses";
import { badRequest, ok, serverError, withProposalRoute } from "@/lib/api/response";
import { logger } from "@/lib/utils/logger";

/** AI-powered section rewrite */
export const maxDuration = 120;

export const POST = withProposalRoute(
  async (request, { id }, context) => {
    const body = await request.json();
    const { sectionId } = body;

    if (!sectionId) {
      return badRequest("sectionId is required");
    }

    const adminClient = createAdminClient();

    // Fetch the section content
    const { data: section, error: sectionError } = await adminClient
      .from("proposal_sections")
      .select("id, title, generated_content, edited_content")
      .eq("id", sectionId)
      .eq("proposal_id", id)
      .single();

    if (sectionError || !section) {
      return badRequest("Section not found");
    }

    const currentContent =
      section.edited_content || section.generated_content || "";

    if (!currentContent) {
      return badRequest("Section has no content to revise");
    }

    // Fetch open reviews for this section
    const { data: openReviews, error: reviewsError } = await adminClient
      .from("proposal_reviews")
      .select("id, content, selected_text")
      .eq("proposal_id", id)
      .eq("status", ReviewStatus.OPEN)
      .or(`section_id.eq.${sectionId},section_id.is.null`);

    if (reviewsError) {
      return serverError("Failed to fetch reviews", reviewsError);
    }

    // Fetch quality judge feedback (non-blocking — null if unavailable)
    const qualityFeedback = await getQualityFeedbackForSection(
      id,
      sectionId,
    ).catch(() => null);

    const hasManualReviews = openReviews && openReviews.length > 0;

    if (!hasManualReviews && !qualityFeedback) {
      return badRequest("No open reviews or quality feedback to address");
    }

    // Build the auto-fix prompt with both feedback sources
    const { system, user: userPrompt } = buildAutoFixPrompt(
      section.title,
      currentContent,
      hasManualReviews
        ? openReviews.map((r) => ({
            id: r.id,
            content: r.content,
            selected_text: r.selected_text,
          }))
        : [],
      qualityFeedback,
    );

    // Call Claude to generate revised content
    const revisedContent = await generateText(userPrompt, {
      systemPrompt: system,
      maxTokens: 8192,
      temperature: 0.3,
    });

    if (!revisedContent) {
      return serverError("AI returned empty response");
    }

    // Update section content
    const { error: updateError } = await adminClient
      .from("proposal_sections")
      .update({
        edited_content: revisedContent,
        is_edited: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sectionId);

    if (updateError) {
      return serverError("Failed to update section", updateError);
    }

    // Mark all addressed manual reviews as resolved
    const reviewIds = hasManualReviews ? openReviews.map((r) => r.id) : [];
    if (reviewIds.length > 0) {
      const { error: resolveError } = await adminClient
        .from("proposal_reviews")
        .update({
          status: ReviewStatus.RESOLVED,
          updated_at: new Date().toISOString(),
        })
        .in("id", reviewIds);

      if (resolveError) {
        logger.warn("Failed to resolve reviews", { error: resolveError });
      }
    }

    return ok({
      success: true,
      resolvedCount: reviewIds.length,
      content: revisedContent,
    });
  },
);
