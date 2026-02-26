/**
 * fetchL1Context — Pure DB-only L1 context fetch
 *
 * This module contains only Supabase queries with no fs/sources imports,
 * making it safe to import from both server pipelines and client-bundle-adjacent
 * server actions (e.g., bid-scoring.ts which is imported by proposals/new/page.tsx).
 *
 * The canonical context.ts re-exports this function and adds caching and
 * additional pipeline utilities. Import from context.ts for pipeline use;
 * import from here when you need just the DB query without dragging in
 * build-pipeline-context.ts (which imports @/lib/sources with Node's fs).
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { createLogger } from "@/lib/utils/logger";
import { TtlCache } from "@/lib/utils/ttl-cache";
import type { CompanyContext, ProductContext, EvidenceLibraryEntry, TeamMember } from "@/types/idd";
import type { L1Context } from "./types";

// L1 context changes rarely (admin-only updates). Cache for 5 minutes per instance.
const l1DbCache = new TtlCache<L1Context>({ ttlMs: 5 * 60 * 1000, maxSize: 50 });

/** Clear the L1 DB cache (used in tests) */
export function clearL1DbCache(): void {
  l1DbCache.clear();
}

/**
 * Fetch L1 Context (Company Truth) from the database.
 *
 * Safe to import in any bundle — no fs, no sources loader, no build-pipeline-context.
 * Results are cached in-memory for 5 minutes keyed by org+serviceLine+industry.
 */
export async function fetchL1ContextFromDb(
  supabase: ReturnType<typeof createAdminClient>,
  serviceLine?: string,
  industry?: string,
  organizationId?: string,
): Promise<L1Context> {
  const cacheKey = `${organizationId || "none"}:${serviceLine || "all"}:${industry || "all"}`;
  const cached = l1DbCache.get(cacheKey);
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
    let productQuery = supabase
      .from("product_contexts")
      .select("id, product_name, service_line, description, capabilities, specifications, pricing_models, constraints, supported_outcomes, is_locked, lock_reason");
    if (organizationId) {
      productQuery = productQuery.eq("organization_id", organizationId);
    }
    if (serviceLine) {
      productQuery = productQuery.eq("service_line", serviceLine);
    }
    const { data: productContexts } = await productQuery;

    // Fetch relevant evidence (case studies, metrics) — verified only
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

    l1DbCache.set(cacheKey, result);
    return result;
  } catch (error) {
    const log = createLogger({ operation: "fetchL1ContextFromDb" });
    log.error("Error fetching L1 context from DB", error);
    return {
      companyContext: [],
      productContexts: [],
      evidenceLibrary: [],
      teamMembers: [],
    };
  }
}
