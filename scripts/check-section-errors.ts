import { readFileSync } from "fs";
import { resolve } from "path";

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

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function main() {
  const { data: sections } = await supabase
    .from("proposal_sections")
    .select("title, generation_status, generation_error")
    .eq("proposal_id", "e6fe96c0-74d2-47c2-9c56-c498bc0ac2fe")
    .order("section_order");

  for (const s of sections || []) {
    console.log(`[${s.generation_status}] ${s.title}`);
    if (s.generation_error) {
      console.log(`  Error: ${s.generation_error}`);
    }
  }
}

main().catch(console.error);
