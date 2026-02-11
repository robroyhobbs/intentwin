/**
 * Create a test proposal for COM Systems and run it through the real L1 pipeline
 * Run: npx tsx scripts/test-proposal-generation.ts
 */
import { readFileSync } from "fs";
import { resolve } from "path";

// Load env
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
import { generateProposal } from "../src/lib/ai/pipeline";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const COM_ORG_ID = "e0c3a510-8350-43cd-b0f6-3fa34c55b88e";
const USER_ID = "cfb2a693-a660-4970-af20-624360651edf";

async function main() {
  console.log("=== Test Proposal Generation (COM Systems L1 Pipeline) ===\n");

  // Create a test proposal
  const intakeData = {
    client_name: "Department of Veterans Affairs",
    client_industry: "Federal Government",
    opportunity_name: "VA Network Modernization & Zero Trust Implementation",
    scope_description:
      "Modernize the VA's enterprise network infrastructure across 3 regional data centers, implementing Zero Trust Architecture per NIST SP 800-207, upgrading core switching and routing, deploying SD-WAN for 150+ remote clinics, and establishing a 24/7 NOC for ongoing managed services.",
    key_requirements: [
      "NIST SP 800-207 Zero Trust Architecture implementation",
      "SD-WAN deployment across 150+ VA clinic locations",
      "Core network infrastructure upgrade (Cisco Nexus / Juniper)",
      "24/7 Network Operations Center (NOC) with Tier 1-3 support",
      "CMMC 2.0 Level 2 compliance alignment",
      "FedRAMP-compliant cloud connectivity (Azure Government)",
    ],
    timeline_expectation: "18 months with phased rollout",
    budget_range: "$8M - $12M",
    contract_vehicle: "GSA Schedule 70",
    evaluation_criteria: [
      "Technical approach and methodology",
      "Past performance on similar federal network modernization",
      "Key personnel qualifications (CCIE required)",
      "Small business utilization (SDVOSB preference)",
      "Price reasonableness",
    ],
    competitive_landscape:
      "Competing against 2-3 large integrators; our SDVOSB status and CCIE team are key differentiators",
  };

  const { data: proposal, error: createErr } = await supabase
    .from("proposals")
    .insert({
      title: "VA Network Modernization & Zero Trust Implementation",
      status: "draft",
      intake_data: intakeData,
      organization_id: COM_ORG_ID,
      created_by: USER_ID,
    })
    .select()
    .single();

  if (createErr || !proposal) {
    console.log("Failed to create proposal:", createErr?.message);
    return;
  }

  console.log(`Proposal created: ${proposal.id}`);
  console.log(`Title: ${proposal.title}`);
  console.log(`Client: ${intakeData.client_name}\n`);
  console.log("Running through the L1 pipeline (this takes 2-3 minutes)...\n");

  try {
    await generateProposal(proposal.id);
    console.log("\nProposal generation completed!\n");
  } catch (err) {
    console.log(
      "\nGeneration error:",
      err instanceof Error ? err.message : err,
    );
    if (err instanceof Error && err.stack) {
      console.log("\nStack trace:");
      console.log(err.stack);
    }
  }

  // Show results
  const { data: sections } = await supabase
    .from("proposal_sections")
    .select("section_type, title, generation_status, generated_content")
    .eq("proposal_id", proposal.id)
    .order("section_order");

  console.log(`=== Generated ${sections?.length || 0} sections ===\n`);

  for (const s of sections || []) {
    const preview = s.generated_content?.substring(0, 120) || "(empty)";
    const comMentions = (s.generated_content?.match(/COM Systems/gi) || [])
      .length;
    const l1Keywords = (
      s.generated_content?.match(/SDVOSB|CCIE|Zero Trust|NIST|CMMC/gi) || []
    ).length;
    console.log(`[${s.generation_status}] ${s.title}`);
    console.log(
      `  COM Systems mentions: ${comMentions} | L1 keywords: ${l1Keywords}`,
    );
    console.log(`  Preview: ${preview}...`);
    console.log();
  }

  console.log(`View at: https://intentwin.vercel.app/proposals/${proposal.id}`);
}

main().catch(console.error);
