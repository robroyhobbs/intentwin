import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

/**
 * Get singleton OpenAI client instance.
 * Requires OPENAI_API_KEY environment variable.
 */
export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY is not set. Add it to your environment variables.",
      );
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Review a proposal section using GPT-4o.
 * Returns structured scores across 4 quality dimensions + feedback.
 */
export async function reviewWithGPT4o(
  prompt: string,
  options: { temperature?: number; maxTokens?: number } = {},
): Promise<{
  content_quality: number;
  client_fit: number;
  evidence: number;
  brand_voice: number;
  feedback: string;
}> {
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 1024,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("GPT-4o returned empty response");
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
