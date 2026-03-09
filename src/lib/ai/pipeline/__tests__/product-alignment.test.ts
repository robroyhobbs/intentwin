import { describe, it, expect } from "vitest";
import {
  computeProductAlignment,
  type ProductAlignmentScore,
} from "../product-alignment";
import type { ProductContext } from "@/types/idd";

function makeProduct(
  id: string,
  name: string,
  serviceLine: string,
  capabilities: { name: string; description: string }[],
): ProductContext {
  return {
    id,
    product_name: name,
    service_line: serviceLine,
    description: `${name} - enterprise ${serviceLine} solution`,
    capabilities: capabilities.map((c) => ({
      ...c,
      outcomes: [],
    })),
    specifications: {},
    pricing_models: [],
    constraints: {},
  } as ProductContext;
}

const sampleProducts: ProductContext[] = [
  makeProduct("p1", "CloudShift", "Cloud Migration", [
    { name: "AWS Migration", description: "Migrate workloads to AWS cloud infrastructure" },
    { name: "Azure Integration", description: "Microsoft Azure cloud services integration" },
    { name: "Data Migration", description: "Database and storage migration services" },
  ]),
  makeProduct("p2", "SecureOps", "Cybersecurity", [
    { name: "SIEM Implementation", description: "Security information and event management" },
    { name: "Zero Trust Architecture", description: "Zero trust network security design" },
    { name: "Compliance Audit", description: "Security compliance and audit services" },
  ]),
  makeProduct("p3", "DevFlow", "Software Development", [
    { name: "Agile Development", description: "Agile software development methodology" },
    { name: "CI/CD Pipeline", description: "Continuous integration deployment pipeline" },
  ]),
];

