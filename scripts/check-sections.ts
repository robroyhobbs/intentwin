#!/usr/bin/env tsx
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const proposalId = "be35da09-5926-429c-adb5-ed5245ad3577";

  const { data: sections } = await supabase
    .from("proposal_sections")
    .select("section_type, generation_status, generation_error")
    .eq("proposal_id", proposalId);

  console.log("Existing sections:", sections?.length);
  for (const s of sections || []) {
    console.log("  ", s.section_type, "|", s.generation_status, "|", s.generation_error?.slice(0, 100) || "ok");
  }
}

check().catch(console.error);
