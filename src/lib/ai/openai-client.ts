import OpenAI from "openai";
import { createReviewClient, type ReviewScores } from "./review-client-factory";
import { openaiHeliconeOptions } from "@/lib/observability/helicone";

const { getClient, review } = createReviewClient<OpenAI>({
  providerName: "GPT-4o",
  envVar: "OPENAI_API_KEY",
  createClient: (apiKey) => new OpenAI({ apiKey, ...openaiHeliconeOptions() }),
  callApi: async (client, prompt, options) => {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 1024,
      response_format: { type: "json_object" },
    });
    return response.choices[0]?.message?.content ?? "";
  },
});

/**
 * Get singleton OpenAI client instance.
 * Requires OPENAI_API_KEY environment variable.
 */
export function getOpenAIClient(): OpenAI {
  return getClient();
}

/**
 * Review a proposal section using GPT-4o.
 * Returns structured scores across 4 quality dimensions + feedback.
 */
export async function reviewWithGPT4o(
  prompt: string,
  options: { temperature?: number; maxTokens?: number } = {},
): Promise<ReviewScores> {
  return review(prompt, options);
}
