/**
 * Seed Team Members for COM Systems Inc
 *
 * Populates the team_members table (migration 00041) with key personnel
 * extracted from real RFP responses and capability statements.
 *
 * Usage: npx tsx scripts/seed-team-members.ts
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

const USER_ID = "596d5c61-1710-49ee-9331-ec7d45b10f7a";

const TEAM_MEMBERS = [
  {
    name: "Soo Jin Om",
    role: "Enterprise Network Architect",
    title: "President / CEO",
    email: "som@thecomsystems.com",
    skills: [
      "Enterprise Network Design",
      "Data Center Architecture",
      "Cisco Nexus/ACI",
      "SD-WAN",
      "Network Security",
      "NIST Compliance",
      "Federal IT Infrastructure",
      "Project Leadership",
    ],
    certifications: [
      "Cisco CCIE Data Center #53236",
      "CCNP Routing & Switching",
      "CCNP Security",
      "CCNA Wireless",
      "CCNA Data Center",
      "AWS Solutions Architect Professional",
    ],
    clearance_level: "Secret",
    years_experience: 15,
    project_history: [
      {
        title: "U.S. Department of State — Global Infrastructure Modernization (WIAB + STORM)",
        client_industry: "Federal Government",
        scope: "Led enterprise network modernization across 250+ global sites. Designed and deployed WIAB (Wireless in a Box) and STORM (Smart Tactical Operations Resource Management) platforms.",
        results: "99.95% uptime across 250+ global diplomatic facilities. Reduced deployment time for new facility connectivity from weeks to 48 hours.",
        dates: "2018–Present",
      },
      {
        title: "U.S. Drug Enforcement Administration (DEA) — Infrastructure Modernization",
        client_industry: "Federal Government / Law Enforcement",
        scope: "Multi-year IT infrastructure modernization program including network refresh, security hardening, and cloud migration planning for sensitive law enforcement systems.",
        results: "Modernized infrastructure across multiple DEA facilities. Achieved full NIST SP 800-171 compliance.",
        dates: "2019–2022",
      },
      {
        title: "Department of Energy (DOE/NNSA) — Classified Network Modernization",
        client_industry: "Federal Government / National Security",
        scope: "Classified network infrastructure upgrade for the National Nuclear Security Administration. Required TS/SCI clearance and SCIF-compliant operations.",
        results: "Zero security incidents during 18-month modernization. Achieved full CMMC Level 3 equivalent compliance.",
        dates: "2020–2022",
      },
    ],
    bio: "U.S. Army squad leader veteran and George Mason University alumnus (Class of 2011). 15+ years designing enterprise networking solutions for federal agencies. Holds Cisco CCIE Data Center certification (#53236) — one of only ~30,000 active CCIEs worldwide. Personally architects every major engagement. Brings military discipline, elite technical depth, and hands-on leadership to every project.",
    is_verified: true,
  },
  {
    name: "John Kang",
    role: "Program Manager",
    title: "Program Manager & System Architect",
    email: null,
    skills: [
      "Program Management",
      "System Architecture",
      "Managed Services",
      "Data Center Operations",
      "Enterprise IT Strategy",
      "Network Architecture",
      "Help Desk Operations",
      "Regulatory Compliance",
      "ITIL Service Management",
    ],
    certifications: [
      "PMP",
      "ITIL v4 Foundation",
      "PRINCE2 Practitioner",
    ],
    clearance_level: "Public Trust",
    years_experience: 15,
    project_history: [
      {
        title: "George Mason University — IT Managed Services",
        client_industry: "Higher Education",
        scope: "Program manager for comprehensive IT managed services engagement covering network operations, help desk, systems engineering, and cybersecurity for 40,000+ user campus environment.",
        results: "Maintained 99.9% service availability. Managed team of 12+ technicians. Achieved SLA compliance across all service categories.",
        dates: "2024–Present",
      },
      {
        title: "KLC Systems — 9-Year Commercial Managed Services Partnership",
        client_industry: "Commercial / Technology",
        scope: "Long-term managed services engagement covering full IT lifecycle support, infrastructure management, and strategic IT planning.",
        results: "9-year continuous partnership. Zero unplanned outages in critical systems. 98%+ client satisfaction rating.",
        dates: "2015–2024",
      },
    ],
    bio: "15+ years in managed services, data center operations, and enterprise IT strategy. Expert in network architecture, help desk operations, systems engineering, and regulatory compliance. Leads cross-functional teams delivering IT services to federal, education, and commercial clients.",
    is_verified: true,
  },
  {
    name: "Dustin Han",
    role: "Technical Manager",
    title: "Technical Manager & System Architect",
    email: null,
    skills: [
      "Cybersecurity",
      "IT Infrastructure",
      "Service Desk Leadership",
      "Splunk SIEM",
      "Duo MFA",
      "CrowdStrike",
      "Intune MDM",
      "Active Directory",
      "SCCM",
      "SCOM",
      "VMware",
      "PowerShell Automation",
      "NIST Compliance",
      "CMMC Compliance",
    ],
    certifications: [
      "CISSP",
      "CompTIA Security+",
      "CEH (Certified Ethical Hacker)",
      "Splunk Certified Admin",
      "VMware VCP",
    ],
    clearance_level: "Secret",
    years_experience: 10,
    project_history: [
      {
        title: "Federal Agency — Cybersecurity Operations Center",
        client_industry: "Federal Government",
        scope: "Technical lead for cybersecurity operations including SIEM deployment (Splunk), endpoint protection (CrowdStrike), identity management (Duo MFA), and compliance monitoring against NIST SP 800-53 controls.",
        results: "Reduced mean time to detect (MTTD) security incidents by 60%. Achieved 100% compliance on NIST SP 800-53 audit.",
        dates: "2021–Present",
      },
      {
        title: "George Mason University — Security & Systems Engineering",
        client_industry: "Higher Education",
        scope: "Cybersecurity and systems engineering for campus-wide IT infrastructure. Led endpoint management (Intune, SCCM), server infrastructure (VMware), and security monitoring programs.",
        results: "Deployed endpoint protection to 15,000+ devices. Automated patch management reducing vulnerability window from 30 days to 72 hours.",
        dates: "2024–Present",
      },
    ],
    bio: "10+ years in cybersecurity, IT infrastructure, and service desk leadership. Expert in Splunk SIEM, Duo MFA, CrowdStrike, Intune MDM, Active Directory, SCCM, SCOM, VMware, and PowerShell automation. NIST and CMMC compliance specialist. Brings deep security expertise to every engagement.",
    is_verified: true,
  },
  {
    name: "Lawrence Kosar",
    role: "Cloud Architect",
    title: "Cloud Architect & VP of Operations",
    email: null,
    skills: [
      "Cloud Architecture",
      "AWS",
      "Azure",
      "Infrastructure Strategy",
      "Cybersecurity",
      "Automation",
      "Client Operations",
      "Compliance",
      "Scalable Service Delivery",
      "Terraform",
      "CI/CD Pipelines",
    ],
    certifications: [
      "AWS Solutions Architect Professional",
      "Azure Solutions Architect Expert",
      "CompTIA Security+",
      "ITIL v4 Foundation",
    ],
    clearance_level: "Public Trust",
    years_experience: 10,
    project_history: [
      {
        title: "Northern Virginia MSP — Cloud Migration & Operations",
        client_industry: "Commercial / MSP",
        scope: "VP of Operations at a leading Northern Virginia MSP. Led cloud migration strategy, hybrid infrastructure design, and operational excellence programs for 50+ enterprise clients.",
        results: "Migrated 50+ enterprise clients to hybrid cloud. Reduced infrastructure costs by 35% average. 99.99% uptime across managed cloud environments.",
        dates: "2019–2024",
      },
      {
        title: "Federal Cloud Migration Initiative",
        client_industry: "Federal Government",
        scope: "Architected FedRAMP-compliant cloud environments for federal workloads. Designed IaaS/PaaS solutions on AWS GovCloud and Azure Government.",
        results: "Achieved FedRAMP Moderate authorization. Zero data breaches across all migrated workloads.",
        dates: "2022–Present",
      },
    ],
    bio: "10+ years in cloud/infrastructure strategy, cybersecurity, automation, and client operations. VP of Operations at a leading Northern Virginia MSP. Expert in compliance and scalable service delivery. Brings enterprise cloud expertise to government and commercial engagements.",
    is_verified: true,
  },
];

async function main() {
  console.log("=== Seed Team Members for COM Systems Inc ===\n");

  // Resolve org ID
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", "com-systems-inc")
    .single();

  if (!org) {
    console.error("ERROR: COM Systems org not found. Run seed-com-systems-demo.ts first.");
    process.exit(1);
  }

  const orgId = org.id;
  console.log(`Org ID: ${orgId}\n`);

  // Clear existing team members
  console.log("Step 1: Clearing existing team members...");
  const { error: delError } = await supabase
    .from("team_members")
    .delete()
    .eq("organization_id", orgId);

  if (delError) {
    console.error(`  Error: ${delError.message}`);
  } else {
    console.log("  Cleared existing team members");
  }

  // Insert team members
  console.log(`\nStep 2: Inserting ${TEAM_MEMBERS.length} team members...`);
  for (const member of TEAM_MEMBERS) {
    const { error } = await supabase.from("team_members").insert({
      organization_id: orgId,
      name: member.name,
      role: member.role,
      title: member.title,
      email: member.email,
      skills: member.skills,
      certifications: member.certifications,
      clearance_level: member.clearance_level,
      years_experience: member.years_experience,
      project_history: member.project_history,
      bio: member.bio,
      is_verified: member.is_verified,
      verified_at: new Date().toISOString(),
      created_by: USER_ID,
    });

    if (error) {
      console.error(`  Error (${member.name}): ${error.message}`);
    } else {
      console.log(`  + ${member.name} — ${member.role} (${member.title})`);
    }
  }

  // Verify
  console.log("\n=== Verification ===");
  const { data: count } = await supabase
    .from("team_members")
    .select("id, name, role", { count: "exact" })
    .eq("organization_id", orgId);

  console.log(`Team members: ${count?.length} entries`);
  count?.forEach((m: { name: string; role: string }) => {
    console.log(`  - ${m.name} (${m.role})`);
  });

  console.log("\nDone!");
}

main().catch((e) => console.error("Fatal:", e.message));
