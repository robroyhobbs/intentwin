/**
 * Product Alignment — Per-product match scoring against RFP requirements.
 *
 * Pure function that computes how well each product/service aligns with
 * the extracted RFP requirements. Uses keyword matching against product
 * capabilities — no AI calls needed.
 */

import type { ProductContext } from "@/types/idd";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ProductAlignmentScore {
  productId: string;
  productName: string;
  serviceLine: string;
  score: number; // 0-100
  matchedCapabilities: string[];
  unmatchedCapabilities: string[];
  enabled: boolean;
}

export interface ProductAlignmentResult {
  products: ProductAlignmentScore[];
  hasProducts: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Extract meaningful keywords from a text string */
function extractKeywords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
}

/** Check if a capability matches any requirement keywords */
function capabilityMatchesRequirements(
  capName: string,
  capDescription: string,
  requirementKeywords: Set<string>,
): boolean {
  const capKeywords = extractKeywords(`${capName} ${capDescription}`);
  let matchCount = 0;
  for (const kw of capKeywords) {
    if (requirementKeywords.has(kw)) matchCount++;
  }
  // Consider it a match if at least 2 keywords overlap, or the capability
  // name itself is contained in the requirements
  return matchCount >= 2;
}

// ── Main function ────────────────────────────────────────────────────────────

/**
 * Compute per-product alignment scores against RFP requirements text.
 * Pure function — no DB calls, no AI calls, no side effects.
 *
 * @param products - Company's product catalog from L1 context
 * @param requirementsText - Combined RFP requirements/description text
 * @param enabledProductIds - Set of product IDs currently enabled for this proposal (optional)
 */
export function computeProductAlignment(
  products: ProductContext[],
  requirementsText: string,
  enabledProductIds?: Set<string>,
): ProductAlignmentResult {
  if (!products.length) {
    return { products: [], hasProducts: false };
  }

  const reqKeywords = extractKeywords(requirementsText);

  const scored: ProductAlignmentScore[] = products.map((product) => {
    const capabilities = product.capabilities ?? [];
    const matched: string[] = [];
    const unmatched: string[] = [];

    for (const cap of capabilities) {
      if (capabilityMatchesRequirements(cap.name, cap.description, reqKeywords)) {
        matched.push(cap.name);
      } else {
        unmatched.push(cap.name);
      }
    }

    // Score: percentage of capabilities that match + base score from description match
    const descKeywords = extractKeywords(
      `${product.product_name} ${product.description} ${product.service_line}`,
    );
    let descMatchCount = 0;
    for (const kw of descKeywords) {
      if (reqKeywords.has(kw)) descMatchCount++;
    }
    const descScore = Math.min(descMatchCount * 10, 30); // up to 30 points from description

    const capScore =
      capabilities.length > 0
        ? Math.round((matched.length / capabilities.length) * 70) // up to 70 points from capabilities
        : 0;

    const score = Math.min(descScore + capScore, 100);

    return {
      productId: product.id,
      productName: product.product_name,
      serviceLine: product.service_line,
      score,
      matchedCapabilities: matched,
      unmatchedCapabilities: unmatched,
      enabled: enabledProductIds
        ? enabledProductIds.has(product.id)
        : score >= 30, // default: enable if score >= 30
    };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return { products: scored, hasProducts: true };
}
