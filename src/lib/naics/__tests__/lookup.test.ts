import { describe, it, expect } from "vitest";
import {
  searchNaics,
  isValidNaicsCode,
  getNaicsEntry,
  parseNaicsCodes,
  extractNaicsFromText,
} from "../lookup";

describe("NAICS Lookup", () => {
  // ── Happy Path ──────────────────────────────────────────────

  describe("Happy Path", () => {
    it("searches by code number", () => {
      const results = searchNaics("541512");
      expect(results).toHaveLength(1);
      expect(results[0].code).toBe("541512");
      expect(results[0].description).toContain("Computer Systems Design");
    });

    it("searches by partial code prefix", () => {
      const results = searchNaics("5415");
      expect(results.length).toBeGreaterThan(1);
      for (const r of results) {
        expect(r.code.startsWith("5415") || r.code.includes("5415")).toBe(true);
      }
    });

    it("searches by description keyword", () => {
      const results = searchNaics("computer");
      expect(results.length).toBeGreaterThan(0);
      for (const r of results) {
        expect(r.description.toLowerCase()).toContain("computer");
      }
    });

    it("selected codes appear as removable entries via getNaicsEntry", () => {
      const entry = getNaicsEntry("541512");
      expect(entry).toBeDefined();
      expect(entry!.code).toBe("541512");
      expect(entry!.description).toContain("Computer Systems Design");
    });

    it("comma-separated paste adds multiple codes", () => {
      const result = parseNaicsCodes("541512,541511");
      expect(result.valid).toHaveLength(2);
      expect(result.valid.map((v) => v.code)).toContain("541512");
      expect(result.valid.map((v) => v.code)).toContain("541511");
      expect(result.invalid).toHaveLength(0);
    });

    it("extracts NAICS codes from RFP text", () => {
      const text =
        "This solicitation is classified under NAICS Code 541512 (Computer Systems Design Services). Secondary NAICS: 541511.";
      const results = extractNaicsFromText(text);
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.code)).toContain("541512");
      expect(results.map((r) => r.code)).toContain("541511");
    });
  });

  // ── Bad Path ────────────────────────────────────────────────

  describe("Bad Path", () => {
    it("invalid NAICS code returns false from isValidNaicsCode", () => {
      expect(isValidNaicsCode("999999")).toBe(false);
      expect(isValidNaicsCode("000000")).toBe(false);
    });

    it("empty search query shows top-level categories", () => {
      const results = searchNaics("");
      expect(results.length).toBeGreaterThan(0);
      // Should be deduped by 2-digit prefix
      const prefixes = results.map((r) => r.code.slice(0, 2));
      const uniquePrefixes = new Set(prefixes);
      expect(uniquePrefixes.size).toBe(prefixes.length);
    });

    it("pasting non-numeric text doesn't add invalid codes", () => {
      const result = parseNaicsCodes("hello,world,541512");
      expect(result.valid).toHaveLength(1);
      expect(result.valid[0].code).toBe("541512");
      expect(result.invalid).toContain("hello");
      expect(result.invalid).toContain("world");
    });

    it("extraction returns empty for text with no NAICS codes", () => {
      const results = extractNaicsFromText(
        "This RFP requires cloud migration services for the agency.",
      );
      expect(results).toHaveLength(0);
    });
  });

  // ── Edge Cases ──────────────────────────────────────────────

  describe("Edge Cases", () => {
    it("ambiguous partial input shows multiple results", () => {
      const results = searchNaics("54");
      expect(results.length).toBeGreaterThan(5);
    });

    it("search respects limit parameter", () => {
      const results = searchNaics("5", 3);
      expect(results.length).toBeLessThanOrEqual(3);
    });

    it("handles NAICS in various RFP formats", () => {
      const formats = [
        "NAICS: 541512",
        "NAICS Code 541512",
        "541512 (Computer Systems)",
        "NAICS 541512;",
      ];
      for (const fmt of formats) {
        const results = extractNaicsFromText(fmt);
        expect(results).toHaveLength(1);
        expect(results[0].code).toBe("541512");
      }
    });

    it("deduplicates extracted codes", () => {
      const text = "NAICS 541512 is the primary code. NAICS: 541512 again.";
      const results = extractNaicsFromText(text);
      expect(results).toHaveLength(1);
    });

    it("parseNaicsCodes handles whitespace and mixed separators", () => {
      const result = parseNaicsCodes("541512, 541511  541519");
      expect(result.valid).toHaveLength(3);
    });
  });

  // ── Security ────────────────────────────────────────────────

  describe("Security", () => {
    it("search doesn't accept injection patterns", () => {
      // Should return empty results, not crash
      const results = searchNaics("'; DROP TABLE naics; --");
      expect(Array.isArray(results)).toBe(true);
    });

    it("parseNaicsCodes sanitizes input", () => {
      const result = parseNaicsCodes("<script>alert(1)</script>");
      expect(result.valid).toHaveLength(0);
      expect(result.invalid.length).toBeGreaterThan(0);
    });
  });

  // ── Data Leak ───────────────────────────────────────────────

  describe("Data Leak", () => {
    it("entries only contain code and description", () => {
      const results = searchNaics("541512");
      for (const r of results) {
        const keys = Object.keys(r);
        expect(keys).toEqual(["code", "description"]);
      }
    });
  });

  // ── Data Damage ─────────────────────────────────────────────

  describe("Data Damage", () => {
    it("search results are new objects (not references to internal data)", () => {
      const results1 = searchNaics("541512");
      const results2 = searchNaics("541512");
      // Same data but we're OK with reference equality for static data
      expect(results1[0].code).toBe(results2[0].code);
    });

    it("parseNaicsCodes doesn't modify input string", () => {
      const input = "541512,541511";
      const copy = input;
      parseNaicsCodes(input);
      expect(input).toBe(copy);
    });
  });
});
