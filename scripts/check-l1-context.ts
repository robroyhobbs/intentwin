/**
 * Check what L1 context is in the database and which org it belongs to
 * Run: npx tsx scripts/check-l1-context.ts
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

const COM_ORG_ID = "e0c3a510-8350-43cd-b0f6-3fa34c55b88e";

async function main() {
  console.log("=== L1 Context Audit ===\n");

  // Check all orgs
  const { data: orgs } = await supabase.from("organizations").select("id, name, slug");
  console.log("Organizations:");
  orgs?.forEach((o) => console.log(`  ${o.id} | ${o.name} (${o.slug})`));

  // Check company_context
  console.log("\n--- company_context ---");
  const { data: cc } = await supabase
    .from("company_context")
    .select("id, category, key, title, organization_id")
    .order("category");

  const comCtx = cc?.filter((c) => c.organization_id === COM_ORG_ID);
  const nullCtx = cc?.filter((c) => !c.organization_id);
  const otherCtx = cc?.filter((c) => c.organization_id && c.organization_id !== COM_ORG_ID);

  console.log(`  Total: ${cc?.length}`);
  console.log(`  COM Systems (org_id set): ${comCtx?.length}`);
  console.log(`  NULL org_id (legacy): ${nullCtx?.length}`);
  console.log(`  Other org: ${otherCtx?.length}`);

  if (nullCtx && nullCtx.length > 0) {
    console.log("\n  Legacy entries (NULL org_id) — these are the Acme/Capgemini ones:");
    nullCtx.forEach((c) => console.log(`    ${c.category}/${c.key}: ${c.title}`));
  }

  // Check product_contexts
  console.log("\n--- product_contexts ---");
  const { data: pc } = await supabase
    .from("product_contexts")
    .select("id, product_name, service_line, organization_id");

  const comProds = pc?.filter((p) => p.organization_id === COM_ORG_ID);
  const nullProds = pc?.filter((p) => !p.organization_id);

  console.log(`  Total: ${pc?.length}`);
  console.log(`  COM Systems: ${comProds?.length}`);
  console.log(`  NULL org_id (legacy): ${nullProds?.length}`);

  if (nullProds && nullProds.length > 0) {
    console.log("\n  Legacy products:");
    nullProds.forEach((p) => console.log(`    ${p.product_name} (${p.service_line})`));
  }

  // Check evidence_library
  console.log("\n--- evidence_library ---");
  const { data: ev } = await supabase
    .from("evidence_library")
    .select("id, evidence_type, title, organization_id");

  const comEv = ev?.filter((e) => e.organization_id === COM_ORG_ID);
  const nullEv = ev?.filter((e) => !e.organization_id);

  console.log(`  Total: ${ev?.length}`);
  console.log(`  COM Systems: ${comEv?.length}`);
  console.log(`  NULL org_id (legacy): ${nullEv?.length}`);

  if (nullEv && nullEv.length > 0) {
    console.log("\n  Legacy evidence:");
    nullEv.forEach((e) => console.log(`    ${e.evidence_type}: ${e.title}`));
  }

  // Check how the app fetches L1 context
  console.log("\n=== Diagnosis ===");
  console.log("The app is likely fetching records WHERE organization_id IS NULL");
  console.log("(legacy Acme data) instead of WHERE organization_id = COM_ORG_ID.");
  console.log("\nFix options:");
  console.log("  1. Delete legacy NULL org_id records");
  console.log("  2. Update legacy records to point to a different org");
  console.log("  3. Fix the app query to filter by the user's org_id");
}

main().catch(console.error);
