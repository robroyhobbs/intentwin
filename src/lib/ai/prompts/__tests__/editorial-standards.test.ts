import { describe, it, expect } from "vitest";
import {
  buildEditorialStandards,
  BANNED_PHRASES,
  FORMATTING_RULES,
  ANTI_FLUFF_RULES,
} from "../editorial-standards";

describe("buildEditorialStandards", () => {
  // ── Grounding Level Behavior ───────────────────────────────────────────────

  describe("groundingLevel='low'", () => {
    it("includes aspirational framing language", () => {
      const result = buildEditorialStandards(
        "RFP",
        null,
        undefined,
        undefined,
        undefined,
        "low",
      );
      expect(result).toContain("aspirational framing");
      expect(result).toContain("Our team would bring");
    });

    it("removes the default general-but-concrete evidence fallback", () => {
      const result = buildEditorialStandards(
        "RFP",
        null,
        undefined,
        undefined,
        undefined,
        "low",
      );
      // The default fallback text should be replaced
      expect(result).not.toContain(
        "write a general but concrete statement WITHOUT placeholders",
      );
    });
  });

  describe("groundingLevel='high'", () => {
    it("does not include aspirational framing language", () => {
      const result = buildEditorialStandards(
        "RFP",
        null,
        undefined,
        undefined,
        undefined,
        "high",
      );
      expect(result).not.toContain("aspirational framing");
    });

    it("keeps the default evidence fallback", () => {
      const result = buildEditorialStandards(
        "RFP",
        null,
        undefined,
        undefined,
        undefined,
        "high",
      );
      expect(result).toContain(
        "write a general but concrete statement WITHOUT placeholders",
      );
    });
  });

  describe("groundingLevel=undefined (default)", () => {
    it("does not include aspirational framing language", () => {
      const result = buildEditorialStandards("RFP");
      expect(result).not.toContain("aspirational framing");
    });

    it("keeps the default evidence fallback", () => {
      const result = buildEditorialStandards("RFP");
      expect(result).toContain(
        "write a general but concrete statement WITHOUT placeholders",
      );
    });
  });

  describe("groundingLevel='medium'", () => {
    it("does not include aspirational framing language (medium uses default)", () => {
      const result = buildEditorialStandards(
        "RFP",
        null,
        undefined,
        undefined,
        undefined,
        "medium",
      );
      expect(result).not.toContain("aspirational framing");
    });

    it("keeps the default evidence fallback", () => {
      const result = buildEditorialStandards(
        "RFP",
        null,
        undefined,
        undefined,
        undefined,
        "medium",
      );
      expect(result).toContain(
        "write a general but concrete statement WITHOUT placeholders",
      );
    });
  });

  // ── Core Sections Always Present ───────────────────────────────────────────

  describe("core sections", () => {
    it("includes formatting rules regardless of grounding level", () => {
      for (const level of ["high", "medium", "low", undefined] as const) {
        const result = buildEditorialStandards(
          "RFP",
          null,
          undefined,
          undefined,
          undefined,
          level,
        );
        expect(result).toContain("OUTPUT FORMAT RULES (MANDATORY)");
      }
    });

    it("includes anti-fluff rules regardless of grounding level", () => {
      for (const level of ["high", "medium", "low", undefined] as const) {
        const result = buildEditorialStandards(
          "RFP",
          null,
          undefined,
          undefined,
          undefined,
          level,
        );
        expect(result).toContain("WRITING QUALITY RULES (MANDATORY)");
        expect(result).toContain("BANNED PHRASES");
      }
    });

    it("includes internal planning guidance", () => {
      const result = buildEditorialStandards("RFP");
      expect(result).toContain("INTERNAL PLANNING");
      expect(result).not.toContain("<thought_process>");
    });
  });

  // ── Solicitation Type Rules ────────────────────────────────────────────────

  describe("solicitation type", () => {
    it("appends RFQ tone rules for RFQ", () => {
      const result = buildEditorialStandards("RFQ");
      expect(result).toContain("SOLICITATION TONE: RFQ");
      expect(result).toContain("bottom-line upfront");
    });

    it("appends RFI tone rules for RFI", () => {
      const result = buildEditorialStandards("RFI");
      expect(result).toContain("SOLICITATION TONE: RFI");
      expect(result).toContain("researching options");
    });

    it("appends SOW tone rules for SOW", () => {
      const result = buildEditorialStandards("SOW");
      expect(result).toContain("SOLICITATION TONE: SOW");
      expect(result).toContain("contractual");
    });

    it("does not append solicitation-specific rules for standard RFP", () => {
      const result = buildEditorialStandards("RFP");
      expect(result).not.toContain("SOLICITATION TONE:");
    });
  });

  // ── Audience Profile ───────────────────────────────────────────────────────

  describe("audience profile", () => {
    it("adds non-technical audience calibration", () => {
      const result = buildEditorialStandards("RFP", {
        tech_level: "non_technical",
        evaluator: "county_board",
      });
      expect(result).toContain("AUDIENCE CALIBRATION: NON-TECHNICAL AUDIENCE");
      expect(result).toContain("county_board");
    });

    it("adds technical audience calibration", () => {
      const result = buildEditorialStandards("RFP", {
        tech_level: "highly_technical",
        evaluator: "engineering_team",
        size: "enterprise",
      });
      expect(result).toContain("AUDIENCE CALIBRATION: TECHNICAL AUDIENCE");
      expect(result).toContain("engineering_team");
      expect(result).toContain("enterprise");
    });

    it("adds no audience rules for moderate tech level", () => {
      const result = buildEditorialStandards("RFP", {
        tech_level: "moderate",
      });
      expect(result).not.toContain("AUDIENCE CALIBRATION:");
    });

    it("handles null audience gracefully", () => {
      const result = buildEditorialStandards("RFP", null);
      expect(result).not.toContain("AUDIENCE CALIBRATION:");
    });
  });

  // ── Tone Modulation ────────────────────────────────────────────────────────

  describe("tone", () => {
    it("adds conversational tone rules", () => {
      const result = buildEditorialStandards(
        "RFP",
        null,
        undefined,
        undefined,
        "conversational",
      );
      expect(result).toContain("WRITING TONE: CONVERSATIONAL");
      expect(result).toContain("contractions");
    });

    it("adds technical tone rules", () => {
      const result = buildEditorialStandards(
        "RFP",
        null,
        undefined,
        undefined,
        "technical",
      );
      expect(result).toContain("WRITING TONE: TECHNICAL");
    });

    it("adds executive tone rules", () => {
      const result = buildEditorialStandards(
        "RFP",
        null,
        undefined,
        undefined,
        "executive",
      );
      expect(result).toContain("WRITING TONE: EXECUTIVE");
      expect(result).toContain("C-suite");
    });

    it("adds no tone rules for professional (default)", () => {
      const result = buildEditorialStandards(
        "RFP",
        null,
        undefined,
        undefined,
        "professional",
      );
      expect(result).not.toContain("WRITING TONE:");
    });
  });

  // ── Brand Lock ─────────────────────────────────────────────────────────────

  describe("brand lock", () => {
    it("adds brand name lock when provided", () => {
      const result = buildEditorialStandards("RFP", null, "Acme Corp");
      expect(result).toContain("BRAND NAME LOCK");
      expect(result).toContain("Acme Corp");
    });

    it("does not add brand lock for empty string", () => {
      const result = buildEditorialStandards("RFP", null, "  ");
      expect(result).not.toContain("BRAND NAME LOCK");
    });

    it("does not add brand lock when undefined", () => {
      const result = buildEditorialStandards("RFP", null, undefined);
      expect(result).not.toContain("BRAND NAME LOCK");
    });
  });

  // ── Repetition Limiter ─────────────────────────────────────────────────────

  describe("repetition limiter", () => {
    it("adds repetition limiter when differentiators provided", () => {
      const diffs = ["47 federal migrations", "FedRAMP certified"];
      const result = buildEditorialStandards("RFP", null, undefined, diffs);
      expect(result).toContain("REPETITION LIMITER (MANDATORY)");
      expect(result).toContain("47 federal migrations");
      expect(result).toContain("FedRAMP certified");
    });

    it("does not add repetition limiter for empty array", () => {
      const result = buildEditorialStandards("RFP", null, undefined, []);
      expect(result).not.toContain("REPETITION LIMITER");
    });
  });
});

