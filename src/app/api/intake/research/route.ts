import { NextRequest, NextResponse } from "next/server";
import { getUserContext } from "@/lib/supabase/auth-api";
import { generateText } from "@/lib/ai/gemini";
import { buildResearchPrompt } from "@/lib/ai/prompts/extract-intake";
import type { ClientResearch } from "@/types/intake";

/** AI research call */
export const maxDuration = 120;

const RESEARCH_SYSTEM_PROMPT = `You are a business intelligence analyst with access to current information about companies. You provide thorough, accurate research to help consulting teams prepare winning proposals. You always respond with valid JSON only.`;

export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { client_name, industry_hint } = body;

    if (!client_name) {
      return NextResponse.json(
        { error: "client_name is required" },
        { status: 400 }
      );
    }

    // Build research prompt
    const prompt = buildResearchPrompt(client_name, industry_hint);

    // Call Claude for research
    // Note: In production, you might want to use web search tools here
    // For now, Claude will use its training knowledge
    const response = await generateText(prompt, {
      systemPrompt: RESEARCH_SYSTEM_PROMPT,
      temperature: 0.5,
      maxTokens: 4096,
    });

    // Parse JSON response
    let research: ClientResearch;
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = response;
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      research = JSON.parse(jsonStr.trim());
    } catch (_parseError) {
      console.error("Failed to parse research response:", response);
      return NextResponse.json(
        { error: "Failed to parse research results" },
        { status: 500 }
      );
    }

    // Add timestamp
    research.researched_at = new Date().toISOString();

    return NextResponse.json({ research });
  } catch (error) {
    console.error("Research error:", error);
    return NextResponse.json(
      { error: "Failed to research client" },
      { status: 500 }
    );
  }
}
