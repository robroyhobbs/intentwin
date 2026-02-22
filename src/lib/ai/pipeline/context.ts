import { createAdminClient } from "@/lib/supabase/admin";
import { createLogger } from "@/lib/utils/logger";
import { TtlCache } from "@/lib/utils/ttl-cache";
import type { OutcomeContract, CompanyContext, ProductContext, EvidenceLibraryEntry, TeamMember } from "@/types/idd";
import type { L1Context } from "./types";

// Re-export buildPipelineContext from its dedicated module for backwards compatibility
export { buildPipelineContext } from "./build-pipeline-context";

// L1 context changes rarely (admin-only updates). Cache for 5 minutes
// to avoid redundant DB queries during concurrent proposal generations.
const l1Cache = new TtlCache<L1Context>({ ttlMs: 5 * 60 * 1000, maxSize: 50 });

/**
 * Terms that indicate vague, unsubstantiated capability claims.
 * When these appear in product descriptions or capabilities,
 * a specificity warning is appended to the L1 context string.
 */
export const VAGUE_CAPABILITY_TERMS = [
  "enterprise tools",
  "advanced platform",
  "comprehensive solution",
  "industry-leading",
  "next-generation",
  "cutting-edge solution",
  "best-of-breed",
  "end-to-end platform",
  "world-class tools",
  "innovative solution",
] as const;

/**
 * Scan product capabilities and descriptions for vague terms.
 * Returns an array of internal SPECIFICITY WARNING strings.
 * These are pipeline metadata — never exposed in generated content.
 */
export function checkCapabilitySpecificity(products: ProductContext[]): string[] {
  const warnings: string[] = [];

  for (const product of products) {
    const textsToCheck: string[] = [product.description || ""];

    if (Array.isArray(product.capabilities)) {
      for (const cap of product.capabilities) {
        const c = cap as { name?: string; description?: string };
        if (c.name) textsToCheck.push(c.name);
        if (c.description) textsToCheck.push(c.description);
      }
    }

    const combined = textsToCheck.join(" ").toLowerCase();

    for (const term of VAGUE_CAPABILITY_TERMS) {
      if (combined.includes(term.toLowerCase())) {
        warnings.push(
          `SPECIFICITY WARNING: "${product.product_name}" uses vague term "${term}" — replace with concrete technology names, metrics, or specifications`,
        );
      }
    }
  }

  return warnings;
}

/** Clear the L1 context cache (used in tests and after L1 data updates) */
export function clearL1Cache(): void {
  l1Cache.clear();
}

/** Fetch L1 Context: Company Truth from the database.
 * Results are cached in-memory for 5 minutes keyed by org+serviceLine+industry. */
