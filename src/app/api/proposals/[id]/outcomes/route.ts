import { NextRequest, NextResponse } from "next/server";
import { getUserContext, verifyProposalAccess } from "@/lib/supabase/auth-api";
import { generateText } from "@/lib/ai/claude";
import { buildOutcomesPrompt } from "@/lib/ai/prompts/outcomes";
import { getIndustryConfig } from "@/lib/ai/industry-configs";
import type { WinStrategyData } from "@/types/outcomes";

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
    const { intake_data } = body;

    if (!intake_data) {
      return NextResponse.json(
        { error: "Intake data is required" },
        { status: 400 },
      );
    }

    // Generate outcomes using Claude, with industry win themes if available
    const industryConfig = getIndustryConfig(
      (intake_data.client_industry as string) || "",
    );
    let prompt = buildOutcomesPrompt(intake_data);
    if (industryConfig && industryConfig.winThemes.length > 0) {
      prompt += `\n\n## Industry Win Themes\nFor the ${industryConfig.displayName} sector, consider incorporating these proven win themes:\n${industryConfig.winThemes.map((t) => `- ${t}`).join("\n")}\n\nWeave these into the win_themes and differentiators you generate.`;
    }
    const rawResponse = await generateText(prompt, { temperature: 0.5 });

    // Parse the JSON response
    let parsed: Omit<WinStrategyData, "generated_at">;
    try {
      // Strip any markdown code fences if present
      const cleaned = rawResponse
        .replace(/^```(?:json)?\s*/m, "")
        .replace(/\s*```$/m, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse outcomes JSON:", rawResponse);
      return NextResponse.json(
        { error: "Failed to parse AI-generated outcomes" },
        { status: 500 },
      );
    }

    // Add IDs and metadata to target outcomes
    const winStrategy: WinStrategyData = {
      win_themes: parsed.win_themes || [],
      success_metrics: parsed.success_metrics || [],
      differentiators: parsed.differentiators || [],
      target_outcomes: (parsed.target_outcomes || []).map((o, i) => ({
        id: `outcome-${Date.now()}-${i}`,
        outcome: o.outcome,
        category: o.category || "cost_optimization",
        priority: o.priority || "medium",
        ai_suggested: true,
        user_edited: false,
      })),
      generated_at: new Date().toISOString(),
    };

    return NextResponse.json({ win_strategy: winStrategy });
  } catch (error) {
    console.error("Generate outcomes error:", error);
    return NextResponse.json(
      { error: "Failed to generate outcomes" },
      { status: 500 },
    );
  }
}
