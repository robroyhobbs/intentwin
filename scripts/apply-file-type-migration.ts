/**
 * Apply the file_type CHECK constraint migration to allow txt and md uploads
 * Run: npx tsx scripts/apply-file-type-migration.ts
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

async function main() {
  console.log("=== Applying file_type constraint migration ===\n");

  // Drop old constraint and add new one
  const { error: dropErr } = await supabase.rpc("exec_sql", {
    sql: "ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_file_type_check;",
  });

  if (dropErr) {
    // exec_sql may not exist — try via direct SQL through the REST API
    console.log("exec_sql not available, trying alternative approach...");

    // Test by inserting a txt record and checking if constraint blocks it
    const { error: testErr } = await supabase
      .from("documents")
      .insert({
        title: "__test_txt__",
        file_name: "test.txt",
        file_type: "txt",
        file_size_bytes: 100,
        storage_path: "test/test.txt",
        mime_type: "text/plain",
        uploaded_by: "cfb2a693-a660-4970-af20-624360651edf",
        organization_id: "e0c3a510-8350-43cd-b0f6-3fa34c55b88e",
      })
      .select()
      .single();

    if (testErr) {
      console.log("Constraint blocks txt uploads:", testErr.message);
      console.log("\nYou need to run this SQL in the Supabase Dashboard SQL Editor:");
      console.log("────────────────────────────────────────");
      console.log("ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_file_type_check;");
      console.log("ALTER TABLE public.documents ADD CONSTRAINT documents_file_type_check CHECK (file_type IN ('docx', 'pdf', 'pptx', 'txt', 'md'));");
      console.log("────────────────────────────────────────");
    } else {
      console.log("txt file type already accepted! Cleaning up test record...");
      await supabase.from("documents").delete().eq("title", "__test_txt__");
      console.log("Done — no migration needed.");
    }
    return;
  }

  const { error: addErr } = await supabase.rpc("exec_sql", {
    sql: "ALTER TABLE public.documents ADD CONSTRAINT documents_file_type_check CHECK (file_type IN ('docx', 'pdf', 'pptx', 'txt', 'md'));",
  });

  if (addErr) {
    console.log("Error adding new constraint:", addErr.message);
  } else {
    console.log("Migration applied successfully!");
  }
}

main().catch(console.error);
