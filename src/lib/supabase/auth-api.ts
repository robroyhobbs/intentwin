import { NextRequest } from "next/server";
import { createClient } from "./server";
import { createAdminClient } from "./admin";
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
    console.warn("Server client auth check failed:", e);
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
        console.warn("Bearer token auth check failed:", e);
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
    console.warn("Failed to get user profile/organization:", error);
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
 * Check if user's organization is within plan limits
 */
export async function checkPlanLimit(
  organizationId: string,
  limitKey: "proposals_per_month" | "ai_tokens_per_month" | "max_users" | "max_documents"
): Promise<{ allowed: boolean; current: number; limit: number; message?: string }> {
  const adminClient = createAdminClient();
  const { data: org, error } = await adminClient
    .from("organizations")
    .select("plan_tier, plan_limits, usage_current_period, trial_ends_at")
    .eq("id", organizationId)
    .single();

  if (error || !org) {
    return { allowed: false, current: 0, limit: 0, message: "Organization not found" };
  }

  // Check trial expiration
  if (org.plan_tier === "trial" && new Date(org.trial_ends_at) < new Date()) {
    return { allowed: false, current: 0, limit: 0, message: "Trial expired. Please upgrade to continue." };
  }

  // Enterprise has unlimited
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
}

/**
 * Increment usage counter for organization
 */
export async function incrementUsage(
  organizationId: string,
  key: "proposals_created" | "ai_tokens_used" | "documents_uploaded",
  amount: number = 1
): Promise<void> {
  const adminClient = createAdminClient();

  // Get current usage
  const { data: org } = await adminClient
    .from("organizations")
    .select("usage_current_period")
    .eq("id", organizationId)
    .single();

  if (!org) return;

  const currentUsage = org.usage_current_period || {};
  currentUsage[key] = (currentUsage[key] || 0) + amount;

  await adminClient
    .from("organizations")
    .update({ usage_current_period: currentUsage })
    .eq("id", organizationId);
}
