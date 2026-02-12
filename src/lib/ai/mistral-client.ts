import { Mistral } from "@mistralai/mistralai";

let mistralClient: Mistral | null = null;

/**
 * Get singleton Mistral client instance.
 * Requires MISTRAL_API_KEY environment variable.
 */
export function getMistralClient(): Mistral {
  if (!mistralClient) {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error(
        "MISTRAL_API_KEY is not set. Add it to your environment variables.",
      );
    }
    mistralClient = new Mistral({ apiKey });
  }
  return mistralClient;
}

/**
 * Review a proposal section using Mistral Small.
 * Returns structured scores across 4 quality dimensions + feedback.
 */
export async function reviewWithMistral(
  prompt: string,
): Promise<{
  content_quality: number;
  client_fit: number;
  evidence: number;
  brand_voice: number;
  feedback: string;
}> {
  const client = getMistralClient();

  const response = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    maxTokens: 1024,
    responseFormat: { type: "json_object" },
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Mistral returned empty response");
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
