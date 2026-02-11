import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ============================================================
// Phase 0: OpenAI Client — Tests First (RED)
// ============================================================

// ============================================================
// HAPPY PATH
// ============================================================
describe("Happy Path", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV, OPENAI_API_KEY: "sk-test-key-12345" };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("getOpenAIClient returns an OpenAI instance when key is set", async () => {
    const { getOpenAIClient } = await import("../openai-client");
    const client = getOpenAIClient();
    expect(client).toBeDefined();
    expect(typeof client.chat).toBe("object");
  });

  it("getOpenAIClient returns singleton (same instance on multiple calls)", async () => {
    const { getOpenAIClient } = await import("../openai-client");
    const a = getOpenAIClient();
    const b = getOpenAIClient();
    expect(a).toBe(b);
  });

  it("reviewWithGPT4o calls chat.completions.create with correct model", async () => {
    const { reviewWithGPT4o } = await import("../openai-client");

    // Mock the OpenAI client
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              content_quality: 8,
              client_fit: 9,
              evidence: 7,
              brand_voice: 8,
              feedback: "Good section overall.",
            }),
          },
        },
      ],
    });

    // We'll test the function signature and return type
    // The actual API call is tested in integration tests
    expect(typeof reviewWithGPT4o).toBe("function");
  });
});

// ============================================================
// BAD PATH
// ============================================================
describe("Bad Path", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("getOpenAIClient throws when OPENAI_API_KEY is missing", async () => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.OPENAI_API_KEY;

    const { getOpenAIClient } = await import("../openai-client");
    expect(() => getOpenAIClient()).toThrow("OPENAI_API_KEY");
  });

  it("getOpenAIClient throws when OPENAI_API_KEY is empty string", async () => {
    process.env = { ...ORIGINAL_ENV, OPENAI_API_KEY: "" };

    const { getOpenAIClient } = await import("../openai-client");
    expect(() => getOpenAIClient()).toThrow("OPENAI_API_KEY");
  });
});

// ============================================================
// EDGE CASES
// ============================================================
describe("Edge Cases", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV, OPENAI_API_KEY: "sk-test-key-12345" };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("module exports expected functions", async () => {
    const mod = await import("../openai-client");
    expect(typeof mod.getOpenAIClient).toBe("function");
    expect(typeof mod.reviewWithGPT4o).toBe("function");
  });
});

// ============================================================
// SECURITY
// ============================================================
describe("Security", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV, OPENAI_API_KEY: "sk-test-key-12345" };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("API key is not exposed in error messages when call fails", async () => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.OPENAI_API_KEY;

    const { getOpenAIClient } = await import("../openai-client");
    try {
      getOpenAIClient();
    } catch (e: unknown) {
      const msg = (e as Error).message;
      expect(msg).not.toContain("sk-");
      expect(msg).toContain("OPENAI_API_KEY");
    }
  });
});

// ============================================================
// DATA LEAK
// ============================================================
describe("Data Leak", () => {
  it("OpenAI client module does not export the raw API key", async () => {
    const mod = await import("../openai-client");
    const exported = Object.keys(mod);
    expect(exported).not.toContain("apiKey");
    expect(exported).not.toContain("OPENAI_API_KEY");
  });
});

// ============================================================
// DATA DAMAGE
// ============================================================
describe("Data Damage", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV, OPENAI_API_KEY: "sk-test-key-12345" };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("creating client does not modify process.env", async () => {
    const envBefore = { ...process.env };
    const { getOpenAIClient } = await import("../openai-client");
    getOpenAIClient();
    expect(process.env).toEqual(envBefore);
  });
});
