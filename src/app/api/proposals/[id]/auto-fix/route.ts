import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext, verifyProposalAccess } from "@/lib/supabase/auth-api";
import { generateText } from "@/lib/ai/claude";
import { buildAutoFixPrompt } from "@/lib/ai/prompts/auto-fix";
import { getQualityFeedbackForSection } from "@/lib/ai/quality-overseer";

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

    // Verify proposal belongs to user's organization
    const proposal = await verifyProposalAccess(context, id);
    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { sectionId } = body;

    if (!sectionId) {
      return NextResponse.json(
        { error: "sectionId is required" },
        { status: 400 },
      );
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
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    const currentContent =
      section.edited_content || section.generated_content || "";

    if (!currentContent) {
      return NextResponse.json(
        { error: "Section has no content to revise" },
        { status: 400 },
      );
    }

    // Fetch open reviews for this section
    const { data: openReviews, error: reviewsError } = await adminClient
      .from("proposal_reviews")
      .select("id, content, selected_text")
      .eq("proposal_id", id)
      .eq("status", "open")
      .or(`section_id.eq.${sectionId},section_id.is.null`);

    if (reviewsError) {
      return NextResponse.json(
        { error: "Failed to fetch reviews" },
        { status: 500 },
      );
    }

    // Fetch quality judge feedback (non-blocking — null if unavailable)
    const qualityFeedback = await getQualityFeedbackForSection(
      id,
      sectionId,
    ).catch(() => null);

    const hasManualReviews = openReviews && openReviews.length > 0;

    if (!hasManualReviews && !qualityFeedback) {
      return NextResponse.json(
        { error: "No open reviews or quality feedback to address" },
        { status: 400 },
      );
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
      return NextResponse.json(
        { error: "AI returned empty response" },
        { status: 500 },
      );
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
      return NextResponse.json(
        { error: "Failed to update section" },
        { status: 500 },
      );
    }

    // Mark all addressed manual reviews as resolved
    const reviewIds = hasManualReviews ? openReviews.map((r) => r.id) : [];
    if (reviewIds.length > 0) {
      const { error: resolveError } = await adminClient
        .from("proposal_reviews")
        .update({
          status: "resolved",
          updated_at: new Date().toISOString(),
        })
        .in("id", reviewIds);

      if (resolveError) {
        console.error("Failed to resolve reviews:", resolveError);
      }
    }

    return NextResponse.json({
      success: true,
      resolvedCount: reviewIds.length,
      content: revisedContent,
    });
  } catch (error) {
    console.error("Auto-fix error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