export async function fetchL1Context(
  supabase: ReturnType<typeof createAdminClient>,
  serviceLine?: string,
  industry?: string,
  organizationId?: string,
): Promise<L1Context> {
  // Check cache first
  const cacheKey = `${organizationId || "none"}:${serviceLine || "all"}:${industry || "all"}`;
  const cached = l1Cache.get(cacheKey);
  if (cached) return cached;

  try {
    // Fetch company context (brand, values, certifications, legal)
    let companyQuery = supabase
      .from("company_context")
      .select("id, category, key, title, content, metadata, is_locked, lock_reason, last_verified_at, verified_by")
      .order("category");
    if (organizationId) {
      companyQuery = companyQuery.eq("organization_id", organizationId);
    }
    const { data: companyContext } = await companyQuery;

    // Fetch relevant product contexts
    let productQuery = supabase.from("product_contexts").select("id, product_name, service_line, description, capabilities, specifications, pricing_models, constraints, supported_outcomes, is_locked, lock_reason");
    if (organizationId) {
      productQuery = productQuery.eq("organization_id", organizationId);
    }
    if (serviceLine) {
      productQuery = productQuery.eq("service_line", serviceLine);
    }
    const { data: productContexts } = await productQuery;

    // Fetch relevant evidence (case studies, metrics)
    let evidenceQuery = supabase
      .from("evidence_library")
      .select("id, evidence_type, title, summary, full_content, client_industry, service_line, client_size, outcomes_demonstrated, metrics, is_verified, verified_by, verified_at, verification_notes")
      .eq("is_verified", true);
    if (organizationId) {
      evidenceQuery = evidenceQuery.eq("organization_id", organizationId);
    }
    if (serviceLine) {
      evidenceQuery = evidenceQuery.eq("service_line", serviceLine);
    }
    if (industry) {
      evidenceQuery = evidenceQuery.or(
        `client_industry.eq.${industry},client_industry.is.null`,
      );
    }
    const { data: evidenceLibrary } = await evidenceQuery
      .order("is_verified", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10);

    // Fetch team members (named personnel for proposal generation)
    let teamMembersQuery = supabase
      .from("team_members")
      .select("id, name, role, title, skills, certifications, clearance_level, years_experience, project_history, bio, is_verified, verified_by, verified_at");
    if (organizationId) {
      teamMembersQuery = teamMembersQuery.eq("organization_id", organizationId);
    }
    const { data: teamMembers } = await teamMembersQuery
      .order("is_verified", { ascending: false })
      .order("name")
      .limit(50);

    const result: L1Context = {
      companyContext: (companyContext || []) as CompanyContext[],
      productContexts: (productContexts || []) as ProductContext[],
      evidenceLibrary: (evidenceLibrary || []) as EvidenceLibraryEntry[],
      teamMembers: (teamMembers || []) as TeamMember[],
    };

    // Cache the result for subsequent calls with same params
    l1Cache.set(cacheKey, result);

    return result;
  } catch (error) {
    const l1Log = createLogger({ operation: "fetchL1Context" });
    l1Log.error("Error fetching L1 context", error);
    return {
      companyContext: [],
      productContexts: [],
      evidenceLibrary: [],
      teamMembers: [],
    };
  }
}

/** Build the Outcome Contract context string for prompts */
export function buildOutcomeContractContext(
  outcomeContract: OutcomeContract | null,
): string {
  if (!outcomeContract) return "";

  const sections: string[] = [];

  if (outcomeContract.current_state?.length > 0) {
    sections.push(
      `## Client Current State (Pain Points)\n${outcomeContract.current_state.map((p) => `- ${p}`).join("\n")}`,
    );
  }

  if (outcomeContract.desired_state?.length > 0) {
    sections.push(
      `## Client Desired Outcomes\n${outcomeContract.desired_state.map((o) => `- ${o}`).join("\n")}`,
    );
  }

  if (outcomeContract.transformation) {
    sections.push(
      `## Transformation Promise\n${outcomeContract.transformation}`,
    );
  }

  if (outcomeContract.success_metrics?.length > 0) {
    const metricsTable = outcomeContract.success_metrics
      .filter((m) => m.outcome)
      .map(
        (m) =>
          `- ${m.outcome}: ${m.metric} → Target: ${m.target} (Measured by: ${m.measurement_method})`,
      )
      .join("\n");
    sections.push(`## Success Metrics\n${metricsTable}`);
  }

  return sections.length > 0
    ? `\n\n=== OUTCOME CONTRACT (Source of Truth) ===\n${sections.join("\n\n")}\n=== END OUTCOME CONTRACT ===\n`
    : "";
}

/** Build L1 context string for prompts */

/** 
 * Filter the global L1 Context down to only what's strictly necessary for a specific section.
 * This prevents the "Lost in the Middle" LLM syndrome and saves tokens.
 */
