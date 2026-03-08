import { getModel } from "./models";
import { getClient } from "./gemini";

/**
 * Review a proposal section using Gemini.
 * Returns structured scores across 4 quality dimensions + feedback.
 */
export async function reviewWithGemini(prompt: string): Promise<{
  content_quality: number;
  client_fit: number;
  evidence: number;
  brand_voice: number;
  grounding?: number;
  feedback: string;
}> {
  const client = getClient();

  // Race against a 45s timeout to prevent hanging
  const GEMINI_REVIEW_TIMEOUT_MS = 45_000;
  const response = await Promise.race([
    client.models.generateContent({
      model: getModel("review"),
      contents: prompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    }),
    new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              `Gemini review timed out after ${GEMINI_REVIEW_TIMEOUT_MS / 1000}s`,
            ),
          ),
        GEMINI_REVIEW_TIMEOUT_MS,
      ),
    ),
  ]);
  const content = response.text;

  if (!content) {
    throw new Error("Gemini returned empty response");
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content);
  } catch (parseError) {
    const preview = content.length > 200 ? content.slice(-200) : content;
    throw new Error(
      `Gemini returned invalid JSON (${content.length} chars, likely truncated). Tail: ${preview}`,
    );
  }

  return {
    content_quality: Number(parsed.content_quality) || 0,
    client_fit: Number(parsed.client_fit) || 0,
    evidence: Number(parsed.evidence) || 0,
    brand_voice: Number(parsed.brand_voice) || 0,
    ...(parsed.grounding != null
      ? { grounding: Number(parsed.grounding) || 0 }
      : {}),
    feedback: String(parsed.feedback || ""),
  };
}
