/**
 * Test Utilities
 * 
 * Central export for all test utilities used across the IntentBid test suite.
 * 
 * Usage:
 * ```typescript
 * import { 
 *   createMockSupabase, 
 *   createMockGeminiClient,
 *   createMockOrganization,
 *   createMockProposal 
 * } from "@/lib/test-utils";
 * ```
 */

// Supabase mocks
export {
  createMockSupabaseClient,
  createMockSupabaseAuth,
  createMockSupabase,
  createMockSupabaseWithHelpers,
} from "./mock-supabase";

// AI mocks
export {
  createMockGeminiClient,
  createMockVoyageClient,
  createMockAIPipeline,
  createMockAIResponse,
  createMockEmbeddingResponse,
} from "./mock-ai";

// Test data factories
export {
  createMockOrganization,
  createMockUser,
  createMockProposal,
  createMockDocument,
  createMockArray,
  createTestContext,
  type MockOrganization,
  type MockUser,
  type MockProposal,
  type MockDocument,
} from "./test-data";

// API test helpers
export {
  makeApiRequest,
  parseApiResponse,
  createMockUserContext,
  createCrudMockDb,
} from "./mock-api-helpers";
