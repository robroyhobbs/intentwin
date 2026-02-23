import { Mistral } from "@mistralai/mistralai";
import { createReviewClient, type ReviewScores } from "./review-client-factory";
import { mistralHeliconeOptions } from "@/lib/observability/helicone";

const { getClient, review } = createReviewClient<Mistral>({
  providerName: "Mistral",
  envVar: "MISTRAL_API_KEY",
  createClient: (apiKey) => new Mistral({ apiKey, ...mistralHeliconeOptions() }),
  callApi: async (client, prompt) => {
    const response = await client.chat.complete({
      model: "mistral-small-latest",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      maxTokens: 1024,
      responseFormat: { type: "json_object" },
    });
    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") return "";
    return content;
  },
});

/**
 * Get singleton Mistral client instance.
 * Requires MISTRAL_API_KEY environment variable.
 */
export function getMistralClient(): Mistral {
  return getClient();
}

/**
 * Review a proposal section using Mistral Small.
 * Returns structured scores across 4 quality dimensions + feedback.
 */
export async function reviewWithMistral(prompt: string): Promise<ReviewScores> {
  return review(prompt);
}
