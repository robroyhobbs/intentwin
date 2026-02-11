/**
 * Move legacy NULL org_id records to Capgemini org, so COM Systems data shows cleanly
 * Run: npx tsx scripts/fix-legacy-l1-data.ts
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

const CAPGEMINI_ORG_ID = "fe8de6d6-d050-49e9-b98d-3fb5b25b5de2";

async function main() {
  console.log("=== Moving legacy NULL org_id records to Capgemini org ===\n");

  // Fix company_context
  const { data: cc, error: ccErr } = await supabase
    .from("company_context")
    .update({ organization_id: CAPGEMINI_ORG_ID })
    .is("organization_id", null)
    .select("id");

  console.log(`company_context: moved ${cc?.length ?? 0} records ${ccErr ? "(error: " + ccErr.message + ")" : ""}`);

  // Fix product_contexts
  const { data: pc, error: pcErr } = await supabase
    .from("product_contexts")
    .update({ organization_id: CAPGEMINI_ORG_ID })
    .is("organization_id", null)
    .select("id");

  console.log(`product_contexts: moved ${pc?.length ?? 0} records ${pcErr ? "(error: " + pcErr.message + ")" : ""}`);

  // Fix evidence_library
  const { data: ev, error: evErr } = await supabase
    .from("evidence_library")
    .update({ organization_id: CAPGEMINI_ORG_ID })
    .is("organization_id", null)
    .select("id");

  console.log(`evidence_library: moved ${ev?.length ?? 0} records ${evErr ? "(error: " + evErr.message + ")" : ""}`);

  // Verify COM Systems data
  console.log("\n--- Verification ---");
  const COM_ORG_ID = "e0c3a510-8350-43cd-b0f6-3fa34c55b88e";

  const { data: comCC } = await supabase
    .from("company_context")
    .select("category, key, title")
    .eq("organization_id", COM_ORG_ID);
  console.log(`\nCOM Systems company_context: ${comCC?.length} records`);

  const { data: comPC } = await supabase
    .from("product_contexts")
    .select("product_name")
    .eq("organization_id", COM_ORG_ID);
  console.log(`COM Systems product_contexts: ${comPC?.length} records`);

  const { data: comEV } = await supabase
    .from("evidence_library")
    .select("title")
    .eq("organization_id", COM_ORG_ID);
  console.log(`COM Systems evidence_library: ${comEV?.length} records`);

  // Check for any remaining NULL records
  const { data: nullCC } = await supabase
    .from("company_context")
    .select("id")
    .is("organization_id", null);
  const { data: nullPC } = await supabase
    .from("product_contexts")
    .select("id")
    .is("organization_id", null);
  const { data: nullEV } = await supabase
    .from("evidence_library")
    .select("id")
    .is("organization_id", null);

  console.log(`\nRemaining NULL org_id: company=${nullCC?.length}, products=${nullPC?.length}, evidence=${nullEV?.length}`);

  if ((nullCC?.length ?? 0) + (nullPC?.length ?? 0) + (nullEV?.length ?? 0) === 0) {
    console.log("\nAll records have org_id set. COM Systems should show clean data now.");
  }
}

main().catch(console.error);
