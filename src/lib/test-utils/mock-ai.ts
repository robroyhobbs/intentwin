import { vi } from "vitest";

/**
 * Mock Google Gemini (Generative AI) client
 */
export function createMockGeminiClient() {
  return {
    generateContent: vi.fn(),
    generateContentStream: vi.fn(),
    startChat: vi.fn(() => ({
      sendMessage: vi.fn(),
      sendMessageStream: vi.fn(),
    })),
  };
}

/**
 * Mock Voyage AI embeddings client
 */
export function createMockVoyageClient() {
  return {
    embed: vi.fn(),
    embedDocuments: vi.fn(),
    embedQuery: vi.fn(),
  };
}

/**
 * Mock Groq client
 *
 * Matches the Groq SDK interface used in groq-client.ts:
 *   client.chat.completions.create({ model, messages, temperature, max_tokens, response_format })
 *
 * The Groq SDK (`groq-sdk`) mirrors the OpenAI API shape.
 */
export function createMockGroqClient() {
  return {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          id: "chatcmpl-mock-groq",
          object: "chat.completion",
          created: Date.now(),
          model: "llama-3.3-70b-versatile",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: JSON.stringify({
                  content_quality: 8,
                  client_fit: 7,
                  evidence: 6,
                  brand_voice: 8,
                  feedback:
                    "Mock Groq review: Section demonstrates solid structure with room for improvement in evidence citations.",
                }),
              },
              finish_reason: "stop",
            },
          ],
          usage: {
            prompt_tokens: 500,
            completion_tokens: 120,
            total_tokens: 620,
          },
        }),
      },
    },
  };
}

/**
 * Mock Mistral client
 *
 * Matches the Mistral SDK interface used in mistral-client.ts:
 *   client.chat.complete({ model, messages, temperature, maxTokens, responseFormat })
 *
 * Note: Mistral SDK uses `chat.complete()` (not `chat.completions.create()`),
 * `maxTokens` (camelCase), and `responseFormat` (camelCase).
 */
export function createMockMistralClient() {
  return {
    chat: {
      complete: vi.fn().mockResolvedValue({
        id: "cmpl-mock-mistral",
        object: "chat.completion",
        created: Date.now(),
        model: "mistral-small-latest",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: JSON.stringify({
                content_quality: 7,
                client_fit: 8,
                evidence: 7,
                brand_voice: 7,
                feedback:
                  "Mock Mistral review: Content is well-structured. Consider strengthening evidence with specific metrics and case study references.",
              }),
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 480,
          completion_tokens: 110,
          total_tokens: 590,
        },
      }),
    },
  };
}

/**
 * Creates a mock AI pipeline for proposal generation
 */
export function createMockAIPipeline() {
  return {
    generateSection: vi.fn(),
    runQualityReview: vi.fn(),
    extractRequirements: vi.fn(),
    buildWinStrategy: vi.fn(),
  };
}

/**
 * Helper to create consistent mock AI responses
 */
export function createMockAIResponse<T>(data: T) {
  return {
    data: {
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify(data),
          }],
        },
      }],
    },
  };
}

/**
 * Helper to create mock embedding response
 */
export function createMockEmbeddingResponse(vector: number[] = []) {
  const defaultVector = Array(1024).fill(0).map(() => Math.random());
  return {
    data: [{
      embedding: vector.length > 0 ? vector : defaultVector,
    }],
  };
}

/**
 * Helper to create a mock Groq review response with custom scores
 */
export function createMockGroqReviewResponse(scores?: {
  content_quality?: number;
  client_fit?: number;
  evidence?: number;
  brand_voice?: number;
  feedback?: string;
}) {
  return {
    id: "chatcmpl-mock-groq",
    object: "chat.completion",
    created: Date.now(),
    model: "llama-3.3-70b-versatile",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: JSON.stringify({
            content_quality: scores?.content_quality ?? 8,
            client_fit: scores?.client_fit ?? 7,
            evidence: scores?.evidence ?? 6,
            brand_voice: scores?.brand_voice ?? 8,
            feedback:
              scores?.feedback ??
              "Mock Groq review: Section demonstrates solid structure.",
          }),
        },
        finish_reason: "stop",
      },
    ],
    usage: { prompt_tokens: 500, completion_tokens: 120, total_tokens: 620 },
  };
}

/**
 * Helper to create a mock Mistral review response with custom scores
 */
export function createMockMistralReviewResponse(scores?: {
  content_quality?: number;
  client_fit?: number;
  evidence?: number;
  brand_voice?: number;
  feedback?: string;
}) {
  return {
    id: "cmpl-mock-mistral",
    object: "chat.completion",
    created: Date.now(),
    model: "mistral-small-latest",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: JSON.stringify({
            content_quality: scores?.content_quality ?? 7,
            client_fit: scores?.client_fit ?? 8,
            evidence: scores?.evidence ?? 7,
            brand_voice: scores?.brand_voice ?? 7,
            feedback:
              scores?.feedback ??
              "Mock Mistral review: Content is well-structured.",
          }),
        },
        finish_reason: "stop",
      },
    ],
    usage: { prompt_tokens: 480, completion_tokens: 110, total_tokens: 590 },
  };
}
