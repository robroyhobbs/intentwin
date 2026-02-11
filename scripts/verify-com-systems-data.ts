/**
 * Verify COM Systems L1 data - show actual content
 * Run: npx tsx scripts/verify-com-systems-data.ts
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
  console.log("=== COM Systems Data Verification ===\n");

  // 1. Verify org exists
  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", COM_ORG_ID)
    .single();
  console.log("ORG:", org?.name, "| plan:", org?.plan_tier, "| slug:", org?.slug);

  // 2. Verify profile link
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("organization_id", COM_ORG_ID);
  console.log("PROFILES linked:", profile?.length, profile?.map((p) => p.email).join(", "));

  // 3. Show ALL company_context with actual content
  console.log("\n--- COMPANY CONTEXT (full content) ---");
  const { data: cc } = await supabase
    .from("company_context")
    .select("*")
    .eq("organization_id", COM_ORG_ID)
    .order("category");

  if (!cc || cc.length === 0) {
    console.log("  ** EMPTY — no company context records for this org **");
  } else {
    for (const c of cc) {
      const preview = c.content?.substring(0, 80) || "(empty)";
      console.log(`  [${c.category}/${c.key}] ${c.title}: ${preview}...`);
    }
  }

  // 4. Show ALL product_contexts with actual content
  console.log("\n--- PRODUCT CONTEXTS (full content) ---");
  const { data: pc } = await supabase
    .from("product_contexts")
    .select("*")
    .eq("organization_id", COM_ORG_ID);

  if (!pc || pc.length === 0) {
    console.log("  ** EMPTY — no product records for this org **");
  } else {
    for (const p of pc) {
      const capCount = Array.isArray(p.capabilities) ? p.capabilities.length : 0;
      console.log(`  [${p.service_line}] ${p.product_name} — ${capCount} capabilities`);
      console.log(`    Desc: ${p.description?.substring(0, 100)}...`);
      if (Array.isArray(p.capabilities)) {
        for (const cap of p.capabilities) {
          console.log(`      - ${cap.name}: ${cap.description?.substring(0, 60)}...`);
        }
      }
    }
  }

  // 5. Show ALL evidence with actual content
  console.log("\n--- EVIDENCE LIBRARY (full content) ---");
  const { data: ev } = await supabase
    .from("evidence_library")
    .select("*")
    .eq("organization_id", COM_ORG_ID);

  if (!ev || ev.length === 0) {
    console.log("  ** EMPTY — no evidence records for this org **");
  } else {
    for (const e of ev) {
      console.log(`  [${e.evidence_type}] ${e.title} (verified: ${e.is_verified})`);
      console.log(`    Summary: ${e.summary?.substring(0, 100)}...`);
      console.log(`    Content length: ${e.full_content?.length || 0} chars`);
      if (Array.isArray(e.metrics)) {
        console.log(`    Metrics: ${e.metrics.map((m: any) => `${m.name}=${m.value}`).join(", ")}`);
      }
    }
  }

  // 6. Check documents table
  console.log("\n--- DOCUMENTS / KNOWLEDGE BASE ---");
  const { data: docs } = await supabase
    .from("documents")
    .select("*")
    .eq("organization_id", COM_ORG_ID);
  console.log(`Documents uploaded: ${docs?.length || 0}`);
  if (docs && docs.length > 0) {
    for (const d of docs) {
      console.log(`  - ${d.title} (${d.document_type}) — ${d.status}`);
    }
  }

  // 7. Check what the settings page fetches (simulate the exact query)
  console.log("\n--- SIMULATED SETTINGS PAGE FETCH ---");
  const { data: settingsCC, error: settingsErr } = await supabase
    .from("company_context")
    .select("*")
    .eq("organization_id", COM_ORG_ID)
    .order("category", { ascending: true });

  console.log(`Settings page would show: ${settingsCC?.length || 0} entries`);
  if (settingsErr) console.log("Error:", settingsErr.message);

  // Summary
  console.log("\n=== SUMMARY ===");
  console.log(`Company Context: ${cc?.length || 0} records with real content`);
  console.log(`Products: ${pc?.length || 0} records with capabilities`);
  console.log(`Evidence: ${ev?.length || 0} records with case studies`);
  console.log(`Documents: ${docs?.length || 0} uploaded files`);
}

main().catch(console.error);
