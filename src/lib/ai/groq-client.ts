import Groq from "groq-sdk";
import { createReviewClient, type ReviewScores } from "./review-client-factory";

const { getClient, review } = createReviewClient<Groq>({
  providerName: "Groq/Llama",
  envVar: "GROQ_API_KEY",
  createClient: (apiKey) => new Groq({ apiKey }),
  callApi: async (client, prompt) => {
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    });
    return response.choices[0]?.message?.content ?? "";
  },
});

/**
 * Get singleton Groq client instance.
 * Requires GROQ_API_KEY environment variable.
 */
export function getGroqClient(): Groq {
  return getClient();
}

/**
 * Review a proposal section using Llama 3.3 70B via Groq.
 * Returns structured scores across 4 quality dimensions + feedback.
 */
export async function reviewWithGroq(prompt: string): Promise<ReviewScores> {
  return review(prompt);
}
