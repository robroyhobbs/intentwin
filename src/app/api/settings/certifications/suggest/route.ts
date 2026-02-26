import { NextRequest } from "next/server";
import { getUserContext } from "@/lib/supabase/auth-api";
import { generateText } from "@/lib/ai/gemini";
import { unauthorized, badRequest, ok, serverError } from "@/lib/api/response";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const context = await getUserContext(request);
  if (!context) return unauthorized();

  let body: { certificationName: string };
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid request body");
  }

  const { certificationName } = body;
  if (!certificationName?.trim() || certificationName.trim().length < 3) {
    return badRequest("Certification name must be at least 3 characters");
  }

  try {
    const prompt = `You are helping a company fill out their proposal management profile.
Generate a concise, professional 1-2 sentence description for the following certification or partnership:

"${certificationName.trim()}"

The description should:
- Explain what the certification demonstrates or signifies
- Mention the benefit to clients or the credibility it provides
- Be written from the company's perspective (e.g. "We hold..." or "Our [cert] demonstrates...")
- Be 20-40 words

Respond with ONLY the description text. No quotes, no preamble, no explanation.`;

    const description = await generateText(prompt, {
      temperature: 0.4,
      maxTokens: 128,
    });

    return ok({ description: description.trim() });
  } catch (error) {
    return serverError("Failed to generate description", error);
  }
}
