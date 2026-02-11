/**
 * Test all proposal export formats
 *
 * Usage: npx tsx scripts/test-exports.ts
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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ORG_ID = "e0c3a510-8350-43cd-b0f6-3fa34c55b88e";

async function main() {
  // 1. Check proposals
  const { data: proposals, error: propErr } = await supabase
    .from("proposals")
    .select("id, title, status, created_at")
    .eq("organization_id", ORG_ID)
    .order("created_at", { ascending: false });

  console.log("=== Proposals ===");
  if (propErr) {
    console.error("Error:", propErr.message);
    return;
  }
  console.log(`${proposals?.length || 0} proposals found`);
  proposals?.forEach((p) => console.log(`  [${p.status}] ${p.title} (id: ${p.id})`));

  // 2. Check sections for first proposal
  if (proposals && proposals.length > 0) {
    const { data: sections } = await supabase
      .from("proposal_sections")
      .select("id, title, section_type, generation_status")
      .eq("proposal_id", proposals[0].id)
      .order("section_order", { ascending: true });
    console.log(`\n=== Sections for "${proposals[0].title}" ===`);
    console.log(`${sections?.length || 0} sections`);
    sections?.forEach((s) =>
      console.log(`  [${s.generation_status}] ${s.title} (${s.section_type})`),
    );
  }

  // 3. Check storage buckets
  const { data: buckets, error: buckErr } = await supabase.storage.listBuckets();
  console.log("\n=== Storage Buckets ===");
  if (buckErr) console.error("Error:", buckErr.message);
  else {
    console.log(`${buckets?.length || 0} buckets`);
    buckets?.forEach((b) => console.log(`  ${b.name} (public: ${b.public})`));

    // Check if exported-proposals bucket exists
    const hasBucket = buckets?.some((b) => b.name === "exported-proposals");
    if (!hasBucket) {
      console.log("\n  ⚠ 'exported-proposals' bucket MISSING — creating...");
      const { error: createErr } = await supabase.storage.createBucket("exported-proposals", {
        public: false,
      });
      if (createErr) console.error("  Error creating bucket:", createErr.message);
      else console.log("  ✓ 'exported-proposals' bucket created");
    } else {
      console.log("  ✓ 'exported-proposals' bucket exists");
    }
  }
}

main().catch(console.error);
