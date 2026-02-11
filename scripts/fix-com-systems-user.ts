/**
 * Fix COM Systems user creation - bypasses the broken trigger
 * Run: npx tsx scripts/fix-com-systems-user.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(import.meta.dirname || __dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_EMAIL = "demo@thecomsystems.com";
const DEMO_PASSWORD = "COMSystems2026!";
const ORG_ID = "e0c3a510-8350-43cd-b0f6-3fa34c55b88e";

async function main() {
  console.log("=== Fix COM Systems User ===\n");

  // Check all existing users
  console.log("Checking existing users...");
  const { data: users } = await supabase.auth.admin.listUsers();

  if (users?.users) {
    console.log(`  Found ${users.users.length} total users:`);
    for (const u of users.users) {
      console.log(`    - ${u.email} (${u.id})`);
    }
  }

  const existing = users?.users?.find((u) => u.email === DEMO_EMAIL);

  if (existing) {
    console.log(`\nUser already exists: ${existing.id}`);
    console.log("Updating password and linking to org...");

    await supabase.auth.admin.updateUserById(existing.id, {
      password: DEMO_PASSWORD,
      email_confirm: true,
    });

    const { error } = await supabase.from("profiles").upsert({
      id: existing.id,
      email: DEMO_EMAIL,
      full_name: "COM Systems Demo",
      organization_id: ORG_ID,
      role: "admin",
    });

    if (error) {
      console.log("Profile upsert error:", error.message);
    } else {
      console.log("Profile linked to COM Systems org!");
    }
  } else {
    // Use the existing Trellex demo user approach — repurpose an existing user
    // or try a different creation approach
    console.log("\nUser does not exist. Trying alternative approaches...\n");

    // Approach 1: Try signUp instead of admin.createUser (different code path)
    console.log("Approach 1: Using auth.signUp...");
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      options: {
        data: { full_name: "COM Systems Demo" },
      },
    });

    if (signUpError) {
      console.log(`  signUp error: ${signUpError.message}`);
    } else if (signUpData?.user) {
      console.log(`  Created via signUp: ${signUpData.user.id}`);

      // Confirm email via admin
      await supabase.auth.admin.updateUserById(signUpData.user.id, {
        email_confirm: true,
      });

      // Link profile
      const { error } = await supabase.from("profiles").upsert({
        id: signUpData.user.id,
        email: DEMO_EMAIL,
        full_name: "COM Systems Demo",
        organization_id: ORG_ID,
        role: "admin",
      });

      if (error) {
        console.log(`  Profile error: ${error.message}`);
      } else {
        console.log("  Profile linked!");
      }
    }

    // Check again
    const { data: recheck } = await supabase.auth.admin.listUsers();
    const found = recheck?.users?.find((u) => u.email === DEMO_EMAIL);

    if (!found) {
      // Approach 2: Use the existing demo user (matt@trellex.io) as a fallback
      console.log("\nApproach 2: Looking for existing Trellex demo user to clone approach...");
      const trellex = recheck?.users?.find((u) => u.email === "matt@trellex.io");

      if (trellex) {
        console.log(`  Found Trellex user: ${trellex.id}`);
        console.log("  You can use the existing demo login (matt@trellex.io)");
        console.log("  and switch its org to COM Systems.\n");
        console.log("  Or create the user in Supabase Dashboard > Authentication > Users:");
        console.log(`    Email:    ${DEMO_EMAIL}`);
        console.log(`    Password: ${DEMO_PASSWORD}`);
        console.log("  Then re-run this script to link the profile.\n");
      } else {
        console.log("  No existing users to repurpose.");
        console.log("  Please create the user manually in Supabase Dashboard:");
        console.log(`    Email:    ${DEMO_EMAIL}`);
        console.log(`    Password: ${DEMO_PASSWORD}`);
        console.log("  Then re-run this script.\n");
      }
    }
  }

  // Verify final state
  console.log("--- Final State ---");
  const { data: finalUsers } = await supabase.auth.admin.listUsers();
  const comUser = finalUsers?.users?.find((u) => u.email === DEMO_EMAIL);

  if (comUser) {
    console.log(`User:    ${comUser.email} (${comUser.id})`);
    console.log(`Confirmed: ${comUser.email_confirmed_at ? "Yes" : "No"}`);

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", comUser.id)
      .single();

    if (profile) {
      console.log(`Profile: ${profile.full_name} (${profile.role})`);
      console.log(`Org ID:  ${profile.organization_id}`);
    } else {
      console.log("Profile: NOT LINKED");
    }
  } else {
    console.log("User: NOT FOUND — needs manual creation");
  }

  console.log("\n========================================");
  console.log("  Login: https://intentwin.vercel.app/login");
  console.log(`  Email: ${DEMO_EMAIL}`);
  console.log(`  Pass:  ${DEMO_PASSWORD}`);
  console.log("========================================\n");
}

main().catch(console.error);
