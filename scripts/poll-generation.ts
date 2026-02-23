#!/usr/bin/env tsx
/**
 * Poll a proposal's generation progress. Run with:
 *   npx tsx --env-file=.env.local scripts/poll-generation.ts
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, key);
const proposalId = process.argv[2] || "be35da09-5926-429c-adb5-ed5245ad3577";

async function poll() {
  console.log(`Polling proposal ${proposalId}...`);
  for (let i = 0; i < 60; i++) {
    const { data: p } = await supabase
      .from("proposals")
      .select("status, generation_error")
      .eq("id", proposalId)
      .single();

    const { data: sections } = await supabase
      .from("proposal_sections")
      .select("section_type, generation_status, generation_error")
      .eq("proposal_id", proposalId);

    const completed = sections?.filter((s) => s.generation_status === "completed").length || 0;
    const failed = sections?.filter((s) => s.generation_status === "failed").length || 0;
    const pending = sections?.filter((s) => s.generation_status === "pending").length || 0;
    const generating = sections?.filter((s) => s.generation_status === "generating").length || 0;

    const time = new Date().toISOString().slice(11, 19);
    console.log(
      `${time} | status: ${p?.status} | sections: ${sections?.length || 0} | ` +
      `completed: ${completed} | generating: ${generating} | pending: ${pending} | failed: ${failed}` +
      (p?.generation_error ? ` | ERROR: ${p.generation_error.slice(0, 80)}` : "")
    );

    if (failed > 0) {
      const failedSections = sections?.filter((s) => s.generation_status === "failed");
      for (const s of failedSections || []) {
        console.log(`  FAILED: ${s.section_type} - ${s.generation_error?.slice(0, 200)}`);
      }
    }

    if (p?.status !== "generating") {
      console.log("Generation finished with status:", p?.status);
      if (p?.generation_error) console.log("Error:", p.generation_error);
      break;
    }

    await new Promise((r) => setTimeout(r, 5000));
  }
}

poll().catch(console.error);
