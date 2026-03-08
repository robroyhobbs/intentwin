import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { voyageApiUrl, voyageHeliconeHeaders } from "../helicone";

describe("helicone", () => {
  describe("when HELICONE_API_KEY is not set", () => {
    beforeEach(() => {
      vi.stubEnv("HELICONE_API_KEY", "");
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("voyageApiUrl returns direct Voyage endpoint", () => {
      expect(voyageApiUrl()).toBe("https://api.voyageai.com/v1/embeddings");
    });

    it("voyageHeliconeHeaders returns empty object", () => {
      expect(voyageHeliconeHeaders()).toEqual({});
    });
  });

  describe("when HELICONE_API_KEY is set", () => {
    beforeEach(() => {
      vi.stubEnv("HELICONE_API_KEY", "test-key");
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("voyageApiUrl returns Helicone gateway URL", () => {
      expect(voyageApiUrl()).toBe("https://gateway.helicone.ai/v1/embeddings");
    });

    it("voyageHeliconeHeaders returns proxied headers", () => {
      expect(voyageHeliconeHeaders()).toEqual({
        "Helicone-Auth": "Bearer test-key",
        "Helicone-Target-Url": "https://api.voyageai.com",
        "Helicone-Target-Provider": "VoyageAI",
      });
    });
  });
});
