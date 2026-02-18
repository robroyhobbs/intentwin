import { GoogleGenerativeAI } from "@google/generative-ai";

let geminiClient: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    geminiClient = new GoogleGenerativeAI(apiKey);
  }
  return geminiClient;
}

/**
 * Review a proposal section using Gemini.
 * Returns structured scores across 4 quality dimensions + feedback.
 */
export async function reviewWithGemini(prompt: string): Promise<{
  content_quality: number;
  client_fit: number;
  evidence: number;
  brand_voice: number;
  feedback: string;
}> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-3-pro-preview",
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
  });

  // Race against a 45s timeout to prevent hanging
  const GEMINI_REVIEW_TIMEOUT_MS = 45_000;
  const result = await Promise.race([
    model.generateContent(prompt),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Gemini review timed out after ${GEMINI_REVIEW_TIMEOUT_MS / 1000}s`)),
        GEMINI_REVIEW_TIMEOUT_MS,
      ),
    ),
  ]);
  const content = result.response.text();

  if (!content) {
    throw new Error("Gemini returned empty response");
  }

  const parsed = JSON.parse(content);
  return {
    content_quality: Number(parsed.content_quality) || 0,
    client_fit: Number(parsed.client_fit) || 0,
    evidence: Number(parsed.evidence) || 0,
    brand_voice: Number(parsed.brand_voice) || 0,
    feedback: String(parsed.feedback || ""),
  };
}
