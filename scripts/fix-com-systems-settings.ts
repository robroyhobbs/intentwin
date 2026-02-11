/**
 * Populate organizations.settings JSON for COM Systems so the Profile tab shows real data
 * Run: npx tsx scripts/fix-com-systems-settings.ts
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
  console.log("=== Populating COM Systems org settings ===\n");

  const settings = {
    description:
      "COM Systems Inc is a Service-Disabled Veteran-Owned Small Business (SDVOSB) delivering enterprise IT networking, cloud infrastructure, cybersecurity, and systems engineering services to federal agencies and commercial enterprises. With CCIE Data Center certified engineers and deep expertise across Cisco, Juniper, Palo Alto, and AWS/Azure platforms, COM Systems provides end-to-end technology solutions from design through managed operations. Headquartered in the Washington DC metro area, COM Systems holds active GSA Schedule contracts and maintains security clearances for classified environments.",
    differentiators: [
      "Service-Disabled Veteran-Owned Small Business (SDVOSB) with VA CVE verification",
      "CCIE Data Center certified engineering team — top 3% of network engineers globally",
      "End-to-end service delivery from architecture design through 24/7 managed operations",
      "Deep federal experience with DoS, DEA, and classified environment clearances",
      "Multi-vendor expertise across Cisco, Juniper, Palo Alto, Fortinet, AWS, and Azure",
      "Proven methodology: Discover → Design → Deploy → Harden → Operate → Optimize",
    ],
    industries: [
      "Federal Government",
      "Department of Defense",
      "Intelligence Community",
      "Civilian Agencies",
      "Healthcare (Federal)",
      "Financial Services",
    ],
    services: [
      "network_infrastructure",
      "cloud_services",
      "cybersecurity",
      "systems_engineering",
      "managed_services",
      "unified_communications",
    ],
  };

  const { error } = await supabase
    .from("organizations")
    .update({ settings })
    .eq("id", COM_ORG_ID);

  if (error) {
    console.log("ERROR updating settings:", error.message);
    return;
  }

  console.log("Settings updated successfully!\n");

  // Verify
  const { data: org } = await supabase
    .from("organizations")
    .select("name, settings")
    .eq("id", COM_ORG_ID)
    .single();

  console.log("Org:", org?.name);
  console.log("Description:", org?.settings?.description?.substring(0, 80) + "...");
  console.log("Differentiators:", org?.settings?.differentiators?.length);
  console.log("Industries:", org?.settings?.industries?.join(", "));
  console.log("Services:", org?.settings?.services?.join(", "));

  console.log("\n=== Done! Profile tab should now show real data ===");
}

main().catch(console.error);