export function buildSectionSpecificL1Context(
  l1Context: L1Context,
  sectionType: string,
  solicitationType: string = "RFP"
): string {
  // Always include Brand Guidelines for tone
  const brandContext = l1Context.companyContext.filter(c => c.category === "brand");
  
  let relevantEvidence: EvidenceLibraryEntry[] = [];
  let relevantProducts: ProductContext[] = [];
  let relevantCompany = [...brandContext];
  let evidenceCountForSection: number | undefined;

  // Specific routing logic
  if (sectionType === "case_studies" || solicitationType === "RFI") {
    // RFIs and Case Study sections need maximum proof points
    relevantEvidence = l1Context.evidenceLibrary;
    // Track actual count so prompt can enforce placeholder behavior
    evidenceCountForSection = l1Context.evidenceLibrary.length;
  } else if (sectionType === "team" || sectionType === "methodology") {
    // Only fetch certs and methodology + team members for team section
    relevantCompany = [
      ...brandContext,
      ...l1Context.companyContext.filter(c => c.category === "certifications" || c.category === "values")
    ];
  } else if (sectionType === "pricing") {
    // Only fetch legal/pricing terms
    relevantCompany = [
      ...brandContext,
      ...l1Context.companyContext.filter(c => c.category === "legal")
    ];
  } else {
    // Default: Provide top 3 evidence points and product specs to avoid overwhelming
    relevantEvidence = l1Context.evidenceLibrary.slice(0, 3);
    relevantProducts = l1Context.productContexts;
  }

  // Include team members only in the team section
  const relevantTeamMembers = sectionType === "team"
    ? (l1Context.teamMembers || [])
    : [];

  const l1String = buildL1ContextString({
    companyContext: relevantCompany,
    productContexts: relevantProducts,
    evidenceLibrary: relevantEvidence,
    teamMembers: relevantTeamMembers,
  });

  // Prepend evidence count metadata for sections that need it (case_studies, team)
  // This allows prompt functions to detect evidence availability without signature changes
  if (evidenceCountForSection !== undefined) {
    return `<!-- L1_EVIDENCE_COUNT: ${evidenceCountForSection} -->\n${l1String}`;
  }

  return l1String;
}

