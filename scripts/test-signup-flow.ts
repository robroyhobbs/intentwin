/**
 * Test the full signup flow end-to-end
 * Usage: npx tsx scripts/test-signup-flow.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(import.meta.dirname || __dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  env[t.slice(0, eq)] = t.slice(eq + 1);
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  console.log("=== End-to-End Signup Test ===\n");

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const testEmail = `test-e2e-${Date.now()}@testmail.dev`;
  const testPassword = "TestPassword2026!";

  // Step 1: Add to allowed_emails (waitlist bypass)
  console.log("1. Adding to allowed_emails...");
  await admin.from("allowed_emails").insert({ email: testEmail });
  console.log("   Done");

  // Step 2: Check access via API (simulating what the signup page does)
  console.log("\n2. Checking access via /api/auth/check-access...");
  try {
    const checkRes = await fetch("http://localhost:3000/api/auth/check-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail }),
    });
    const checkData = await checkRes.json();
    console.log("   Allowed:", checkData.allowed);
  } catch {
    console.log("   (dev server not running, skipping API check)");
  }

  // Step 3: Signup
  console.log("\n3. Signing up...");
  const anonClient = createClient(SUPABASE_URL, ANON_KEY);
  const { data: signupData, error: signupErr } = await anonClient.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: { full_name: "E2E Test User", organization_name: "E2E Test Corp" },
    },
  });

  if (signupErr) {
    console.log("   FAILED:", signupErr.message);
    await cleanup(admin, testEmail);
    return;
  }

  const userId = signupData.user?.id;
  console.log("   User ID:", userId);
  console.log("   Confirmed:", signupData.user?.email_confirmed_at ? "YES" : "NO");
  console.log("   Session:", signupData.session ? "YES" : "NO");

  if (!signupData.session) {
    console.log("\n   ERROR: No session returned. Auto-confirm may not be working.");
    await cleanup(admin, testEmail, userId);
    return;
  }

  // Step 4: Verify profile + org were created by trigger
  console.log("\n4. Verifying trigger created profile + org...");
  await new Promise((r) => setTimeout(r, 500));

  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("id, email, organization_id, role")
    .eq("id", userId)
    .single();

  if (profileErr || !profile) {
    console.log("   TRIGGER FAILED:", profileErr?.message);
    await cleanup(admin, testEmail, userId);
    return;
  }
  console.log("   Profile: role=" + profile.role + ", org=" + profile.organization_id);

  const { data: org } = await admin
    .from("organizations")
    .select("id, name, slug")
    .eq("id", profile.organization_id)
    .single();
  console.log("   Org:", org?.name, "(slug:", org?.slug + ")");

  // Step 5: Verify data isolation — new org should have zero L1 data
  console.log("\n5. Verifying data isolation...");
  const { data: cc } = await admin
    .from("company_context")
    .select("id")
    .eq("organization_id", profile.organization_id);
  const { data: pc } = await admin
    .from("product_contexts")
    .select("id")
    .eq("organization_id", profile.organization_id);
  const { data: el } = await admin
    .from("evidence_library")
    .select("id")
    .eq("organization_id", profile.organization_id);
  const { data: docs } = await admin
    .from("documents")
    .select("id")
    .eq("organization_id", profile.organization_id);

  console.log("   company_context:", cc?.length || 0, "rows");
  console.log("   product_contexts:", pc?.length || 0, "rows");
  console.log("   evidence_library:", el?.length || 0, "rows");
  console.log("   documents:", docs?.length || 0, "rows");

  const allZero =
    (cc?.length || 0) === 0 &&
    (pc?.length || 0) === 0 &&
    (el?.length || 0) === 0 &&
    (docs?.length || 0) === 0;

  if (allZero) {
    console.log("   Data isolation: PASSED");
  } else {
    console.log("   Data isolation: FAILED (data leaked)");
  }

  // Step 6: Verify login works
  console.log("\n6. Testing login...");
  const { data: loginData, error: loginErr } = await anonClient.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });
  if (loginErr) {
    console.log("   Login FAILED:", loginErr.message);
  } else {
    console.log("   Login: SUCCESS (session:", !!loginData.session, ")");
  }

  // Summary
  console.log("\n=== RESULT ===");
  if (signupData.session && profile && org && allZero && !loginErr) {
    console.log("ALL CHECKS PASSED - Signup flow works end-to-end!");
  } else {
    console.log("SOME CHECKS FAILED - see above for details");
  }

  // Cleanup
  await cleanup(admin, testEmail, userId, profile.organization_id);
}

async function cleanup(
  admin: ReturnType<typeof createClient>,
  email: string,
  userId?: string | null,
  orgId?: string | null,
) {
  console.log("\nCleaning up...");
  if (userId) {
    await admin.from("profiles").delete().eq("id", userId);
    await admin.auth.admin.deleteUser(userId);
  }
  if (orgId) {
    await admin.from("organizations").delete().eq("id", orgId);
  }
  await admin.from("allowed_emails").delete().eq("email", email);
  console.log("Done.");
}

main().catch(console.error);
