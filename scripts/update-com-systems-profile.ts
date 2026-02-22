/**
 * Update COM Systems Inc Organization Profile — Branding, Brand Voice, Company Settings
 *
 * Usage:
 *   npx tsx scripts/update-com-systems-profile.ts
 *
 * This script:
 *   1. Finds the COM Systems organization
 *   2. Uploads the SVG logo to Supabase storage
 *   3. Updates organizations.settings with branding, brand_voice, description,
 *      differentiators, industries, and services
 *
 * Source: COM_SYSTEMS_L1.md Section 11 (Voice & Tone), Section 9 (Differentiators),
 *         and brand reference from MyVibe landing page
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

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  },
);

const ORG_SLUG = "com-systems-inc";

// ===========================================
// BRAND COLORS — Based on COM Systems brand identity
// Professional federal IT / veteran-owned aesthetic
// ===========================================
const BRANDING = {
  primary_color: "#003366",   // Deep navy blue — authority, trust, federal
  secondary_color: "#1A1A2E", // Dark navy/slate — professional, serious
  accent_color: "#00A3E0",    // Bright cyan — technology, innovation
  font_family: "Calibri",
  header_text: "COM Systems Inc",
  footer_text: "Confidential — COM Systems Inc. | SDVOSB Certified | www.thecomsystems.com",
  logo_url: "", // Will be set after upload
};

// ===========================================
// BRAND VOICE — From COM_SYSTEMS_L1.md Section 11
// ===========================================
const BRAND_VOICE = {
  tone: [
    "Professional but personal — open with understanding of the client's challenge.",
    "Mission-focused — every capability tied back to the client's core mission.",
    "Outcome-oriented — lead with what the client gets, not what we do.",
    "Military precision — structured, clear hierarchy, numbered where appropriate.",
    "Evidence-backed — always include specific metrics ($20M, 80% reduction, 99.99% uptime).",
    "Humble confidence — let credentials and results speak. No overselling.",
    "Position as a partner, not a vendor. Use first-person plural ('we').",
    "Connect every capability to a compliance framework or best practice.",
    "Close with commitment to long-term value, not just project delivery.",
  ].join(" "),
  terminology: {
    use: [
      "Mission-critical environments",
      "Federal-grade security",
      "Proactive, not reactive",
      "Long-term resilience",
      "Enterprise best practices scaled for agility",
      "Embassy-grade protection",
      "Force multiplier for internal IT teams",
      "Veteran-led, mission-focused",
      "We don't just patch issues; we engineer solutions",
      "Defense-in-depth",
      "Zero Trust Architecture",
      "CCIE-certified",
      "End-to-end accountability",
    ],
    avoid: [
      "synergy",
      "leverage",
      "circle back",
      "cutting-edge",
      "disruptive",
      "game-changer",
      "revolutionary",
      "best-in-class",
      "out of the box",
      "paradigm shift",
      "move the needle",
      "low-hanging fruit",
      "thought leader",
      "world-class",
    ],
  },
};

// ===========================================
// COMPANY PROFILE SETTINGS
// ===========================================
const DESCRIPTION =
  "COM Systems Inc. is a Service-Disabled Veteran-Owned Small Business (SDVOSB) and SWaM-certified provider delivering advanced IT Networking, Cloud Architecture, Systems Engineering, and Security Services. We combine military-grade discipline with elite technical expertise (CCIE) to support mission-critical environments for federal agencies, higher education, and local government.";

const DIFFERENTIATORS = [
  "Elite Engineering (CCIE #53236) — Led by one of only ~30,000 active Cisco Certified Internetwork Experts worldwide. Every engagement benefits from architect-level network design.",
  "Veteran Discipline & Mission Focus — Founded and led by a U.S. Army squad leader. Operations run with military precision — 24/7/365 accountability and rapid responsiveness.",
  "Federal-Grade Security for Everyone — We apply federal standards (NIST 800-171, CMMC, Zero Trust) to ALL clients. Local governments and businesses get embassy-grade protection.",
  "Proven Federal Past Performance — $20M+ in federal contracts with Department of State, DEA, and DOE/NNSA. References available across all agencies.",
  "Local Agility + Enterprise Depth — Headquartered in Fairfax, VA — 15 minutes from the agencies we serve. Technical depth of a large prime with the speed of a local partner.",
];

const INDUSTRIES = [
  "Federal Government",
  "State & Local Government",
  "Higher Education",
  "Commercial Enterprise",
  "Defense & Intelligence",
];

const SERVICES = [
  "Enterprise Network Engineering",
  "IT Managed Services (MSP)",
  "Cybersecurity & Compliance",
  "Cloud & SaaS Architecture",
  "Systems Engineering",
  "Data Center & Hardware Services",
  "IT Staff Augmentation",
];

// ===========================================
// MAIN EXECUTION
// ===========================================
async function main() {
  console.log("=== Updating COM Systems Inc Profile ===\n");

  // Step 1: Find the organization
  console.log("Step 1: Finding COM Systems organization...");
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id, name, settings")
    .eq("slug", ORG_SLUG)
    .single();

  if (orgError || !org) {
    console.error("  Organization not found:", orgError?.message);
    process.exit(1);
  }
  console.log(`  Found: ${org.name} (${org.id})`);

  const orgId = org.id;
  const existingSettings = (org.settings || {}) as Record<string, unknown>;

  // Step 2: Upload logo to Supabase storage
  console.log("\nStep 2: Uploading logo to Supabase storage...");
  const logoPath = resolve(
    import.meta.dirname || __dirname,
    "../public/logos/com-systems-logo.svg",
  );
  let logoUrl = "";

  try {
    const logoBuffer = readFileSync(logoPath);
    const fileName = `${orgId}/logo-${Date.now()}.svg`;

    const { error: uploadError } = await supabase.storage
      .from("organization-assets")
      .upload(fileName, logoBuffer, {
        contentType: "image/svg+xml",
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.log(`  Upload warning: ${uploadError.message}`);
      console.log("  Trying to create bucket first...");

      // Try creating the bucket
      await supabase.storage.createBucket("organization-assets", {
        public: true,
        fileSizeLimit: 2 * 1024 * 1024,
      });

      // Retry upload
      const { error: retryError } = await supabase.storage
        .from("organization-assets")
        .upload(fileName, logoBuffer, {
          contentType: "image/svg+xml",
          cacheControl: "3600",
          upsert: true,
        });

      if (retryError) {
        console.log(`  Could not upload logo: ${retryError.message}`);
        console.log("  Will set logo_url to local path as fallback.");
        logoUrl = "/logos/com-systems-logo.svg";
      } else {
        const { data: urlData } = supabase.storage
          .from("organization-assets")
          .getPublicUrl(fileName);
        logoUrl = urlData.publicUrl;
        console.log(`  Uploaded! URL: ${logoUrl}`);
      }
    } else {
      const { data: urlData } = supabase.storage
        .from("organization-assets")
        .getPublicUrl(fileName);
      logoUrl = urlData.publicUrl;
      console.log(`  Uploaded! URL: ${logoUrl}`);
    }
  } catch (err) {
    console.log(`  Logo file read error: ${err}`);
    logoUrl = "/logos/com-systems-logo.svg";
    console.log(`  Using fallback: ${logoUrl}`);
  }

  // Step 3: Update organization settings
  console.log("\nStep 3: Updating organization settings...");

  const updatedSettings = {
    ...existingSettings,
    description: DESCRIPTION,
    differentiators: DIFFERENTIATORS,
    industries: INDUSTRIES,
    services: SERVICES,
    branding: {
      ...BRANDING,
      logo_url: logoUrl,
    },
    brand_voice: BRAND_VOICE,
  };

  const { error: updateError } = await supabase
    .from("organizations")
    .update({ settings: updatedSettings })
    .eq("id", orgId);

  if (updateError) {
    console.error("  Error updating settings:", updateError.message);
    process.exit(1);
  }

  console.log("  Settings updated successfully!");

  // Step 4: Verify
  console.log("\nStep 4: Verifying update...");
  const { data: updated } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", orgId)
    .single();

  const settings = updated?.settings as Record<string, unknown> | undefined;
  const branding = settings?.branding as Record<string, string> | undefined;
  const brandVoice = settings?.brand_voice as Record<string, unknown> | undefined;
  const diffs = settings?.differentiators as string[] | undefined;

  console.log("\n========================================");
  console.log("  COM Systems Profile Updated!");
  console.log("========================================");
  console.log(`  Org:         ${org.name}`);
  console.log(`  Org ID:      ${orgId}`);
  console.log("========================================");
  console.log("\n  Branding:");
  console.log(`   Primary:    ${branding?.primary_color || "not set"}`);
  console.log(`   Secondary:  ${branding?.secondary_color || "not set"}`);
  console.log(`   Accent:     ${branding?.accent_color || "not set"}`);
  console.log(`   Font:       ${branding?.font_family || "not set"}`);
  console.log(`   Logo:       ${branding?.logo_url ? "Uploaded" : "Not set"}`);
  console.log(`   Header:     ${branding?.header_text || "not set"}`);
  console.log(`   Footer:     ${branding?.footer_text || "not set"}`);
  console.log("\n  Brand Voice:");
  console.log(`   Tone:       ${brandVoice?.tone ? "Set (" + String(brandVoice.tone).slice(0, 60) + "...)" : "not set"}`);
  const terminology = brandVoice?.terminology as { use?: string[]; avoid?: string[] } | undefined;
  console.log(`   Use terms:  ${terminology?.use?.length || 0} phrases`);
  console.log(`   Avoid:      ${terminology?.avoid?.length || 0} phrases`);
  console.log("\n  Company Profile:");
  console.log(`   Description: ${settings?.description ? "Set" : "not set"}`);
  console.log(`   Differentiators: ${diffs?.length || 0}`);
  console.log(`   Industries:  ${(settings?.industries as string[])?.length || 0}`);
  console.log(`   Services:    ${(settings?.services as string[])?.length || 0}`);
  console.log("\n========================================");
  console.log("  Next: Log in at intentbid.com and verify:");
  console.log("   - /settings/company (Profile + Differentiators)");
  console.log("   - /settings/branding (Colors + Logo + Preview)");
  console.log("   - /settings/brand-voice (Tone + Terminology)");
  console.log("========================================\n");
}

main().catch(console.error);
