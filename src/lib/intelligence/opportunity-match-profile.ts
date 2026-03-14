import type { OpportunityMatchProfile } from "./types";

interface CompanyContextSource {
  category: string;
  key: string;
  title: string;
  content: string;
}

interface ProductCapabilitySource {
  name: string;
}

interface ProductSource {
  id: string;
  product_name: string;
  service_line: string;
  description: string;
  capabilities: ProductCapabilitySource[];
}

interface MatchProfileFilters {
  naicsCodes?: string[];
  state?: string;
  city?: string;
  setAsideType?: string;
}

export interface OpportunityMatchProfileSource {
  companyContext: CompanyContextSource[];
  products: ProductSource[];
  filters?: MatchProfileFilters;
}

export interface OpportunityMatchProfileSummary {
  productCount: number;
  serviceLineCount: number;
  capabilityCount: number;
  certificationCount: number;
  naicsCount: number;
}

export function buildOpportunityMatchProfile(
  source: OpportunityMatchProfileSource,
): {
  profile: Required<OpportunityMatchProfile>;
  summary: OpportunityMatchProfileSummary;
} {
  const serviceLines = dedupeCaseInsensitive(
    source.products.map((product) => product.service_line),
  );
  const capabilityKeywords = dedupeCaseInsensitive(
    source.products.flatMap((product) => [
      product.product_name,
      ...product.capabilities.map((capability) => capability.name),
    ]),
  );
  const certifications = dedupeCaseInsensitive(
    source.companyContext
      .filter((item) => item.category === "certifications")
      .map((item) => item.title),
  );
  const naicsCodes = dedupeExact(source.filters?.naicsCodes ?? []);
  const preferredStates = dedupeUpper(source.filters?.state ? [source.filters.state] : []);
  const preferredCities = dedupeCaseInsensitive(
    source.filters?.city ? [source.filters.city] : [],
  );
  const eligibleSetAsides = dedupeCaseInsensitive(
    source.filters?.setAsideType ? [source.filters.setAsideType] : [],
  );

  return {
    profile: {
      naics_codes: naicsCodes,
      service_lines: serviceLines,
      capability_keywords: capabilityKeywords,
      certifications,
      preferred_states: preferredStates,
      preferred_cities: preferredCities,
      eligible_set_asides: eligibleSetAsides,
    },
    summary: {
      productCount: source.products.length,
      serviceLineCount: serviceLines.length,
      capabilityCount: capabilityKeywords.length,
      certificationCount: certifications.length,
      naicsCount: naicsCodes.length,
    },
  };
}

function dedupeCaseInsensitive(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const normalized = trimmed.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(trimmed);
  }
  return result;
}

function dedupeExact(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}

function dedupeUpper(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = value.trim().toUpperCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}
