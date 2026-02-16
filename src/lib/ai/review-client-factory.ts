/**
 * Review Client Factory
 *
 * Generic factory that extracts the shared singleton + review pattern used
 * by all LLM review clients (OpenAI, Groq, Mistral, etc.).
 *
 * Each provider supplies:
 *   - How to construct its SDK client (constructor + env var)
 *   - How to call its chat API and extract the raw content string
 *
 * The factory handles:
 *   - Lazy singleton initialization
 *   - Graceful "no API key" error
 *   - Response parsing & score normalization
 */

// ── Shared return type (matches quality-review.ts QualityScores) ──

export interface ReviewScores {
  content_quality: number;
  client_fit: number;
  evidence: number;
  brand_voice: number;
  feedback: string;
}

// ── Factory config ──

export interface ReviewClientConfig<TClient> {
  /** Human-readable provider name, used in error messages (e.g. "OpenAI") */
  providerName: string;

  /** Environment variable that holds the API key (e.g. "OPENAI_API_KEY") */
  envVar: string;

  /** Construct the SDK client given an API key */
  createClient: (apiKey: string) => TClient;

  /**
   * Execute the chat/completion call and return the raw content string.
   * The factory handles JSON parsing and score normalization.
   */
  callApi: (client: TClient, prompt: string, options?: ReviewCallOptions) => Promise<string>;
}

export interface ReviewCallOptions {
  temperature?: number;
  maxTokens?: number;
}

// ── Factory function ──

export function createReviewClient<TClient>(config: ReviewClientConfig<TClient>) {
  let instance: TClient | null = null;

  /**
   * Get or create the singleton SDK client.
   * Throws if the required env var is missing.
   */
  function getClient(): TClient {
    if (!instance) {
      const apiKey = process.env[config.envVar];
      if (!apiKey) {
        throw new Error(
          `${config.envVar} is not set. Add it to your environment variables.`,
        );
      }
      instance = config.createClient(apiKey);
    }
    return instance;
  }

  /**
   * Send a prompt to the provider and return normalized quality scores.
   */
  async function review(
    prompt: string,
    options: ReviewCallOptions = {},
  ): Promise<ReviewScores> {
    const client = getClient();
    const content = await config.callApi(client, prompt, options);

    if (!content) {
      throw new Error(`${config.providerName} returned empty response`);
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

  return { getClient, review };
}
