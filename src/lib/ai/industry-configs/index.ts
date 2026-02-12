/**
 * Industry Intelligence — config type, lookup, and prompt builder.
 *
 * Only pipeline.ts should import from this module. Prompt builders
 * receive the built string, not the config object.
 */

import { financialServicesConfig } from "./financial-services";
import { healthcareConfig } from "./healthcare";
import { publicSectorConfig } from "./public-sector";
import { manufacturingConfig } from "./manufacturing";

// ============================================================
// Types
// ============================================================

export interface IndustryConfig {
  /** Must match the dropdown value in proposals/new/page.tsx */
  key: string;
  displayName: string;
  painPoints: string[];
  keywords: string[];
  priorities: string[];
  winThemes: string[];
  /** Per-section guidance keyed by section type */
  sectionGuidance: Record<string, string>;
}

// ============================================================
// Registry
// ============================================================

const INDUSTRY_CONFIGS: Record<string, IndustryConfig> = {
  [financialServicesConfig.key]: financialServicesConfig,
  [healthcareConfig.key]: healthcareConfig,
  [publicSectorConfig.key]: publicSectorConfig,
  [manufacturingConfig.key]: manufacturingConfig,
};

// ============================================================
// Lookup
// ============================================================

/**
 * Returns the industry config for a given key, or null if not found.
 * Unknown keys (including "other" and empty string) return null,
 * which means no industry intelligence is injected.
 */
export function getIndustryConfig(
  industryKey: string,
): IndustryConfig | null {
  if (!industryKey) return null;
  return INDUSTRY_CONFIGS[industryKey] ?? null;
}

// ============================================================
// Prompt builder
// ============================================================

/**
 * Build the industry context string that gets appended to prompts.
 * Returns empty string when config is null (graceful degradation).
 */
export function buildIndustryContext(
  config: IndustryConfig | null,
  sectionType?: string,
): string {
  if (!config) return "";

  const parts: string[] = [
    `\n## Industry Intelligence`,
    `This proposal targets the **${config.displayName}** sector.`,
  ];

  if (config.painPoints.length > 0) {
    parts.push(
      `\n**Key industry pain points to address:**`,
      ...config.painPoints.map((p) => `- ${p}`),
    );
  }

  if (config.keywords.length > 0) {
    parts.push(
      `\n**Use this terminology naturally:**`,
      config.keywords.join(", "),
    );
  }

  if (config.priorities.length > 0) {
    parts.push(
      `\n**Buyer priorities in this sector:**`,
      ...config.priorities.map((p, i) => `${i + 1}. ${p}`),
    );
  }

  if (sectionType && config.sectionGuidance[sectionType]) {
    parts.push(
      `\n**Section-specific guidance:**`,
      config.sectionGuidance[sectionType],
    );
  }

  return parts.join("\n");
}