describe("BANNED_PHRASES", () => {
  it("is a non-empty array", () => {
    expect(BANNED_PHRASES.length).toBeGreaterThan(0);
  });

  it("includes known fluff phrases", () => {
    expect(BANNED_PHRASES).toContain("leverage");
    expect(BANNED_PHRASES).toContain("synergize");
    expect(BANNED_PHRASES).toContain("best-in-class");
  });
});

describe("FORMATTING_RULES", () => {
  it("contains formatting directives", () => {
    expect(FORMATTING_RULES).toContain("OUTPUT FORMAT RULES");
    expect(FORMATTING_RULES).toContain("Headings");
    expect(FORMATTING_RULES).toContain("Bullet points");
    expect(FORMATTING_RULES).toContain("Tables");
  });
});

describe("ANTI_FLUFF_RULES", () => {
  it("contains quality directives", () => {
    expect(ANTI_FLUFF_RULES).toContain("WRITING QUALITY RULES");
    expect(ANTI_FLUFF_RULES).toContain("SPECIFICITY TEST");
    expect(ANTI_FLUFF_RULES).toContain("EVIDENCE REQUIREMENT");
    expect(ANTI_FLUFF_RULES).toContain("ACTIVE VOICE");
    expect(ANTI_FLUFF_RULES).toContain("NEVER USE BRACKETS");
  });

  it("embeds banned phrases in the text", () => {
    for (const phrase of BANNED_PHRASES) {
      expect(ANTI_FLUFF_RULES).toContain(phrase);
    }
  });
});
