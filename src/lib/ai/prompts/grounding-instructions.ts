/**
 * Grounding Instructions — Anti-Hallucination Guardrails
 *
 * Computes grounding level per section based on L1 data availability,
 * and builds conditional prompt instructions that shift AI output
 * from confident claims to honest/aspirational framing when evidence is thin.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type GroundingLevel = "high" | "medium" | "low";

export interface L1DataAvailability {
  evidenceCount: number;
  productCount: number;
  teamMemberCount: number;
  companyContextCount: number;
}

// ── Sections that rely heavily on evidence ────────────────────────────────────

const EVIDENCE_HEAVY_SECTIONS = new Set([
  "case_studies",
  "why_us",
  "approach",
  "methodology",
  "executive_summary",
  "cover_letter",
]);

// ── Parse L1 metadata from context string ────────────────────────────────────

/**
 * Extract L1 data availability counts from the metadata comment injected
 * by buildSectionSpecificL1Context. Supports both old and new formats.
 */
export function parseL1Metadata(l1Context: string): L1DataAvailability {
  // New format: <!-- L1_DATA: evidence=3 products=2 team=5 company=4 -->
  const newMatch = l1Context.match(
    /<!-- L1_DATA: evidence=(\d+) products=(\d+) team=(\d+) company=(\d+) -->/,
  );
  if (newMatch) {
    return {
      evidenceCount: parseInt(newMatch[1], 10),
      productCount: parseInt(newMatch[2], 10),
      teamMemberCount: parseInt(newMatch[3], 10),
      companyContextCount: parseInt(newMatch[4], 10),
    };
  }

  // Old format: <!-- L1_EVIDENCE_COUNT: 5 -->
  const oldMatch = l1Context.match(/<!-- L1_EVIDENCE_COUNT: (\d+) -->/);
  if (oldMatch) {
    return {
      evidenceCount: parseInt(oldMatch[1], 10),
      productCount: 0,
      teamMemberCount: 0,
      companyContextCount: 0,
    };
  }

  return { evidenceCount: 0, productCount: 0, teamMemberCount: 0, companyContextCount: 0 };
}

// ── Compute grounding level ──────────────────────────────────────────────────

/**
 * Determine how grounded a section can be based on available L1 data.
 * Evidence-heavy sections require more data to achieve "high" grounding.
 */
export function computeGroundingLevel(
  sectionType: string,
  l1: L1DataAvailability,
): GroundingLevel {
  const isEvidenceHeavy = EVIDENCE_HEAVY_SECTIONS.has(sectionType);
  const totalData = l1.evidenceCount + l1.productCount + l1.companyContextCount;

  if (isEvidenceHeavy) {
    if (l1.evidenceCount >= 2 && totalData >= 4) return "high";
    if (l1.evidenceCount >= 1 || totalData >= 2) return "medium";
    return "low";
  }

  // Non-evidence-heavy sections (timeline, pricing, team, etc.)
  if (totalData >= 2) return "high";
  if (totalData >= 1) return "medium";
  return "low";
}

// ── Build grounding instructions for prompts ─────────────────────────────────

/**
 * Build conditional prompt instructions based on grounding level.
 * Returns empty string for "high" — existing editorial standards suffice.
 */
export function buildGroundingInstructions(
  sectionType: string,
  l1: L1DataAvailability,
  companyName: string,
): string {
  const level = computeGroundingLevel(sectionType, l1);

  if (level === "high") return "";

  if (level === "low") {
    return `
## HONEST FRAMING MODE (MANDATORY)

The Company Context has very limited data for this section (evidence: ${l1.evidenceCount}, products: ${l1.productCount}).

**You MUST follow these rules:**
1. Use aspirational language: "${companyName} would bring..." or "${companyName} is prepared to deliver..." — do NOT claim past delivery without evidence
2. Do NOT fabricate metrics, client names, case studies, or specific numbers
3. Do NOT write statements like "Our team has delivered multiple large-scale..." unless backed by Company Context data
4. Frame capabilities as forward-looking commitments, not historical achievements
5. It is acceptable to describe methodology, approach, and team structure in general terms
6. When referencing outcomes, use "targeted" or "projected" rather than "achieved" or "delivered"

**Acceptable:** "${companyName} would apply a phased migration approach designed to minimize disruption..."
**NOT acceptable:** "${companyName} has successfully completed numerous similar migrations..."`;
  }

  // medium
  return `
## EVIDENCE CALIBRATION (IMPORTANT)

Limited Company Context is available for this section (evidence: ${l1.evidenceCount}, products: ${l1.productCount}).

**Rules:**
1. Prefer evidence-backed claims — use data from Company Context whenever available
2. For claims without direct evidence, hedge appropriately: "Our approach is designed to..." rather than "We have consistently delivered..."
3. Do NOT fabricate specific metrics, client names, or case studies
4. You may reference general capabilities and methodology without hedging
5. Clearly distinguish between proven results (from evidence) and projected outcomes`;
}
