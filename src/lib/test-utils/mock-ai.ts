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
 * Mock OpenAI client
 */
export function createMockOpenAIClient() {
  return {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
    embeddings: {
      create: vi.fn(),
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
