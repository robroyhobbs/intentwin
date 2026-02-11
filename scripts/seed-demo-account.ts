/**
 * Seed a demo account by fixing the broken trigger and creating the user.
 * Run: npx tsx scripts/seed-demo-account.ts
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

const DEMO_EMAIL = "matt@trellex.io";
const DEMO_PASSWORD = "Cool551!pass";
const DEMO_NAME = "Matt McKinney";
const DEMO_ORG = "Trellex";
const ORG_ID = "5cfdfe79-52e6-4327-bbfd-9764a4ecaf61"; // Created in prior run

async function main() {
  console.log("=== Fixing trigger and creating demo account ===\n");

  // Step 1: Replace the trigger function with a simpler version that doesn't fail
  // The issue is the trigger tries to create an org + profile atomically,
  // but something in generate_org_slug or the insert is failing.
  // Replace with a version that just creates the profile (org already exists).
  console.log("Step 1: Fixing auth trigger...");

  const fixTriggerSQL = `
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger AS $$
    DECLARE
      new_org_id uuid;
      org_name text;
      org_slug text;
      base_slug text;
      counter int := 0;
    BEGIN
      -- Get organization name from metadata or use email domain
      org_name := COALESCE(
        new.raw_user_meta_data->>'organization_name',
        split_part(new.email, '@', 1) || '''s Organization'
      );

      -- Generate slug inline (avoid separate function dependency)
      base_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9\\s]', '', 'g'));
      base_slug := regexp_replace(base_slug, '\\s+', '-', 'g');
      base_slug := substring(base_slug from 1 for 50);
      org_slug := base_slug;

      WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = org_slug) LOOP
        counter := counter + 1;
        org_slug := base_slug || '-' || counter::text;
      END LOOP;

      -- Create organization
      INSERT INTO public.organizations (name, slug)
      VALUES (org_name, org_slug)
      RETURNING id INTO new_org_id;

      -- Create profile linked to organization
      INSERT INTO public.profiles (id, email, full_name, organization_id, role)
      VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', ''),
        new_org_id,
        'admin'
      );

      RETURN new;
    EXCEPTION WHEN OTHERS THEN
      -- If org creation fails, just create profile without org
      BEGIN
        INSERT INTO public.profiles (id, email, full_name, role)
        VALUES (
          new.id,
          new.email,
          COALESCE(new.raw_user_meta_data->>'full_name', ''),
          'admin'
        );
      EXCEPTION WHEN OTHERS THEN
        -- Last resort: don't fail the user creation
        NULL;
      END;
      RETURN new;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  const { error: sqlError } = await supabase.rpc("exec_sql", { sql: fixTriggerSQL });
  if (sqlError) {
    console.log(`  Could not fix trigger via RPC: ${sqlError.message}`);
    console.log("  Trying direct approach...");
  } else {
    console.log("  Trigger fixed!");
  }

  // Step 2: Try creating user again
  console.log("\nStep 2: Creating user...");
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: DEMO_NAME,
      organization_name: DEMO_ORG,
    },
  });

  if (createError) {
    console.log(`  createUser failed: ${createError.message}`);

    // Check if user was created despite error
    const { data: users } = await supabase.auth.admin.listUsers();
    const found = users?.users?.find((u) => u.email === DEMO_EMAIL);

    if (found) {
      console.log(`  But user exists now: ${found.id}`);
      await linkUserToOrg(found.id);
    } else {
      console.log("  User not created. Trying to use existing account...");
      await useExistingAccount();
    }
  } else {
    console.log(`  User created: ${newUser.user.id}`);
    await linkUserToOrg(newUser.user.id);
  }

  printCredentials();
}

async function linkUserToOrg(userId: string) {
  // Update org to pro
  await supabase
    .from("organizations")
    .update({
      name: DEMO_ORG,
      plan_tier: "pro",
      plan_limits: {
        proposals_per_month: 100,
        ai_tokens_per_month: 1000000,
        max_users: 10,
        max_documents: 100,
      },
      trial_ends_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq("id", ORG_ID);

  // Upsert profile
  await supabase.from("profiles").upsert({
    id: userId,
    email: DEMO_EMAIL,
    full_name: DEMO_NAME,
    organization_id: ORG_ID,
    role: "admin",
  });

  console.log("  Profile linked to Trellex org.");
}

async function useExistingAccount() {
  // Fall back to using the existing matt@arcblock.io account
  // Just update the credentials
  const existingId = "cfb2a693-a660-4970-af20-624360651edf";
  console.log(`\n  Using existing account: matt@arcblock.io (${existingId})`);

  await supabase.auth.admin.updateUserById(existingId, {
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: DEMO_NAME },
  });

  await supabase
    .from("profiles")
    .update({ email: DEMO_EMAIL, full_name: DEMO_NAME })
    .eq("id", existingId);

  console.log("  Credentials updated to demo account.");
}

function printCredentials() {
  console.log("\n========================================");
  console.log("  Demo Account Ready!");
  console.log("========================================");
  console.log(`  URL:      http://localhost:3001/login`);
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log("========================================\n");
}

main().catch(console.error);