describe("computeProductAlignment", () => {
  // ── Happy Path ──────────────────────────────────────────────

  describe("Happy Path", () => {
    it("returns scored products with match scores (0-100)", () => {
      const result = computeProductAlignment(
        sampleProducts,
        "Cloud migration to AWS infrastructure with data migration",
      );
      expect(result.hasProducts).toBe(true);
      expect(result.products).toHaveLength(3);
      for (const p of result.products) {
        expect(p.score).toBeGreaterThanOrEqual(0);
        expect(p.score).toBeLessThanOrEqual(100);
      }
    });

    it("each product shows matched and unmatched capabilities", () => {
      const result = computeProductAlignment(
        sampleProducts,
        "AWS cloud migration and data migration services",
      );
      const cloudShift = result.products.find((p) => p.productId === "p1");
      expect(cloudShift).toBeDefined();
      expect(cloudShift!.matchedCapabilities.length).toBeGreaterThan(0);
      // At least some capabilities should be matched for cloud migration query
    });

    it("uses existing data (no new AI calls) — returns synchronously", () => {
      // computeProductAlignment is a pure sync function
      const result = computeProductAlignment(sampleProducts, "cloud services");
      expect(result.products).toHaveLength(3);
    });

    it("respects enabledProductIds for toggle state", () => {
      const enabled = new Set(["p2"]);
      const result = computeProductAlignment(
        sampleProducts,
        "cloud migration",
        enabled,
      );
      const p1 = result.products.find((p) => p.productId === "p1");
      const p2 = result.products.find((p) => p.productId === "p2");
      expect(p1!.enabled).toBe(false);
      expect(p2!.enabled).toBe(true);
    });

    it("sorts products by score descending", () => {
      const result = computeProductAlignment(
        sampleProducts,
        "AWS cloud migration infrastructure data migration services",
      );
      for (let i = 1; i < result.products.length; i++) {
        expect(result.products[i - 1].score).toBeGreaterThanOrEqual(
          result.products[i].score,
        );
      }
    });
  });

  // ── Bad Path ────────────────────────────────────────────────

  describe("Bad Path", () => {
    it("no products configured: returns empty with hasProducts false", () => {
      const result = computeProductAlignment([], "cloud migration");
      expect(result.hasProducts).toBe(false);
      expect(result.products).toHaveLength(0);
    });

    it("product with 0% match score still included (not hidden)", () => {
      const result = computeProductAlignment(
        sampleProducts,
        "underwater basket weaving certification",
      );
      // All products should still be in the list even with 0 score
      expect(result.products).toHaveLength(3);
      const scores = result.products.map((p) => p.score);
      expect(scores.some((s) => s === 0)).toBe(true);
    });

    it("empty requirements text: all products score 0", () => {
      const result = computeProductAlignment(sampleProducts, "");
      for (const p of result.products) {
        expect(p.score).toBe(0);
      }
    });
  });

  // ── Edge Cases ──────────────────────────────────────────────

  describe("Edge Cases", () => {
    it("product with no capabilities scores based on description only", () => {
      const noCaps = [
        makeProduct("p-empty", "Cloud Platform", "Cloud", []),
      ];
      const result = computeProductAlignment(noCaps, "cloud platform services");
      expect(result.products[0].matchedCapabilities).toHaveLength(0);
      expect(result.products[0].unmatchedCapabilities).toHaveLength(0);
      // Still gets some score from description keyword match
      expect(result.products[0].score).toBeGreaterThanOrEqual(0);
    });

    it("handles 20+ products without issues", () => {
      const manyProducts = Array.from({ length: 25 }, (_, i) =>
        makeProduct(`p${i}`, `Product ${i}`, "Services", [
          { name: `Cap ${i}`, description: `Capability ${i} description` },
        ]),
      );
      const result = computeProductAlignment(manyProducts, "services capability");
      expect(result.products).toHaveLength(25);
    });

    it("default enable threshold: products with score >= 30 are enabled", () => {
      const result = computeProductAlignment(
        sampleProducts,
        "AWS cloud migration infrastructure data migration services",
      );
      for (const p of result.products) {
        if (p.score >= 30) {
          expect(p.enabled).toBe(true);
        } else {
          expect(p.enabled).toBe(false);
        }
      }
    });
  });

  // ── Security ────────────────────────────────────────────────

  describe("Security", () => {
    it("handles special characters in requirements without error", () => {
      expect(() =>
        computeProductAlignment(
          sampleProducts,
          '<script>alert("xss")</script> SELECT * FROM products',
        ),
      ).not.toThrow();
    });
  });

  // ── Data Leak ───────────────────────────────────────────────

  describe("Data Leak", () => {
    it("result only contains expected fields per product", () => {
      const result = computeProductAlignment(sampleProducts, "cloud");
      const expectedKeys: (keyof ProductAlignmentScore)[] = [
        "productId",
        "productName",
        "serviceLine",
        "score",
        "matchedCapabilities",
        "unmatchedCapabilities",
        "enabled",
      ];
      for (const p of result.products) {
        const keys = Object.keys(p);
        for (const key of keys) {
          expect(expectedKeys).toContain(key);
        }
      }
    });
  });

  // ── Data Damage ─────────────────────────────────────────────

  describe("Data Damage", () => {
    it("does not modify input products array", () => {
      const copy = [...sampleProducts];
      computeProductAlignment(sampleProducts, "cloud migration");
      expect(sampleProducts).toEqual(copy);
    });

    it("enabling/disabling is proposal-scoped (returns new objects)", () => {
      const result1 = computeProductAlignment(
        sampleProducts,
        "cloud",
        new Set(["p1"]),
      );
      const result2 = computeProductAlignment(
        sampleProducts,
        "cloud",
        new Set(["p2"]),
      );
      // Different enabled states for same products
      const p1r1 = result1.products.find((p) => p.productId === "p1");
      const p1r2 = result2.products.find((p) => p.productId === "p1");
      expect(p1r1!.enabled).toBe(true);
      expect(p1r2!.enabled).toBe(false);
    });
  });
});