export function buildL1ContextString(l1Context: L1Context): string {
  const sections: string[] = [];

  // Company brand and values
  const brandContext = l1Context.companyContext.filter(
    (c) => c.category === "brand" || c.category === "values",
  );
  if (brandContext.length > 0) {
    const brandStr = brandContext
      .map((c) => `- ${c.title}: ${c.content}`)
      .join("\n");
    sections.push(`## Company Identity\n${brandStr}`);
  }

  // Certifications
  const certs = l1Context.companyContext.filter(
    (c) => c.category === "certifications",
  );
  if (certs.length > 0) {
    const certsStr = certs.map((c) => `- ${c.title}: ${c.content}`).join("\n");
    sections.push(`## Certifications & Partnerships\n${certsStr}`);
  }

  // Product capabilities (with pricing and constraints)
  if (l1Context.productContexts.length > 0) {
    const prodStr = l1Context.productContexts
      .map((p) => {
        const caps = Array.isArray(p.capabilities)
          ? p.capabilities.map((c: { name: string; description?: string }) =>
              c.description ? `  - ${c.name}: ${c.description}` : `  - ${c.name}`
            ).join("\n")
          : "";
        const pricing = Array.isArray(p.pricing_models) && p.pricing_models.length > 0
          ? `\n  Pricing: ${p.pricing_models.map((pm: { model: string; best_for?: string }) => `${pm.model}${pm.best_for ? ` (best for: ${pm.best_for})` : ""}`).join("; ")}`
          : "";
        const constraints = p.constraints?.not_suitable_for?.length
          ? `\n  Not suitable for: ${p.constraints.not_suitable_for.join(", ")}`
          : "";
        return `### ${p.product_name}\n${p.description}${caps ? `\n  Capabilities:\n${caps}` : ""}${pricing}${constraints}`;
      })
      .join("\n\n");
    sections.push(`## Our Capabilities & Services\n${prodStr}`);
  }

  // Evidence (case studies with metrics and full content for top entries)
  if (l1Context.evidenceLibrary.length > 0) {
    const evidenceStr = l1Context.evidenceLibrary
      .map((e, idx) => {
        const metrics = Array.isArray(e.metrics)
          ? e.metrics
              .map(
                (m: { name: string; value: string }) => `${m.name}: ${m.value}`,
              )
              .join(", ")
          : "";
        const outcomes = Array.isArray(e.outcomes_demonstrated) && e.outcomes_demonstrated.length > 0
          ? `\n  Outcomes: ${e.outcomes_demonstrated.map((o: { outcome: string; description?: string }) => o.description || o.outcome).join("; ")}`
          : "";
        // Include full_content for top 3 entries to give the LLM concrete material
        const detail = idx < 3 && e.full_content
          ? `\n  Detail: ${e.full_content.slice(0, 500)}`
          : "";
        return `### ${e.title} (${e.evidence_type})${e.client_industry ? ` [${e.client_industry}]` : ""}\n${e.summary}${metrics ? `\nMetrics: ${metrics}` : ""}${outcomes}${detail}`;
      })
      .join("\n\n");
    sections.push(`## Verified Evidence — CITE THESE IN YOUR RESPONSE\n${evidenceStr}`);
  }

  // Team Members (named personnel for proposals)
  if (l1Context.teamMembers && l1Context.teamMembers.length > 0) {
    const teamStr = l1Context.teamMembers
      .map((tm) => {
        const certs = Array.isArray(tm.certifications) && tm.certifications.length > 0
          ? `\n  Certifications: ${tm.certifications.join(", ")}`
          : "";
        const skills = Array.isArray(tm.skills) && tm.skills.length > 0
          ? `\n  Skills: ${tm.skills.join(", ")}`
          : "";
        const clearance = tm.clearance_level
          ? `\n  Clearance: ${tm.clearance_level}`
          : "";
        const experience = tm.years_experience
          ? `\n  Experience: ${tm.years_experience} years`
          : "";
        const bio = tm.bio
          ? `\n  Bio: ${tm.bio.slice(0, 300)}`
          : "";
        return `### ${tm.name} — ${tm.role}${tm.title ? ` (${tm.title})` : ""}${certs}${skills}${clearance}${experience}${bio}`;
      })
      .join("\n\n");
    sections.push(`## Team Members — USE THESE REAL PEOPLE IN THE PROPOSAL\n${teamStr}`);
  }

  // Legal constraints
  const legal = l1Context.companyContext.filter((c) => c.category === "legal");
  if (legal.length > 0) {
    const legalStr = legal.map((c) => `- ${c.title}: ${c.content}`).join("\n");
    sections.push(`## Content Guidelines (Must Follow)\n${legalStr}`);
  }

  // Specificity warnings — internal metadata to improve generation quality
  const specificityWarnings = checkCapabilitySpecificity(l1Context.productContexts);
  if (specificityWarnings.length > 0) {
    sections.push(
      `## Specificity Guidance (Internal — Do Not Include in Output)\n${specificityWarnings.map((w) => `- ${w}`).join("\n")}`,
    );
  }

  if (sections.length === 0) return "";

  return `\n\n=== COMPANY CONTEXT (L1 - Verified Truth) ===
IMPORTANT: The data below is verified company truth. You MUST:
1. Reference specific capabilities from "Our Capabilities" when describing solutions
2. Cite at least one entry from "Verified Evidence" with concrete metrics
3. Never invent capabilities, metrics, or case studies not listed below
4. Follow all "Content Guidelines" constraints

${sections.join("\n\n")}
=== END COMPANY CONTEXT ===\n`;
}

/**
 * Extract competitive objections from intake data.
 * Parses incumbent_info, competitive_landscape, and client_concerns
 * into actionable objections for the competitive positioning prompt.
 */
export function extractCompetitiveObjections(
  intakeData: Record<string, unknown>,
): string[] {
  const objections: string[] = [];

  const incumbent = intakeData.incumbent_info as string | undefined;
  if (incumbent?.trim()) {
    objections.push(
      `Current vendor context: ${incumbent.trim().slice(0, 200)}`,
    );
  }

  const competitive = intakeData.competitive_landscape as string | undefined;
  if (competitive?.trim()) {
    objections.push(
      `Competitive context: ${competitive.trim().slice(0, 200)}`,
    );
  }

  const concerns = intakeData.client_concerns as
    | string
    | string[]
    | undefined;
  if (Array.isArray(concerns)) {
    for (const c of concerns.slice(0, 3)) {
      if (typeof c === "string" && c.trim()) {
        objections.push(`Client concern: ${c.trim()}`);
      }
    }
  } else if (typeof concerns === "string" && concerns.trim()) {
    objections.push(`Client concern: ${concerns.trim().slice(0, 200)}`);
  }

  return objections;
}


