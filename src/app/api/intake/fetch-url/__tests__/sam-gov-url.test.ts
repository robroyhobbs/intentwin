import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  detectSamGovUrl,
  constructPublicSamUrl,
  isAllowedExternalUrl,
  fetchSamOpportunityDescription,
} from "../route";

describe("SAM.gov URL Detection", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  // ── Happy Path ──────────────────────────────────────────────

  describe("Happy Path", () => {
    it("identifies workspace URL pattern", () => {
      const result = detectSamGovUrl(
        "https://sam.gov/workspace/contract/opp/da51523c-7f5d-47b7-b5fd-c269a0177be4/view",
      );
      expect(result.isWorkspace).toBe(true);
      expect(result.opportunityId).toBe(
        "da51523c-7f5d-47b7-b5fd-c269a0177be4",
      );
    });

    it("extracts correct UUID from workspace URL", () => {
      const result = detectSamGovUrl(
        "https://sam.gov/workspace/contract/opp/e92e78ae-7715-4efa-bd89-7be85d0b5eb8/view",
      );
      expect(result.opportunityId).toBe(
        "e92e78ae-7715-4efa-bd89-7be85d0b5eb8",
      );
    });

    it("constructs correct public URL", () => {
      const url = constructPublicSamUrl(
        "da51523c-7f5d-47b7-b5fd-c269a0177be4",
      );
      expect(url).toBe(
        "https://sam.gov/opp/da51523c-7f5d-47b7-b5fd-c269a0177be4/view",
      );
    });

    it("returns isWorkspace false for non-SAM.gov URLs", () => {
      const result = detectSamGovUrl("https://example.com/page");
      expect(result.isWorkspace).toBe(false);
      expect(result.opportunityId).toBeUndefined();
    });

    it("handles public SAM.gov URLs correctly (passes through)", () => {
      const result = detectSamGovUrl(
        "https://sam.gov/opp/da51523c-7f5d-47b7-b5fd-c269a0177be4/view",
      );
      expect(result.isWorkspace).toBe(false);
      expect(result.opportunityId).toBe(
        "da51523c-7f5d-47b7-b5fd-c269a0177be4",
      );
    });
  });

  // ── Bad Path ────────────────────────────────────────────────

  describe("Bad Path", () => {
    it("malformed SAM.gov URL without UUID treated as non-SAM", () => {
      const result = detectSamGovUrl(
        "https://sam.gov/workspace/contract/opp//view",
      );
      expect(result.isWorkspace).toBe(false);
      expect(result.opportunityId).toBeUndefined();
    });

    it("SAM.gov URL with extra query params still extracts UUID", () => {
      const result = detectSamGovUrl(
        "https://sam.gov/workspace/contract/opp/da51523c-7f5d-47b7-b5fd-c269a0177be4/view?tab=details",
      );
      expect(result.isWorkspace).toBe(true);
      expect(result.opportunityId).toBe(
        "da51523c-7f5d-47b7-b5fd-c269a0177be4",
      );
    });
  });

  // ── Edge Cases ──────────────────────────────────────────────

  describe("Edge Cases", () => {
    it("handles trailing slash", () => {
      const result = detectSamGovUrl(
        "https://sam.gov/workspace/contract/opp/da51523c-7f5d-47b7-b5fd-c269a0177be4/view/",
      );
      // Trailing slash after /view shouldn't match our regex
      // This is acceptable — user should use the exact URL format
      expect(result.isWorkspace).toBe(true);
    });

    it("handles mixed case (SAM.gov, Sam.Gov)", () => {
      const result = detectSamGovUrl(
        "https://SAM.GOV/workspace/contract/opp/da51523c-7f5d-47b7-b5fd-c269a0177be4/view",
      );
      expect(result.isWorkspace).toBe(true);
      expect(result.opportunityId).toBe(
        "da51523c-7f5d-47b7-b5fd-c269a0177be4",
      );
    });

    it("handles secure.sam.gov subdomain", () => {
      const result = detectSamGovUrl(
        "https://secure.sam.gov/workspace/contract/opp/da51523c-7f5d-47b7-b5fd-c269a0177be4/view",
      );
      // secure.sam.gov should still match
      expect(result.isWorkspace).toBe(true);
    });
  });

  // ── Security ────────────────────────────────────────────────

  describe("Security", () => {
    it("rejects non-allowlisted domains even if the path looks like SAM.gov", () => {
      expect(
        isAllowedExternalUrl(
          new URL(
            "https://evil.com/sam.gov/workspace/contract/opp/da51523c-7f5d-47b7-b5fd-c269a0177be4/view",
          ),
        ),
      ).toBe(false);
    });

    it("allows supported procurement hosts", () => {
      expect(
        isAllowedExternalUrl(
          new URL(
            "https://sam.gov/workspace/contract/opp/da51523c-7f5d-47b7-b5fd-c269a0177be4/view",
          ),
        ),
      ).toBe(true);
      expect(
        isAllowedExternalUrl(
          new URL(
            "https://secure.fedbidspeed.com/Handler.ashx?act=link&req=nav",
          ),
        ),
      ).toBe(true);
    });

    it("rejects link-local and localhost targets", () => {
      expect(isAllowedExternalUrl(new URL("http://127.0.0.1/test"))).toBe(
        false,
      );
      expect(isAllowedExternalUrl(new URL("http://localhost/test"))).toBe(
        false,
      );
    });
  });

  // ── Data Leak ───────────────────────────────────────────────

  describe("Data Leak", () => {
    it("detection result only contains expected fields", () => {
      const result = detectSamGovUrl(
        "https://sam.gov/workspace/contract/opp/da51523c-7f5d-47b7-b5fd-c269a0177be4/view",
      );
      const keys = Object.keys(result);
      expect(keys).toContain("isWorkspace");
      expect(keys).toContain("opportunityId");
      expect(keys.length).toBeLessThanOrEqual(2);
    });
  });

  // ── Data Damage ─────────────────────────────────────────────

  describe("Data Damage", () => {
    it("detection does not modify input URL string", () => {
      const url =
        "https://sam.gov/workspace/contract/opp/da51523c-7f5d-47b7-b5fd-c269a0177be4/view";
      const urlCopy = url;
      detectSamGovUrl(url);
      expect(url).toBe(urlCopy);
    });
  });

  describe("Direct Description Fallback", () => {
    it("uses the intelligence service first when configured", async () => {
      vi.stubEnv("INTELLIGENCE_API_URL", "https://intel.example.com");
      vi.stubEnv("INTELLIGENCE_SERVICE_KEY", "svc-key");

      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              description:
                "A".repeat(80),
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
        );
      vi.stubGlobal("fetch", fetchMock);

      const description = await fetchSamOpportunityDescription("notice-1");

      expect(description).toBe("A".repeat(80));
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(String(fetchMock.mock.calls[0][0])).toContain(
        "/api/v1/opportunities/source/sam_gov/notice-1/description",
      );
    });

    it("falls back to the direct SAM description API when intelligence is unavailable", async () => {
      vi.stubEnv("SAM_API_KEY", "sam-key");

      const fetchMock = vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            description: "Federal opportunity description from SAM.gov",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );
      vi.stubGlobal("fetch", fetchMock);

      const description = await fetchSamOpportunityDescription("notice-2");

      expect(description).toBe("Federal opportunity description from SAM.gov");
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(String(fetchMock.mock.calls[0][0])).toContain(
        "noticeid=notice-2",
      );
    });
  });
});
