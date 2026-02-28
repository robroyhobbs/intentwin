import { vi, beforeAll, afterAll, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

/**
 * Vitest setup file
 * Runs before all tests
 */

// Global test timeout
vi.setConfig({ testTimeout: 30000 });

// Mock environment variables
beforeAll(() => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
  vi.stubEnv("GOOGLE_AI_API_KEY", "test-google-ai-key");
  vi.stubEnv("VOYAGE_API_KEY", "test-voyage-key");
});

// Cleanup after each test
afterEach(() => {
  // Clean up any mounted React components
  cleanup();
  
  // Clear all mocks
  vi.clearAllMocks();
  
  // Reset modules to ensure clean state
  vi.resetModules();
});

// Cleanup after all tests
afterAll(() => {
  // Restore environment variables
  vi.unstubAllEnvs();
  
  // Restore all mocks
  vi.restoreAllMocks();
});
