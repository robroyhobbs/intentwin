import Groq from "groq-sdk";

let groqClient: Groq | null = null;

/**
 * Get singleton Groq client instance.
 * Requires GROQ_API_KEY environment variable.
 */
export function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GROQ_API_KEY is not set. Add it to your environment variables.",
      );
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

/**
 * Review a proposal section using Llama 3.3 70B via Groq.
 * Returns structured scores across 4 quality dimensions + feedback.
 */
export async function reviewWithGroq(
  prompt: string,
): Promise<{
  content_quality: number;
  client_fit: number;
  evidence: number;
  brand_voice: number;
  feedback: string;
}> {
  const client = getGroqClient();

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 1024,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Groq/Llama returned empty response");
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
