/**
 * Switch the existing Trellex demo user to the COM Systems org
 * Run: npx tsx scripts/switch-to-com-systems.ts
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

const USER_ID = "cfb2a693-a660-4970-af20-624360651edf";
const COM_ORG_ID = "e0c3a510-8350-43cd-b0f6-3fa34c55b88e";

async function main() {
  console.log("Switching matt@trellex.io to COM Systems org...\n");

  const { error: profileErr } = await supabase
    .from("profiles")
    .update({ organization_id: COM_ORG_ID })
    .eq("id", USER_ID);

  if (profileErr) {
    console.log("Profile update error:", profileErr.message);
  } else {
    console.log("Profile switched to COM Systems org!");
  }

  // Verify
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, role, organization_id")
    .eq("id", USER_ID)
    .single();

  const { data: org } = await supabase
    .from("organizations")
    .select("name, slug, plan_tier")
    .eq("id", COM_ORG_ID)
    .single();

  console.log("\n--- Verified ---");
  console.log("User:", profile?.email);
  console.log("Name:", profile?.full_name);
  console.log("Role:", profile?.role);
  console.log("Org:", org?.name, "(" + org?.slug + ")");
  console.log("Plan:", org?.plan_tier);
  console.log("\n========================================");
  console.log("  Demo Login Ready!");
  console.log("========================================");
  console.log("  URL:      https://intentwin.vercel.app/login");
  console.log("  Email:    matt@trellex.io");
  console.log("  Password: Cool551!pass");
  console.log("  Org:      COM Systems Inc");
  console.log("========================================");
}

main().catch(console.error);
