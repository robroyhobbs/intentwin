import { NextRequest } from "next/server";
import { createClient } from "./server";
import { createAdminClient } from "./admin";
import { logger } from "@/lib/utils/logger";
import type { User } from "@supabase/supabase-js";

/**
 * User context with organization info for multi-tenancy
 */
export interface UserContext {
  user: User;
  organizationId: string;
  role: "admin" | "manager" | "member";
  teamId?: string;
}

/**
 * Extract authenticated user from a Route Handler request.
 * Tries cookie-based session first, then falls back to Authorization header.
 */
export async function getAuthUser(
  request?: NextRequest
): Promise<User | null> {
  // 1. Try the server client (cookie-based session)
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) return user;
  } catch (e) {
    logger.warn("Server client auth check failed", { detail: e });
  }

  // 2. Fallback: Authorization Bearer token
  if (request) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.slice(7);
        const adminClient = createAdminClient();
        const { data } = await adminClient.auth.getUser(token);
        if (data.user) return data.user;
      } catch (e) {
        logger.warn("Bearer token auth check failed", { detail: e });
      }
    }
  }

  return null;
}

/**
 * Get full user context including organization for multi-tenancy.
 * Returns null if user is not authenticated or has no organization.
 */
export async function getUserContext(
  request?: NextRequest
): Promise<UserContext | null> {
  const user = await getAuthUser(request);
  if (!user) return null;

  const adminClient = createAdminClient();
  const { data: profile, error } = await adminClient
    .from("profiles")
    .select("organization_id, role, team_id")
    .eq("id", user.id)
    .single();

  if (error || !profile?.organization_id) {
    logger.warn("Failed to get user profile/organization", { detail: error });
    return null;
  }

  return {
    user,
    organizationId: profile.organization_id,
    role: profile.role as "admin" | "manager" | "member",
    teamId: profile.team_id,
  };
}

/**
 * Check if user's organization is within plan limits.
 *
 * TODO: Re-enable enforcement when pricing tiers are hardcoded.
 * Currently bypassed — all accounts have unlimited access.
 */
export async function checkPlanLimit(
  _organizationId: string,
  _limitKey: "proposals_per_month" | "ai_tokens_per_month" | "max_users" | "max_documents"
): Promise<{ allowed: boolean; current: number; limit: number; message?: string }> {
  // Enforcement bypassed — all accounts get unlimited access
  // To re-enable: restore the DB query and limit checks below
  return { allowed: true, current: 0, limit: Infinity };

  /* Original enforcement logic — restore when ready:
  const adminClient = createAdminClient();
  const { data: org, error } = await adminClient
    .from("organizations")
    .select("plan_tier, plan_limits, usage_current_period, trial_ends_at")
    .eq("id", organizationId)
    .single();

  if (error || !org) {
    return { allowed: false, current: 0, limit: 0, message: "Organization not found" };
  }

  if (org.plan_tier === "trial" && new Date(org.trial_ends_at) < new Date()) {
    return { allowed: false, current: 0, limit: 0, message: "Trial expired. Please upgrade to continue." };
  }

  if (org.plan_tier === "enterprise") {
    return { allowed: true, current: 0, limit: Infinity };
  }

  const usageKeyMap: Record<string, string> = {
    proposals_per_month: "proposals_created",
    ai_tokens_per_month: "ai_tokens_used",
    max_documents: "documents_uploaded",
    max_users: "max_users",
  };

  const current = org.usage_current_period?.[usageKeyMap[limitKey]] || 0;
  const limit = org.plan_limits?.[limitKey] || 0;

  return {
    allowed: current < limit,
    current,
    limit,
    message: current >= limit ? `You've reached your ${limitKey.replace(/_/g, " ")} limit. Please upgrade.` : undefined,
  };
  */
}

/**
 * Increment usage counter for organization.
 * Uses an atomic Postgres RPC (jsonb_set) to prevent race conditions
 * when concurrent requests increment the same counter.
 */
export async function incrementUsage(
  organizationId: string,
  key: "proposals_created" | "ai_tokens_used" | "documents_uploaded",
  amount: number = 1
): Promise<void> {
  const adminClient = createAdminClient();

  const { error } = await adminClient.rpc("increment_usage_by_org", {
    org_id: organizationId,
    usage_key: key,
    amount,
  });

  if (error) {
    logger.warn("Failed to increment usage", {
      organizationId,
      key,
      amount,
      detail: error,
    });
  }
}

/**
 * Lightweight access check — only fetches id + organization_id.
 * Use when the caller only needs to confirm the proposal belongs to the org
 * and does NOT need any proposal data beyond that.
 */
export async function checkProposalAccess(
  context: UserContext,
  proposalId: string
): Promise<boolean> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("proposals")
    .select("id")
    .eq("id", proposalId)
    .eq("organization_id", context.organizationId)
    .single();

  return !error && !!data;
}

/**
 * Verify user has access to a resource (proposal or document) in their organization.
 * Returns the full resource if access is granted, null otherwise.
 * Use when the caller needs proposal data (status, quality_review, title, etc.).
 * For pure access checks, prefer checkProposalAccess() to avoid fetching large JSONB blobs.
 */
export async function verifyProposalAccess(
  context: UserContext,
  proposalId: string
): Promise<{ id: string; organization_id: string; [key: string]: unknown } | null> {
  const adminClient = createAdminClient();
  const { data: proposal, error } = await adminClient
    .from("proposals")
    .select("id, title, status, intake_data, rfp_document_id, rfp_extracted_requirements, generation_model, generation_started_at, generation_completed_at, generation_error, created_by, organization_id, win_strategy_data, outcome_contract, intent_status, intent_approved_by, intent_approved_at, intent_notes, deal_outcome, deal_outcome_set_at, deal_outcome_set_by, deal_value, deal_currency, loss_reason, loss_reason_category, competitor_won, outcome_notes, promoted_to_case_study, case_study_source_id, client_research, intake_source_type, quality_review, bid_evaluation, l1_summary, compliance_assessment, created_at, updated_at")
    .eq("id", proposalId)
    .eq("organization_id", context.organizationId)
    .single();

  if (error || !proposal) {
    return null;
  }

  return proposal;
}

/**
 * Lightweight access check — only fetches id + organization_id.
 * Use when the caller only needs to confirm the document belongs to the org
 * and does NOT need any document data beyond that.
 */
export async function checkDocumentAccess(
  context: UserContext,
  documentId: string
): Promise<boolean> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("documents")
    .select("id")
    .eq("id", documentId)
    .eq("organization_id", context.organizationId)
    .single();

  return !error && !!data;
}

/**
 * Verify user has access to a document in their organization.
 * Returns the full document if access is granted, null otherwise.
 * For pure access checks, prefer checkDocumentAccess().
 */
export async function verifyDocumentAccess(
  context: UserContext,
  documentId: string
): Promise<{ id: string; organization_id: string; [key: string]: unknown } | null> {
  const adminClient = createAdminClient();
  const { data: document, error } = await adminClient
    .from("documents")
    .select("id, title, description, file_name, file_type, file_size_bytes, storage_path, mime_type, document_type, industry, service_line, client_name, win_status, tags, processing_status, processing_error, chunk_count, parsed_text_preview, uploaded_by, organization_id, created_at, updated_at")
    .eq("id", documentId)
    .eq("organization_id", context.organizationId)
    .single();

  if (error || !document) {
    return null;
  }

  return document;
}
