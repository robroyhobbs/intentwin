import { NextRequest } from "next/server";
import { getUserContext, checkProposalAccess } from "@/lib/supabase/auth-api";
import { generateText } from "@/lib/ai/gemini";
import { buildOutcomesPrompt } from "@/lib/ai/prompts/outcomes";
import { getIndustryConfig } from "@/lib/ai/industry-configs";
import { unauthorized, notFound, badRequest, ok, serverError } from "@/lib/api/response";
import type { WinStrategyData } from "@/types/outcomes";

/** AI outcome generation */
export const maxDuration = 120;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return unauthorized();
    }

    // Verify proposal belongs to user's organization
    const hasAccess = await checkProposalAccess(context, id);
    if (!hasAccess) {
      return notFound("Proposal not found");
    }

    const body = await request.json();
    const { intake_data } = body;

    if (!intake_data) {
      return badRequest("Intake data is required");
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
    } catch (parseError) {
      return serverError("Failed to parse AI-generated outcomes", parseError);
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

    return ok({ win_strategy: winStrategy });
  } catch (error) {
    return serverError("Failed to generate outcomes", error);
  }
}
