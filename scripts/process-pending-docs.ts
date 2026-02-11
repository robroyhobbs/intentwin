/**
 * Process all pending documents (parse + embed)
 * Run: npx dotenv -e .env.local -- tsx scripts/process-pending-docs.ts
 *  OR: npx tsx scripts/process-pending-docs.ts  (loads .env.local itself)
 */
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local into process.env (static imports are hoisted but
// createAdminClient reads process.env at call-time, not import-time,
// so this still works as long as we set env before calling processDocument)
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  const envPath = resolve(import.meta.dirname || __dirname, "../.env.local");
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    process.env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
  }
}

import { processDocument } from "../src/lib/documents/pipeline";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const COM_ORG_ID = "e0c3a510-8350-43cd-b0f6-3fa34c55b88e";

async function main() {
  console.log("ENV check:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "loaded" : "MISSING");

  const { data: pending } = await supabase
    .from("documents")
    .select("id, title, file_type")
    .eq("organization_id", COM_ORG_ID)
    .eq("processing_status", "pending");

  if (!pending || pending.length === 0) {
    console.log("No pending documents to process.");
    return;
  }

  console.log(`=== Processing ${pending.length} pending documents ===\n`);

  let success = 0;
  let failed = 0;

  for (const doc of pending) {
    process.stdout.write(`Processing: ${doc.title} [${doc.file_type}]... `);
    try {
      await processDocument(doc.id);
      console.log("OK");
      success++;
    } catch (err) {
      console.log(`FAILED: ${err instanceof Error ? err.message : err}`);
      failed++;
    }
  }

  console.log(`\n=== Done: ${success} processed, ${failed} failed ===`);

  const { data: allDocs } = await supabase
    .from("documents")
    .select("title, file_type, processing_status, chunk_count")
    .eq("organization_id", COM_ORG_ID)
    .order("created_at");

  console.log(`\nKnowledge Base (${allDocs?.length} documents):`);
  allDocs?.forEach((d) => {
    console.log(
      `  [${d.file_type}] ${d.title} — ${d.processing_status} (${d.chunk_count || 0} chunks)`,
    );
  });
}

main().catch(console.error);
