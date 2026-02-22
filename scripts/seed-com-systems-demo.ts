/**
 * Seed COM Systems Inc Demo Account + L1 Company Context
 *
 * Usage:
 *   npx tsx scripts/seed-com-systems-demo.ts
 *
 * This script:
 *   1. Finds or creates the COM Systems Inc organization (Pro tier)
 *   2. Finds or creates the demo user account
 *   3. Seeds L1 Company Context (brand, values, certifications, legal, partnerships)
 *   4. Seeds Product Contexts (7 service pillars)
 *   5. Seeds Evidence Library (case studies with real RFP metrics, certifications)
 *
 * Source: L1 research from 3 RFP responses (GMU 2025, Amelia 2023, Orange 2020),
 *         capability statement, and web research
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

const DEMO_EMAIL = "som@thecomsystems.com";
const DEMO_PASSWORD = "Cool551!pass";
const DEMO_NAME = "Som Sengmany";
const ORG_NAME = "COM Systems Inc";

// ===========================================
// COMPANY CONTEXT - Brand, Values, Certs, Legal, Partnerships
// ===========================================
const COMPANY_CONTEXT = [
  // Brand
  {
    category: "brand",
    key: "company_name",
    title: "Company Name",
    content: "COM Systems Inc",
    is_locked: true,
    lock_reason: "Core brand identity",
  },
  {
    category: "brand",
    key: "tagline",
    title: "Brand Tagline",
    content: "Everything about IT IS IN OUR DNA",
    is_locked: true,
    lock_reason: "Official brand tagline",
  },
  {
    category: "brand",
    key: "description",
    title: "Company Description",
    content:
      "COM Systems Inc. is a Service-Disabled Veteran-Owned Small Business (SDVOSB) and SWaM-certified provider delivering advanced IT Networking, Cloud Architecture, Systems Engineering, and Security Services. We combine military-grade discipline with elite technical expertise (CCIE) to support mission-critical environments for federal agencies, higher education, and local government.",
    is_locked: true,
    lock_reason: "Official company description — synthesized from RFPs",
  },
  {
    category: "brand",
    key: "mission",
    title: "Mission Statement",
    content:
      "To maximize value for each client by delivering customized, high-quality IT services designed to strengthen the client's ability to achieve its core mission.",
    is_locked: true,
    lock_reason: "Official mission statement from RFPs",
  },
  {
    category: "brand",
    key: "value_proposition",
    title: "Value Proposition",
    content:
      "Veteran-led, mission-focused, security-first approach. We don't just patch issues; we engineer long-term resilience using enterprise best practices (ITIL, NIST, CMMC) scaled for agility. We apply federal-grade security standards to every engagement, giving commercial and local government clients embassy-grade protection.",
    is_locked: true,
    lock_reason: "Core value proposition from RFPs",
  },
  {
    category: "brand",
    key: "founding_year",
    title: "Year Founded",
    content: "~2016 (Incorporated April 19, 2019 in Virginia)",
    is_locked: true,
    lock_reason: "Historical fact",
  },
  {
    category: "brand",
    key: "headquarters",
    title: "Headquarters",
    content: "5290 Tractor Ln., Fairfax, VA 22030",
    is_locked: true,
    lock_reason: "Official address from RFPs",
  },
  {
    category: "brand",
    key: "business_type",
    title: "Business Classification",
    content:
      "Service-Disabled Veteran-Owned Small Business (SDVOSB), SWaM-certified (Small, Women-owned, and Minority-owned)",
    is_locked: true,
    lock_reason: "Federal and state certifications",
  },
  {
    category: "brand",
    key: "contact_email",
    title: "Contact Email",
    content: "som@thecomsystems.com",
    is_locked: true,
    lock_reason: "Official contact",
  },
  {
    category: "brand",
    key: "contact_phone",
    title: "Contact Phone",
    content: "703-946-9150",
    is_locked: true,
    lock_reason: "Official contact",
  },
  {
    category: "brand",
    key: "website",
    title: "Website",
    content: "www.thecomsystems.com",
    is_locked: true,
    lock_reason: "Official website",
  },
  {
    category: "brand",
    key: "duns",
    title: "DUNS/UEI Number",
    content: "117050016",
    is_locked: true,
    lock_reason: "Federal registration",
  },
  {
    category: "brand",
    key: "cage_code",
    title: "CAGE Code",
    content: "8BL97",
    is_locked: true,
    lock_reason: "Federal registration",
  },
  {
    category: "brand",
    key: "naics_codes",
    title: "NAICS Codes",
    content:
      "518210 (Computing Infrastructure/Data Processing/Hosting), 541511 (Custom Computer Programming), 541512 (Computer Systems Design), 541513 (Computer Facilities Management), 541519 (Other Computer Related Services), 541618 (Other Management Consulting), 511210 (Software Publishers)",
    is_locked: true,
    lock_reason: "Federal registration codes",
  },
  {
    category: "brand",
    key: "leadership_ceo",
    title: "CEO — Soo Jin Om",
    content:
      "Soo Jin Om, President/CEO & Enterprise Network Architect. U.S. Army squad leader veteran, George Mason University alumnus (Class of 2011). 15+ years designing enterprise networking solutions for federal agencies. Cisco CCIE Data Center (#53236) — one of only ~30,000 active CCIEs worldwide. Additional certs: CCNP Routing & Switching, CCNP Security, CCNA Wireless, CCNA Data Center, AWS Solutions Architect Professional. Personally architects every major engagement.",
    is_locked: true,
    lock_reason: "Leadership — verified from GMU RFP",
  },
  {
    category: "brand",
    key: "leadership_pm",
    title: "Program Manager — John Kang",
    content:
      "John Kang, Program Manager & System Architect. 15+ years in managed services, data center operations, and enterprise IT strategy. Expertise in network architecture, help desk operations, systems engineering, and regulatory compliance.",
    is_locked: true,
    lock_reason: "Leadership — verified from GMU RFP",
  },
  {
    category: "brand",
    key: "leadership_tech",
    title: "Technical Manager — Dustin Han",
    content:
      "Dustin Han, Technical Manager & System Architect. 10+ years in cybersecurity, IT infrastructure, and service desk leadership. Expert in Splunk SIEM, Duo MFA, CrowdStrike, Intune MDM, Active Directory, SCCM, SCOM, VMware, PowerShell automation. NIST and CMMC compliance specialist.",
    is_locked: true,
    lock_reason: "Leadership — verified from GMU RFP",
  },
  {
    category: "brand",
    key: "leadership_cloud",
    title: "Cloud Architect — Lawrence Kosar",
    content:
      "Lawrence Kosar, Cloud Architect. 10+ years in cloud/infrastructure strategy, cybersecurity, automation, and client operations. VP of Operations at a leading Northern Virginia MSP. Expertise in compliance and scalable service delivery.",
    is_locked: true,
    lock_reason: "Leadership — verified from GMU RFP",
  },
  {
    category: "brand",
    key: "team_certifications",
    title: "Team Certifications",
    content:
      "CCIE, CCNP Security, CISSP, PMP, PRINCE2, ITIL, VMware VCP, Splunk, AWS Solutions Architect Professional, Azure, CEH, CompTIA Security+",
    is_locked: true,
    lock_reason: "Verified from GMU RFP key personnel section",
  },

  // Values
  {
    category: "values",
    key: "mission_focused",
    title: "Mission-Focused",
    content:
      "Veteran-led and mission-focused, understanding federal environments' unique demands. We approach every engagement with the urgency, discipline, and accountability that comes from military service.",
    is_locked: true,
    lock_reason: "Core value",
  },
  {
    category: "values",
    key: "security_first",
    title: "Security-First",
    content:
      "Security is not an afterthought — it is foundational to every technology decision. We embed security at the design phase, not the compliance phase. Every solution is built with CMMC, NIST, and Zero Trust principles from day one.",
    is_locked: true,
    lock_reason: "Core value",
  },
  {
    category: "values",
    key: "technical_excellence",
    title: "Technical Excellence",
    content:
      "We hold ourselves to the highest standard of technical competence. Our CCIE-certified engineers represent the top tier of networking expertise, ensuring our clients receive solutions designed and implemented by elite professionals.",
    is_locked: true,
    lock_reason: "Core value",
  },
  {
    category: "values",
    key: "end_to_end",
    title: "End-to-End Accountability",
    content:
      "From initial assessment through ongoing managed services, COM Systems provides a single point of accountability. The team that designs your solution is the team that operates it — eliminating handoff gaps.",
    is_locked: true,
    lock_reason: "Core value",
  },
  {
    category: "values",
    key: "proactive",
    title: "Proactive Protection",
    content:
      "We don't wait for problems — we prevent them. Our 24/7 Network Operations Center provides continuous monitoring and threat detection, identifying and resolving issues before they impact operations.",
    is_locked: true,
    lock_reason: "Core value",
  },

  // Certifications
  {
    category: "certifications",
    key: "sdvosb",
    title: "SDVOSB Certification",
    content:
      "COM Systems Inc is a certified Service-Disabled Veteran-Owned Small Business (SDVOSB), verified through the SBA and the Center for Verification and Evaluation (CVE). Eligible for veteran set-aside contracts and sole-source awards under FAR 19.1405.",
    is_locked: true,
    lock_reason: "Federal certification",
  },
  {
    category: "certifications",
    key: "swam",
    title: "SWaM Certification",
    content:
      "COM Systems Inc is SWaM-certified (Small, Women-owned, and Minority-owned) through the Virginia Department of Small Business and Supplier Diversity (DSBSD). Eligible for Virginia SWaM-targeted procurement and supplier diversity programs.",
    is_locked: true,
    lock_reason: "State certification — verified from RFPs",
  },
  {
    category: "certifications",
    key: "ccie",
    title: "Cisco CCIE Data Center",
    content:
      "CEO Soo Jin Om holds Cisco CCIE Data Center certification (#53236) — the industry's most rigorous networking credential with a pass rate below 3%. Only ~30,000 active CCIEs worldwide. This brings top-tier architectural expertise to every engagement.",
    is_locked: true,
    lock_reason: "Technical certification — verified from all RFPs",
  },
  {
    category: "certifications",
    key: "cmmc_compliance",
    title: "CMMC Compliance",
    content:
      "COM Systems operates in compliance with CMMC 2.0 requirements and assists clients in achieving CMMC Level 1 and Level 2 certification. Security practices align with the 110 controls of NIST SP 800-171.",
    is_locked: true,
    lock_reason: "Compliance capability",
  },
  {
    category: "certifications",
    key: "nist_alignment",
    title: "NIST Framework Alignment",
    content:
      "COM Systems aligns service delivery with NIST Cybersecurity Framework (CSF) 2.0, NIST SP 800-171 (CUI protection), NIST SP 800-207 (Zero Trust Architecture), NIST SP 800-53 (Security Controls), and CIS Benchmarks for systems hardening.",
    is_locked: true,
    lock_reason: "Compliance alignment",
  },
  {
    category: "certifications",
    key: "fedramp",
    title: "FedRAMP Cloud Compliance",
    content:
      "COM Systems designs and deploys cloud solutions aligned with FedRAMP requirements, supporting federal agencies in achieving authorized cloud deployments on Microsoft Azure, AWS GovCloud, and hybrid environments.",
    is_locked: true,
    lock_reason: "Cloud compliance capability",
  },

  // Legal constraints
  {
    category: "legal",
    key: "classification_handling",
    title: "Classification Handling Policy",
    content:
      "COM Systems works with Federal Contract Information (FCI) and Controlled Unclassified Information (CUI). Staff hold Top Secret/SCI and Q-level clearances for appropriate engagements. All proposals must accurately represent classification handling capabilities.",
    is_locked: true,
    lock_reason: "Security policy",
  },
  {
    category: "legal",
    key: "past_performance_disclosure",
    title: "Past Performance Disclosure Policy",
    content:
      "Reference Department of State, DEA, and DOE engagements by agency name. Use verified metrics from RFP submissions (e.g., $20M contract value, 80% drift reduction, RTO 8hr→<1hr). Do not disclose specific system architectures or security configurations without written approval.",
    is_locked: true,
    lock_reason: "OPSEC policy — updated with RFP-verified metrics",
  },
  {
    category: "legal",
    key: "pricing_commitments",
    title: "Pricing Commitment Policy",
    content:
      "All pricing in proposals is indicative and subject to final scoping. Include disclaimer: 'Pricing is subject to final requirements validation and may be adjusted during contract negotiations.'",
    is_locked: true,
    lock_reason: "Legal policy",
  },

  // Partnerships
  {
    category: "partnerships",
    key: "cisco_partnership",
    title: "Cisco Technology Partner",
    content:
      "Primary technology partner for networking, security, and data center infrastructure. CCIE-level expertise across the full Cisco stack including Catalyst, Nexus, HyperFlex, SD-WAN, ISE, and wireless solutions.",
    is_locked: true,
    lock_reason: "Technology partnership — verified from all RFPs",
  },
  {
    category: "partnerships",
    key: "microsoft_partnership",
    title: "Microsoft Technology Partner",
    content:
      "Microsoft Azure, Azure Government, Microsoft 365, Windows Server, Active Directory, Intune, Teams, and SharePoint expertise. Cloud deployments across Azure and Azure Government.",
    is_locked: true,
    lock_reason: "Technology partnership — verified from RFPs",
  },
];

// ===========================================
// PRODUCT CONTEXTS - 7 Service Pillars
// ===========================================
const PRODUCT_CONTEXTS = [
  {
    product_name: "Enterprise Network Engineering",
    service_line: "network_engineering",
    description:
      "End-to-end network architecture, design, and optimization led by CCIE-certified architects. Specializing in secure, high-availability networks for government and enterprise environments.",
    capabilities: [
      {
        name: "Enterprise Network Design & Deployment",
        description:
          "Full lifecycle network architecture from design through deployment, leveraging CCIE-level expertise for complex multi-site, multi-vendor environments.",
        outcomes: ["quality_improvement", "risk_reduction"],
      },
      {
        name: "WiFi in a Box (WIAB)",
        description:
          "Proprietary enterprise wireless solution designed to Diplomatic Security standards. Deployed at 15 U.S. embassies worldwide with centralized monitoring and WIDS integration.",
        outcomes: ["quality_improvement", "risk_reduction", "compliance"],
      },
      {
        name: "Network Security & Segmentation",
        description:
          "Microsegmentation, VLAN architecture, and network access control designed to meet CMMC and NIST SP 800-171 requirements.",
        outcomes: ["risk_reduction", "compliance"],
      },
      {
        name: "SD-WAN & VPN Solutions",
        description:
          "Software-defined WAN deployments with encrypted tunneling for secure site-to-site and remote access connectivity.",
        outcomes: ["cost_optimization", "speed_to_value"],
      },
      {
        name: "4-Phase Infrastructure Assessment",
        description:
          "Proprietary assessment methodology: Information Gathering → Examine Characteristics → Analysis & Draft → Final Report with prioritized remediation and cost/benefit analysis.",
        outcomes: ["quality_improvement", "risk_reduction"],
      },
    ],
    specifications: {
      primary_vendor: "Cisco (CCIE expertise)",
      technologies: [
        "Cisco Catalyst/Nexus",
        "SD-WAN (Cisco Viptela/Meraki)",
        "Next-Gen Firewalls",
        "Ekahau (wireless surveys)",
        "SolarWinds NPM/NCM",
        "Enterprise Wireless (Wi-Fi 6/6E)",
      ],
      compliance_frameworks: [
        "CMMC 2.0",
        "NIST SP 800-171",
        "NIST SP 800-207",
        "CIS Benchmarks",
      ],
    },
    supported_outcomes: [
      "quality_improvement",
      "risk_reduction",
      "compliance",
      "cost_optimization",
      "speed_to_value",
    ],
    is_locked: true,
    lock_reason: "Core service — verified from DoS, DEA, and GMU RFPs",
  },
  {
    product_name: "IT Managed Services (MSP)",
    service_line: "managed_services",
    description:
      "Proactive 24/7/365 IT support and infrastructure management. We act as a force multiplier for internal IT teams or serve as the full outsourced IT department.",
    capabilities: [
      {
        name: "24/7 NOC Monitoring & Support",
        description:
          "Continuous network and system monitoring with Tier 1/2/3 support. 1-hour response SLA for Severity 0 (urgent) issues. Automated alerting via OpsGenie and PagerDuty.",
        outcomes: ["quality_improvement", "risk_reduction"],
      },
      {
        name: "Asset & Configuration Management",
        description:
          "Full lifecycle asset tracking using ITIL standards with centralized CMDB. Automated patching, configuration control, and drift prevention.",
        outcomes: ["quality_improvement", "compliance"],
      },
      {
        name: "Tiered IT Support",
        description:
          "Remote and onsite support across three tiers. Pre-staged backup workstations for zero-downtime swaps. Complete ticket lifecycle with SLA-driven escalation.",
        outcomes: ["quality_improvement", "speed_to_value"],
      },
      {
        name: "Incident Response & Remediation",
        description:
          "Structured incident response: detection, containment, eradication, recovery, and post-incident review aligned with NIST CSF 2.0.",
        outcomes: ["risk_reduction", "compliance"],
      },
    ],
    specifications: {
      support_model: "24/7/365 NOC with Tier 1, 2, and 3 escalation",
      response_times: {
        severity_0: "Within 1 hour — resolution 24 hours",
        severity_1: "Within 2 hours — resolution 2-5 working days",
        severity_2: "Within 4 hours — resolution 1-2 weeks",
        severity_3: "Within 4 hours — resolution 2-3 weeks",
      },
      tooling: [
        "ConnectWise Control",
        "Freshservice",
        "PRTG",
        "PagerDuty",
        "OpsGenie",
        "SolarWinds",
      ],
    },
    supported_outcomes: [
      "quality_improvement",
      "risk_reduction",
      "cost_optimization",
      "compliance",
      "speed_to_value",
    ],
    is_locked: true,
    lock_reason:
      "Core service — verified from Town of Orange, Amelia, GMU RFPs",
  },
  {
    product_name: "Cybersecurity & Compliance",
    service_line: "cybersecurity",
    description:
      "Defense-in-depth security aligned with federal mandates (NIST, CMMC, Zero Trust). We bake security into the architecture rather than bolting it on.",
    capabilities: [
      {
        name: "Zero Trust Architecture",
        description:
          "NIST SP 800-207 aligned implementation including micro-segmentation, identity-based access, and continuous verification per federal EO 14028.",
        outcomes: ["risk_reduction", "compliance"],
      },
      {
        name: "CMMC & NIST Compliance Readiness",
        description:
          "Preparing organizations for CMMC 2.0 Level 1-2, NIST 800-171, NIST 800-53, and FedRAMP audits. Gap analysis and remediation planning.",
        outcomes: ["compliance", "risk_reduction"],
      },
      {
        name: "Endpoint & Email Protection",
        description:
          "CrowdStrike Falcon EDR, Proofpoint/Mimecast email security, M365 Security Center configuration, DLP, and Advanced Threat Protection.",
        outcomes: ["risk_reduction", "quality_improvement"],
      },
      {
        name: "SIEM & Security Operations",
        description:
          "Splunk Enterprise for centralized logging, real-time monitoring, anomaly detection. Duo MFA/SSO. SOC support and dark web monitoring.",
        outcomes: ["risk_reduction", "compliance"],
      },
      {
        name: "The Firewall Philosophy (5-Step Framework)",
        description:
          "Proprietary framework adapted from Juniper Networks and U.S. State Department: (1) Identify Requirements, (2) Define Policy, (3) Define Philosophy, (4) Identify Communications, (5) Enforcement Points.",
        outcomes: ["risk_reduction", "compliance"],
      },
    ],
    specifications: {
      security_tools: [
        "CrowdStrike Falcon",
        "Splunk Enterprise",
        "Duo MFA",
        "Proofpoint",
        "Mimecast",
        "Microsoft Sentinel",
      ],
      compliance_frameworks: [
        "CMMC 2.0",
        "NIST SP 800-171",
        "NIST SP 800-207",
        "NIST CSF 2.0",
        "CIS Benchmarks",
      ],
    },
    supported_outcomes: ["risk_reduction", "compliance", "quality_improvement"],
    is_locked: true,
    lock_reason: "Core service — verified from all RFPs and capability statement",
  },
  {
    product_name: "Cloud & SaaS Architecture",
    service_line: "cloud_architecture",
    description:
      "Hybrid and multi-cloud deployment and management across Azure, AWS, and on-premises environments. Proven at U.S. Department of State with AWS GovCloud + Azure Government hybrid architectures.",
    capabilities: [
      {
        name: "Cloud Migration & Deployment",
        description:
          "Microsoft Azure, AWS GovCloud, and hybrid cloud deployments with security and compliance built in from day one.",
        outcomes: ["cost_optimization", "speed_to_value", "innovation"],
      },
      {
        name: "Microsoft 365 Migration & Administration",
        description:
          "Full M365 environment migrations including Exchange Online, SharePoint, Teams, and Intune MDM with security configuration.",
        outcomes: ["speed_to_value", "cost_optimization"],
      },
      {
        name: "Cloud Security & Compliance",
        description:
          "FedRAMP-aligned cloud deployments with CMMC-compliant security controls, data loss prevention, and automated compliance monitoring.",
        outcomes: ["compliance", "risk_reduction"],
      },
    ],
    specifications: {
      cloud_platforms: [
        "Microsoft Azure",
        "Azure Government",
        "AWS",
        "AWS GovCloud",
        "Hybrid Cloud",
      ],
      saas_platforms: [
        "Microsoft 365",
        "Exchange Online",
        "SharePoint",
        "Teams",
        "Intune",
      ],
      compliance_frameworks: ["FedRAMP", "CMMC 2.0", "FISMA"],
    },
    supported_outcomes: [
      "cost_optimization",
      "speed_to_value",
      "compliance",
      "risk_reduction",
      "innovation",
    ],
    is_locked: true,
    lock_reason: "Core service — proven at DoS with hybrid GovCloud architecture",
  },
  {
    product_name: "Systems Engineering",
    service_line: "systems_engineering",
    description:
      "Server, storage, and virtualization architecture including hyperconverged infrastructure. Deep expertise in VMware, identity management, and systems hardening to NIST and CIS standards.",
    capabilities: [
      {
        name: "Server & Virtualization Architecture",
        description:
          "VMware vSphere, Windows Server, and Citrix architecture design, deployment, and optimization for enterprise workloads.",
        outcomes: ["quality_improvement", "cost_optimization"],
      },
      {
        name: "Hyperconverged Infrastructure (HCI)",
        description:
          "Cisco HyperFlex design and deployment. Consolidates compute, storage, and networking for simplified management. Proven at DOE national labs.",
        outcomes: ["cost_optimization", "speed_to_value"],
      },
      {
        name: "Identity & Access Management",
        description:
          "Active Directory, Group Policy, PKI, and identity management solutions providing secure authentication across the enterprise.",
        outcomes: ["risk_reduction", "compliance"],
      },
      {
        name: "Systems Hardening",
        description:
          "Hardening to NIST SP 800-171 and CIS Benchmark standards including configuration baselining, patch management, and vulnerability remediation.",
        outcomes: ["risk_reduction", "compliance", "quality_improvement"],
      },
    ],
    specifications: {
      platforms: ["VMware vSphere/vSAN", "Windows Server", "Citrix", "Hyper-V"],
      identity: [
        "Active Directory",
        "Azure AD",
        "Group Policy",
        "PKI/Certificate Services",
      ],
      hardening_standards: ["NIST SP 800-171", "CIS Benchmarks", "DISA STIGs"],
    },
    supported_outcomes: [
      "quality_improvement",
      "cost_optimization",
      "risk_reduction",
      "compliance",
      "speed_to_value",
    ],
    is_locked: true,
    lock_reason: "Core service — proven at DEA and DOE",
  },
  {
    product_name: "Data Center & Hardware Services",
    service_line: "data_center",
    description:
      "Physical infrastructure services from design through deployment, including structured cabling, rack/stack, data center buildouts, and disaster recovery architecture.",
    capabilities: [
      {
        name: "Data Center Buildouts",
        description:
          "Complete rack, stack, and cabling design and deployment. Built high-availability data center in Manassas, VA for DOE/NNSA.",
        outcomes: ["quality_improvement", "risk_reduction"],
      },
      {
        name: "Disaster Recovery Architecture",
        description:
          "Veeam-based replication and backup with automated synchronization. High-availability configurations achieving 99.99% data availability.",
        outcomes: ["risk_reduction", "compliance"],
      },
      {
        name: "Hardware Deployment & Integration",
        description:
          "Traditional and hyperconverged hardware platform deployment (Cisco UCS, HyperFlex) with full integration into existing infrastructure.",
        outcomes: ["speed_to_value", "quality_improvement"],
      },
      {
        name: "Structured Cabling",
        description:
          "Fiber optic, copper, and structured cabling design and installation meeting TIA/EIA standards.",
        outcomes: ["quality_improvement", "risk_reduction"],
      },
    ],
    specifications: {
      hardware_vendors: ["Cisco UCS", "Cisco HyperFlex", "Dell/EMC", "Veeam"],
      standards: ["TIA/EIA-568", "TIA-942 (Data Centers)", "BICSI"],
    },
    supported_outcomes: [
      "quality_improvement",
      "risk_reduction",
      "speed_to_value",
      "compliance",
    ],
    is_locked: true,
    lock_reason: "Core service — proven at DOE Manassas data center",
  },
  {
    product_name: "IT Staff Augmentation",
    service_line: "staff_augmentation",
    description:
      "Rapid deployment of cleared, certified IT professionals for skill gaps or surge capacity. Structured staffing model with continuity guarantees and a 5-point quality evaluation framework.",
    capabilities: [
      {
        name: "Cleared Talent Deployment",
        description:
          "Access to professionals with Top Secret/SCI and Q-level clearances. Rapid fill rate: 1-2 weeks for critical roles, 3-4 weeks for standard.",
        outcomes: ["speed_to_value", "quality_improvement"],
      },
      {
        name: "Continuity Guarantee",
        description:
          "Qualified replacement within 5 business days for P1/P2 roles or 10 business days for standard. Structured bench resources ensure zero service gaps.",
        outcomes: ["risk_reduction", "quality_improvement"],
      },
      {
        name: "5-Point Quality Model",
        description:
          "Every candidate evaluated on Technical Competence, Cultural Fit, Communication, Reliability, and Compliance. 30/60/90-day and quarterly performance reviews.",
        outcomes: ["quality_improvement", "compliance"],
      },
    ],
    specifications: {
      roles: [
        "Network Engineers",
        "System Administrators",
        "Help Desk Specialists",
        "Cloud Architects",
        "Splunk Engineers",
        "Cybersecurity Analysts",
        "DBA Specialists",
      ],
      clearance_levels: ["Public Trust", "Secret", "Top Secret/SCI", "Q-Level"],
      fill_timeline: {
        p1_critical: "1-2 weeks",
        standard: "3-4 weeks",
      },
    },
    supported_outcomes: [
      "speed_to_value",
      "quality_improvement",
      "risk_reduction",
      "compliance",
    ],
    is_locked: true,
    lock_reason: "Core service — detailed in GMU RFP staffing model",
  },
];

// ===========================================
// EVIDENCE LIBRARY - Real Case Studies from RFPs
// ===========================================
const EVIDENCE_LIBRARY = [
  {
    evidence_type: "case_study",
    title:
      "U.S. Department of State — Global Infrastructure Modernization (WIAB + STORM)",
    summary:
      "Modernized global wireless infrastructure for 15 U.S. embassies and secured VIP communications for the Secretary of State. $20M contract value over 8+ years.",
    full_content: `# U.S. Department of State — Global Infrastructure Modernization

## Program
"WiFi in a Box" (WIAB) + STORM (Secure Telecommunication Operation Remote Monitoring)

## Contract Value
$20 million

## Duration
8+ years (September 2018 – Present)

## References
- Charles Chen, Program Manager, STORM | (310) 938-8738 | voipchuck@gmail.com
- Wade A. DeWalt, DoS | (202) 647-0917 | dewaltwa@state.gov

## Client Challenge
Aging and insecure wireless networks across 15 U.S. embassies worldwide. The Secretary of State and senior diplomatic staff required secure, reliable VIP communications for global travel. Existing systems faced coverage gaps, configuration drift, and security compliance challenges in high-threat diplomatic environments.

## Our Solution
- Designed and deployed "WiFi in a Box" (WIAB) — a Diplomatic Security-compliant wireless LAN integrating firewalls, WIDS, and centralized monitoring
- Conducted wireless site surveys using Ekahau across all embassy sites
- Deployed hybrid cloud architecture integrating AWS GovCloud, Azure Government, and on-premises systems for STORM
- Implemented Zero Trust Architecture, IAM, and automated compliance monitoring
- Built AI-driven monitoring of voice, video, and data traffic for VIP communications
- Established 24/7/365 monitoring using SolarWinds NPM/NCM, OpsGenie alerting, and high-availability hybrid cloud with hourly data replication

## Outcomes
- 80% reduction in configuration drift across all embassy sites
- 45% reduction in wireless security incidents
- 99.99% availability through HA hybrid cloud architecture
- Standardized secure wireless infrastructure across 15 global posts
- Centralized management with automated policy deployment and real-time monitoring

## Relevant Service Lines
Network Engineering, Cloud Architecture, Cybersecurity, Managed Services, Zero Trust`,
    client_industry: "federal_government",
    service_line: "network_engineering",
    client_size: "enterprise",
    outcomes_demonstrated: [
      {
        outcome: "risk_reduction",
        description:
          "80% reduction in configuration drift; 45% reduction in wireless security incidents",
      },
      {
        outcome: "quality_improvement",
        description:
          "99.99% availability; standardized secure wireless across 15 global posts",
      },
      {
        outcome: "compliance",
        description:
          "Diplomatic Security standards met; Zero Trust Architecture implemented",
      },
    ],
    metrics: [
      {
        name: "Contract Value",
        value: "$20M",
        context: "8+ year program for Department of State",
      },
      {
        name: "Configuration Drift Reduction",
        value: "80%",
        context: "Across all 15 embassy sites",
      },
      {
        name: "Security Incident Reduction",
        value: "45%",
        context: "Wireless security incidents across global posts",
      },
      {
        name: "Availability",
        value: "99.99%",
        context: "HA hybrid cloud architecture",
      },
      {
        name: "Global Reach",
        value: "15 embassies",
        context: "Worldwide deployment",
      },
    ],
    is_verified: true,
    verification_notes:
      "Verified from GMU RFP past performance section and Town of Orange RFP STORM details. Metrics extracted from actual proposal submissions.",
  },
  {
    evidence_type: "case_study",
    title:
      "U.S. Drug Enforcement Administration (DEA) — Infrastructure Modernization",
    summary:
      "Modernized legacy infrastructure for the DEA, reducing RTO from 8 hours to under 1 hour and cutting security incidents by over 50%. Achieved full NIST 800-171 compliance.",
    full_content: `# U.S. Drug Enforcement Administration (DEA) — Infrastructure Modernization

## Duration
April 2019 – November 2022

## Reference
Keith Yoon, IT Operation Manager | (202) 277-4961 | Keith.yoon@dea.gov

## Client Challenge
Legacy infrastructure creating performance bottlenecks and security risks for nationwide law enforcement operations. Aging systems required modernization with minimal disruption to mission-critical applications where latency and downtime directly impacted operational effectiveness.

## Our Solution
- Designed and deployed virtualized server and storage environment using VMware
- Integrated Splunk Enterprise for centralized logging, real-time monitoring, and anomaly detection
- Deployed CrowdStrike Falcon EDR for enhanced endpoint protection
- Implemented Veeam-based disaster recovery architecture with automated backup synchronization
- Conducted comprehensive IT Infrastructure Assessment (network architecture, topology, IP addressing, performance, capacity, fault-tolerance, security, wireless, component inventory)
- Achieved full NIST SP 800-171 compliance across all systems

## Outcomes
- Recovery Time Objective (RTO) reduced from 8 hours to under 1 hour
- Security incidents reduced by over 50%
- Full NIST SP 800-171 compliance achieved
- Increased system scalability and uptime through server consolidation
- Updated network documentation and hardened configuration baselines

## Relevant Service Lines
Systems Engineering, Cybersecurity, Infrastructure Assessment, Disaster Recovery`,
    client_industry: "federal_government",
    service_line: "cybersecurity",
    client_size: "enterprise",
    outcomes_demonstrated: [
      {
        outcome: "risk_reduction",
        description:
          "RTO reduced from 8 hours to <1 hour; security incidents reduced >50%",
      },
      {
        outcome: "compliance",
        description: "Full NIST SP 800-171 compliance achieved",
      },
      {
        outcome: "quality_improvement",
        description:
          "Server consolidation improved scalability and uptime; hardened baselines",
      },
    ],
    metrics: [
      {
        name: "RTO Improvement",
        value: "8 hours → <1 hour",
        context: "Disaster recovery time reduction",
      },
      {
        name: "Security Incident Reduction",
        value: ">50%",
        context: "Across nationwide law enforcement operations",
      },
      {
        name: "Compliance",
        value: "NIST 800-171",
        context: "Full compliance achieved",
      },
    ],
    is_verified: true,
    verification_notes:
      "Verified from GMU RFP past performance section. Reference contact provided. Metrics from actual proposal submission.",
  },
  {
    evidence_type: "case_study",
    title:
      "Department of Energy (DOE/NNSA) — Classified Network Modernization",
    summary:
      "Modernized classified network infrastructure supporting 5,000+ users across national laboratories. Achieved 99.99% data availability and reduced MTTR from 6 hours to under 45 minutes.",
    full_content: `# Department of Energy (DOE/NNSA) — Classified Network Modernization

## Duration
2 years

## Reference
Taylor Swiderski, Federal Program Manager, NNSA | (240) 931-8823 | taylor.swiderski@nnsa.doe.gov

## Client Challenge
The National Nuclear Security Administration (NNSA) required high-availability classified connectivity and disaster recovery for sensitive research data supporting 5,000+ users across multiple national laboratories. The existing infrastructure lacked redundancy and had unacceptable recovery times for classified workloads.

## Our Solution
- Designed and deployed redundant data center architecture using Cisco HyperFlex, VMware vSphere, and Veeam
- Built high-availability data center in Manassas, VA
- Modernized classified network connectivity across DOE facilities
- Implemented automated backup synchronization with hourly replication
- Deployed structured cabling and physical infrastructure to government standards

## Outcomes
- 99.99% data availability achieved
- 40% improvement in cross-site communication speeds
- Mean Time to Repair (MTTR) reduced from 6 hours to under 45 minutes
- Secure, scalable infrastructure supporting advanced research workloads across national laboratories

## Relevant Service Lines
Data Center, Systems Engineering, Network Engineering, Disaster Recovery`,
    client_industry: "federal_government",
    service_line: "data_center",
    client_size: "enterprise",
    outcomes_demonstrated: [
      {
        outcome: "quality_improvement",
        description:
          "99.99% data availability; 40% improvement in cross-site communication",
      },
      {
        outcome: "risk_reduction",
        description: "MTTR reduced from 6 hours to <45 minutes",
      },
      {
        outcome: "compliance",
        description:
          "Classified network standards met for 5,000+ users across national labs",
      },
    ],
    metrics: [
      {
        name: "Data Availability",
        value: "99.99%",
        context: "Classified network supporting 5,000+ users",
      },
      {
        name: "Cross-Site Speed Improvement",
        value: "40%",
        context: "Communication between national laboratories",
      },
      {
        name: "MTTR Improvement",
        value: "6 hours → <45 minutes",
        context: "Mean time to repair for classified systems",
      },
    ],
    is_verified: true,
    verification_notes:
      "Verified from GMU RFP past performance section. NNSA reference contact provided.",
  },
  {
    evidence_type: "case_study",
    title: "KLC Systems — 9-Year Commercial Managed Services Partnership",
    summary:
      "Decade-long managed services engagement achieving 60% reduction in system downtime for a growing commercial enterprise. Longest retained client relationship.",
    full_content: `# KLC Systems — Commercial Managed Services

## Duration
9+ years (ongoing)

## Reference
Sara Kim, Manager | (703) 494-1373 | skim@kl.construction

## Client Challenge
Growing IT complexity and increasing downtime impacting business operations. KLC Systems needed a reliable IT partner who could scale with business growth while maintaining operational continuity and introducing modern cloud infrastructure.

## Our Solution
- Full lifecycle management for workstations, servers, and Active Directory environments
- Deployed and maintained Microsoft 365, Adobe Creative Cloud, and VMware infrastructure
- Introduced proactive monitoring and preventive maintenance program
- Streamlined IT workflows through automated patching and centralized asset management
- Managed disaster recovery and backup systems
- Ongoing desktop/laptop support with pre-staged backup workstations

## Outcomes
- 60% reduction in system downtime
- 9-year retained client relationship (and counting) — longest active engagement
- Streamlined workflows via automated patching and improved ticket response times
- Enhanced cybersecurity posture and operational continuity
- Successfully scaled IT infrastructure alongside business growth

## Relevant Service Lines
Managed Services, Systems Engineering, Cloud Architecture`,
    client_industry: "commercial",
    service_line: "managed_services",
    client_size: "mid_market",
    outcomes_demonstrated: [
      {
        outcome: "quality_improvement",
        description: "60% reduction in system downtime",
      },
      {
        outcome: "cost_optimization",
        description:
          "9-year partnership demonstrates sustained value and cost-effectiveness",
      },
      {
        outcome: "risk_reduction",
        description:
          "Proactive monitoring and automated patching prevent issues before impact",
      },
    ],
    metrics: [
      {
        name: "Downtime Reduction",
        value: "60%",
        context: "System downtime for commercial operations",
      },
      {
        name: "Client Retention",
        value: "9+ years",
        context: "Longest active client relationship",
      },
    ],
    is_verified: true,
    verification_notes:
      "Verified from GMU RFP past performance section. Reference contact provided.",
  },
  {
    evidence_type: "metric",
    title: "Federal IT Service Track Record — Aggregate Metrics",
    summary:
      "COM Systems' aggregate federal and commercial practice metrics demonstrating breadth and depth of IT capabilities.",
    full_content:
      "COM Systems maintains CCIE Data Center certified engineers, 24/7 NOC operations, and proven delivery across Department of State ($20M, 8+ years), DEA (3+ years), DOE/NNSA (2 years), and commercial clients (9+ years). The team brings military service experience directly into service delivery, with compliance expertise spanning CMMC, NIST 800-171, NIST CSF 2.0, FedRAMP, and Zero Trust Architecture. Key metrics: $20M+ total federal contract value, 15 embassies secured globally, 80% configuration drift reduction, 99.99% data availability, RTO improvements from 8hrs to <1hr, 60% downtime reduction for commercial clients, 9+ year longest client retention.",
    client_industry: null,
    service_line: null,
    outcomes_demonstrated: [
      {
        outcome: "quality_improvement",
        description:
          "CCIE-level engineering expertise; 99.99% availability demonstrated",
      },
      {
        outcome: "compliance",
        description:
          "Multi-framework compliance: CMMC, NIST 800-171, NIST CSF 2.0, FedRAMP, Zero Trust",
      },
      {
        outcome: "risk_reduction",
        description:
          "80% config drift reduction, >50% security incident reduction, RTO 8hr→<1hr",
      },
    ],
    metrics: [
      {
        name: "Total Federal Contract Value",
        value: "$20M+",
        context: "Department of State program alone",
      },
      {
        name: "Federal Agencies Served",
        value: "4+",
        context: "DoS, DEA, DOE/NNSA, and additional",
      },
      {
        name: "Engineering Certification",
        value: "CCIE Data Center #53236",
        context: "Top 1% — only ~30,000 active worldwide",
      },
      {
        name: "NOC Operations",
        value: "24/7/365",
        context: "Proactive monitoring and incident response",
      },
      {
        name: "Compliance Frameworks",
        value: "10+",
        context:
          "CMMC, NIST 800-171, NIST CSF, 800-207, 800-53, FedRAMP, CIS, FISMA, ISO 27001, FERPA",
      },
      {
        name: "Longest Client Retention",
        value: "9+ years",
        context: "KLC Systems commercial engagement",
      },
    ],
    is_verified: true,
    verification_notes:
      "Aggregated from all three RFP submissions and capability statement.",
  },
  {
    evidence_type: "certification",
    title: "SDVOSB — Service-Disabled Veteran-Owned Small Business",
    summary:
      "SBA-verified SDVOSB status enabling access to veteran set-aside contracts and sole-source awards up to $5M for services.",
    full_content:
      "COM Systems Inc is a certified Service-Disabled Veteran-Owned Small Business (SDVOSB), verified through the U.S. Small Business Administration and the Center for Verification and Evaluation (CVE). This certification enables COM Systems to compete for veteran set-aside contracts and receive sole-source awards up to $5 million for services under FAR 19.1405. The SDVOSB program supports the federal government's goal of awarding at least 3% of prime contract dollars to service-disabled veteran-owned firms. CAGE Code: 8BL97.",
    client_industry: null,
    service_line: null,
    outcomes_demonstrated: [
      {
        outcome: "compliance",
        description: "Meets federal socioeconomic contracting goals",
      },
    ],
    metrics: [
      {
        name: "Sole-Source Threshold",
        value: "$5M",
        context: "Maximum for SDVOSB sole-source services contracts",
      },
      {
        name: "Federal Goal",
        value: "3%",
        context: "Government-wide SDVOSB prime contract target",
      },
    ],
    is_verified: true,
    verification_notes: "SBA and CVE verified. CAGE Code 8BL97.",
  },
  {
    evidence_type: "certification",
    title: "SWaM — Small, Women-owned, and Minority-owned Business",
    summary:
      "Virginia DSBSD-certified SWaM status enabling access to Virginia state procurement diversity programs and SWaM-targeted contracts.",
    full_content:
      "COM Systems Inc is SWaM-certified (Small, Women-owned, and Minority-owned) through the Virginia Department of Small Business and Supplier Diversity (DSBSD). This certification makes COM Systems eligible for Virginia SWaM-targeted procurement, supporting state and local government supplier diversity goals. Combined with SDVOSB, this dual certification provides access to both federal veteran set-aside and state diversity-targeted contracting opportunities.",
    client_industry: null,
    service_line: null,
    outcomes_demonstrated: [
      {
        outcome: "compliance",
        description: "Meets Virginia supplier diversity goals",
      },
    ],
    metrics: [
      {
        name: "Certification Body",
        value: "VA DSBSD",
        context:
          "Virginia Department of Small Business and Supplier Diversity",
      },
    ],
    is_verified: true,
    verification_notes:
      "Referenced in RFP submissions and capability statement.",
  },
];

// ===========================================
// MAIN EXECUTION
// ===========================================
async function main() {
  console.log("=== Setting up COM Systems Inc Demo Account ===\n");
  console.log(
    "Source: 3 RFP responses (GMU, Amelia, Orange), capability statement, web research\n",
  );

  // Step 0: Fix the auth trigger (known issue)
  console.log("Step 0: Fixing auth trigger...");
  const fixTriggerSQL = `
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger AS $$
    DECLARE
      new_org_id uuid;
      org_name text;
      org_slug text;
      base_slug text;
      counter int := 0;
    BEGIN
      org_name := COALESCE(
        new.raw_user_meta_data->>'organization_name',
        split_part(new.email, '@', 1) || '''s Organization'
      );
      base_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9\\s]', '', 'g'));
      base_slug := regexp_replace(base_slug, '\\s+', '-', 'g');
      base_slug := substring(base_slug from 1 for 50);
      org_slug := base_slug;
      WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = org_slug) LOOP
        counter := counter + 1;
        org_slug := base_slug || '-' || counter::text;
      END LOOP;
      INSERT INTO public.organizations (name, slug)
      VALUES (org_name, org_slug)
      RETURNING id INTO new_org_id;
      INSERT INTO public.profiles (id, email, full_name, organization_id, role)
      VALUES (
        new.id, new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', ''),
        new_org_id, 'admin'
      );
      RETURN new;
    EXCEPTION WHEN OTHERS THEN
      BEGIN
        INSERT INTO public.profiles (id, email, full_name, role)
        VALUES (
          new.id, new.email,
          COALESCE(new.raw_user_meta_data->>'full_name', ''), 'admin'
        );
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
      RETURN new;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  const { error: sqlError } = await supabase.rpc("exec_sql", {
    sql: fixTriggerSQL,
  });
  if (sqlError) {
    console.log(`  Could not fix trigger via RPC: ${sqlError.message}`);
    console.log("  Will attempt user creation anyway...");
  } else {
    console.log("  Trigger fixed!");
  }

  // Step 1: Create or find organization
  console.log("\nStep 1: Creating/finding organization...");
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: ORG_NAME,
      slug: "com-systems-inc",
      plan_tier: "pro",
      plan_limits: {
        proposals_per_month: 100,
        ai_tokens_per_month: 1000000,
        max_users: 10,
        max_documents: 100,
      },
      trial_ends_at: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    })
    .select()
    .single();

  let orgId: string;

  if (orgError) {
    if (orgError.message.includes("duplicate")) {
      console.log("  Organization already exists, fetching...");
      const { data: existing } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", "com-systems-inc")
        .single();
      orgId = existing!.id;
    } else {
      console.error("  Error creating org:", orgError.message);
      process.exit(1);
    }
  } else {
    orgId = org.id;
    console.log(`  Created org: ${orgId}`);
  }

  // Step 2: Find or create user
  console.log("\nStep 2: Finding/creating demo user...");

  let userId: string | undefined;
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(
    (u) => u.email === DEMO_EMAIL,
  );

  if (existingUser) {
    userId = existingUser.id;
    console.log(`  User already exists: ${userId}`);
    await supabase.auth.admin.updateUserById(userId, {
      password: DEMO_PASSWORD,
      email_confirm: true,
    });
    console.log("  Password updated.");
  } else {
    const { data: newUser, error: createError } =
      await supabase.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: DEMO_NAME,
          organization_name: ORG_NAME,
        },
      });

    if (createError) {
      console.log(`  Create returned error: ${createError.message}`);
      const { data: recheckUsers } = await supabase.auth.admin.listUsers();
      const found = recheckUsers?.users?.find((u) => u.email === DEMO_EMAIL);
      if (found) {
        userId = found.id;
        console.log(`  User was created despite error: ${userId}`);
      } else {
        console.log("  Trying without metadata...");
        const { data: bareUser, error: bareError } =
          await supabase.auth.admin.createUser({
            email: DEMO_EMAIL,
            password: DEMO_PASSWORD,
            email_confirm: true,
          });
        if (bareError) {
          const { data: finalCheck } = await supabase.auth.admin.listUsers();
          const lastFound = finalCheck?.users?.find(
            (u) => u.email === DEMO_EMAIL,
          );
          if (lastFound) {
            userId = lastFound.id;
            console.log(`  Found user on final check: ${userId}`);
          } else {
            console.error(
              "  Cannot create user. Create manually in Supabase dashboard:",
            );
            console.error(`  Email: ${DEMO_EMAIL}, Password: ${DEMO_PASSWORD}`);
            console.log(
              "  Continuing with L1 context seeding (no user link)...",
            );
          }
        } else {
          userId = bareUser.user.id;
          console.log(`  Created bare user: ${userId}`);
        }
      }
    } else {
      userId = newUser.user.id;
      console.log(`  Created user: ${userId}`);
    }
  }

  // Step 3: Link profile to org
  console.log("\nStep 3: Linking profile to organization...");
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    email: DEMO_EMAIL,
    full_name: DEMO_NAME,
    organization_id: orgId,
    role: "admin",
  });

  if (profileError) {
    console.error("  Error linking profile:", profileError.message);
  } else {
    console.log("  Profile linked!");
  }

  // Step 4: Clear existing L1 data for clean re-seed
  console.log("\nStep 4: Clearing existing L1 data for clean re-seed...");

  const { error: clearCtx } = await supabase
    .from("company_context")
    .delete()
    .eq("organization_id", orgId);
  if (clearCtx) {
    console.log(`  Warning clearing company_context: ${clearCtx.message}`);
  } else {
    console.log("  Cleared company_context");
  }

  const { error: clearProd } = await supabase
    .from("product_contexts")
    .delete()
    .eq("organization_id", orgId);
  if (clearProd) {
    console.log(`  Warning clearing product_contexts: ${clearProd.message}`);
  } else {
    console.log("  Cleared product_contexts");
  }

  const { error: clearEv } = await supabase
    .from("evidence_library")
    .delete()
    .eq("organization_id", orgId);
  if (clearEv) {
    console.log(`  Warning clearing evidence_library: ${clearEv.message}`);
  } else {
    console.log("  Cleared evidence_library");
  }

  // Step 5: Seed Company Context
  console.log(
    `\nStep 5: Seeding Company Context (${COMPANY_CONTEXT.length} entries)...`,
  );
  for (const ctx of COMPANY_CONTEXT) {
    const { error } = await supabase.from("company_context").insert({
      ...ctx,
      organization_id: orgId,
      metadata: (ctx as any).metadata || {},
    });
    if (error) {
      console.error(`   Error: ${ctx.key}: ${error.message}`);
    } else {
      console.log(`   + ${ctx.category}/${ctx.key}`);
    }
  }

  // Step 6: Seed Product Contexts
  console.log(
    `\nStep 6: Seeding Product Contexts (${PRODUCT_CONTEXTS.length} service pillars)...`,
  );
  for (const prod of PRODUCT_CONTEXTS) {
    const { error } = await supabase
      .from("product_contexts")
      .insert({ ...prod, organization_id: orgId });
    if (error) {
      console.error(`   Error: ${prod.product_name}: ${error.message}`);
    } else {
      console.log(`   + ${prod.product_name} (${prod.service_line})`);
    }
  }

  // Step 7: Seed Evidence Library
  console.log(
    `\nStep 7: Seeding Evidence Library (${EVIDENCE_LIBRARY.length} entries)...`,
  );
  for (const ev of EVIDENCE_LIBRARY) {
    const { error } = await supabase
      .from("evidence_library")
      .insert({ ...ev, organization_id: orgId });
    if (error) {
      console.error(`   Error: ${ev.title}: ${error.message}`);
    } else {
      console.log(`   + ${ev.evidence_type}: ${ev.title}`);
    }
  }

  // Summary
  console.log("\n========================================");
  console.log("  COM Systems Demo Account Ready!");
  console.log("========================================");
  console.log(`  URL:      https://intentwin.vercel.app/login`);
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log(`  Org:      ${ORG_NAME}`);
  console.log(`  Org ID:   ${orgId}`);
  console.log("========================================");
  console.log(`\n  L1 Context Seeded (from real RFPs):`);
  console.log(
    `   - ${COMPANY_CONTEXT.length} company context entries (brand, values, certs, legal, partnerships)`,
  );
  console.log(
    `   - ${PRODUCT_CONTEXTS.length} product contexts (7 service pillars)`,
  );
  console.log(
    `   - ${EVIDENCE_LIBRARY.length} evidence library entries (4 case studies + metrics + 2 certs)`,
  );
  console.log("\n  Data Sources:");
  console.log("   - GMU RFP (2025) — most comprehensive, key personnel + metrics");
  console.log("   - County of Amelia RFP (2023) — infrastructure assessment methodology");
  console.log("   - Town of Orange RFP (2020) — STORM details + SLA structure");
  console.log("   - Capability Statement — service overview + NAICS codes");
  console.log("\n  Next steps:");
  console.log("   1. Log in and verify L1 data at /settings/company");
  console.log("   2. Check evidence at /evidence-library");
  console.log(
    "   3. Upload the capability statement PDF at /knowledge-base/upload",
  );
  console.log("   4. Create a test proposal to verify AI uses L1 context");
  console.log("========================================\n");
}

main().catch(console.error);
