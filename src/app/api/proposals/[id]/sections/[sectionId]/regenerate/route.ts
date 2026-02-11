import { NextRequest, NextResponse } from "next/server";
import { getUserContext, verifyProposalAccess } from "@/lib/supabase/auth-api";
import { regenerateSection } from "@/lib/ai/pipeline";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const { id, sectionId } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const proposal = await verifyProposalAccess(context, id);
    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    // Fire-and-forget regeneration
    regenerateSection(id, sectionId).catch((err) => {
      console.error(
        `Section regeneration failed for ${sectionId}:`,
        err,
      );
    });

    return NextResponse.json({
      status: "regenerating",
      sectionId,
      message: "Section regeneration started.",
    });
  } catch (error) {
    console.error("Regenerate section error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
